import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetProjectByIdQuery, useDeleteProjectMutation } from "../features/projects/projectApi";
import { Shield, Trash2 } from "lucide-react";

const Settings = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: projectData } = useGetProjectByIdQuery(projectId);
  const [deleteProject, { isLoading }] = useDeleteProjectMutation();

  const project = projectData?.data;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    try {
      await deleteProject(projectId).unwrap();
      navigate("/");
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  };

  if (!project) return <div className="p-8 text-center text-slate-500">Loading project settings...</div>;

  return (
    <div className="mx-auto max-w-3xl py-8">
      <h1 className="mb-8 text-2xl font-bold text-white">Project Settings</h1>

      <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">General</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-400">Project Name</label>
            <input
              type="text"
              defaultValue={project.name}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-indigo-500"
              readOnly // For now
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-400">Description</label>
            <textarea
              defaultValue={project.description}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-indigo-500"
              rows={3}
              readOnly // For now
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-6">
        <div className="mb-4 flex items-center gap-3 text-red-400">
          <Trash2 className="size-5" />
          <h2 className="text-lg font-semibold">Danger Zone</h2>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Deleting a project will permanently remove all associated tasks, columns, and data.
        </p>
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          {isLoading ? "Deleting..." : "Delete Project"}
        </button>
      </div>
    </div>
  );
};

export default Settings;
