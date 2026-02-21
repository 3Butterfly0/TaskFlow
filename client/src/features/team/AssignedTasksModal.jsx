import { useState, useMemo } from "react";
import Modal from "../../components/ui/Modal";
import { useGetTasksByProjectQuery } from "../tasks/taskApi";
import { Loader, AlertTriangle, Layers, Calendar, CheckSquare } from "lucide-react";

/**
 * Modal to display tasks assigned to a specific member in the project.
 */
const AssignedTasksModal = ({ isOpen, onClose, member, projectId }) => {
  const { data: tasksData, isLoading, isError } = useGetTasksByProjectQuery(projectId, {
    skip: !isOpen || !projectId || !member,
  });

  const memberTasks = useMemo(() => {
    if (!tasksData?.data || !member) return [];
    return tasksData.data.filter((task) =>
      task.assignees?.some(
        (a) => a === member._id || a._id === member._id
      )
    );
  }, [tasksData, member]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Tasks for ${member?.username || "Member"}`}>
      <div className="flex flex-col h-[60vh] overflow-hidden -mx-6 px-6 relative">
        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <Loader className="size-6 animate-spin text-indigo-500" />
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="flex flex-1 flex-col items-center justify-center space-y-3">
            <AlertTriangle className="size-8 text-red-500" />
            <p className="text-sm text-slate-400">Failed to load assigned tasks.</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && memberTasks.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center space-y-3 text-center">
            <div className="rounded-full bg-slate-900 p-4 ring-1 ring-slate-800">
              <Layers className="size-8 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">No Assigned Tasks</p>
              <p className="text-xs text-slate-500 mt-1">
                {member?.username} doesn't have any tasks in this project yet.
              </p>
            </div>
          </div>
        )}

        {/* Task List */}
        {!isLoading && !isError && memberTasks.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-3 pb-4 custom-scrollbar">
            {memberTasks.map((task) => (
              <div
                key={task._id}
                className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-colors hover:border-slate-700/60 hover:bg-slate-900/70"
              >
                <div className="flex items-start justify-between gap-3 relative">
                  <div>
                    <h4 className="text-sm font-medium text-white leading-snug">
                      {task.title}
                    </h4>
                    {task.content && (
                       <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                         {task.content}
                       </p>
                    )}
                  </div>
                  <div className={`shrink-0 rounded bg-slate-800/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide border border-slate-700/50 ${
                       task.priority === 'critical' ? 'text-red-400' :
                       task.priority === 'high' ? 'text-amber-400' :
                       task.priority === 'low' ? 'text-slate-400' : 'text-blue-400'
                  }`}>
                    {task.priority || "MEDIUM"}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                        <CheckSquare className="size-3.5" />
                        <span>{task.isInBacklog ? "Backlog" : "Board"}</span>
                      </div>
                      
                      {task.dueDate && (
                         <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                           <Calendar className="size-3.5" />
                           <span>
                             {new Date(task.dueDate).toLocaleDateString(undefined, {
                               month: "short",
                               day: "numeric",
                             })}
                           </span>
                         </div>
                      )}
                   </div>
                   
                   <span className="text-[10px] font-mono text-slate-600">
                      #{task._id.slice(-4)}
                   </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
         <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors"
         >
            Close
         </button>
      </div>
    </Modal>
  );
};

export default AssignedTasksModal;
