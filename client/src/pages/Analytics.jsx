import { useParams } from "react-router-dom";
import AnalyticsDashboard from "../features/analytics/AnalyticsDashboard";
const Analytics = () => {
  const { projectId } = useParams();

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <AnalyticsDashboard projectId={projectId} />
      </div>
    </div>
  );
};

export default Analytics;
