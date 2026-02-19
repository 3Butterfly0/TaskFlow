import { useState } from "react";
import { Link } from "react-router-dom";
import { useSearchQuery } from "../features/search/searchApi";
import { Search, Loader, Filter } from "lucide-react";

/**
 * Global Issues Navigator.
 * Simple table view of tasks/tickets across all projects.
 */
const GlobalIssues = () => {
  const [filter, setFilter] = useState({ q: "", type: "task" });
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input
  const handleSearchChange = (e) => {
    setFilter({ ...filter, q: e.target.value });
    setTimeout(() => {
      setDebouncedQuery(e.target.value);
    }, 300);
  };

  const { data, isLoading } = useSearchQuery({
    q: debouncedQuery || " ", // Send space to match all if supported, else rely on type
    type: "task",
  });

  const tasks = data?.data?.tasks || [];

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ───────────────────────────────────── */}
      <header className="flex flex-col gap-4 border-b border-slate-800 bg-slate-950 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Issues</h1>
          <p className="text-sm text-slate-400">
            View and manage issues across all projects
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter issues..."
              className="h-10 w-64 rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-4 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
              value={filter.q}
              onChange={handleSearchChange}
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700">
            <Filter className="size-4" />
            Filters
          </button>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader className="size-8 animate-spin text-indigo-500" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-900/50 p-8 text-center">
            <Search className="mb-4 size-10 text-slate-600" />
            <h3 className="text-lg font-medium text-slate-300">
              No issues found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your search terms or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-sm">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Key / Summary
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Project
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Priority
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900">
                {tasks.map((task) => (
                  <tr
                    key={task._id}
                    className="group transition-colors hover:bg-slate-800/50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      {/* Icon placeholder based on type if we had type field */}
                      <div className="flex items-center justify-center rounded bg-blue-500/20 p-1 text-blue-400 w-6 h-6">
                        <div className="size-2 rounded-full bg-current" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/projects/${task.projectId._id}/board?task=${task._id}`}
                        className="font-medium text-slate-200 hover:text-indigo-400 hover:underline"
                      >
                        {task.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-400">
                      {task.projectId?.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          task.priority === "high" || task.priority === "critical"
                            ? "bg-red-500/10 text-red-500"
                            : task.priority === "medium"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-green-500/10 text-green-500"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {new Date(task.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalIssues;
