import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";

/**
 * A single board column with sortable task list.
 *
 * Per production-blueprint.md §2:
 *   Column defines order via taskIds array.
 *   Tasks are looked up from the task map by ID.
 *
 * Props:
 *   column  – { id, title, taskIds }
 *   taskMap – Map<taskId, taskDoc>
 */
const BoardColumn = ({ column, taskMap, onOpen, isDoneColumn }) => {
  // Resolve taskIds to actual task documents, preserving order
  const tasks = (column.taskIds || []).map((id) => taskMap[id]).filter(Boolean);

  // Make the column a droppable zone (for dropping into empty columns)
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  return (
    <div
      className={`flex h-full w-[300px] shrink-0 flex-col rounded bg-slate-900 transition-colors ${
        isOver ? "bg-slate-800/80 ring-2 ring-indigo-500/50" : ""
      }`}
    >
      <div className="flex items-center justify-between sticky top-0 px-3 py-3 z-10 rounded-t cursor-pointer hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-2">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
            {column.title}
          </h3>
          <span className="flex items-center justify-center text-xs font-semibold text-slate-500">
            {tasks.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 overflow-y-auto p-2 min-h-[60px]"
      >
        <SortableContext
          items={column.taskIds || []}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 && (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-700 py-8">
              <p className="text-xs text-slate-500">No tasks</p>
            </div>
          )}

          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onOpen={onOpen}
              isDoneColumn={isDoneColumn}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default BoardColumn;
