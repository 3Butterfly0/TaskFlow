import { useParams } from "react-router-dom";
import AnalyticsDashboard from "../features/analytics/AnalyticsDashboard";
const Analytics = () => {
  const { projectId } = useParams();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
        <AnalyticsDashboard projectId={projectId} />
      </div>
    </div>
  );
};

export default Analytics;
