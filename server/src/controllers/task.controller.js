import Task from "../models/Task.model.js";
import Project from "../models/Project.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { emitToProject } from "../config/socket.js";
import { createNotification } from "./notification.controller.js";
import { logActivity } from "../utils/activityLogger.js";
import { deleteFromCloudinary } from "../config/cloudinary.js";

// GET /api/tasks?projectId=xxx
export const getTasksByProject = async (req, res, next) => {
  try {
    const projectId = req.project._id;

    // Build query
    const showArchived = req.query.isArchived === 'true';
    const query = { projectId, isArchived: showArchived };

    if (req.query.status) {
      query.status = { $in: req.query.status.split(",") };
    } else {
      // Board view: hide completed tasks older than 7 days
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query.$or = [
        { status: { $ne: "completed" } },
        { status: "completed", completedAt: { $gte: oneWeekAgo } },
        { status: "completed", completedAt: null },
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const totalTasks = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate("assignees", "username email avatar")
      .populate("reporter", "username email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res
      .status(200)
      .json(new ApiResponse(200, {
        tasks,
        pagination: {
          total: totalTasks,
          page,
          limit,
          totalPages: Math.ceil(totalTasks / limit)
        }
      }, "Tasks fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/my-tasks
export const getMyTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, priority, projectId } = req.query;

    const showArchived = req.query.isArchived === 'true';
    const query = { assignees: userId, isArchived: showArchived };

    if (status) query.status = { $in: status.split(",") };
    else query.status = "active";

    if (priority) query.priority = { $in: priority.split(",") };
    if (projectId) query.projectId = projectId;

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalTasks = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate("projectId", "name")
      .populate("assignees", "username email avatar")
      .populate("reporter", "username email avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res
      .status(200)
      .json(new ApiResponse(200, {
        tasks,
        pagination: {
          total: totalTasks,
          page,
          limit,
          totalPages: Math.ceil(totalTasks / limit)
        }
      }, "My tasks fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const accessibleIds = await Project.getAccessibleIds(userId);
    const task = await Task.findOne({ _id: id, projectId: { $in: accessibleIds } })
      .populate("assignees", "username email avatar")
      .populate("comments.user", "username email avatar");

    if (!task) {
      throw new ApiError(404, "Task not found or access denied");
    }

    res
      .status(200)
      .json(new ApiResponse(200, task, "Task fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks/:id/comments
export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      throw new ApiError(400, "Comment text is required");
    }

    const accessibleIds = await Project.getAccessibleIds(userId);
    const task = await Task.findOne({ _id: id, projectId: { $in: accessibleIds } });

    if (!task) {
      throw new ApiError(404, "Task not found or access denied");
    }

    task.comments.push({
      text: text.trim(),
      user: userId,
    });

    await task.save();

    await logActivity({
      action: 'COMMENTED',
      actorId: userId,
      entityType: 'Task',
      entityId: task._id,
      projectId: task.projectId,
      details: { text: text.trim().slice(0, 80) }
    });
    await task.populate("comments.user", "username email avatar");

    const newComment = task.comments[task.comments.length - 1];

    emitToProject(task.projectId.toString(), "comment.added", {
      projectId: task.projectId,
      taskId: id,
      comment: newComment,
    });

    // Notify assignees (excluding commenter)
    const assigneesToNotify = task.assignees.filter(
      (assigneeId) => assigneeId.toString() !== userId,
    );
    for (const assigneeId of assigneesToNotify) {
      await createNotification({
        recipient: assigneeId,
        sender: userId,
        type: "comment",
        resourceId: id,
        resourceType: "Task",
        message: `New comment on task: ${task.title}`,
      });
    }

    res
      .status(201)
      .json(new ApiResponse(201, newComment, "Comment added successfully"));
  } catch (error) {
    next(error);
  }
};

// POST /api/tasks
export const createTask = async (req, res, next) => {
  try {
    const {
      title,
      content,
      priority,
      columnId,
      assignees,
      dueDate,
      labels,
    } = req.body;

    const projectId = req.project._id;

    if (!title || !columnId) {
      throw new ApiError(400, "title and columnId are required");
    }

    const userId = req.user._id.toString();
    const project = req.project;

    const column = project.columns.find((col) => col.id === columnId);
    if (!column) {
      throw new ApiError(404, `Column "${columnId}" not found in project`);
    }

    const task = await Task.create({
      title,
      content,
      priority,
      projectId,
      columnId,
      assignees: assignees || [],
      reporter: userId,
      status: column.title.toLowerCase() === "done" ? "completed" : "active",
      completedAt: column.title.toLowerCase() === "done" ? Date.now() : null,
      dueDate: dueDate || null,
      labels: labels || [],
      isInBacklog: !!req.body.isInBacklog,
      activityLog: [
        {
          type: "task_created",
          actorId: userId,
          metadata: { columnTitle: column.title },
        },
      ],
    });

    await logActivity({
      action: 'CREATED',
      actorId: userId,
      entityType: 'Task',
      entityId: task._id,
      projectId: task.projectId
    });

    // Append task ID to column (only if not in backlog)
    if (!req.body.isInBacklog) {
      column.taskIds.push(task._id.toString());
      await project.save();
    }

    await task.populate("assignees", "username email avatar");

    emitToProject(projectId, "task.created", {
      task,
      columnId,
    });

    // Notify assignees
    if (assignees && assignees.length > 0) {
      for (const assigneeId of assignees) {
        await createNotification({
          recipient: assigneeId,
          sender: userId,
          type: "assign",
          resourceId: task._id,
          resourceType: "Task",
          message: `You were assigned to task: ${task.title}`,
        });
      }
    }

    res
      .status(201)
      .json(new ApiResponse(201, task, "Task created successfully"));
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id
export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const accessibleIds = await Project.getAccessibleIds(userId);
    const task = await Task.findOne({ _id: id, projectId: { $in: accessibleIds } });

    if (!task) {
      throw new ApiError(404, "Task not found or access denied");
    }

    const allowedFields = [
      "title",
      "content",
      "priority",
      "assignees",
      "dueDate",
      "labels",
      "watchers",
      "subtasks",
      "attachments",
      "isInBacklog",
      "status",
      "cancellationReason",
      "rejectionReason",
    ];

    // Build activity log entries for tracked changes
    const logEntries = [];

    if (updates.status && updates.status !== task.status) {
      logEntries.push({
        type: "status_changed",
        actorId: userId,
        metadata: { from: task.status, to: updates.status },
      });

      if (updates.status === "completed") {
        task.completedAt = Date.now();
      } else if (updates.status === "cancelled") {
        task.cancelledAt = Date.now();
      } else if (updates.status === "rejected") {
        task.rejectedAt = Date.now();
      } else if (updates.status === "active") {
        task.completedAt = null;
        task.cancelledAt = null;
        task.rejectedAt = null;
      }
    }

    if (updates.priority && updates.priority !== task.priority) {
      logEntries.push({
        type: "priority_changed",
        actorId: userId,
        metadata: { from: task.priority, to: updates.priority },
      });
    }

    if (updates.dueDate && String(updates.dueDate) !== String(task.dueDate)) {
      logEntries.push({
        type: "due_date_changed",
        actorId: userId,
        metadata: { from: task.dueDate, to: updates.dueDate },
      });
    }

    if (
      updates.isInBacklog !== undefined &&
      updates.isInBacklog !== task.isInBacklog
    ) {
      logEntries.push({
        type: "moved_column",
        actorId: userId,
        metadata: {
          fromColumnId: task.isInBacklog ? "Backlog" : "Board",
          toColumnId: updates.isInBacklog ? "Backlog" : "Board",
        },
      });
    }

    // Evaluate assignee diffs before applying updates
    let newlyAssigned = [];
    if (updates.assignees) {
      const originalAssignees = new Set(
        task.assignees.map((id) => id.toString()),
      );

      newlyAssigned = updates.assignees.filter(
        (assigneeId) => !originalAssignees.has(assigneeId.toString())
      );
    }

    // Apply updates
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        task[field] = updates[field];
      }
    }

    // Persist to new log collection
    for (const log of logEntries) {
      // Map old types to enum
      let actionName = 'UPDATED';
      let eventDetails = log;

      if (log.type === 'moved_column') { actionName = 'MOVED'; }

      await logActivity({
          action: actionName,
          actorId: userId,
          entityType: 'Task',
          entityId: task._id,
          projectId: task.projectId,
          details: log.metadata
      });
    }

    await task.save();
    await task.populate("assignees", "username email avatar");

    // Notify on assignment change
    if (newlyAssigned.length > 0) {
      for (const assigneeId of newlyAssigned) {
        if (assigneeId.toString() !== userId) {
          await createNotification({
            recipient: assigneeId,
            sender: userId,
            type: "task_assignment",
            resourceId: id,
            resourceType: "Task",
            message: `You were assigned to task: ${updates.title || task.title}`,
          });
        }
      }
    }

    // Notify assignees about status/priority changes
    if (updates.isInBacklog !== undefined || updates.priority !== undefined) {
      const notifyList = task.assignees.filter(
        (a) => a._id.toString() !== userId,
      );
      for (const assignee of notifyList) {
        await createNotification({
          recipient: assignee._id,
          sender: userId,
          type: "status",
          resourceId: task._id,
          resourceType: "Task",
          message: `Task updated: ${task.title}`,
        });
      }
    }

    emitToProject(task.projectId.toString(), "task.updated", {
      task,
    });

    res
      .status(200)
      .json(new ApiResponse(200, task, "Task updated successfully"));
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/reorder
export const reorderInsideColumn = async (req, res, next) => {
  try {
    const { projectId, columnId, taskIds } = req.body;

    if (!projectId || !columnId || !Array.isArray(taskIds)) {
      throw new ApiError(
        400,
        "projectId, columnId, and taskIds array are required",
      );
    }

    const userId = req.user.id;

    const accessibleIds = await Project.getAccessibleIds(userId);
    if (!accessibleIds.some(id => id.toString() === projectId)) {
      throw new ApiError(403, "You do not have access to this project");
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const column = project.columns.find((col) => col.id === columnId);
    if (!column) {
      throw new ApiError(404, `Column "${columnId}" not found`);
    }

    // Validate that the new task order contains the same IDs
    const currentTaskIds = new Set(column.taskIds);
    const newTaskIds = new Set(taskIds);
    if (
      currentTaskIds.size !== newTaskIds.size ||
      [...currentTaskIds].some((currId) => !newTaskIds.has(currId))
    ) {
      throw new ApiError(400, "Invalid task reorder array payload");
    }

    column.taskIds = taskIds;
    await project.save();

    emitToProject(projectId, "task.reordered", {
      columnId,
      taskIds,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { columnId, taskIds },
          "Column reordered successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/move
export const moveAcrossColumns = async (req, res, next) => {
  try {
    const {
      projectId,
      taskId,
      sourceColumnId,
      destinationColumnId,
      newSourceTaskIds,
      newDestinationTaskIds,
    } = req.body;

    const missing = [];
    if (!projectId) missing.push("projectId");
    if (!taskId) missing.push("taskId");
    if (!sourceColumnId) missing.push("sourceColumnId");
    if (!destinationColumnId) missing.push("destinationColumnId");
    if (!Array.isArray(newSourceTaskIds))
      missing.push("newSourceTaskIds (array required)");
    if (!Array.isArray(newDestinationTaskIds))
      missing.push("newDestinationTaskIds (array required)");

    if (missing.length > 0) {
      throw new ApiError(
        400,
        `Missing or invalid fields: ${missing.join(", ")}`,
      );
    }

    const userId = req.user.id;

    const accessibleIds = await Project.getAccessibleIds(userId);
    if (!accessibleIds.some(id => id.toString() === projectId)) {
      throw new ApiError(403, "You do not have access to this project");
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    // Locate columns
    const sourceColumn = project.columns.find(
      (col) => col.id === sourceColumnId,
    );
    const destColumn = project.columns.find(
      (col) => col.id === destinationColumnId,
    );

    if (!sourceColumn) {
      throw new ApiError(404, `Source column "${sourceColumnId}" not found`);
    }
    if (!destColumn) {
      throw new ApiError(
        404,
        `Destination column "${destinationColumnId}" not found`,
      );
    }

    // Update both column taskIds
    sourceColumn.taskIds = newSourceTaskIds;
    destColumn.taskIds = newDestinationTaskIds;
    await project.save();

    // Update task columnId
    const task = await Task.findById(taskId);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    task.columnId = destinationColumnId;

    const destTitle = destColumn.title.toLowerCase();

    // Map column title to task status
    let newStatus = task.status;
    if (destTitle.includes("done") || destTitle.includes("complete")) {
      newStatus = "completed";
      task.completedAt = Date.now();
      task.cancelledAt = null;
      task.rejectedAt = null;
    } else {
      newStatus = "active";
      task.completedAt = null;
    }

    if (newStatus !== task.status) {
      task.activityLog.push({
        type: "status_changed",
        actorId: userId,
        metadata: { from: task.status, to: newStatus },
      });
      task.status = newStatus;
    }

    await logActivity({
      action: 'MOVED',
      actorId: userId,
      entityType: 'Task',
      entityId: task._id,
      projectId: task.projectId,
      details: {
        from: sourceColumn.title,
        to: destColumn.title,
        fromColumnId: sourceColumnId,
        toColumnId: destinationColumnId,
      }
    });

    await task.save();
    await task.populate("assignees", "username email avatar");

    const responseData = {
      task,
      sourceColumn: { id: sourceColumnId, taskIds: newSourceTaskIds },
      destinationColumn: {
        id: destinationColumnId,
        taskIds: newDestinationTaskIds,
      },
    };

    emitToProject(projectId, "task.moved", responseData);

    res
      .status(200)
      .json(new ApiResponse(200, responseData, "Task moved successfully"));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const accessibleIds = await Project.getAccessibleIds(userId);
    const task = await Task.findOne({ _id: id, projectId: { $in: accessibleIds } });

    if (!task) {
      throw new ApiError(404, "Task not found or access denied");
    }

    const project = await Project.findById(task.projectId);
    if (!project) throw new ApiError(404, "Project not found");

    // Remove from column
    const column = project.columns.find((col) => col.id === task.columnId);
    if (column) {
      column.taskIds = column.taskIds.filter((tid) => tid !== id);
      await project.save();
    }

    await Task.findByIdAndUpdate(id, { isArchived: true }, { new: true });

    // Cleanup attachments (Cloudinary)
    if (task.attachments && task.attachments.length > 0) {
      for (const att of task.attachments) {
        if (att.publicId) {
          await deleteFromCloudinary(att.publicId);
        }
      }
    }

    await logActivity({
      action: 'ARCHIVED',
      actorId: userId,
      entityType: 'Task',
      entityId: task._id,
      projectId: task.projectId
    });

    emitToProject(task.projectId.toString(), "task.deleted", {
      taskId: id,
      columnId: task.columnId,
    });

    res
      .status(200)
      .json(new ApiResponse(200, { id }, "Task deleted successfully"));
  } catch (error) {
    next(error);
  }
};
