import Project from "../models/Project.model.js";
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
