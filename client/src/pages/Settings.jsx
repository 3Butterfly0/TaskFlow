import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import {
  useGetProjectByIdQuery,
  useDeleteProjectMutation,
  useUpdateProjectMutation,
  useTransferOwnershipMutation,
} from "../features/projects/projectApi";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";
import {
  Settings as SettingsIcon,
  Users,
  Trash2,
  Globe,
  Shield,
} from "lucide-react";
import SettingsLayout from "../components/settings/SettingsLayout";
import { toast } from "react-hot-toast";

const Settings = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { data: projectData, isLoading: isProjectLoading } =
    useGetProjectByIdQuery(projectId);
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation();
  const [transferOwnership, { isLoading: isTransferring }] =
    useTransferOwnershipMutation();
  const user = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState("general");

  const project = projectData?.data;
  const isOwner = project?.owner?._id === user?._id;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "private",
  });
  const [newOwnerId, setNewOwnerId] = useState("");

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        visibility: project.visibility || "private",
      });
    }
  }, [project]);

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "access", label: "Access", icon: Users },
    { id: "integrations", label: "Integrations", icon: Globe },
    { id: "danger", label: "Danger Zone", icon: Trash2 },
  ];

  const handleDelete = () => {
    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-w-sm w-full mx-4">
            <h1 className="text-xl font-bold text-white mb-2">Delete Project</h1>
            <p className="text-sm text-slate-400 mb-6">Are you sure you want to delete this project? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition">Cancel</button>
              <button 
                onClick={async () => {
                  try {
                    await deleteProject(projectId).unwrap();
                    toast.success("Project deleted successfully");
                    navigate("/");
                  } catch (err) {
                    toast.error("Failed to delete project");
                  }
                  onClose();
                }} 
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-lg shadow-red-500/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        );
      }
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProject({ id: projectId, ...formData }).unwrap();
      toast.success("Project updated successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update project");
    }
  };

  const handleTransfer = () => {
    if (!newOwnerId) return toast.error("Select a member to transfer ownership");
    
    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <div className="rounded-xl border border-yellow-900/50 bg-slate-900 p-6 shadow-2xl max-w-sm w-full mx-4">
            <h1 className="text-xl font-bold text-yellow-500 mb-2 flex items-center gap-2">Transfer Ownership</h1>
            <p className="text-sm text-slate-400 mb-6">Are you sure you want to transfer ownership? You will instantly lose Admin rights.</p>
            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition">Cancel</button>
              <button 
                onClick={async () => {
                  try {
                    await transferOwnership({ id: projectId, newOwnerId }).unwrap();
                    toast.success("Ownership transferred successfully");
                    navigate("/");
                  } catch (err) {
                    toast.error(err?.data?.message || "Failed to transfer ownership");
                  }
                  onClose();
                }} 
                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-900 bg-yellow-500 hover:bg-yellow-400 transition"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        );
      }
    });
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
      {activeTab === "general" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Update project details.</p>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4 pt-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Project Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={!isOwner}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                disabled={!isOwner}
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) =>
                  setFormData({ ...formData, visibility: e.target.value })
                }
                disabled={!isOwner}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none focus:border-indigo-500 disabled:opacity-50"
              >
                <option value="private">Private (Members only)</option>
                <option value="public">Public (Visible to everyone)</option>
              </select>
            </div>

            {isOwner && (
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
      {activeTab === "access" && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400">
              Manage who can access this project.
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
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] uppercase font-bold text-indigo-400">
                Future Update
              </span>
              <h3 className="text-lg font-bold text-white">Power Up Your Workflow</h3>
            </div>
            <p className="text-sm text-slate-400 max-w-xl">
              Connect TaskFlow with your favorite development and communication tools. 
              Automate notifications, sync code changes, and keep your team in the loop.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { name: "GitHub", desc: "Sync pull requests and issues", icon: "G" },
              { name: "Slack", desc: "Get real-time task notifications", icon: "S" },
              { name: "Jira", desc: "Import legacy projects and tasks", icon: "J" },
              { name: "Figma", desc: "Embed designs directly in tasks", icon: "F" },
            ].map((tool) => (
              <div
                key={tool.name}
                className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-all hover:border-slate-700 hover:bg-slate-900"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-sm font-bold text-slate-400 border border-slate-700">
                  {tool.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-semibold text-slate-200">{tool.name}</h4>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Waitlist</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{tool.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === "danger" && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400">
              Irreversible actions for this project.
            </p>
          </div>

          {!isOwner ? (
            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6 text-center text-slate-400">
              Only the project owner can access these settings.
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-orange-500/20 bg-orange-950/10 p-6">
                <div className="mb-4 flex items-center gap-3 text-orange-400">
                  <Users className="size-5" />
                  <h3 className="font-semibold">Transfer Ownership</h3>
                </div>
                <p className="mb-4 text-sm text-slate-400">
                  Transfer this project to another team member. You will lose
                  owner privileges.
                </p>
                <div className="flex gap-3">
                  <select
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a member...</option>
                    {project.members
                      ?.filter((m) => m._id !== user?._id)
                      .map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.username} ({member.email})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleTransfer}
                    disabled={isTransferring || !newOwnerId}
                    className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {isTransferring ? "Transferring..." : "Transfer"}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-6">
                <div className="mb-4 flex items-center gap-3 text-red-400">
                  <Trash2 className="size-5" />
                  <h3 className="font-semibold">Delete Project</h3>
                </div>
                <p className="mb-4 text-sm text-slate-400">
                  Deleting a project will permanently remove all associated
                  tasks, columns, and data.
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
            </>
          )}
        </div>
      )}
    </SettingsLayout>
  );
};

export default Settings;
