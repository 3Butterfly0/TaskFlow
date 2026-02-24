import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inviteeEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    inviteeUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Null if user is not registered yet
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "expired", "declined"],
      default: "pending",
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: document deletes when Date.now() >= expiresAt
    },
  },
  { timestamps: true },
);

export const Invitation = mongoose.model("Invitation", invitationSchema);
