import mongoose from "mongoose";

// ── Ticket schema ────────────────────────────────────
const ticketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, "Ticket subject is required"],
      trim: true,
      minlength: [3, "Subject must be at least 3 characters"],
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },

    description: {
      type: String,
      required: [true, "Ticket description is required"],
      trim: true,
    },

    severity: {
      type: String,
      enum: ["minor", "major", "blocking"],
      default: "minor",
    },

    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter is required"],
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "rejected"],
      default: "open",
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },

    linkedTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    // ── Production enhancements (per production-blueprint.md §4) ──
    attachments: [
      {
        url: { type: String, required: true },
        filename: { type: String, required: true },
      },
    ],

    triagedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes (per production-blueprint.md §4) ──────────
ticketSchema.index({ status: 1 });
ticketSchema.index({ reporter: 1 });
ticketSchema.index({ severity: 1 });
ticketSchema.index({ projectId: 1 });
ticketSchema.index({ projectId: 1, status: 1 });

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
