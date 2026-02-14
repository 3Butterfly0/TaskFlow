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
 * Per production-blueprint.md §6:
 *   Reorder inside column:  { projectId, columnId, taskIds }
 *   Move across columns:    { projectId, taskId, sourceColumnId,
 *                              destinationColumnId, newSourceTaskIds,
 *                              newDestinationTaskIds }
 *
 * Per prd.md §3.4 – Optimistic UI:
 *   Card snaps instantly → rollback on API failure
 *
 * Props:
 *   columns   – array of { id, title, taskIds } from the project
 *   tasks     – flat array of task documents
 *   projectId – current project ID
 */
const BoardContainer = ({ columns: serverColumns, tasks, projectId }) => {
  const [reorderColumn] = useReorderColumnMutation();
  const [moveTask] = useMoveTaskMutation();

  // ── Optimistic column state ────────────────────────
  // We keep a local copy so drag operations are instant.
  // On API failure, we rollback to the server state.
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

  // ── Sensors ────────────────────────────────────────
  // PointerSensor with a 5px activation distance prevents
  // accidental drags when clicking on cards.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // ── Helper: find which column a task lives in ──────
  const findColumnByTaskId = useCallback(
    (taskId) => {
      return columns.find((col) =>
        (col.taskIds || []).includes(taskId)
      );
    },
    [columns]
  );

  // ── onDragStart ────────────────────────────────────
  const handleDragStart = useCallback(
    (event) => {
      const { active } = event;
      const task = taskMap[active.id];
      if (task) setActiveTask(task);
    },
    [taskMap]
  );

  // ── onDragOver ─────────────────────────────────────
  // This fires continuously as the user drags over items.
  // We use it to optimistically move cards across columns
  // so the visual feedback is instant.
  const handleDragOver = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id;
      const overId = over.id;
      if (activeId === overId) return;

      const activeColumn = findColumnByTaskId(activeId);
      if (!activeColumn) return;

      // Determine the target column:
      // If hovering over a column droppable, use that column.
      // If hovering over a task, find which column that task is in.
      let overColumn;
      if (String(overId).startsWith("column-")) {
        const colId = String(overId).replace("column-", "");
        overColumn = columns.find((c) => c.id === colId);
      } else {
        overColumn = findColumnByTaskId(overId);
      }

      if (!overColumn || activeColumn.id === overColumn.id) return;

      // Cross-column move (optimistic)
      setOptimisticColumns((prev) => {
        const cols = (prev || serverColumns).map((col) => ({
          ...col,
          taskIds: [...(col.taskIds || [])],
        }));

        const srcCol = cols.find((c) => c.id === activeColumn.id);
        const destCol = cols.find((c) => c.id === overColumn.id);

        // Remove from source
        const srcIdx = srcCol.taskIds.indexOf(activeId);
        if (srcIdx === -1) return prev;
        srcCol.taskIds.splice(srcIdx, 1);

        // Insert into destination at the position of the over item
        if (String(overId).startsWith("column-")) {
          // Dropped on column itself → append to end
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
    [columns, findColumnByTaskId, serverColumns]
  );

  // ── onDragEnd ──────────────────────────────────────
  // Fires when the user drops. We finalize the optimistic
  // state and send the API call. On failure → rollback.
  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) {
        // Dropped outside – rollback
        setOptimisticColumns(null);
        return;
      }

      const activeId = active.id;
      const overId = over.id;

      const activeColumn = findColumnByTaskId(activeId);
      if (!activeColumn) {
        setOptimisticColumns(null);
        return;
      }

      // Determine target column
      let overColumn;
      if (String(overId).startsWith("column-")) {
        const colId = String(overId).replace("column-", "");
        overColumn = columns.find((c) => c.id === colId);
      } else {
        overColumn = findColumnByTaskId(overId);
      }

      if (!overColumn) {
        setOptimisticColumns(null);
        return;
      }

      // Snapshot for rollback
      const rollbackColumns = serverColumns;

      if (activeColumn.id === overColumn.id) {
        // ── Same column reorder ────────────────────
        const colTaskIds = [...activeColumn.taskIds];
        const oldIdx = colTaskIds.indexOf(activeId);
        const newIdx = colTaskIds.indexOf(overId);

        if (oldIdx === newIdx || oldIdx === -1) return;

        const newTaskIds = arrayMove(colTaskIds, oldIdx, newIdx);

        // Optimistic update
        setOptimisticColumns((prev) =>
          (prev || serverColumns).map((col) =>
            col.id === activeColumn.id
              ? { ...col, taskIds: newTaskIds }
              : col
          )
        );

        try {
          await reorderColumn({
            projectId,
            columnId: activeColumn.id,
            taskIds: newTaskIds,
          }).unwrap();
        } catch {
          // Rollback on failure
          setOptimisticColumns(null);
        }
      } else {
        // ── Cross-column move ──────────────────────
        // optimisticColumns already has the correct state
        // from handleDragOver. We just need to send the API call.
        const currentCols = optimisticColumns || columns;
        const srcCol = currentCols.find((c) => c.id === activeColumn.id);
        const destCol = currentCols.find((c) => c.id === overColumn.id);

        // Handle edge case: srcCol & destCol might have been
        // swapped during dragOver - find them based on where
        // the task currently sits in optimistic state
        const actualDestCol = currentCols.find((c) =>
          (c.taskIds || []).includes(activeId)
        );
        const actualSrcCol = currentCols.find(
          (c) => c.id !== actualDestCol?.id &&
          rollbackColumns.find((rc) => rc.id === c.id)?.taskIds?.includes(activeId)
        );

        const finalSrcCol = actualSrcCol || srcCol;
        const finalDestCol = actualDestCol || destCol;

        try {
          await moveTask({
            projectId,
            taskId: activeId,
            sourceColumnId: finalSrcCol.id,
            destinationColumnId: finalDestCol.id,
            newSourceTaskIds: finalSrcCol.taskIds || [],
            newDestinationTaskIds: finalDestCol.taskIds || [],
          }).unwrap();
        } catch {
          // Rollback on failure
          setOptimisticColumns(null);
        }
      }
    },
    [
      columns,
      optimisticColumns,
      serverColumns,
      findColumnByTaskId,
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
          <BoardColumn key={column.id} column={column} taskMap={taskMap} />
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
