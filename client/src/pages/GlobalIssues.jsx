import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetMyTasksQuery } from "../features/tasks/taskApi";
import { useGetProjectsQuery } from "../features/projects/projectApi";
import {
  Search,
  Loader,
  Filter,
  CheckCircle,
  Clock,
  ArchiveX,
  XCircle,
  Layout,
  ArrowRight,
} from "lucide-react";

const GlobalIssues = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState({
    q: "",
    projectId: "all",
    priority: "all",
    status: "all",
  });

  // Projects for the filter dropdown
  const { data: projectsData } = useGetProjectsQuery();
  const projects = projectsData?.data || [];

  // Fetch tasks
  const { data, isLoading } = useGetMyTasksQuery({
    projectId: filter.projectId !== "all" ? filter.projectId : undefined,
    priority: filter.priority !== "all" ? filter.priority : undefined,
    status: filter.status !== "all" ? filter.status : undefined,
  });

  const tasks = data?.data || [];

  // Client side text search filter
  const filteredTasks = tasks.filter((task) => {
    if (!filter.q) return true;
    const lowerQ = filter.q.toLowerCase();
    return (
      task.title.toLowerCase().includes(lowerQ) ||
      task.content?.toLowerCase().includes(lowerQ)
    );
  });

  const getPriorityColor = (prio) => {
    switch (prio) {
      case "critical":
        return "text-red-400 font-bold bg-red-400/10 border-red-500/20";
      case "high":
        return "text-orange-400 bg-orange-400/10 border-orange-500/20";
      case "medium":
        return "text-amber-400 bg-amber-400/10 border-amber-500/20";
      case "low":
        return "text-blue-400 bg-blue-400/10 border-blue-500/20";
      default:
        return "text-slate-400 bg-slate-800 border-slate-700";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-400">
            <CheckCircle className="size-3.5" /> Done
          </span>
        );
      case "active":
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-400">
            <Clock className="size-3.5" /> Active
          </span>
        );
      case "cancelled":
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <ArchiveX className="size-3.5" /> Cancelled
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-400">
            <XCircle className="size-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-800 bg-slate-900/50 p-4 md:p-8 shrink-0">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Global Issues
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Track and manage all tasks assigned to you across every workspace.
        </p>

        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by keyword..."
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-4 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
              value={filter.q}
              onChange={(e) => setFilter({ ...filter, q: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 flex-1 lg:flex-none">
              <span className="text-xs font-sm text-slate-500 uppercase tracking-wider">
                Project
              </span>
              <select
                value={filter.projectId}
                onChange={(e) =>
                  setFilter({ ...filter, projectId: e.target.value })
                }
                className="h-10 bg-transparent text-sm text-slate-300 outline-none w-full"
              >
                <option value="all">All Projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 flex-1 lg:flex-none">
              <span className="text-xs font-sm text-slate-500 uppercase tracking-wider">
                Status
              </span>
              <select
                value={filter.status}
                onChange={(e) =>
                  setFilter({ ...filter, status: e.target.value })
                }
                className="h-10 bg-transparent text-sm text-slate-300 outline-none w-full"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 flex-1 lg:flex-none">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Priority
              </span>
              <select
                value={filter.priority}
                onChange={(e) =>
                  setFilter({ ...filter, priority: e.target.value })
                }
                className="h-10 bg-transparent text-sm text-slate-300 outline-none w-full"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader className="size-8 animate-spin text-indigo-500" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex size-20 items-center justify-center rounded-2xl bg-slate-900/50 border border-slate-800/80 shadow-inner">
              <CheckCircle className="size-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white">All caught up!</h3>
            <p className="mt-2 text-slate-400 max-w-sm">
              You don't have any issues matching the current criteria across
              your projects.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 shadow-xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="border-b border-slate-800/80 bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-500 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 min-w-[300px]">Task Summary</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {filteredTasks.map((task) => (
                    <tr
                      key={task._id}
                      onClick={() =>
                        navigate(
                          `/projects/${task.projectId?._id}/board?taskId=${task._id}`,
                        )
                      }
                      className="group transition-all hover:bg-slate-800/60 cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        {getStatusBadge(task.status)}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-1 break-all whitespace-normal">
                            {task.title}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            ID: {task._id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="size-6 bg-slate-850 border border-slate-700 rounded-md flex items-center justify-center">
                            <Layout className="size-3 text-slate-400" />
                          </div>
                          <span className="font-medium text-slate-300">
                            {task.projectId?.name || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end pr-2 text-slate-600 group-hover:text-indigo-400 transition-colors">
                          <ArrowRight className="size-5" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalIssues;
