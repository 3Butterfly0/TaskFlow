import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import ReactQuill from "react-quill";
// import "react-quill/dist/quill.snow.css";
import {
  useGetTaskByIdQuery,
  useUpdateTaskMutation,
  useAddCommentMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
} from "./taskApi";
import { selectCurrentUser } from "../auth/authSlice";
import FileUploader from "../../components/ui/FileUploader";
import {
  X,
  Trash2,
  Calendar,
  Tag,
  Users,
  CheckSquare,
  Paperclip,
  Activity,
  MessageSquare,
  Clock,
  MoreHorizontal,
} from "lucide-react";

const PRIORITIES = ["low", "medium", "high", "critical"];
const TABS = [
  { id: "comments", label: "Comments", icon: MessageSquare },
  { id: "history", label: "History", icon: Activity },
];

const TaskDetails = ({ taskId, isOpen, onClose, projectMembers = [], projectColumns = [] }) => {
  const overlayRef = useRef(null);
  const { data, isLoading: isTaskLoading } = useGetTaskByIdQuery(taskId, {
    skip: !taskId || !isOpen,
  });
  const [updateTask, { isLoading: isSaving }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [addComment, { isLoading: isCommentLoading }] = useAddCommentMutation();
  const [moveTask] = useMoveTaskMutation();
  const currentUser = useSelector(selectCurrentUser);

  const task = data?.data;

  // Local state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [assignees, setAssignees] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [activeTab, setActiveTab] = useState("comments");
  const [commentText, setCommentText] = useState("");

  // Sync state with task data
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setContent(task.content || "");
      setPriority(task.priority || "medium");
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
      setAssignees(task.assignees?.map((a) => a._id) || []);
      setSubtasks(task.subtasks || []);
      setAttachments(task.attachments || []);
    }
  }, [task]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = async (updates) => {
    if (!task) return;
    try {
      await updateTask({ id: task._id, ...updates }).unwrap();
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment({ taskId: task._id, text: commentText }).unwrap();
      setCommentText("");
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      await deleteTask(task._id).unwrap();
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8"
    >
      <div className="flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
        {/* Is Loading */}
        {isTaskLoading ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-slate-400">Loading task data...</span>
          </div>
        ) : task ? (
          <>
            {/* ── Header ─────────────────────────────── */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-6 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="font-medium text-slate-300">
                  {task.projectId ? "Project" : "Task"}
                </span>
                <span>/</span>
                <span className="font-mono text-xs uppercase text-slate-500">
                  {task._id.slice(-6)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  className="rounded p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                  title="Delete Task"
                >
                  <Trash2 className="size-4" />
                </button>
                <div className="h-4 w-px bg-slate-700 mx-1" />
                <button
                  onClick={onClose}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* ── Content Body ───────────────────────── */}
            <div className="flex flex-1 overflow-hidden">
              {/* ── Left Column: Main Content ────────── */}
              <div className="shrink-0 flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {/* Title */}
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => handleSave({ title })}
                  className="w-full bg-transparent text-2xl font-bold text-white placeholder-slate-600 outline-none mb-6"
                  placeholder="Task Title"
                />

                {/* Description */}
                <div className="mb-8">
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Description
                  </h3>
                  <div className="prose-invert prose-sm rounded-lg border border-slate-800 bg-slate-900/30">
                    <ReactQuill
                      theme="snow"
                      value={content}
                      onChange={setContent}
                      onBlur={() => handleSave({ content })}
                      className="text-slate-200"
                      modules={{
                        toolbar: [
                          [{ header: [1, 2, false] }],
                          ["bold", "italic", "underline", "strike", "blockquote"],
                          [
                            { list: "ordered" },
                            { list: "bullet" },
                            { indent: "-1" },
                            { indent: "+1" },
                          ],
                          ["link", "code-block"],
                          ["clean"],
                        ],
                      }}
                    />
                  </div>
                </div>

                {/* Attachments */}
                <div className="mb-8">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Paperclip className="size-4" /> Attachments
                  </h3>
                  <div className="flex flex-wrap gap-3 mb-3">
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="group relative flex items-center gap-3 rounded-md border border-slate-700 bg-slate-800 px-3 py-2"
                      >
                        <span className="text-sm font-medium text-indigo-400 truncate max-w-[150px]">
                          <a href={att.url} target="_blank" rel="noreferrer">
                            {att.filename}
                          </a>
                        </span>
                        <button
                          onClick={() => {
                            const newAtts = attachments.filter((_, i) => i !== idx);
                            setAttachments(newAtts);
                            handleSave({ attachments: newAtts });
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-opacity"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <FileUploader
                    onUpload={(file) => {
                      const newAtt = {
                        url: file.url,
                        filename: file.filename,
                        size: file.size,
                      };
                      const updated = [...attachments, newAtt];
                      setAttachments(updated);
                      handleSave({ attachments: updated });
                    }}
                  />
                </div>

                {/* Subtasks */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                      <CheckSquare className="size-4" /> Subtasks
                    </h3>
                    <span className="text-xs text-slate-500 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                      {subtasks.filter((s) => s.isCompleted).length} /{" "}
                      {subtasks.length} done
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {subtasks.length > 0 && (
                    <div className="h-1.5 w-full bg-slate-800 rounded-full mb-4 overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{
                          width: `${
                            (subtasks.filter((s) => s.isCompleted).length /
                              subtasks.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    {subtasks.map((sub, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 group rounded p-2 hover:bg-slate-900/50 -mx-2 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={sub.isCompleted}
                          onChange={async () => {
                            const updated = subtasks.map((s, i) =>
                              i === idx ? { ...s, isCompleted: !s.isCompleted } : s
                            );
                            setSubtasks(updated);
                            handleSave({ subtasks: updated });

                            // Check auto-complete
                            const allComplete = updated.length > 0 && updated.every(s => s.isCompleted);
                            if (allComplete) {
                              const doneCol = projectColumns.find(c => c.title.toLowerCase() === "done");
                              // Ensure it's not already in the Done column
                              if (doneCol && task.columnId !== doneCol.id) {
                                if (window.confirm("All subtasks are complete. Move task to Done?")) {
                                  try {
                                     // source column is task.columnId
                                     const sourceCol = projectColumns.find(c => c.id === task.columnId);
                                     if (sourceCol) {
                                        const newSourceTaskIds = sourceCol.taskIds.filter(id => id !== task._id);
                                        const newDestTaskIds = [...doneCol.taskIds, task._id];
                                        
                                        await moveTask({
                                          projectId: task.projectId,
                                          taskId: task._id,
                                          sourceColumnId: sourceCol.id,
                                          destinationColumnId: doneCol.id,
                                          newSourceTaskIds,
                                          newDestinationTaskIds: newDestTaskIds,
                                        }).unwrap();
                                     }
                                  } catch (err) {
                                     console.error("Failed to auto-move task to Done", err);
                                  }
                                }
                              }
                            }
                          }}
                          className="size-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
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
                          onClick={() => {
                            const updated = subtasks.filter((_, i) => i !== idx);
                            setSubtasks(updated);
                            handleSave({ subtasks: updated });
                          }}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      placeholder="+ Add subtask"
                      className="w-full bg-transparent text-sm text-slate-400 placeholder-slate-600 outline-none focus:text-white py-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          const updated = [
                            ...subtasks,
                            { title: e.currentTarget.value.trim(), isCompleted: false },
                          ];
                          setSubtasks(updated);
                          handleSave({ subtasks: updated });
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Tabs: Comments & History */}
                <div>
                  <div className="flex items-center gap-6 border-b border-slate-800 mb-4">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 pb-2 text-sm font-medium transition-colors border-b-2 ${
                          activeTab === tab.id
                            ? "border-indigo-500 text-white"
                            : "border-transparent text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        <tab.icon className="size-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === "comments" ? (
                    <div className="space-y-6">
                      <div className="flex gap-3">
                        <div className="size-8 shrink-0 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                          {currentUser?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 min-h-[80px]"
                          />
                          <div className="mt-2 flex justify-end">
                            <button
                              onClick={handleCommentSubmit}
                              disabled={isCommentLoading || !commentText.trim()}
                              className="rounded bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {(task.comments || []).map((comment, i) => (
                          <div key={i} className="flex gap-3 group">
                            <div className="size-8 shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white">
                              {comment.user?.username?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-slate-300">
                                  {comment.user?.username || "Unknown"}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                                {comment.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pl-4 border-l border-slate-800">
                      {(task.activityLog || [])
                        .slice()
                        .reverse()
                        .map((log, i) => (
                          <div key={i} className="relative pb-4 last:pb-0">
                            <div className="absolute -left-[21px] top-1 size-2.5 rounded-full border-2 border-slate-950 bg-slate-700" />
                            <p className="text-sm text-slate-400">
                              <span className="font-semibold text-slate-300">
                                User {/* Ideally fetch user name or populate actorId */}
                              </span>{" "}
                              {log.type.replace(/_/g, " ")}{" "}
                              <span className="text-xs text-slate-500 ml-2">
                                {new Date(log.createdAt).toLocaleString()}
                              </span>
                            </p>
                            {log.metadata && (
                              <pre className="mt-1 text-xs text-slate-600 font-mono">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right Column: Meta Info ──────────── */}
              <div className="w-80 border-l border-slate-800 bg-slate-900/20 p-6 overflow-y-auto hidden md:block">
                {/* Status Dropdown (Mapping to Column) */}
                <div className="mb-6">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </label>
                  <select
                    value={task.columnId || ""}
                    onChange={async (e) => {
                       const destColId = e.target.value;
                       if (destColId === task.columnId) return;
                       const sourceCol = projectColumns.find(c => c.id === task.columnId);
                       const destCol = projectColumns.find(c => c.id === destColId);
                       if (sourceCol && destCol) {
                          const newSourceTaskIds = sourceCol.taskIds.filter(id => id !== task._id);
                          const newDestTaskIds = [...destCol.taskIds, task._id];
                          await moveTask({
                            projectId: task.projectId,
                            taskId: task._id,
                            sourceColumnId: sourceCol.id,
                            destinationColumnId: destCol.id,
                            newSourceTaskIds,
                            newDestinationTaskIds: newDestTaskIds,
                          });
                       }
                    }}
                    className="w-full rounded bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                     {projectColumns.map((col) => (
                        <option key={col.id} value={col.id}>{col.title}</option>
                     ))}
                  </select>
                </div>

                {/* Assignees */}
                <div className="mb-6">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Assignees
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {assignees.map((id) => {
                      const member = projectMembers.find((m) => m._id === id);
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-2 rounded-full bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-400 border border-indigo-500/20"
                        >
                          <div className="size-4 rounded-full bg-indigo-500 text-[10px] text-white flex items-center justify-center">
                            {member?.username?.charAt(0).toUpperCase()}
                          </div>
                          {member?.username || "Unknown"}
                          <button
                            onClick={() => {
                              const updated = assignees.filter((uid) => uid !== id);
                              setAssignees(updated);
                              handleSave({ assignees: updated });
                            }}
                            className="hover:text-white"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1">
                    + Add Assignee
                  </button>
                </div>

                {/* Priority */}
                <div className="mb-6">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value);
                      handleSave({ priority: e.target.value });
                    }}
                    className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="mb-6">
                  <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <Calendar className="size-3.5" /> Dates
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => {
                      setDueDate(e.target.value);
                      handleSave({ dueDate: e.target.value });
                    }}
                    className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none scheme-dark"
                  />
                </div>

                {/* Metadata */}
                <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-500 space-y-2">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated</span>
                    <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-slate-500">Task not found</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default TaskDetails;
