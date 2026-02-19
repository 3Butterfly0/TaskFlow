import { useGetProjectAnalyticsQuery } from "./analyticsApi";
import { useGetProjectMembersQuery } from "../projects/projectApi"; // Assume this exists or use projectApi
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
import { Loader } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];
const PRIORITY_COLORS = {
  low: "#3b82f6",     // blue
  medium: "#f59e0b",  // amber
  high: "#ef4444",    // red
  critical: "#7f1d1d",// dark red
};

const AnalyticsDashboard = ({ projectId }) => {
  const { data: analyticsData, isLoading } = useGetProjectAnalyticsQuery(projectId);
  const { data: membersData } = useGetProjectMembersQuery(projectId);

  if (isLoading) return <div className="flex justify-center p-10"><Loader className="animate-spin text-slate-500" /></div>;

  const analytics = analyticsData?.data;
  if (!analytics) return <div className="text-center text-slate-500">No data available</div>;

  const members = membersData?.data || [];
  
  // Transform assignee data for chart
  const assigneeData = Object.entries(analytics.byAssignee).map(([id, count]) => {
     if (id === "Unassigned") return { name: "Unassigned", count };
     const user = members.find(m => m._id === id);
     return { name: user ? user.username : "Unknown", count };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       
       {/* Status Distribution (Pie) */}
       <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
         <h3 className="text-lg font-semibold text-white mb-4">Task Status Distribution</h3>
         <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
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
                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                 ))}
               </Pie>
               <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }}
                  itemStyle={{ color: '#e2e8f0' }}
               />
             </PieChart>
           </ResponsiveContainer>
         </div>
         <div className="flex flex-wrap gap-4 justify-center mt-4">
            {analytics.byStatus.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-slate-400">
                <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {entry.name}: {entry.value}
              </div>
            ))}
         </div>
       </div>

       {/* Priority Breakdown (Bar) */}
       <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
         <h3 className="text-lg font-semibold text-white mb-4">Tasks by Priority</h3>
         <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={analytics.byPriority}>
               <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
               <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
               <RechartsTooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }}
               />
               <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                 {analytics.byPriority.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || "#64748b"} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
         </div>
       </div>

       {/* Workload (Bar) */}
       <div className="col-span-1 md:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-6">
         <h3 className="text-lg font-semibold text-white mb-4">Team Workload</h3>
         <div className="h-64">
           <ResponsiveContainer width="100%" height="100%">
             <BarChart data={assigneeData} layout="vertical">
               <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
               <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={100} />
               <RechartsTooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#e2e8f0' }}
               />
               <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} />
             </BarChart>
           </ResponsiveContainer>
         </div>
       </div>

    </div>
  );
};

export default AnalyticsDashboard;
