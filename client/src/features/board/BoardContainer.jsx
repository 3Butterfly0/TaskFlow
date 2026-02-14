import { useState, useMemo, useCallback, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import BoardColumn from "./BoardColumn";
import TaskCard from "./TaskCard";
import { useReorderColumnMutation, useMoveTaskMutation } from "../tasks/taskApi";

/**
 * Board container with @dnd-kit drag-and-drop + optimistic UI.
 *
 * Props:
 *   columns    – array of { id, title, taskIds } from the project
 *   tasks      – flat array of task documents
 *   projectId  – current project ID
 *   onOpenTask – callback when a card is clicked
 */
const BoardContainer = ({ columns: serverColumns, tasks, projectId, onOpenTask }) => {
  const [reorderColumn] = useReorderColumnMutation();
  const [moveTask] = useMoveTaskMutation();

  // ── Optimistic column state ────────────────────────
  const [optimisticColumns, setOptimisticColumns] = useState(null);
  const columns = optimisticColumns || serverColumns;

  // Sync server state when it changes (e.g. after refetch)
  const prevServerRef = useRef(serverColumns);
  if (prevServerRef.current !== serverColumns) {
    prevServerRef.current = serverColumns;
    setOptimisticColumns(null);
  }

  // ── Task map for O(1) lookups ──────────────────────
  const taskMap = useMemo(() => {
    const map = {};
    for (const task of tasks) {
      map[task._id] = task;
    }
    return map;
  }, [tasks]);

  // ── Active drag state ──────────────────────────────
  const [activeTask, setActiveTask] = useState(null);

  // ── Drag origin ref ────────────────────────────────
  // Captures the source column ID at drag start.
  // This is the SINGLE SOURCE OF TRUTH for where the task
  // originally lived — never changes during the drag.
  const dragOriginRef = useRef(null);

  // ── Sensors ────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // ── onDragStart ────────────────────────────────────
  const handleDragStart = useCallback(
    (event) => {
      const { active } = event;
      const task = taskMap[active.id];
      if (!task) return;

      setActiveTask(task);

      // Record which column this task is dragged FROM
      // using SERVER state (the truth before any optimism)
      const sourceCol = serverColumns.find((col) =>
        (col.taskIds || []).includes(active.id)
      );
      dragOriginRef.current = {
        taskId: active.id,
        sourceColumnId: sourceCol?.id || null,
        sourceTaskIds: sourceCol ? [...sourceCol.taskIds] : [],
      };
    },
    [taskMap, serverColumns]
  );

  // ── onDragOver ─────────────────────────────────────
  // Fires continuously. We use it for visual feedback only
  // (optimistically moving the card across columns).
  const handleDragOver = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || !dragOriginRef.current) return;

      const activeId = active.id;
      const overId = over.id;
      if (activeId === overId) return;

      setOptimisticColumns((prev) => {
        const currentCols = prev || serverColumns;

        // Find which column currently has the task in optimistic state
        const activeColumn = currentCols.find((c) =>
          (c.taskIds || []).includes(activeId)
        );
        if (!activeColumn) return prev;

        // Determine target column
        let overColumn;
        if (String(overId).startsWith("column-")) {
          const colId = String(overId).replace("column-", "");
          overColumn = currentCols.find((c) => c.id === colId);
        } else {
          overColumn = currentCols.find((c) =>
            (c.taskIds || []).includes(overId)
          );
        }

        if (!overColumn || activeColumn.id === overColumn.id) return prev;

        // Deep-clone columns so we don't mutate state
        const cols = currentCols.map((col) => ({
          ...col,
          taskIds: [...(col.taskIds || [])],
        }));

        const srcCol = cols.find((c) => c.id === activeColumn.id);
        const destCol = cols.find((c) => c.id === overColumn.id);

        // Remove from source
        srcCol.taskIds = srcCol.taskIds.filter((id) => id !== activeId);

        // Remove from destination too (prevent duplicates if dragOver fires multiple times)
        destCol.taskIds = destCol.taskIds.filter((id) => id !== activeId);

        // Insert into destination
        if (String(overId).startsWith("column-")) {
          destCol.taskIds.push(activeId);
        } else {
          const overIdx = destCol.taskIds.indexOf(overId);
          if (overIdx === -1) {
            destCol.taskIds.push(activeId);
          } else {
            destCol.taskIds.splice(overIdx, 0, activeId);
          }
        }

        return cols;
      });
    },
    [serverColumns]
  );

  // ── onDragEnd ──────────────────────────────────────
  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveTask(null);

      const origin = dragOriginRef.current;
      dragOriginRef.current = null;

      if (!over || !origin) {
        setOptimisticColumns(null);
        return;
      }

      const activeId = active.id;
      const overId = over.id;

      // Use the current optimistic state for final column arrays
      const currentCols = optimisticColumns || serverColumns;

      // Find where the task currently sits in optimistic state
      const currentColumn = currentCols.find((c) =>
        (c.taskIds || []).includes(activeId)
      );

      if (!currentColumn) {
        setOptimisticColumns(null);
        return;
      }

      if (currentColumn.id === origin.sourceColumnId) {
        // ── Same column reorder ────────────────────
        const colTaskIds = [...currentColumn.taskIds];
        const oldIdx = origin.sourceTaskIds.indexOf(activeId);
        const newIdx = colTaskIds.indexOf(overId);

        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) {
          setOptimisticColumns(null);
          return;
        }

        const newTaskIds = arrayMove([...origin.sourceTaskIds], oldIdx, newIdx);

        setOptimisticColumns(
          currentCols.map((col) =>
            col.id === currentColumn.id
              ? { ...col, taskIds: newTaskIds }
              : col
          )
        );

        try {
          await reorderColumn({
            projectId,
            columnId: currentColumn.id,
            taskIds: newTaskIds,
          }).unwrap();
        } catch {
          setOptimisticColumns(null);
        }
      } else {
        // ── Cross-column move ──────────────────────
        // Source = where the task was in server state (origin ref)
        // Destination = where optimistic state placed the task

        // Build clean source taskIds (task removed)
        const newSourceTaskIds = origin.sourceTaskIds.filter(
          (id) => id !== activeId
        );

        // Build clean destination taskIds (task included, no duplicates)
        const newDestTaskIds = (currentColumn.taskIds || []).filter(
          (id) => id !== activeId
        );
        // Re-insert at the correct position
        const insertIdx = (currentColumn.taskIds || []).indexOf(activeId);
        if (insertIdx >= 0) {
          newDestTaskIds.splice(insertIdx, 0, activeId);
        } else {
          newDestTaskIds.push(activeId);
        }

        try {
          await moveTask({
            projectId,
            taskId: activeId,
            sourceColumnId: origin.sourceColumnId,
            destinationColumnId: currentColumn.id,
            newSourceTaskIds,
            newDestinationTaskIds: newDestTaskIds,
          }).unwrap();
        } catch {
          setOptimisticColumns(null);
        }
      }
    },
    [
      optimisticColumns,
      serverColumns,
      projectId,
      reorderColumn,
      moveTask,
    ]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <BoardColumn key={column.id} column={column} taskMap={taskMap} onOpen={onOpenTask} />
        ))}
      </div>

      {/* ── Drag overlay ──────────────────────── */}
      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default BoardContainer;
