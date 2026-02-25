import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetProjectByIdQuery,
  useDeleteProjectMutation,
  useTogglePinProjectMutation,
} from "../features/projects/projectApi";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";
import {
  Settings as SettingsIcon,
  Users,
  Trash2,
  Globe,
  Shield,
  Pin,
} from "lucide-react";
import SettingsLayout from "../components/settings/SettingsLayout";
import { Toaster } from "react-hot-toast";

const Settings = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: projectData, isLoading: isProjectLoading } =
    useGetProjectByIdQuery(projectId);
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
  const [togglePin, { isLoading: isPinning }] = useTogglePinProjectMutation();
  const user = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState("general");

  const isPinned = user?.pinnedProjects?.includes(projectId);

  const project = projectData?.data;

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "access", label: "Access", icon: Users },
    { id: "integrations", label: "Integrations", icon: Globe },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ];

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone.",
      )
    )
      return;
    try {
      await deleteProject(projectId).unwrap();
      navigate("/");
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  };

  const handlePin = async () => {
    try {
      await togglePin(projectId).unwrap();
    } catch (err) {
      console.error("Failed to pin project", err);
    }
  };

  if (isProjectLoading)
    return (
      <div className="p-8 text-center text-slate-500">
        Loading project settings...
      </div>
    );
  if (!project)
    return (
      <div className="p-8 text-center text-slate-500">Project not found.</div>
    );

  return (
    <SettingsLayout
      title="Project Settings"
      description={`Manage settings for "${project.name}"`}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <Toaster position="top-right" />

      {activeTab === "general" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                General Settings
              </h2>
              <p className="text-sm text-slate-400">Update project details.</p>
            </div>
            <button
              onClick={handlePin}
              disabled={isPinning}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                isPinned
                  ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                  : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Pin className={`size-3 ${isPinned ? "fill-current" : ""}`} />
              {isPinned ? "Pinned" : "Pin Project"}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Project Name
              </label>
              <input
                type="text"
                defaultValue={project.name}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Description
              </label>
              <textarea
                defaultValue={project.description}
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Visibility
              </label>
              <select
                defaultValue={project.visibility || "private"}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-indigo-500"
              >
                <option value="private">Private (Components only)</option>
                <option value="public">Public (Visible to everyone)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {activeTab === "access" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Access Control</h2>
            <p className="text-sm text-slate-400">
              Manage who can access this project.
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-sm text-slate-300">
              To manage team members, please visit the{" "}
              <button
                onClick={() => navigate(`/projects/${projectId}/team`)}
                className="text-indigo-400 hover:underline"
              >
                Team Page
              </button>
              .
            </p>
          </div>

          <div className="space-y-4 opacity-50 pointer-events-none">
            <h3 className="text-sm font-medium text-slate-300">
              Default Member Role
            </h3>
            <div className="flex items-center gap-2 rounded-lg border border-slate-700 p-3">
              <Shield className="size-4 text-slate-400" />
              <span className="text-sm text-slate-400">Editor</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Integrations</h2>
            <p className="text-sm text-slate-400">
              Connect with third-party tools.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {["GitHub", "Slack", "Jira", "Figma"].map((tool) => (
              <div
                key={tool}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/30 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded bg-slate-700" />
                  <span className="font-medium text-slate-200">{tool}</span>
                </div>
                <button className="rounded px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 border border-slate-600">
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "danger" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Danger Zone</h2>
            <p className="text-sm text-slate-400">
              Irreversible actions for this project.
            </p>
          </div>

          <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-6">
            <div className="mb-4 flex items-center gap-3 text-red-400">
              <Trash2 className="size-5" />
              <h3 className="font-semibold">Delete Project</h3>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Deleting a project will permanently remove all associated tasks,
              columns, and data.
              <br />
              <strong>This action cannot be undone.</strong>
            </p>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </button>
          </div>
        </div>
      )}
    </SettingsLayout>
  );
};

export default Settings;
