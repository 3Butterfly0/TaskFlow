import Project from "../models/Project.model.js";
import Task from "../models/Task.model.js";
import User from "../models/User.model.js";
import Ticket from "../models/Ticket.model.js";
import { Invitation } from "../models/Invitation.model.js";
import Notification from "../models/Notification.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// ──────────────────────────────────────────────────────
// POST /api/projects
// ──────────────────────────────────────────────────────
export const createProject = async (req, res, next) => {
  try {
    const { name, description, visibility } = req.body;

    // ── Validation ────────────────────────────────────
    if (!name) {
      throw new ApiError(400, "Project name is required");
    }

    // ── Create project ────────────────────────────────
    const project = await Project.create({
      name,
      description,
      visibility,
      owner: req.user.id,
      createdBy: req.user.id,
      members: [req.user.id], // Owner is auto-added as a member
    });

    // Populate owner and members for the response
    await project.populate([
      { path: "owner", select: "username email avatar" },
      { path: "members", select: "username email avatar" },
    ]);

    res
      .status(201)
      .json(new ApiResponse(201, project, "Project created successfully"));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/projects
// Returns projects where user is owner OR member
// ──────────────────────────────────────────────────────
export const getProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const projects = await Project.find({
      $or: [{ owner: userId }, { members: userId }],
      archived: false,
    })
      .populate("owner", "username email avatar")
      .populate("members", "username email avatar")
      .sort({ updatedAt: -1 });

    res
      .status(200)
      .json(new ApiResponse(200, projects, "Projects fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/projects/:id
// ──────────────────────────────────────────────────────
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(id)
      .populate("owner", "username email avatar")
      .populate("members", "username email avatar");

    // ── Not found ─────────────────────────────────────
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // ── Access check: must be owner or member ─────────
    const isOwner = project.owner._id.toString() === userId;
    const isMember = project.members.some((m) => m._id.toString() === userId);

    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    res
      .status(200)
      .json(new ApiResponse(200, project, "Project fetched successfully"));
  } catch (error) {
    next(error);
  }
};
// ──────────────────────────────────────────────────────
// GET /api/projects/:id/members
// ──────────────────────────────────────────────────────
export const getProjectMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate(
      "members",
      "username email avatar",
    );
    if (!project) throw new ApiError(404, "Project not found");

    const userId = req.user.id;
    const isOwner = project.owner.toString() === userId;
    // Members are populated, so their _id is an object
    const isMember = project.members.some((m) => m._id.toString() === userId);

    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, project.members, "Members fetched successfully"),
      );
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// DELETE /api/projects/:id
// Deletes project and all associated tasks
// ──────────────────────────────────────────────────────
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(id);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // ── Access check: must be owner ───────────────────
    if (project.owner.toString() !== userId) {
      throw new ApiError(403, "Only the project owner can delete this project");
    }

    // ── Cascade delete tasks and related records ──────
    await Task.deleteMany({ projectId: id });
    await Ticket.deleteMany({ projectId: id });
    await Invitation.deleteMany({ projectId: id });
    await Notification.deleteMany({ resourceId: id, resourceType: "Project" });

    // ── Delete project ────────────────────────────────
    await Project.findByIdAndDelete(id);

    res
      .status(200)
      .json(new ApiResponse(200, { id }, "Project deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/projects/:id/pin
// Toggle pin status for a project
// ──────────────────────────────────────────────────────
export const togglePinProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify project exists
    const project = await Project.findById(id);
    if (!project) throw new ApiError(404, "Project not found");

    const user = await User.findById(userId);
    const isPinned = user.pinnedProjects.includes(id);

    if (isPinned) {
      user.pinnedProjects = user.pinnedProjects.filter(
        (pId) => pId.toString() !== id,
      );
    } else {
      user.pinnedProjects.push(id);
    }

    await user.save({ validateModifiedOnly: true });

    res
      .status(200)
      .json(
        new ApiResponse(200, { isPinned: !isPinned }, "Pin status updated"),
      );
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/projects/:id/access
// Update last accessed time for a project
// ──────────────────────────────────────────────────────
export const updateLastAccessed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify project exists
    const project = await Project.findById(id);
    if (!project) throw new ApiError(404, "Project not found");

    await User.findByIdAndUpdate(userId, {
      $pull: { lastAccessedProjects: { projectId: id } },
    });

    await User.findByIdAndUpdate(userId, {
      $push: {
        lastAccessedProjects: {
          $each: [{ projectId: id, accessedAt: new Date() }],
          $slice: -5, // Keep only last 5
        },
      },
    });

    res.status(200).json(new ApiResponse(200, null, "Access time updated"));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/projects/:id/columns
// Add a new column to the project
// ──────────────────────────────────────────────────────
export const addColumn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      throw new ApiError(400, "Column title is required");
    }

    const project = await Project.findById(id);
    if (!project) throw new ApiError(404, "Project not found");

    // Require owner or admin to add column
    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members.some((m) => m.toString() === req.user.id);
    const userRole =
      project.roles?.find((r) => r.userId.toString() === req.user.id)?.role ||
      (isOwner ? "admin" : isMember ? "member" : null);

    if (userRole !== "admin") {
      throw new ApiError(403, "Only admins/owners can manage columns");
    }

    // Add new column
    project.columns.push({ title, taskIds: [] });
    await project.save();

    // Return the new column (last one)
    const newColumn = project.columns[project.columns.length - 1];

    res
      .status(201)
      .json(new ApiResponse(201, newColumn, "Column added successfully"));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// PATCH /api/projects/:id/columns/:columnId
// Rename an existing column
// ──────────────────────────────────────────────────────
export const renameColumn = async (req, res, next) => {
  try {
    const { id, columnId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      throw new ApiError(400, "New column title is required");
    }

    const project = await Project.findById(id);
    if (!project) throw new ApiError(404, "Project not found");

    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members.some((m) => m.toString() === req.user.id);
    const userRole =
      project.roles?.find((r) => r.userId.toString() === req.user.id)?.role ||
      (isOwner ? "admin" : isMember ? "member" : null);

    if (userRole !== "admin") {
      throw new ApiError(403, "Only admins/owners can manage columns");
    }

    const column = project.columns.find((col) => col.id === columnId);
    if (!column) {
      throw new ApiError(404, "Column not found");
    }

    column.title = title.trim();
    await project.save();

    res
      .status(200)
      .json(new ApiResponse(200, column, "Column renamed successfully"));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// DELETE /api/projects/:id/columns/:columnId
// Delete a column (only if empty)
// ──────────────────────────────────────────────────────
export const deleteColumn = async (req, res, next) => {
  try {
    const { id, columnId } = req.params;

    const project = await Project.findById(id);
    if (!project) throw new ApiError(404, "Project not found");

    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members.some((m) => m.toString() === req.user.id);
    const userRole =
      project.roles?.find((r) => r.userId.toString() === req.user.id)?.role ||
      (isOwner ? "admin" : isMember ? "member" : null);

    if (userRole !== "admin") {
      throw new ApiError(403, "Only admins/owners can manage columns");
    }

    const columnIndex = project.columns.findIndex((col) => col.id === columnId);
    if (columnIndex === -1) {
      throw new ApiError(404, "Column not found");
    }

    // Default protections
    if (columnIndex < 3) {
      throw new ApiError(
        400,
        "Cannot delete the default base columns (Todo, In Progress, Done).",
      );
    }

    const column = project.columns[columnIndex];
    if (column.taskIds && column.taskIds.length > 0) {
      throw new ApiError(
        400,
        "Cannot delete a column that contains tasks. Move tasks first.",
      );
    }

    project.columns.splice(columnIndex, 1);
    await project.save();

    res
      .status(200)
      .json(new ApiResponse(200, null, "Column deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// PATCH /api/projects/:id
// Update project details (owner only)
// ──────────────────────────────────────────────────────
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, visibility } = req.body;
    const userId = req.user.id;

    const project = await Project.findById(id);
    if (!project) throw new ApiError(404, "Project not found");

    if (project.owner.toString() !== userId) {
      throw new ApiError(403, "Only the project owner can update this project");
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (visibility) project.visibility = visibility;

    await project.save();

    res
      .status(200)
      .json(new ApiResponse(200, project, "Project updated successfully"));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// PATCH /api/projects/:id/transfer
// Transfer ownership of a project
// ──────────────────────────────────────────────────────
export const transferOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newOwnerId } = req.body;
    const userId = req.user.id;

    const project = await Project.findById(id);
    if (!project) throw new ApiError(404, "Project not found");

    if (project.owner.toString() !== userId) {
      throw new ApiError(403, "Only the current owner can transfer ownership");
    }

    if (!newOwnerId) {
      throw new ApiError(400, "New owner ID is required");
    }

    // Check if newOwnerId is a member
    const isMember = project.members.some(
      (memberId) => memberId.toString() === newOwnerId,
    );
    if (!isMember) {
      throw new ApiError(
        400,
        "New owner must be a member of the project first",
      );
    }

    project.owner = newOwnerId;
    await project.save();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          project,
          "Project ownership transferred successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};
