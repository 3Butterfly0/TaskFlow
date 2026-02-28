import Task from "../models/Task.model.js";
import Project from "../models/Project.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const getProjectAnalytics = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { scope } = req.query; // "all" or "me"
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const isOwner = project.owner.toString() === userId;
    const isAdmin = project.roles.some(
      (r) => r.userId.toString() === userId && r.role === "admin",
    );
    const hasAllAccess = isOwner || isAdmin;

    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    // Determine target scope
    // Default: 'all' for owner/admin, 'me' for regular members
    let targetScope = scope || (hasAllAccess ? "all" : "me");
    if (targetScope === "all" && !hasAllAccess) {
      targetScope = "me";
    }

    const allTasks = await Task.find({ projectId }).lean();

    // Filter tasks based on scope
    const tasks =
      targetScope === "me"
        ? allTasks.filter((t) =>
            t.assignees?.some((id) => id.toString() === userId),
          )
        : allTasks;

    // ── Aggregation Logic ─────────────────────────────

    // 1. Column Mapping
    const columnMap = {};
    project.columns.forEach((c) => {
      columnMap[c.id] = c.title;
    });

    const tasksByStatus = {};
    const priorityStats = {
      low: { total: 0, completed: 0 },
      medium: { total: 0, completed: 0 },
      high: { total: 0, completed: 0 },
      critical: { total: 0, completed: 0 },
    };
    const tasksByAssignee = {};
    const memberPerformance = {};

    // Initialize status counts
    Object.values(columnMap).forEach((title) => {
      tasksByStatus[title] = 0;
    });
    tasksByStatus["Backlog"] = 0;

    // Summary counters
    let completedTasksCount = 0;
    let overdueTasksCount = 0;
    const now = new Date();

    tasks.forEach((task) => {
      const isCompleted = task.status === "completed";

      if (isCompleted) {
        completedTasksCount++;
      } else if (task.dueDate && new Date(task.dueDate) < now) {
        overdueTasksCount++;
      }

      // Priority completion rates
      if (task.priority) {
        priorityStats[task.priority].total++;
        if (isCompleted) {
          priorityStats[task.priority].completed++;
        }
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

    // Calculate Per-Member Performance (only if hasAllAccess and targetScope is 'all')
    if (hasAllAccess && targetScope === "all") {
      project.members.forEach((memberId) => {
        const idStr = memberId.toString();
        memberPerformance[idStr] = {
          taskCount: 0,
          completedCount: 0,
          totalTimeCompletedMs: 0,
        };
      });

      allTasks.forEach((task) => {
        // Use allTasks for accurate member stats
        if (!task.assignees || task.assignees.length === 0) return;

        task.assignees.forEach((assigneeId) => {
          const idStr = assigneeId.toString();
          if (!memberPerformance[idStr]) return;

          memberPerformance[idStr].taskCount++;
          if (task.status === "completed") {
            memberPerformance[idStr].completedCount++;
            if (task.completedAt && task.createdAt) {
              const timeToCompleteMs =
                new Date(task.completedAt).getTime() -
                new Date(task.createdAt).getTime();
              memberPerformance[idStr].totalTimeCompletedMs += timeToCompleteMs;
            }
          }
        });
      });
    }

    const formatMemberPerformance = () => {
      return Object.entries(memberPerformance).map(([userId, stats]) => {
        const rate =
          stats.taskCount > 0
            ? Math.round((stats.completedCount / stats.taskCount) * 100)
            : 0;
        const avgTimeMs =
          stats.completedCount > 0
            ? stats.totalTimeCompletedMs / stats.completedCount
            : 0;
        const avgTimeDays =
          avgTimeMs > 0
            ? parseFloat((avgTimeMs / (1000 * 60 * 60 * 24)).toFixed(1))
            : 0;

        return {
          userId,
          taskCount: stats.taskCount,
          completedCount: stats.completedCount,
          completionRate: rate,
          avgTimeDays,
        };
      });
    };

    const analytics = {
      scope: targetScope,
      hasAllAccess,
      summary: {
        totalTasks: tasks.length,
        completedTasks: completedTasksCount,
        pendingTasks: tasks.length - completedTasksCount,
        completionRate:
          tasks.length > 0
            ? Math.round((completedTasksCount / tasks.length) * 100)
            : 0,
        overdueTasks: overdueTasksCount,
      },
      byStatus: Object.entries(tasksByStatus).map(([name, value]) => ({
        name,
        value,
      })),
      byPriority: Object.entries(priorityStats).map(([name, stats]) => ({
        name,
        total: stats.total,
        completed: stats.completed,
        completionRate:
          stats.total > 0
            ? Math.round((stats.completed / stats.total) * 100)
            : 0,
      })),
      byAssignee: tasksByAssignee, // { userId: count }
      perMemberPerformance:
        hasAllAccess && targetScope === "all"
          ? formatMemberPerformance()
          : null,
    };

    res
      .status(200)
      .json(new ApiResponse(200, analytics, "Analytics fetched successfully"));
  } catch (error) {
    next(error);
  }
};
