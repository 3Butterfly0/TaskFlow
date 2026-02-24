import { useState } from "react";
import { useParams } from "react-router-dom";
import { useGetHistoryTasksQuery } from "../features/tasks/taskApi";
import { format } from "date-fns";
import { Search, Filter, ArchiveX, CheckCircle, XCircle } from "lucide-react";
import TaskDetails from "../features/tasks/TaskDetails";
import { useGetProjectByIdQuery } from "../features/projects/projectApi";

const History = () => {
  const { projectId } = useParams();
  const { data, isLoading } = useGetHistoryTasksQuery(projectId);
  const { data: projectData } = useGetProjectByIdQuery(projectId);
  const project = projectData?.data;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const tasks = data?.data || [];

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });



  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider">Done</span>;
      case "cancelled":
        return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider">Cancelled</span>;
      case "rejected":
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider">Rejected</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="border-b border-slate-800 bg-slate-900/50 p-6">
        <h1 className="text-xl font-bold text-white mb-4">Project History</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search historical tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="size-4 text-slate-500 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-slate-900 border border-slate-800">
              <ArchiveX className="size-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-300">No History Found</h3>
            <p className="mt-1 text-sm text-slate-500">
              Tasks that are completed, cancelled, or rejected will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="border-b border-slate-800 bg-slate-900 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Task</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4 min-w-[150px]">Date Logged</th>
                    <th className="px-6 py-4">Reason / Notes</th>
                    <th className="px-6 py-4">Assignees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTasks.map((task) => (
                    <tr 
                      key={task._id} 
                      className="group cursor-pointer hover:bg-slate-800/40 transition-colors"
                      onClick={() => setSelectedTaskId(task._id)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {task.title}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-1">
                          {task._id.slice(-6).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(task.status)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className={`capitalize ${
                            task.priority === 'critical' ? 'text-red-400 font-medium' :
                            task.priority === 'high' ? 'text-orange-400' :
                            task.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'
                         }`}>
                           {task.priority}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        {task.completedAt ? (
                          <div className="text-slate-300 flex items-center gap-1"><span className="text-slate-500">Done: </span>{format(new Date(task.completedAt), "MMM d, yyyy")}</div>
                        ) : task.cancelledAt ? (
                          <div className="text-slate-300"><span className="text-slate-500">Canc: </span>{format(new Date(task.cancelledAt), "MMM d, yyyy")}</div>
                        ) : task.rejectedAt ? (
                          <div className="text-slate-300"><span className="text-slate-500">Rej: </span>{format(new Date(task.rejectedAt), "MMM d, yyyy")}</div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                         <div className="truncate text-slate-400 text-xs">
                           {task.cancellationReason || task.rejectionReason || <span className="text-slate-600">-</span>}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        {task.assignees?.length > 0 ? (
                          <div className="flex -space-x-2">
                            {task.assignees.map((a, i) => (
                              <div
                                key={a._id || i}
                                className="flex size-7 items-center justify-center rounded-full border-2 border-slate-900 bg-indigo-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-slate-800"
                                title={a.username}
                              >
                                {a.username?.charAt(0).toUpperCase()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <TaskDetails
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        projectMembers={project?.members || []}
        projectColumns={project?.columns || []}
      />
    </div>
  );
};

export default History;
