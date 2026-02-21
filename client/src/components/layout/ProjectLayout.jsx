import { Outlet, useParams, Link } from "react-router-dom";
import { useGetProjectByIdQuery } from "../../features/projects/projectApi";
import ProjectNavbar from "./ProjectNavbar";
import { Settings, Loader } from "lucide-react";

/**
 * Layout for project-specific routes.
 * Renders the project header, navigation tabs, and the page content.
 */
const ProjectLayout = () => {
  const { projectId } = useParams();
  const { data: projectData, isLoading } = useGetProjectByIdQuery(projectId);
  const project = projectData?.data;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950">
        <Loader className="animate-spin text-slate-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-950 text-slate-500">
        Project not found
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* ── Project Header & Nav ──────────────────────── */}
      <header className="flex shrink-0 flex-col bg-slate-950 px-8 pt-6 pb-0 shadow-sm border-b border-slate-800">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-slate-500">
          <Link to="/" className="hover:underline hover:text-indigo-400">Workspaces</Link>
          <span>/</span>
          <span className="text-slate-400">{project.name}</span>
        </div>
        
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded bg-indigo-500/20 text-xl font-bold text-indigo-400 border border-indigo-500/30">
              {project.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">
              {project.name}
            </h1>
          </div>
          
          <Link
            to={`/projects/${projectId}/settings`}
            className="flex items-center gap-2 rounded bg-slate-800/40 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border border-slate-700/50"
            title="Project Settings"
          >
            <Settings className="size-4" />
            Settings
          </Link>
        </div>

        {/* ── Tabs ──────────────────────────────────────── */}
        <div className="-mb-px">
          <ProjectNavbar />
        </div>
      </header>

      {/* ── Page Content ──────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default ProjectLayout;
