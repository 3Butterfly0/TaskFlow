import mongoose from "mongoose";

// ── Subtask sub-schema (embedded) ────────────────────
const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Subtask title is required"],
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

// ── Comment sub-schema (embedded) ────────────────────
const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

// ── Activity log sub-schema (embedded, structured events) ──
// Per production-blueprint.md §5 – never store as plain text
const activityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "task_created",
        "status_changed",
        "priority_changed",
        "assignee_added",
        "assignee_removed",
        "comment_added",
        "subtask_added",
        "subtask_completed",
        "attachment_added",
        "due_date_changed",
        "moved_column",
      ],
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

// ── Attachment sub-schema ────────────────────────────
const attachmentSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

// ── Task schema ──────────────────────────────────────
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [1, "Task title cannot be empty"],
      maxlength: [200, "Task title cannot exceed 200 characters"],
    },

    content: {
      type: String,
      default: "",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },

    columnId: {
      type: String,
      required: [true, "Column ID is required"],
    },

    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    dueDate: {
      type: Date,
      default: null,
    },

    // ── Production enhancements (per production-blueprint.md §4) ──
    position: {
      type: Number,
      default: 0,
    },

    isInBacklog: {
      type: Boolean,
      default: false,
    },

    labels: [
      {
        type: String,
        trim: true,
      },
    ],

    watchers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ── History & Status Fields ───────────────────────
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "rejected"],
      default: "active",
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },

    // ── Embedded sub-documents ────────────────────────
    attachments: [attachmentSchema],
    subtasks: [subtaskSchema],
    comments: [commentSchema],
    activityLog: [activityLogSchema],
  },
  {
    timestamps: true,
  },
);

// ── Indexes (per production-blueprint.md §4) ──────────
taskSchema.index({ projectId: 1 });
taskSchema.index({ columnId: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ status: 1 });

// Compound index – accelerates board rendering
taskSchema.index({ projectId: 1, columnId: 1 });

// Text index for search
taskSchema.index({ title: "text", content: "text" });

const Task = mongoose.model("Task", taskSchema);

export default Task;
