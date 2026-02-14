import TaskCard from "./TaskCard";

/**
 * A single board column rendering its ordered tasks.
 *
 * Per production-blueprint.md §2:
 *   Column defines order via taskIds array.
 *   Tasks are looked up from the task map by ID.
 *
 * Props:
 *   column  – { id, title, taskIds }
 *   taskMap – Map<taskId, taskDoc>
 */
const BoardColumn = ({ column, taskMap }) => {
  // Resolve taskIds to actual task documents, preserving order
  const tasks = (column.taskIds || [])
    .map((id) => taskMap[id])
    .filter(Boolean);

  return (
    <div className="flex h-full w-72 shrink-0 flex-col rounded-xl bg-slate-900/50 border border-slate-800">
      {/* ── Column header ──────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">
            {column.title}
          </h3>
          <span className="flex size-5 items-center justify-center rounded-full bg-slate-800 text-[11px] font-medium text-slate-400">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* ── Task list ──────────────────────────── */}
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {tasks.length === 0 && (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-700 py-8">
            <p className="text-xs text-slate-500">No tasks</p>
          </div>
        )}

        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default BoardColumn;
