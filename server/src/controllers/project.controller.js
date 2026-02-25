import Project from "../models/Project.model.js";

import Task from "../models/Task.model.js";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
// POST /api/projects
export const createProject = async (req, res, next) => {
  try {
    const { name, description, visibility } = req.body;

    if (!name) {
      throw new ApiError(400, "Project name is required");
    }

    const project = await Project.create({
      name,
      description,
      visibility,
      owner: req.user.id,
      createdBy: req.user.id,
      members: [req.user.id],
    });

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

// GET /api/projects
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

// GET /api/projects/:id
export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(id)
      .populate("owner", "username email avatar")
      .populate("members", "username email avatar");

    if (!project) {
      throw new ApiError(404, "Project not found");
    }
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

// GET /api/projects/:id/members
export const getProjectMembers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).populate(
      "members",
      "username email avatar",
    );
    if (!project) throw new ApiError(404, "Project not found");

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
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(id);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    if (project.owner.toString() !== userId) {
      throw new ApiError(403, "Only the project owner can delete this project");
    }
    await Task.deleteMany({ projectId: id });
    await Project.findByIdAndDelete(id);

    res
      .status(200)
      .json(new ApiResponse(200, { id }, "Project deleted successfully"));
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/pin
export const togglePinProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

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

// POST /api/projects/:id/access
export const updateLastAccessed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(id);
    if (!project) throw new ApiError(404, "Project not found");

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

// POST /api/projects/:id/columns
export const addColumn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      throw new ApiError(400, "Column title is required");
    }

    const project = await Project.findById(id);
    if (!project) throw new ApiError(404, "Project not found");

    project.columns.push({ title, taskIds: [] });
    await project.save();

    const newColumn = project.columns[project.columns.length - 1];

    res
      .status(201)
      .json(new ApiResponse(201, newColumn, "Column added successfully"));
  } catch (error) {
    next(error);
  }
};
