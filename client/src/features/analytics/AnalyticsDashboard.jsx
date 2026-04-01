import { useState, useEffect } from "react";
import ErrorState from "../../components/ui/ErrorState";
import { useGetProjectAnalyticsQuery } from "./analyticsApi";
import { useGetProjectMembersQuery } from "../projects/projectApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Loader,
  Users,
  User,
  CheckCircle2,
  CircleDashed,
  AlertOctagon,
  TrendingUp,
  Clock,
} from "lucide-react";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];
const PRIORITY_COLORS = {
  low: "#3b82f6", // blue
  medium: "#f59e0b", // amber
  high: "#ef4444", // red
  critical: "#7f1d1d", // dark red
};

const StatCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
    <div className="flex items-start justify-between">
      <h3 className="text-sm font-medium text-slate-400">{title}</h3>
      <div
        className={`p-2 rounded-lg ${colorClass} bg-opacity-10 bg-slate-800`}
      >
        <Icon className={`size-4 ${colorClass}`} />
      </div>
    </div>
    <div className="mt-4">
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const AnalyticsDashboard = ({ projectId }) => {
  const [requestedScope, setRequestedScope] = useState(undefined);
  const {
    data: analyticsData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetProjectAnalyticsQuery({ projectId, scope: requestedScope });
  const { data: membersData } = useGetProjectMembersQuery(projectId);

  const analytics = analyticsData?.data;
  const members = membersData?.data || [];

  // Update requestedScope strictly once to sync with what backend defaulted to
  useEffect(() => {
    if (analytics && requestedScope === undefined) {
      setRequestedScope(analytics.scope);
    }
  }, [analytics, requestedScope]);

  if (isError) {
    return (
      <div className="pt-6">
        <ErrorState message={error?.data?.message || "Failed to load project analytics"} />
      </div>
    );
  }

  if (isLoading || !analytics) {
    return (
      <div className="flex justify-center p-10 h-64 items-center">
        <Loader className="animate-spin text-slate-500 size-8" />
      </div>
    );
  }

  // Transform assignee data for chart
  const assigneeData = Object.entries(analytics.byAssignee).map(
    ([id, count]) => {
      if (id === "Unassigned") return { name: "Unassigned", count };
      const user = members.find((m) => m._id === id);
      return { name: user ? user.username : "Unknown", count };
    },
  );

  const getMemberName = (id) => {
    const user = members.find((m) => m._id === id);
    return user ? user.username : "Unknown Member";
  };

  const CustomPriorityTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-sm font-semibold text-white capitalize mb-1">
            {label} Priority
          </p>
          <p className="text-xs text-slate-400">
            Total Tasks:{" "}
            <span className="text-slate-200 font-medium">{data.total}</span>
          </p>
          <p className="text-xs text-emerald-400">
            Completed: <span className="font-medium">{data.completed}</span>
          </p>
          <p className="text-xs text-indigo-400 font-bold mt-1">
            Rate: {data.completionRate}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Project Analytics</h2>
          <p className="text-sm text-slate-400">
            {analytics.scope === "all"
              ? "Viewing project-wide metrics."
              : "Viewing your personal metrics."}
          </p>
        </div>

        {analytics.hasAllAccess && (
          <div className="flex items-center gap-1 bg-slate-900/50 p-1 border border-slate-800 rounded-lg">
            <button
              onClick={() => setRequestedScope("me")}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${analytics.scope === "me" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
            >
              <User className="size-4" /> My Stats
            </button>
            <button
              onClick={() => setRequestedScope("all")}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${analytics.scope === "all" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Users className="size-4" /> Project Overview
            </button>
          </div>
        )}
      </div>

      {isFetching && requestedScope ? (
        <div className="flex justify-center p-4">
          <Loader className="animate-spin text-indigo-500 size-6" />
        </div>
      ) : (
        <>
          {/* Summary Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              title="Total Tasks"
              value={analytics.summary.totalTasks}
              icon={CircleDashed}
              colorClass="text-blue-500"
            />
            <StatCard
              title="Completed"
              value={analytics.summary.completedTasks}
              icon={CheckCircle2}
              colorClass="text-emerald-500"
            />
            <StatCard
              title="Pending"
              value={analytics.summary.pendingTasks}
              icon={Clock}
              colorClass="text-amber-500"
            />
            <StatCard
              title="Completion Rate"
              value={`${analytics.summary.completionRate}%`}
              icon={TrendingUp}
              colorClass="text-indigo-500"
            />
            <StatCard
              title="Overdue"
              value={analytics.summary.overdueTasks}
              icon={AlertOctagon}
              colorClass="text-red-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Distribution (Pie) */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Task Status Distribution
              </h3>
              <div className="h-64">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={1}
                  minHeight={1}
                >
                  <PieChart>
                    <Pie
                      data={analytics.byStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analytics.byStatus.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#1e293b",
                        color: "#e2e8f0",
                        borderRadius: "0.5rem",
                      }}
                      itemStyle={{ color: "#e2e8f0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                {analytics.byStatus.map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs text-slate-400"
                  >
                    <div
                      className="size-2 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {entry.name}:{" "}
                    <span className="font-bold text-slate-300">
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Breakdown (Bar) */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Priority Completion Rates
              </h3>
              <div className="h-64">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={1}
                  minHeight={1}
                >
                  <BarChart
                    data={analytics.byPriority}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RechartsTooltip
                      content={<CustomPriorityTooltip />}
                      cursor={{ fill: "#1e293b", opacity: 0.4 }}
                    />
                    <Bar dataKey="completionRate" radius={[4, 4, 0, 0]}>
                      {analytics.byPriority.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PRIORITY_COLORS[entry.name] || "#64748b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 text-center mt-4">
                Showing percentage of tasks completed per priority.
              </p>
            </div>

            {/* Workload (Bar) - Only show if 'all' scope so it makes sense */}
            {analytics.scope === "all" && (
              <div className="col-span-1 md:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Team Workload Breakdown
                </h3>
                <div className="h-64">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={1}
                    minHeight={1}
                  >
                    <BarChart
                      data={assigneeData}
                      layout="vertical"
                      margin={{ left: 20 }}
                    >
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#64748b"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                      />
                      <RechartsTooltip
                        cursor={{ fill: "#1e293b", opacity: 0.4 }}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#1e293b",
                          color: "#e2e8f0",
                          borderRadius: "0.5rem",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#6366f1"
                        radius={[0, 4, 4, 0]}
                        barSize={24}
                        name="Tasks Assigned"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Per-Member Performance Table */}
          {analytics.perMemberPerformance && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden mt-6">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-lg font-semibold text-white">
                  Per-Member Performance
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Detailed breakdown of productivity across the team.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Member</th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Assigned Tasks
                      </th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Completed
                      </th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Completion Rate
                      </th>
                      <th className="px-6 py-4 font-semibold text-right">
                        Avg. Time to Complete
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {analytics.perMemberPerformance.map((perf) => (
                      <tr
                        key={perf.userId}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-white">
                          {getMemberName(perf.userId)}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400">
                          {perf.taskCount}
                        </td>
                        <td className="px-6 py-4 text-right text-emerald-400">
                          {perf.completedCount}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                              perf.completionRate >= 80
                                ? "bg-emerald-500/20 text-emerald-400"
                                : perf.completionRate >= 40
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {perf.completionRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400">
                          {perf.avgTimeDays > 0
                            ? `${perf.avgTimeDays} days`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                    {analytics.perMemberPerformance.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-8 text-center text-slate-500"
                        >
                          No members tracked yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
