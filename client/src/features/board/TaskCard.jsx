import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, AlertCircle, Equal, CheckSquare } from "lucide-react";

/**
 * Task card rendered inside a board column.
 * Uses @dnd-kit/sortable to be draggable and reorderable.
 */

const priorityIcons = {
  low: <ArrowDown className="size-3.5 text-blue-400" />,
  medium: <Equal className="size-3.5 text-amber-500" />,
  high: <ArrowUp className="size-3.5 text-red-500" />,
  critical: <AlertCircle className="size-3.5 text-red-600" />,
};

const TaskCard = ({ task, isDragOverlay = false, onOpen, isDoneColumn }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: "task",
      task,
      columnId: task.columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const subtasksDone = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const subtasksTotal = task.subtasks?.length || 0;
  const hasSubtasks = subtasksTotal > 0;

  if (isDragging && !isDragOverlay) {
    // Placeholder while dragging — keeps space in the column
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-lg border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 p-3.5 opacity-40"
      >
        <div className="h-4 w-3/4 rounded bg-slate-800/30" />
        <div className="mt-2 h-3 w-1/2 rounded bg-slate-800/20" />
      </div>
    );
  }

  const handleClick = () => {
    if (onOpen && !isDragging && !isDragOverlay) {
      onOpen(task._id);
    }
  };

  const borderColor = isDoneColumn ? "border-emerald-500/30" : "border-slate-700/50";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`group cursor-grab rounded-lg bg-slate-950 p-3 transition-colors hover:bg-slate-900 border shadow-sm active:cursor-grabbing ${borderColor} ${
        isDragOverlay ? "rotate-2 shadow-2xl shadow-black/50 ring-2 ring-indigo-500/50" : ""
      }`}
    >
      {/* ── Labels ──────────────────────────────── */}
      {task.labels?.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {task.labels.map((label, i) => (
            <span
              key={i}
              className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-400"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* ── Title ──────────────────────────────── */}
      <div className="mb-3 text-[13px] font-medium text-slate-200 leading-snug">
        {task.title}
      </div>

      {/* ── Subtask progress (minimal) ───────────── */}
      {hasSubtasks && (
        <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
           <CheckSquare className="size-3.5 text-slate-500" />
           <span>{subtasksDone}/{subtasksTotal}</span>
        </div>
      )}

      {/* ── Footer: ID, Priority, assignees ── */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          {/* Priority icon */}
          {task.priority && (
             <div title={task.priority} className="flex items-center justify-center">
               {priorityIcons[task.priority]}
             </div>
          )}

          {/* Task ID (Jira style) */}
          <span className="text-[11.5px] font-medium text-slate-500 hover:text-indigo-400 transition-colors">
            TF-{task._id.slice(-4).toUpperCase()}
          </span>

          {/* Due date if near */}
          {task.dueDate && (
            <span className="ml-1 text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded">
              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>

        {/* Assignee avatars */}
        {task.assignees?.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((user) => (
              <div
                key={user._id}
                title={user.username}
                className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-indigo-500/20 text-[9px] font-bold text-indigo-400"
              >
                {user.avatar ? (
                  <img src={user.avatar} className="size-full rounded-full object-cover" />
                ) : (
                  user.username?.charAt(0).toUpperCase() || "?"
                )}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-800 text-[9px] font-medium text-white">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
