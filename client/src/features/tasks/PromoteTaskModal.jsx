import { useState, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import { useUpdateTaskMutation } from "./taskApi";
import { useGetProjectByIdQuery } from "../projects/projectApi";
import { Loader, Plus, X, Trash2, Calendar } from "lucide-react";

/**
 * Modal to promote a backlog task to the board.
 * Allows setting priority, assignee, due date, and subtasks.
 */
const PromoteTaskModal = ({ isOpen, onClose, task, projectId }) => {
  const [updateTask, { isLoading }] = useUpdateTaskMutation();
  const { data: projectData } = useGetProjectByIdQuery(projectId, {
    skip: !isOpen,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [error, setError] = useState("");

  const project = projectData?.data;
  const members = project?.members || [];

  // Initialize form with task data when it opens
  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setPriority(task.priority || "medium");
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
      setAssigneeId(task.assignees?.[0]?._id || task.assignees?.[0] || "");
      setSubtasks(task.subtasks || []);
    }
  }, [isOpen, task]);

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { title: newSubtask.trim(), isCompleted: false }]);
    setNewSubtask("");
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (!assigneeId) {
        setError("Please assign the task to a member.");
        return;
      }

      await updateTask({
        id: task._id,
        title,
        description,
        priority,
        dueDate: dueDate || null,
        assignees: [assigneeId],
        subtasks,
        isInBacklog: false, // Promote to board
        // columnId is already set on the task, or we could let user choose. 
        // For now, let's keep it in its current column (or default first column if needed).
        // Since it's backlog, it might effectively be in "null" or a hidden state, 
        // but the model has `columnId`. If it was created in backlog, it has a columnId.
      }).unwrap();

      onClose();
    } catch (err) {
      setError(err?.data?.message || "Failed to promote task");
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Promote to Ticket">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
        {error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            placeholder="Task title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 min-h-[80px]"
            placeholder="Add a detailed description..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-white outline-none focus:border-indigo-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">
              Assignee <span className="text-red-400">*</span>
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-sm text-white outline-none focus:border-indigo-500"
              required
            >
              <option value="">Select Member</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.username}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">
            Due Date
          </label>
          <div className="relative">
             <Calendar className="absolute left-3 top-2.5 size-4 text-slate-500" />
             <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2.5 pl-10 text-sm text-white outline-none focus:border-indigo-500 scheme-dark"
            />
          </div>
        </div>

        {/* Subtasks */}
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-400">
            Subtasks
          </label>
          <div className="space-y-2 mb-2">
            {subtasks.map((st, index) => (
              <div key={index} className="flex items-center gap-2 bg-slate-900/50 p-2 rounded border border-slate-800">
                <div className={`size-4 rounded-full border-2 ${st.isCompleted ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`} />
                <span className="flex-1 text-sm text-slate-200">{st.title}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSubtask(index)}
                  className="text-slate-500 hover:text-red-400"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(e)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              placeholder="Add subtask..."
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="rounded-lg bg-slate-700 px-3 text-white hover:bg-slate-600"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {/* Created Date Display */}
        <div className="pt-2 text-xs text-slate-500 flex justify-between">
           <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
           <span>ID: {task._id.slice(-4)}</span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {isLoading ? "Promoting..." : "Promote Ticket"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PromoteTaskModal;
