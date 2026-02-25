import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useGetProjectByIdQuery } from "../features/projects/projectApi";
import { useGetTasksByProjectQuery } from "../features/tasks/taskApi";
import BoardContainer from "../features/board/BoardContainer";

import TaskDetails from "../features/tasks/TaskDetails";

import { AlertTriangle, Kanban, Search, Filter, User } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";

const AvatarGroup = ({ members }) => {
  if (!members || members.length === 0) return null;
  const displayMembers = members.slice(0, 4);
  const extraCount = members.length - 4;

  return (
    <div className="flex -space-x-2">
      {displayMembers.map((m, i) => (
        <div
          key={m._id || i}
          className="size-8 rounded-full border-2 border-slate-950 bg-indigo-500/20 flex items-center justify-center text-xs font-medium text-indigo-400 overflow-hidden ring-1 ring-slate-800 cursor-pointer hover:-translate-y-1 transition-transform"
          title={m.username}
        >
          {m.avatar ? (
            <img
              src={m.avatar}
              alt={m.username}
              className="size-full object-cover"
            />
          ) : (
            m.username?.charAt(0).toUpperCase()
          )}
        </div>
      ))}
      {extraCount > 0 && (
        <div className="size-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-medium text-slate-400 cursor-pointer hover:-translate-y-1 transition-transform">
          +{extraCount}
        </div>
      )}
    </div>
  );
};

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

  const { data: tasksData, isLoading: isTasksLoading } =
    useGetTasksByProjectQuery(projectId);

  const project = projectData?.data;
  const tasks = tasksData?.data || [];
  const isLoading = isProjectLoading || isTasksLoading;

  // Check URL query param for task
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const searchParams = new URLSearchParams(window.location.search);
  const taskParam = searchParams.get("task");

  const handleOpenTask = useCallback((taskId) => {
    setSelectedTaskId(taskId);
    const url = new URL(window.location);
    url.searchParams.set("task", taskId);
    window.history.pushState({}, "", url);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedTaskId(null);
    const url = new URL(window.location);
    url.searchParams.delete("task");
    window.history.pushState({}, "", url);
  }, []);

  useState(() => {
    if (taskParam) setSelectedTaskId(taskParam);
  });

  return (
    <div className="flex h-full flex-col p-8 pt-6 overflow-x-auto">
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

      {isLoading && <BoardSkeleton />}

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
          <div className="flex-1">
            <BoardContainer
              columns={project.columns}
              tasks={tasks}
              projectId={projectId}
              onOpenTask={handleOpenTask}
            />
          </div>
        )
      ) : null}

      <TaskDetails
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={handleCloseDrawer}
        projectMembers={project?.members || []}
        projectColumns={project?.columns || []}
      />
    </div>
  );
};

export default Board;
