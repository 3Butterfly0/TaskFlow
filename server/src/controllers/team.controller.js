import Project from "../models/Project.model.js";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { emitToProject } from "../config/socket.js";

// ──────────────────────────────────────────────────────
// GET /api/projects/:projectId/members
// Returns the project's members with role info
// ──────────────────────────────────────────────────────
export const getMembers = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId)
      .populate("owner", "username email avatar isOnline lastSeen")
      .populate("members", "username email avatar isOnline lastSeen");

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const isOwner = project.owner._id.toString() === userId;
    const isMember = project.members.some((m) => m._id.toString() === userId);

    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    // Build members list with roles
    const members = project.members.map((member) => ({
      _id: member._id,
      username: member.username,
      email: member.email,
      avatar: member.avatar,
      isOnline: member.isOnline,
      lastSeen: member.lastSeen,
      role:
        member._id.toString() === project.owner._id.toString()
          ? "admin"
          : "member",
    }));

    res
      .status(200)
      .json(new ApiResponse(200, members, "Members fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/projects/:projectId/members
// Invite a user to the project by email
// ──────────────────────────────────────────────────────
export const addMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    // ── Find project ─────────────────────────────────
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // ── Only owner can add members ───────────────────
    if (project.owner.toString() !== userId) {
      throw new ApiError(403, "Only the project owner can add members");
    }

    // ── Find user by email ───────────────────────────
    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      throw new ApiError(404, "No user found with that email address");
    }

    // ── Check if already a member ────────────────────
    if (
      project.members.some((m) => m.toString() === userToAdd._id.toString())
    ) {
      throw new ApiError(409, "User is already a member of this project");
    }

    // ── Add member ───────────────────────────────────
    project.members.push(userToAdd._id);
    await project.save();

    const member = {
      _id: userToAdd._id,
      username: userToAdd.username,
      email: userToAdd.email,
      avatar: userToAdd.avatar,
      isOnline: userToAdd.isOnline,
      lastSeen: userToAdd.lastSeen,
      role: "member",
    };

    // ── Emit socket event ────────────────────────────
    emitToProject(projectId, "member.added", { member });

    res
      .status(201)
      .json(new ApiResponse(201, member, "Member added successfully"));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// DELETE /api/projects/:projectId/members/:memberId
// Remove a member from the project
// ──────────────────────────────────────────────────────
export const removeMember = async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // ── Only owner can remove members ────────────────
    if (project.owner.toString() !== userId) {
      throw new ApiError(403, "Only the project owner can remove members");
    }

    // ── Cannot remove the owner ──────────────────────
    if (project.owner.toString() === memberId) {
      throw new ApiError(400, "Cannot remove the project owner");
    }

    // ── Check member exists ──────────────────────────
    const memberIndex = project.members.findIndex(
      (m) => m.toString() === memberId,
    );
    if (memberIndex === -1) {
      throw new ApiError(404, "Member not found in this project");
    }

    // ── Remove member ────────────────────────────────
    project.members.splice(memberIndex, 1);
    await project.save();

    // ── Emit socket event ────────────────────────────
    emitToProject(projectId, "member.removed", { memberId });

    res
      .status(200)
      .json(new ApiResponse(200, { memberId }, "Member removed successfully"));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// PATCH /api/projects/:projectId/members/:memberId/role
// Transfer ownership (since roles are owner-based)
// ──────────────────────────────────────────────────────
export const transferOwnership = async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // ── Only current owner can transfer ──────────────
    if (project.owner.toString() !== userId) {
      throw new ApiError(403, "Only the project owner can transfer ownership");
    }

    // ── Verify target is a member ────────────────────
    const isMember = project.members.some((m) => m.toString() === memberId);
    if (!isMember) {
      throw new ApiError(404, "Target user is not a member of this project");
    }

    // ── Transfer ownership ───────────────────────────
    project.owner = memberId;
    await project.save();

    // ── Emit socket event ────────────────────────────
    emitToProject(projectId, "ownership.transferred", {
      newOwnerId: memberId,
      previousOwnerId: userId,
    });

    res
      .status(200)
      .json(new ApiResponse(200, null, "Ownership transferred successfully"));
  } catch (error) {
    next(error);
  }
};
