import Project from "../models/Project.model.js";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { emitToProject } from "../config/socket.js";

// GET /api/projects/:projectId/members
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

    // Build roles map
    const rolesMap = new Map();
    if (project.roles) {
      project.roles.forEach((r) => rolesMap.set(r.userId.toString(), r.role));
    }

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
          : rolesMap.get(member._id.toString()) || "member",
      isOwner: member._id.toString() === project.owner._id.toString(),
    }));

    res
      .status(200)
      .json(new ApiResponse(200, members, "Members fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:projectId/members
export const addMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // Check permissions (Owner or Admin)
    const isOwner = project.owner.toString() === userId;
    const adminRole = project.roles.find(
      (r) => r.userId.toString() === userId && r.role === "admin",
    );

    if (!isOwner && !adminRole) {
      throw new ApiError(
        403,
        "Only the project owner or admins can add members",
      );
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      throw new ApiError(404, "No user found with that email address");
    }

    if (
      project.members.some((m) => m.toString() === userToAdd._id.toString())
    ) {
      throw new ApiError(409, "User is already a member of this project");
    }

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

    emitToProject(projectId, "member.added", { member });

    res
      .status(201)
      .json(new ApiResponse(201, member, "Member added successfully"));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:projectId/members/:memberId
export const removeMember = async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // Check permissions (Owner or Admin)
    const isOwner = project.owner.toString() === userId;
    const adminRole = project.roles.find(
      (r) => r.userId.toString() === userId && r.role === "admin",
    );

    if (!isOwner && !adminRole) {
      throw new ApiError(
        403,
        "Only the project owner or admins can remove members",
      );
    }

    // Cannot remove other admins if you're an admin (only owner can)
    const targetIsAdmin = project.roles.some(
      (r) => r.userId.toString() === memberId && r.role === "admin",
    );

    if (adminRole && targetIsAdmin && !isOwner) {
      throw new ApiError(403, "Admins cannot remove other admins");
    }

    if (project.owner.toString() === memberId) {
      throw new ApiError(400, "Cannot remove the project owner");
    }

    const memberIndex = project.members.findIndex(
      (m) => m.toString() === memberId,
    );
    if (memberIndex === -1) {
      throw new ApiError(404, "Member not found in this project");
    }

    project.members.splice(memberIndex, 1);
    await project.save();

    emitToProject(projectId, "member.removed", { memberId });

    res
      .status(200)
      .json(new ApiResponse(200, { memberId }, "Member removed successfully"));
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:projectId/members/:memberId/transfer
export const transferOwnership = async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    if (project.owner.toString() !== userId) {
      throw new ApiError(403, "Only the project owner can transfer ownership");
    }

    const isMember = project.members.some((m) => m.toString() === memberId);
    if (!isMember) {
      throw new ApiError(404, "Target user is not a member of this project");
    }

    project.owner = memberId;
    await project.save();

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

// PATCH /api/projects/:projectId/members/:memberId/role
export const updateMemberRole = async (req, res, next) => {
  try {
    const { projectId, memberId } = req.params;
    const { role } = req.body;
    const userId = req.user.id;

    if (!role || !["admin", "member", "observer"].includes(role)) {
      throw new ApiError(400, "Invalid role");
    }

    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, "Project not found");

    const isOwner = project.owner.toString() === userId;
    const myRole = project.roles?.find(
      (r) => r.userId.toString() === userId && r.role === "admin",
    );

    if (!isOwner && !myRole) {
      throw new ApiError(
        403,
        "Only the project owner or admins can change roles",
      );
    }

    if (memberId === project.owner.toString()) {
      throw new ApiError(403, "Cannot change role of the owner");
    }

    // Admin restrictions
    if (!isOwner) {
      const targetIsAdmin = project.roles?.find(
        (r) => r.userId.toString() === memberId && r.role === "admin",
      );
      if (targetIsAdmin) {
        throw new ApiError(403, "Admins cannot modify other admins");
      }
      if (role === "admin") {
        throw new ApiError(403, "Admins cannot promote users to admin");
      }
    }

    // Update role
    if (!project.roles) project.roles = [];

    const roleIndex = project.roles.findIndex(
      (r) => r.userId.toString() === memberId,
    );

    if (roleIndex > -1) {
      if (role === "member") {
        project.roles.splice(roleIndex, 1);
      } else {
        project.roles[roleIndex].role = role;
      }
    } else if (role !== "member") {
      project.roles.push({ userId: memberId, role });
    }

    await project.save();

    emitToProject(projectId, "member.updated", { memberId, role });

    res
      .status(200)
      .json(
        new ApiResponse(200, { memberId, role }, "Role updated successfully"),
      );
  } catch (error) {
    next(error);
  }
};
