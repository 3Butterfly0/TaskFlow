import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Task card rendered inside a board column.
 * Uses @dnd-kit/sortable to be draggable and reorderable.
 *
 * Per prd.md §3.5 – Task card displays:
 *   title, priority, assignees, dueDate
 */

const priorityColors = {
  low: "bg-slate-600",
  medium: "bg-blue-600",
  high: "bg-amber-600",
  critical: "bg-red-600",
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const TaskCard = ({ task, isDragOverlay = false, onOpen }) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`group cursor-grab rounded-lg border border-slate-800 bg-slate-950 p-3.5 transition-colors hover:border-slate-700 active:cursor-grabbing ${
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
      <h4 className="mb-2 text-sm font-medium text-white leading-snug">
        {task.title}
      </h4>

      {/* ── Subtask progress ───────────────────── */}
      {hasSubtasks && (
        <div className="mb-2.5">
          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Subtasks</span>
            <span>
              {subtasksDone}/{subtasksTotal}
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-slate-800">
            <div
              className="h-1 rounded-full bg-indigo-500 transition-all"
              style={{
                width: `${(subtasksDone / subtasksTotal) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* ── Footer: priority + assignees + due ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority badge */}
          {task.priority && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold text-white ${priorityColors[task.priority]}`}
            >
              {priorityLabels[task.priority]}
            </span>
          )}

          {/* Due date */}
          {task.dueDate && (
            <span className="text-[11px] text-slate-500">
              {new Date(task.dueDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
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
                className="flex size-6 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-700 text-[10px] font-medium text-white"
              >
                {user.username?.charAt(0).toUpperCase() || "?"}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="flex size-6 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-600 text-[10px] font-medium text-white">
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
