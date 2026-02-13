import { useState } from "react";
import { useCreateProjectMutation } from "./projectApi";
import Modal from "../../components/ui/Modal";

/**
 * Feature-specific modal for creating a new project.
 *
 * Props:
 *   isOpen  – boolean controlling visibility
 *   onClose – callback to close the modal
 */
const CreateProjectModal = ({ isOpen, onClose }) => {
  const [createProject, { isLoading }] = useCreateProjectMutation();

  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Project name is required");
      return;
    }

    try {
      await createProject({
        name: form.name.trim(),
        description: form.description.trim(),
      }).unwrap();

      // Reset and close on success
      setForm({ name: "", description: "" });
      onClose();
    } catch (err) {
      setError(
        err?.data?.error?.message || err?.data?.message || "Failed to create project"
      );
    }
  };

  const handleClose = () => {
    setForm({ name: "", description: "" });
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Project">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label
            htmlFor="project-name"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Project Name
          </label>
          <input
            id="project-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Marketing Website"
            autoFocus
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="project-description"
            className="mb-1.5 block text-sm font-medium text-slate-300"
          >
            Description{" "}
            <span className="text-slate-500">(optional)</span>
          </label>
          <textarea
            id="project-description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Brief description of the project…"
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors resize-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Creating…" : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateProjectModal;
