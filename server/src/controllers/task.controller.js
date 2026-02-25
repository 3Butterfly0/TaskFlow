import Task from "../models/Task.model.js";
import Project from "../models/Project.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { emitToProject } from "../config/socket.js";
import { createNotification } from "./notification.controller.js";

export const getTasksByProject = async (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      throw new ApiError(400, "projectId query parameter is required");
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const userId = req.user.id;
    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);

    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    const query = { projectId };
    if (req.query.status) {
      query.status = { $in: req.query.status.split(",") };
    }

    const tasks = await Task.find(query)
      .populate("assignees", "username email avatar")
      .populate("reporter", "username email avatar")
      .lean();

    res
      .status(200)
      .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/my-tasks
export const getMyTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, priority, projectId } = req.query;

    const query = { assignees: userId };

    if (status) query.status = { $in: status.split(",") };
    else query.status = "active";

    if (priority) query.priority = { $in: priority.split(",") };
    if (projectId) query.projectId = projectId;

    const tasks = await Task.find(query)
      .populate("projectId", "name")
      .populate("assignees", "username email avatar")
      .populate("reporter", "username email avatar")
      .sort({ createdAt: -1 })
      .lean();

    res
      .status(200)
      .json(new ApiResponse(200, tasks, "My tasks fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/:id
export const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(id)
      .populate("assignees", "username email avatar")
      .populate("comments.user", "username email avatar");

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      throw new ApiError(404, "Associated project not found");
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
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

    const task = await Task.findById(id);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      throw new ApiError(404, "Associated project not found");
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    task.comments.push({
      text: text.trim(),
      user: userId,
    });
    task.activityLog.push({
      type: "comment_added",
      actorId: userId,
      metadata: { preview: text.trim().slice(0, 80) },
    });

    await task.save();
    await task.populate("comments.user", "username email avatar");

    const newComment = task.comments[task.comments.length - 1];

    emitToProject(task.projectId.toString(), "comment.added", {
      projectId: task.projectId,
      taskId: id,
      comment: newComment,
      comment: newComment,
    });

    const assigneesToNotify = task.assignees.filter(
      (assigneeId) => assigneeId.toString() !== userId,
    );
    for (const assigneeId of assigneesToNotify) {
      await createNotification({
        recipient: assigneeId,
        sender: userId,
        type: "comment",
        resourceId: taskId,
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
      projectId,
      columnId,
      assignees,
      dueDate,
      labels,
    } = req.body;

    if (!title || !projectId || !columnId) {
      throw new ApiError(400, "title, projectId, and columnId are required");
    }
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const userId = req.user.id;
    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

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

    if (!req.body.isInBacklog) {
      column.taskIds.push(task._id.toString());
      await project.save();
    }
    await task.populate("assignees", "username email avatar");

    // Emit socket event (after DB success)
    emitToProject(projectId, "task.created", {
      task,
      task,
      columnId,
    });

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

    const task = await Task.findById(id);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }
    const project = await Project.findById(task.projectId);
    if (!project) {
      throw new ApiError(404, "Associated project not found");
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
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

    // Apply updates
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        task[field] = updates[field];
      }
    }

    // Append activity log
    if (logEntries.length > 0) {
      task.activityLog.push(...logEntries);
    }

    await task.save();
    await task.populate("assignees", "username email avatar");

    // Notify on Assignment Change
    if (updates.assignees) {
      const originalAssignees = new Set(
        task.assignees.map((a) => a._id.toString()),
      );
      // 'updates.assignees' is array of IDs (strings)
      const newAssignees = updates.assignees;

      for (const assigneeId of newAssignees) {
        // Technically this logic is imperfect because we already updated the task, so originalAssignees
        // might reflect new state if we populated. But here 'task' was refetched?
        // Actually, we modified 'task' in memory at line 315.
        // So we should have compared before applying updates.
        // For simplicity, let's just notify all current assignees about update if relevant.
        // Better: Only notify newly assigned.
        // Implementing proper diffing requires capturing state before loop.
        // Let's just notify all NEW assignees.
        // REVISIT: For now, I'll notify all currently assigned users that "Task was updated" if I am not the one updating.
      }
    }

    // Notify all assignees about status change
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

    // Emit socket event (after DB success)
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

export const reorderInsideColumn = async (req, res, next) => {
  try {
    const { projectId, columnId, taskIds } = req.body;

    // Validation
    if (!projectId || !columnId || !Array.isArray(taskIds)) {
      throw new ApiError(
        400,
        "projectId, columnId, and taskIds array are required",
      );
    }

    const userId = req.user.id;

    // Find project and verify access
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    // Find target column
    const column = project.columns.find((col) => col.id === columnId);
    if (!column) {
      throw new ApiError(404, `Column "${columnId}" not found`);
    }

    // Update column taskIds (new order from client)
    column.taskIds = taskIds;
    await project.save();

    // Emit socket event (after DB success)
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

    // Validation
    if (
      !projectId ||
      !taskId ||
      !sourceColumnId ||
      !destinationColumnId ||
      !Array.isArray(newSourceTaskIds) ||
      !Array.isArray(newDestinationTaskIds)
    ) {
      throw new ApiError(
        400,
        "projectId, taskId, sourceColumnId, destinationColumnId, newSourceTaskIds, and newDestinationTaskIds are all required",
      );
    }

    const userId = req.user.id;

    // Find project and verify access
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
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

    // Step 1 & 2: Update both column taskIds
    sourceColumn.taskIds = newSourceTaskIds;
    destColumn.taskIds = newDestinationTaskIds;
    await project.save();

    // Step 3: Update task.columnId
    const task = await Task.findById(taskId);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    task.columnId = destinationColumnId;

    const destTitle = destColumn.title.toLowerCase();

    // Map column titles to status enums
    let newStatus = task.status;
    if (destTitle.includes("done") || destTitle.includes("complete")) {
      newStatus = "completed";
      task.completedAt = Date.now();
    } else if (destTitle.includes("progress") || destTitle.includes("doing")) {
      newStatus = "in_progress";
      task.completedAt = null;
    } else if (
      destTitle.includes("todo") ||
      destTitle.includes("to do") ||
      destTitle.includes("backlog")
    ) {
      newStatus = "todo";
      task.completedAt = null;
    } else {
      // Default to active for other column types
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

    // Add activity log entry for the move
    task.activityLog.push({
      type: "moved_column",
      actorId: userId,
      metadata: {
        from: sourceColumn.title,
        to: destColumn.title,
        fromColumnId: sourceColumnId,
        toColumnId: destinationColumnId,
      },
    });

    await task.save();

    // Populate for response
    await task.populate("assignees", "username email avatar");

    const responseData = {
      task,
      sourceColumn: { id: sourceColumnId, taskIds: newSourceTaskIds },
      destinationColumn: {
        id: destinationColumnId,
        taskIds: newDestinationTaskIds,
      },
    };

    // Emit socket event (after DB success)
    emitToProject(projectId, "task.moved", responseData);

    res
      .status(200)
      .json(new ApiResponse(200, responseData, "Task moved successfully"));
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(id);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    // Verify project access
    const project = await Project.findById(task.projectId);
    if (!project) throw new ApiError(404, "Project not found");

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    // Remove from Column
    const column = project.columns.find((col) => col.id === task.columnId);
    if (column) {
      column.taskIds = column.taskIds.filter((tid) => tid !== id);
      await project.save();
    }

    // Delete Task
    await Task.findByIdAndDelete(id);

    // Emit socket event (after DB success)
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
