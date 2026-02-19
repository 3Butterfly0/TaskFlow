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
      {/* ── Project Header ────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-600 text-lg font-bold text-white shadow-lg shadow-indigo-900/20">
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              {project.name}
            </h1>
            <p className="text-xs text-slate-500">Software Project</p>
          </div>
          
          <Link
            to={`/projects/${projectId}/settings`}
            className="ml-2 flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title="Project Settings"
          >
            <Settings className="size-4" />
          </Link>
        </div>
      </header>

      {/* ── Tabs ──────────────────────────────────────── */}
      <ProjectNavbar />

      {/* ── Page Content ──────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default ProjectLayout;
