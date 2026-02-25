import User from "../models/User.model.js";
import Project from "../models/Project.model.js";
import Task from "../models/Task.model.js";
import ApiResponse from "../utils/ApiResponse.js";

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

    const promises = [];

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
    if (type === "all" || type === "task") {
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
          .populate("projectId", "name")
          .limit(5)
          .lean()
          .then((data) => {
            results.tasks = data;
          }),
      );
    }

    if (type === "all" || type === "user") {
      promises.push(
        User.find({
          $or: [
            { username: { $regex: searchQuery, $options: "i" } },
            { email: { $regex: searchQuery, $options: "i" } },
          ],
          _id: { $ne: userId },
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
