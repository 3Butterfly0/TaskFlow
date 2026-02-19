import { useParams } from "react-router-dom";
import AnalyticsDashboard from "../features/analytics/AnalyticsDashboard";
import { Link } from "react-router-dom";
import { useGetProjectByIdQuery } from "../features/projects/projectApi";

const Analytics = () => {
  const { projectId } = useParams();
  const { data: projectData } = useGetProjectByIdQuery(projectId);
  const project = projectData?.data;

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-800">
            <div className="text-sm text-slate-500 mb-1">
              <Link to={`/projects/${projectId}/board`} className="hover:text-indigo-400 decoration-none">Projects</Link> / {project?.name}
            </div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8">
            <AnalyticsDashboard projectId={projectId} />
        </div>
    </div>
  );
};

export default Analytics;
