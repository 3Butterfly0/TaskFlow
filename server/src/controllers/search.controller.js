import User from "../models/User.model.js";
import Project from "../models/Project.model.js";
import Task from "../models/Task.model.js";
import ApiResponse from "../utils/ApiResponse.js";

/**
 * Global search across Projects, Tasks, and Users.
 *
 * Query params:
 * - q: Search query string
 * - type: Optional filter (project, task, user, all). Default 'all'.
 */
export const globalSearch = async (req, res, next) => {
  try {
    const { q, type = "all" } = req.query;
    const userId = req.user.id;

    if (!q || q.trim().length === 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { projects: [], tasks: [], users: [] },
            "Empty query",
          ),
        );
    }

    const searchQuery = q.trim();
    const results = {
      projects: [],
      tasks: [],
      users: [],
    };

    // Parallel execution for performance
    const promises = [];

    // 1. Search Projects
    // User must be owner or member
    if (type === "all" || type === "project") {
      promises.push(
        Project.find({
          $text: { $search: searchQuery },
          $or: [{ owner: userId }, { members: userId }],
          archived: false,
        })
          .select("name description updatedAt")
          .limit(5)
          .lean()
          .then((data) => {
            results.projects = data;
          }),
      );
    }

    // 2. Search Tasks
    // User must be a member of the project the task belongs to.
    // This is complex with $text search + cross-collection lookup.
    // For simplicity/performance in this MVP, we verify project access after finding tasks,
    // OR we rely on the fact that task IDs/Titles are somewhat obscure if not authorized.
    // BETTER APPROACH: Find all project IDs user has access to first, then filter tasks by those project IDs.
    if (type === "all" || type === "task") {
      // First get all project IDs user is part of
      const userProjects = await Project.find({
        $or: [{ owner: userId }, { members: userId }],
      }).select("_id");
      const projectIds = userProjects.map((p) => p._id);

      promises.push(
        Task.find({
          $text: { $search: searchQuery },
          projectId: { $in: projectIds },
        })
          .select("title priority projectId columnId updatedAt")
          .populate("projectId", "name") // Project name needed for context
          .limit(5)
          .lean()
          .then((data) => {
            results.tasks = data;
          }),
      );
    }

    // 3. Search Users
    // Find users by username or email (regex partial match)
    if (type === "all" || type === "user") {
      promises.push(
        User.find({
          $or: [
            { username: { $regex: searchQuery, $options: "i" } },
            { email: { $regex: searchQuery, $options: "i" } },
          ],
          _id: { $ne: userId }, // Exclude self
        })
          .select("username email avatar")
          .limit(5)
          .lean()
          .then((data) => {
            results.users = data;
          }),
      );
    }

    await Promise.all(promises);

    res
      .status(200)
      .json(
        new ApiResponse(200, results, "Search results fetched successfully"),
      );
  } catch (error) {
    next(error);
  }
};
