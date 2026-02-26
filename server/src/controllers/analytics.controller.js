import Task from "../models/Task.model.js";
import Project from "../models/Project.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getProjectAnalytics = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    const tasks = await Task.find({ projectId }).lean();

    // ── Aggregation Logic ─────────────────────────────

    // Status Distribution (by Column)
    // We need to map column IDs to titles from project.columns
    const columnMap = {};
    project.columns.forEach((c) => {
      columnMap[c.id] = c.title;
    });

    const tasksByStatus = {};
    const tasksByPriority = { low: 0, medium: 0, high: 0, critical: 0 };
    const tasksByAssignee = {};

    // Initialize status counts
    Object.values(columnMap).forEach((title) => {
      tasksByStatus[title] = 0;
    });
    tasksByStatus["Backlog"] = 0; // Explicit backlog bucket

    tasks.forEach((task) => {
      // Priority
      if (task.priority) {
        tasksByPriority[task.priority] =
          (tasksByPriority[task.priority] || 0) + 1;
      }

      // Status
      if (task.isInBacklog) {
        tasksByStatus["Backlog"]++;
      } else {
        const statusTitle = columnMap[task.columnId] || "Unknown";
        tasksByStatus[statusTitle] = (tasksByStatus[statusTitle] || 0) + 1;
      }

      // Assignee Workload
      if (task.assignees && task.assignees.length > 0) {
        task.assignees.forEach((assigneeId) => {
          tasksByAssignee[assigneeId] = (tasksByAssignee[assigneeId] || 0) + 1;
        });
      } else {
        tasksByAssignee["Unassigned"] =
          (tasksByAssignee["Unassigned"] || 0) + 1;
      }
    });

    // Populate assignee names (could be expensive if many users, but fine for now)
    // We need to fetch user details for keys in tasksByAssignee
    // Optimization: We can rely on frontend to map IDs if we send project members,
    // or we just do a quick lookup here.
    // Let's rely on project.members populated? No project members aren't populated here.
    // Let's just return IDs and let frontend map using Project context or member list.

    const analytics = {
      byStatus: Object.entries(tasksByStatus).map(([name, value]) => ({
        name,
        value,
      })),
      byPriority: Object.entries(tasksByPriority).map(([name, value]) => ({
        name,
        value,
      })),
      byAssignee: tasksByAssignee, // { userId: count }
      totalTasks: tasks.length,
    };

    res
      .status(200)
      .json(new ApiResponse(200, analytics, "Analytics fetched successfully"));
  } catch (error) {
    next(error);
  }
};
