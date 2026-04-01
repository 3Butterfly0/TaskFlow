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
import {
  useReorderColumnMutation,
  useMoveTaskMutation,
} from "../tasks/taskApi";
import { useAddColumnMutation } from "../projects/projectApi";
import { Plus, X, Check } from "lucide-react";

/**
 * Board container with @dnd-kit drag-and-drop + optimistic UI.
 *
 * Props:
 *   columns    – array of { id, title, taskIds } from the project
 *   tasks      – flat array of task documents
 *   projectId  – current project ID
 *   onOpenTask – callback when a card is clicked
 */
const BoardContainer = ({
  columns: serverColumns,
  tasks,
  projectId,
  onOpenTask,
}) => {
  const [reorderColumn] = useReorderColumnMutation();
  const [moveTask] = useMoveTaskMutation();
  const [addColumn] = useAddColumnMutation();

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;

    try {
      await addColumn({ projectId, title: newColumnTitle.trim() }).unwrap();
      setNewColumnTitle("");
      setIsAddingColumn(false);
    } catch {
      // Global error handler takes care of this
    }
  };

  const [optimisticColumns, setOptimisticColumns] = useState(null);
  const columns = optimisticColumns || serverColumns;

  // Sync server state when it changes (e.g. after refetch)
  const prevServerRef = useRef(serverColumns);
  if (prevServerRef.current !== serverColumns) {
    prevServerRef.current = serverColumns;
    setOptimisticColumns(null);
  }

  // Task map for O(1) lookups
  const taskMap = useMemo(() => {
    const map = {};
    for (const task of tasks) {
      map[task._id] = task;
    }
    return map;
  }, [tasks]);

  const [activeTask, setActiveTask] = useState(null);

  // Drag origin ref – captures the source column at drag start
  const dragOriginRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragStart = useCallback(
    (event) => {
      const { active } = event;
      const task = taskMap[active.id];
      if (!task) return;

      setActiveTask(task);

      // Record which column this task is dragged FROM
      // Use currentCols to ensure we capture optimistic task locations gracefully
      const currentCols = optimisticColumns || serverColumns;
      const sourceCol = currentCols.find((col) =>
        (col.taskIds || []).includes(active.id),
      );
      dragOriginRef.current = {
        taskId: active.id,
        sourceColumnId: sourceCol?.id || null,
        sourceTaskIds: sourceCol ? [...sourceCol.taskIds] : [],
      };
    },
    [taskMap, serverColumns, optimisticColumns],
  );

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
          (c.taskIds || []).includes(activeId),
        );
        if (!activeColumn) return prev;

        // Determine target column
        let overColumn;
        if (String(overId).startsWith("column-")) {
          const colId = String(overId).replace("column-", "");
          overColumn = currentCols.find((c) => c.id === colId);
        } else {
          overColumn = currentCols.find((c) =>
            (c.taskIds || []).includes(overId),
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
    [serverColumns],
  );

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
        (c.taskIds || []).includes(activeId),
      );

      if (!currentColumn) {
        setOptimisticColumns(null);
        return;
      }

      if (currentColumn.id === origin.sourceColumnId) {
        // Same column reorder
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
            col.id === currentColumn.id ? { ...col, taskIds: newTaskIds } : col,
          ),
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
        // Cross-column move
        const sourceColumnId = origin.sourceColumnId;
        const destinationColumnId = currentColumn.id;

        const optimisticSourceCol = currentCols.find(
          (c) => c.id === sourceColumnId,
        );
        const optimisticDestCol = currentColumn;

        if (
          sourceColumnId &&
          destinationColumnId &&
          optimisticSourceCol &&
          optimisticDestCol
        ) {
          try {
            const payload = {
              projectId,
              taskId: activeId,
              sourceColumnId,
              destinationColumnId,
              newSourceTaskIds: [...optimisticSourceCol.taskIds],
              newDestinationTaskIds: [...optimisticDestCol.taskIds],
            };
            await moveTask(payload).unwrap();
          } catch {
            // Revert state on failure
            setOptimisticColumns(null);
          }
        } else {
          setOptimisticColumns(null);
        }
      }
    },
    [optimisticColumns, serverColumns, projectId, reorderColumn, moveTask],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-full">
        {columns.map((column, index) => (
          <BoardColumn
            key={column.id}
            column={column}
            columnIndex={index}
            projectId={projectId}
            taskMap={taskMap}
            onOpen={onOpenTask}
            isDoneColumn={column.title === "Done"}
          />
        ))}

        <div className="w-72 shrink-0 rounded-xl border border-dashed border-slate-800 bg-slate-900/20 p-3">
          {isAddingColumn ? (
            <form onSubmit={handleAddColumn} className="space-y-2">
              <input
                autoFocus
                type="text"
                placeholder="Column title..."
                className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
                >
                  <Check className="size-3.5" /> Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingColumn(false)}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingColumn(true)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors"
            >
              <Plus className="size-4" /> Add Column
            </button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default BoardContainer;
