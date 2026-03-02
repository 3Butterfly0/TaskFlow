import { useParams } from "react-router-dom";
import AnalyticsDashboard from "../features/analytics/AnalyticsDashboard";
const Analytics = () => {
  const { projectId } = useParams();

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-4">
        <AnalyticsDashboard projectId={projectId} />
      </div>
    </div>
  );
};

export default Analytics;
