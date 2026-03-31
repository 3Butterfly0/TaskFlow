import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetProjectsQuery } from "../features/projects/projectApi";
import CreateProjectModal from "../features/projects/CreateProjectModal";

const ProjectCardSkeleton = () => (
  <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-950 p-5">
    <div className="mb-3 h-5 w-2/3 rounded bg-slate-800" />
    <div className="mb-4 space-y-2">
      <div className="h-3 w-full rounded bg-slate-800/60" />
      <div className="h-3 w-4/5 rounded bg-slate-800/60" />
    </div>
    <div className="flex items-center gap-3">
      <div className="h-3 w-20 rounded bg-slate-800/40" />
      <div className="h-3 w-16 rounded bg-slate-800/40" />
    </div>
  </div>
);

const ProjectCard = ({ project }) => {
  const memberCount = project.members?.length || 0;
  const columnCount = project.columns?.length || 0;

  return (
    <Link
      to={`/projects/${project._id}/board`}
      className="group rounded-xl border border-slate-800 bg-slate-950 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/80"
    >
      <h3 className="mb-1 text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">
        {project.name}
      </h3>
      <p className="mb-4 text-sm text-slate-400 line-clamp-2">
        {project.description || "No description"}
      </p>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </span>

        <span className="flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          {columnCount} {columnCount === 1 ? "column" : "columns"}
        </span>
      </div>
    </Link>
  );
};

const Dashboard = () => {
  const { data, isLoading, isError, error } = useGetProjectsQuery();
  const [showCreate, setShowCreate] = useState(false);

  const projects = data?.data || [];

  return (
    <div className="flex flex-1 flex-col h-full overflow-y-auto custom-scrollbar px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-400">Welcome back! Manage your workspaces and projects.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Workspace
        </button>
      </div>

      {isError && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
          {error?.data?.message || "Failed to load projects"}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && !isError && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

      {!isLoading && !isError && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 py-16">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-7 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3 className="mb-1 text-base font-semibold text-white">
            No projects yet
          </h3>
          <p className="mb-5 text-sm text-slate-400">
            Create your first project to get started.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Project
          </button>
        </div>
      )}

      <CreateProjectModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
};

export default Dashboard;
