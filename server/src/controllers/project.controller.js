import mongoose from "mongoose";
import Project from "../models/Project.model.js";
import Task from "../models/Task.model.js";
import User from "../models/User.model.js";
import Ticket from "../models/Ticket.model.js";
import { Invitation } from "../models/Invitation.model.js";
import Notification from "../models/Notification.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { logActivity } from "../utils/activityLogger.js";

// POST /api/projects
export const createProject = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, description, visibility } = req.body;

    if (!name) {
      throw new ApiError(400, "Project name is required");
    }

    const [project] = await Project.create([{
      name,
      description,
      visibility,
      owner: req.user.id,
      createdBy: req.user.id,
      members: [req.user.id],
    }], { session });

    await logActivity({
      action: 'CREATED',
      actorId: req.user.id,
      entityType: 'Project',
      entityId: project._id,
      projectId: project._id,
      // Pass details if you need it, but the schema doesn't strictly log session so we rely on the main commit success
    });

    await project.populate([
      { path: "owner", select: "username email avatar" },
      { path: "members", select: "username email avatar" },
    ]);

    await session.commitTransaction();

    res
      .status(201)
      .json(new ApiResponse(201, project, "Project created successfully"));
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// GET /api/projects
export const getProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const projects = await Project.find({
      $or: [{ owner: userId }, { members: userId }],
      isArchived: false,
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

// GET /api/projects/:id
export const getProjectById = async (req, res, next) => {
  try {
    const project = await req.project.populate([
      { path: "owner", select: "username email avatar" },
      { path: "members", select: "username email avatar" }
    ]);

    res
      .status(200)
      .json(new ApiResponse(200, project, "Project fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:id/members
export const getProjectMembers = async (req, res, next) => {
  try {
    const project = await req.project.populate(
      "members",
      "username email avatar",
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, project.members, "Members fetched successfully"),
      );
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res, next) => {
  try {
    const project = req.project;
    const projectId = project._id;
    const userId = req.user._id.toString();

    if (project.owner.toString() !== userId) {
      throw new ApiError(403, "Only the project owner can delete this project");
    }

    // Cascade soft-delete all related records
    await Task.updateMany({ projectId }, { isArchived: true });
    await Ticket.updateMany({ projectId }, { isArchived: true });
    await Invitation.deleteMany({ projectId });
    await Notification.deleteMany({ resourceId: projectId, resourceType: "Project" });

    await Project.findByIdAndUpdate(projectId, { isArchived: true }, { new: true });

    await logActivity({
      action: 'ARCHIVED',
      actorId: req.user.id,
      entityType: 'Project',
      entityId: projectId,
      projectId: projectId
    });

    res
      .status(200)
      .json(new ApiResponse(200, { id: projectId }, "Project deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/pin
export const togglePinProject = async (req, res, next) => {
  try {
    const project = req.project;
    const userId = req.user._id.toString();

    const user = req.user;
    const isPinned = user.pinnedProjects.includes(project._id);

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

// POST /api/projects/:id/access
export const updateLastAccessed = async (req, res, next) => {
  try {
    const project = req.project;
    const userId = req.user._id.toString();

    await User.findByIdAndUpdate(userId, {
      $pull: { lastAccessedProjects: { projectId: id } },
    });

    await User.findByIdAndUpdate(userId, {
      $push: {
        lastAccessedProjects: {
          $each: [{ projectId: id, accessedAt: new Date() }],
          $slice: -5,
        },
      },
    });

    res.status(200).json(new ApiResponse(200, null, "Access time updated"));
  } catch (error) {
    next(error);
  }
};

export const addColumn = async (req, res, next) => {
  try {
    const project = req.project;
    const { title } = req.body;

    if (req.userRole !== "admin") {
      throw new ApiError(403, "Only admins/owners can manage columns");
    }

    project.columns.push({ title: title.trim(), taskIds: [] });
    await project.save();

    const newColumn = project.columns[project.columns.length - 1];

    res
      .status(201)
      .json(new ApiResponse(201, newColumn, "Column added successfully"));
  } catch (error) {
    next(error);
  }
};

// PATCH /api/projects/:id/columns/:columnId
export const renameColumn = async (req, res, next) => {
  try {
    const { id, columnId } = req.params;
    const { title } = req.body;

    if (!title || !title.trim()) {
      throw new ApiError(400, "New column title is required");
    }

    const project = req.project;

    if (req.userRole !== "admin") {
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

// DELETE /api/projects/:id/columns/:columnId
export const deleteColumn = async (req, res, next) => {
  try {
    const { id, columnId } = req.params;

    const project = req.project;

    if (req.userRole !== "admin") {
      throw new ApiError(403, "Only admins/owners can manage columns");
    }

    const columnIndex = project.columns.findIndex((col) => col.id === columnId);
    if (columnIndex === -1) {
      throw new ApiError(404, "Column not found");
    }

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

// PATCH /api/projects/:id
export const updateProject = async (req, res, next) => {
  try {
    const project = req.project;
    const userId = req.user._id.toString();

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

// PATCH /api/projects/:id/transfer
export const transferOwnership = async (req, res, next) => {
  try {
    const project = req.project;
    const userId = req.user._id.toString();

    if (project.owner.toString() !== userId) {
      throw new ApiError(403, "Only the current owner can transfer ownership");
    }

    if (!newOwnerId) {
      throw new ApiError(400, "New owner ID is required");
    }

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
