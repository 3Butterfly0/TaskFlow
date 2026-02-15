import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useGetProjectByIdQuery } from "../features/projects/projectApi";
import { useGetTasksByProjectQuery } from "../features/tasks/taskApi";
import BoardContainer from "../features/board/BoardContainer";
import TaskDrawer from "../features/tasks/TaskDrawer";

import { AlertTriangle, Kanban } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";

/* ── Loading skeleton ──────────────────────────────── */
const BoardSkeleton = () => (
  <div className="flex gap-4 overflow-hidden">
    {Array.from({ length: 3 }).map((_, i) => (
      <div
        key={i}
        className="w-72 shrink-0 rounded-xl border border-slate-800 bg-slate-900/30"
      >
        <div className="border-b border-slate-800 px-4 py-3">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="p-3 space-y-3">
          {Array.from({ length: i === 0 ? 3 : i === 1 ? 2 : 1 }).map((_, j) => (
            <div
              key={j}
              className="rounded-lg border border-slate-800 bg-slate-950 p-3.5 space-y-2"
            >
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2 opacity-60" />
              <div className="flex justify-between mt-2">
                <Skeleton className="h-4 w-8 rounded-full" />
                <Skeleton className="size-5 rounded-full" />
              </div>
            </div>
          ))}
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
              <Skeleton className="h-8 w-48 bg-slate-800/80" />
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
        <div className="flex flex-1 items-center justify-center p-8">
          <EmptyState
            icon={AlertTriangle}
            title="Unable to load board"
            description={
              projectError?.data?.message ||
              "There was an error loading the project board."
            }
            className="w-full max-w-md border-red-500/20 bg-red-950/10"
          />
        </div>
      )}

      {/* ── Loading skeleton ────────────────────── */}
      {isLoading && <BoardSkeleton />}

      {/* ── Board ───────────────────────────────── */}
      {/* ── Board ───────────────────────────────── */}
      {!isLoading && !isProjectError && project ? (
        project.columns?.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-8">
             <EmptyState
               icon={Kanban}
               title="Ready to organize?"
               description="This board is empty. Add columns to get started."
             />
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <BoardContainer
              columns={project.columns}
              tasks={tasks}
              projectId={projectId}
              onOpenTask={handleOpenTask}
            />
          </div>
        )
      ) : null}

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
