import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import {
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useAddCommentMutation,
} from "./taskApi";
import { selectCurrentUser } from "../auth/authSlice";
import FileUploader from "../../components/ui/FileUploader";
import { Settings, ArrowLeft, Trash2, X } from "lucide-react";
import { useDeleteTaskMutation } from "./taskApi";

/* ═══════════════════════════════════════════════════════
   Priority & label constants
   ═══════════════════════════════════════════════════════ */
const PRIORITIES = ["low", "medium", "high", "critical"];
const priorityColors = {
  low: "bg-slate-600",
  medium: "bg-blue-600",
  high: "bg-amber-600",
  critical: "bg-red-600",
};

/* ═══════════════════════════════════════════════════════
   SubtasksSection
   ═══════════════════════════════════════════════════════ */
const SubtasksSection = ({ subtasks, onUpdate }) => {
  const [newTitle, setNewTitle] = useState("");

  const toggleSubtask = (idx) => {
    const updated = subtasks.map((s, i) =>
      i === idx ? { ...s, isCompleted: !s.isCompleted } : s
    );
    onUpdate(updated);
  };

  const addSubtask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onUpdate([...subtasks, { title: newTitle.trim(), isCompleted: false }]);
    setNewTitle("");
  };

  const removeSubtask = (idx) => {
    onUpdate(subtasks.filter((_, i) => i !== idx));
  };

  const done = subtasks.filter((s) => s.isCompleted).length;
  const total = subtasks.length;

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Subtasks {total > 0 && `(${done}/${total})`}
      </h3>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-3 h-1.5 w-full rounded-full bg-slate-800">
          <div
            className="h-1.5 rounded-full bg-indigo-500 transition-all"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      )}

      {/* List */}
      <div className="space-y-1.5 mb-3">
        {subtasks.map((sub, idx) => (
          <div
            key={idx}
            className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-800/50"
          >
            <input
              type="checkbox"
              checked={sub.isCompleted}
              onChange={() => toggleSubtask(idx)}
              className="size-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
            />
            <span
              className={`flex-1 text-sm ${
                sub.isCompleted
                  ? "text-slate-500 line-through"
                  : "text-slate-200"
              }`}
            >
              {sub.title}
            </span>
            <button
              onClick={() => removeSubtask(idx)}
              className="hidden text-slate-500 hover:text-red-400 group-hover:block"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add subtask */}
      <form onSubmit={addSubtask} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a subtask…"
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   CommentsSection
   ═══════════════════════════════════════════════════════ */
const CommentsSection = ({ comments, taskId }) => {
  const [addComment, { isLoading }] = useAddCommentMutation();
  const [text, setText] = useState("");
  const user = useSelector(selectCurrentUser);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await addComment({ taskId, text: text.trim() }).unwrap();
      setText("");
    } catch {
      // Error handled by RTK Query
    }
  };

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Comments ({comments.length})
      </h3>

      {/* Comment list */}
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-xs text-slate-500">No comments yet.</p>
        )}
        {comments.map((comment) => (
          <div key={comment._id} className="flex gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-medium text-white">
              {comment.user?.username?.charAt(0).toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-slate-300">
                  {comment.user?.username || "Unknown"}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(comment.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-300 whitespace-pre-wrap wrap-break-word">
                {comment.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-medium text-white">
          {user?.username?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex flex-1 gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   AttachmentsSection
   ═══════════════════════════════════════════════════════ */
const AttachmentsSection = ({ attachments, onAdd, onRemove }) => {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Attachments ({attachments.length})
      </h3>

      <div className="space-y-2 mb-3">
        {attachments.map((att, idx) => (
          <div
            key={idx}
            className="group flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-2 hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded bg-slate-800 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm font-medium text-indigo-400 hover:underline"
                >
                  {att.filename}
                </a>
                <p className="text-[10px] text-slate-500">
                  {att.size ? `${(att.size / 1024).toFixed(1)} KB` : "File"}
                </p>
              </div>
            </div>
            <button
              onClick={() => onRemove(idx)}
              className="hidden p-1.5 text-slate-500 hover:text-red-400 group-hover:block"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <FileUploader onUpload={onAdd} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   TaskDrawer (main component)
   ═══════════════════════════════════════════════════════ */
const TaskDrawer = ({ taskId, isOpen, onClose, projectMembers = [] }) => {
  const overlayRef = useRef(null);
  const { data, isLoading: isTaskLoading } = useGetTaskByIdQuery(taskId, {
    skip: !taskId || !isOpen,
  });
  const [updateTask, { isLoading: isSaving }] = useUpdateTaskMutation();

  const task = data?.data;

  // ── Local form state (synced from server) ──────────
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignees, setAssignees] = useState([]);

  const [subtasks, setSubtasks] = useState([]);

  const [attachments, setAttachments] = useState([]);

  const [activeTab, setActiveTab] = useState("details"); // 'details' | 'settings'
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  // Reset tab when task changes
  useEffect(() => {
    setActiveTab("details");
  }, [taskId]);

  // Sync local state when task data loads
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setContent(task.content || "");
      setPriority(task.priority || "medium");
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
      setAssignees(task.assignees?.map((a) => a._id) || []);
      setSubtasks(
        task.subtasks?.map((s) => ({
          title: s.title,
          isCompleted: s.isCompleted,
        })) || []
      );
      setAttachments(task.attachments || []);
    }
  }, [task]);

  // ── Escape key ─────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // ── Save handler ───────────────────────────────────
  const handleSave = async () => {
    if (!task) return;
    try {
      await updateTask({
        id: task._id,
        title: title.trim() || task.title,
        content,
        priority,
        dueDate: dueDate || null,
        assignees,
        subtasks,
      }).unwrap();
    } catch {
      // Error handled by RTK Query
    }
  };

  // ── Subtask update (auto-saves) ────────────────────
  const handleSubtaskUpdate = async (newSubtasks) => {
    setSubtasks(newSubtasks);
    if (!task) return;
    try {
      await updateTask({
        id: task._id,
        subtasks: newSubtasks,
      }).unwrap();
    } catch {
      // Revert on failure
      setSubtasks(
        task.subtasks?.map((s) => ({
          title: s.title,
          isCompleted: s.isCompleted,
        })) || []
      );
    }
  };

  // ── Assignee toggle ────────────────────────────────
  const toggleAssignee = async (memberId) => {
    const newAssignees = assignees.includes(memberId)
      ? assignees.filter((id) => id !== memberId)
      : [...assignees, memberId];
    setAssignees(newAssignees);
    if (!task) return;
    try {
      await updateTask({
        id: task._id,
        assignees: newAssignees,
      }).unwrap();
    } catch {
      setAssignees(task.assignees?.map((a) => a._id) || []);
    }
  };

  // ── Attachments handler ────────────────────────────
  const handleAttachmentAdd = async (fileData) => {
    const newAttachments = [...attachments, { url: fileData.url, filename: fileData.filename, size: fileData.size }];
    setAttachments(newAttachments);
    if (!task) return;
    try {
      await updateTask({ id: task._id, attachments: newAttachments }).unwrap();
    } catch {
      setAttachments(task.attachments || []);
    }
  };

  const handleAttachmentRemove = async (idx) => {
    const newAttachments = attachments.filter((_, i) => i !== idx);
    setAttachments(newAttachments);
    if (!task) return;
    try {
      await updateTask({ id: task._id, attachments: newAttachments }).unwrap();
    } catch {
      setAttachments(task.attachments || []);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
    >
      <div className="flex h-full w-full max-w-xl flex-col border-l border-slate-800 bg-slate-950 shadow-2xl">
        {/* ── Header ─────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            {activeTab === "settings" && (
              <button
                onClick={() => setActiveTab("details")}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <h2 className="text-sm font-semibold text-slate-400">
              {activeTab === "settings" ? "Task Settings" : "Task Details"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && (
              <span className="text-[11px] text-slate-500">Saving…</span>
            )}
            
            {activeTab === "details" && (
              <button
                onClick={() => setActiveTab("settings")}
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                title="Task Settings"
              >
                <Settings className="size-5" />
              </button>
            )}

            <button
              onClick={onClose}
              className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────── */}
        {isTaskLoading ? (
          <div className="flex-1 p-6 space-y-4">
             {/* Skeleton loader */}
             <div className="h-7 w-3/4 animate-pulse rounded bg-slate-800" />
             <div className="h-24 w-full animate-pulse rounded bg-slate-800/60" />
             <div className="h-4 w-1/3 animate-pulse rounded bg-slate-800/40" />
          </div>
        ) : task ? (
          activeTab === "settings" ? (
             <div className="flex-1 p-6">
                <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-6">
                  <div className="mb-4 flex items-center gap-3 text-red-400">
                    <Trash2 className="size-5" />
                    <h3 className="text-lg font-semibold">Delete Task</h3>
                  </div>
                  <p className="mb-6 text-sm text-slate-400">
                    Permanently delete this task? This action cannot be undone.
                  </p>
                  <button
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this task?")) {
                        try {
                           await deleteTask(task._id).unwrap();
                           onClose();
                        } catch (err) {
                           console.error("Failed to delete task", err);
                        }
                      }
                    }}
                    disabled={isDeleting}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete Task"}
                  </button>
                </div>
             </div>
          ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ── Title ────────────────────────────── */}
            <div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                className="w-full bg-transparent text-xl font-semibold text-white outline-none placeholder-slate-500"
                placeholder="Task title"
              />
            </div>

            {/* ── Meta row: priority + due date ──── */}
            <div className="flex flex-wrap gap-4">
              {/* Priority */}
              <div className="flex-1 min-w-[140px]">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => {
                    setPriority(e.target.value);
                    if (task) {
                      updateTask({ id: task._id, priority: e.target.value });
                    }
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Due date */}
              <div className="flex-1 min-w-[140px]">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (task) {
                      updateTask({
                        id: task._id,
                        dueDate: e.target.value || null,
                      });
                    }
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 scheme-dark"
                />
              </div>
            </div>

            {/* ── Description ──────────────────────── */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Description
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={handleSave}
                rows={4}
                placeholder="Add a description…"
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            {/* ── Assignees ────────────────────────── */}
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Assignees
              </h3>
              {projectMembers.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No members in this project.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {projectMembers.map((member) => {
                    const isAssigned = assignees.includes(member._id);
                    return (
                      <button
                        key={member._id}
                        onClick={() => toggleAssignee(member._id)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          isAssigned
                            ? "bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/50"
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        <div className="flex size-5 items-center justify-center rounded-full bg-slate-700 text-[10px] text-white">
                          {member.username?.charAt(0).toUpperCase() || "?"}
                        </div>
                        {member.username}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Subtasks ─────────────────────────── */}
            <SubtasksSection
              subtasks={subtasks}
              onUpdate={handleSubtaskUpdate}
            />

            {/* ── Attachments ──────────────────────── */}
            <AttachmentsSection
              attachments={attachments}
              onAdd={handleAttachmentAdd}
              onRemove={handleAttachmentRemove}
            />

            {/* ── Divider ──────────────────────────── */}
            <div className="border-t border-slate-800" />

            {/* ── Comments ─────────────────────────── */}
            <CommentsSection
              comments={task.comments || []}
              taskId={task._id}
            />
          </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-slate-500">Task not found.</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default TaskDrawer;
