import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useGetProjectByIdQuery } from "../features/projects/projectApi";
import { useGetTasksByProjectQuery } from "../features/tasks/taskApi";
import BoardContainer from "../features/board/BoardContainer";
import TaskDrawer from "../features/tasks/TaskDrawer";

/* ── Loading skeleton ──────────────────────────────── */
const BoardSkeleton = () => (
  <div className="flex gap-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="w-72 shrink-0 rounded-xl border border-slate-800 bg-slate-900/50"
      >
        {/* Column header skeleton */}
        <div className="border-b border-slate-800 px-4 py-3">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
        </div>
        {/* Card skeletons */}
        <div className="space-y-2 p-2">
          {Array.from({ length: i === 0 ? 3 : i === 1 ? 2 : 1 }).map(
            (_, j) => (
              <div
                key={j}
                className="animate-pulse rounded-lg border border-slate-800 bg-slate-950 p-3.5"
              >
                <div className="mb-2 h-3 w-3/4 rounded bg-slate-800" />
                <div className="mb-3 h-3 w-1/2 rounded bg-slate-800/60" />
                <div className="flex justify-between">
                  <div className="h-4 w-12 rounded bg-slate-800/40" />
                  <div className="h-5 w-5 rounded-full bg-slate-800/40" />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    ))}
  </div>
);

const Board = () => {
  const { projectId } = useParams();

  const {
    data: projectData,
    isLoading: isProjectLoading,
    isError: isProjectError,
    error: projectError,
  } = useGetProjectByIdQuery(projectId);

  const {
    data: tasksData,
    isLoading: isTasksLoading,
  } = useGetTasksByProjectQuery(projectId);

  const project = projectData?.data;
  const tasks = tasksData?.data || [];
  const isLoading = isProjectLoading || isTasksLoading;

  // ── Task drawer state ──────────────────────────────
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const handleOpenTask = useCallback((taskId) => {
    setSelectedTaskId(taskId);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedTaskId(null);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* ── Page header ─────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isLoading ? (
              <div className="h-7 w-48 animate-pulse rounded bg-slate-800" />
            ) : (
              project?.name || "Board"
            )}
          </h1>
          {!isLoading && project?.description && (
            <p className="mt-1 text-sm text-slate-400">
              {project.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Error state ─────────────────────────── */}
      {isProjectError && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
          {projectError?.data?.message || "Failed to load board"}
        </div>
      )}

      {/* ── Loading skeleton ────────────────────── */}
      {isLoading && <BoardSkeleton />}

      {/* ── Board ───────────────────────────────── */}
      {!isLoading && !isProjectError && project && (
        <div className="flex-1 overflow-hidden">
          <BoardContainer
            columns={project.columns || []}
            tasks={tasks}
            projectId={projectId}
            onOpenTask={handleOpenTask}
          />
        </div>
      )}

      {/* ── Task drawer ─────────────────────────── */}
      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={handleCloseDrawer}
        projectMembers={project?.members || []}
      />
    </div>
  );
};

export default Board;
