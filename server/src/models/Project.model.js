import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Column sub-schema (embedded)
const columnSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: () => uuidv4(),
    },
    title: {
      type: String,
      required: [true, "Column title is required"],
      trim: true,
    },
    taskIds: [
      {
        type: String,
      },
    ],
  },
  { _id: false },
);

// Project schema
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [2, "Project name must be at least 2 characters"],
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },

    description: {
      type: String,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project owner is required"],
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    columns: {
      type: [columnSchema],
      default: () => [
        { id: uuidv4(), title: "Todo", taskIds: [] },
        { id: uuidv4(), title: "In Progress", taskIds: [] },
        { id: uuidv4(), title: "Done", taskIds: [] },
      ],
    },

    // Member Roles (for permissions)
    roles: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["admin", "member", "observer"],
          default: "member",
        },
      },
    ],

    // Production enhancements (per production-blueprint.md §4)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    archived: {
      type: Boolean,
      default: false,
    },

    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes (per production-blueprint.md §4)
projectSchema.index({ owner: 1 });
projectSchema.index({ members: 1 });
projectSchema.index({ archived: 1 });

// Text index for search
projectSchema.index({ name: "text", description: "text" });

const Project = mongoose.model("Project", projectSchema);

export default Project;
