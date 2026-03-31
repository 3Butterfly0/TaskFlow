import Task from "../models/Task.model.js";
import Project from "../models/Project.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { emitToProject } from "../config/socket.js";
import { createNotification } from "./notification.controller.js";

// ──────────────────────────────────────────────────────
// GET /api/tasks?projectId=xxx
// Returns all tasks for a project (used by board rendering)
//
// Per production-blueprint.md §2:
//   Board = Project.columns (order) + Tasks (data)
//   Compound index { projectId, columnId } accelerates this query
// ──────────────────────────────────────────────────────
export const getTasksByProject = async (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      throw new ApiError(400, "projectId query parameter is required");
    }

    // ── Access check ───────────────────────────────────
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

    // ── Fetch tasks ────────────────────────────────────
    const query = { projectId };

    // If specific statuses requested (e.g. History page requests "completed,cancelled,rejected")
    if (req.query.status) {
      query.status = { $in: req.query.status.split(",") };
    } else {
      // Board view (no status filter): Hide completed tasks older than 7 days
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query.$or = [
        { status: { $ne: "completed" } },
        { status: "completed", completedAt: { $gte: oneWeekAgo } },
        // Fallback: If status is completed but completedAt is mysteriously null, hide or show?
        // We will show them by fallback rule just to not lose them immediately if they were corrupted.
        { status: "completed", completedAt: null },
      ];
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

// ──────────────────────────────────────────────────────
// GET /api/tasks/my-tasks
// Returns all tasks assigned to the current user globally
// ──────────────────────────────────────────────────────
export const getMyTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, priority, projectId } = req.query;

    const query = { assignees: userId };

    if (status) query.status = { $in: status.split(",") };
    // By default, only show "active" tasks if no status is specified
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

// ──────────────────────────────────────────────────────
// GET /api/tasks/:id
// Returns a single task with populated references
// (used by task drawer / detail view)
// ──────────────────────────────────────────────────────
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

    // ── Access check ───────────────────────────────────
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

// ──────────────────────────────────────────────────────
// POST /api/tasks/:id/comments
// Add a comment to a task (embedded sub-document)
//
// Per architecture.md §4:
//   Comment (embedded) – small list, suitable for embedding
// Per production-blueprint.md §5 – structured activity log
// ──────────────────────────────────────────────────────
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

    // ── Access check ───────────────────────────────────
    const project = await Project.findById(task.projectId);
    if (!project) {
      throw new ApiError(404, "Associated project not found");
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    // ── Push comment ───────────────────────────────────
    task.comments.push({
      text: text.trim(),
      user: userId,
    });

    // ── Activity log ───────────────────────────────────
    task.activityLog.push({
      type: "comment_added",
      actorId: userId,
      metadata: { preview: text.trim().slice(0, 80) },
    });

    await task.save();
    await task.populate("comments.user", "username email avatar");

    const newComment = task.comments[task.comments.length - 1];

    // ── Emit socket event (after DB success) ──────────
    emitToProject(task.projectId.toString(), "comment.added", {
      projectId: task.projectId,
      taskId: id,
      comment: newComment,
    });

    // ── Notify Assignees (excluding self) ──────────────
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

// ──────────────────────────────────────────────────────
// POST /api/tasks
// Creates a task and appends its ID to the target column
// ──────────────────────────────────────────────────────
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

    // ── Validation ────────────────────────────────────
    if (!title || !projectId || !columnId) {
      throw new ApiError(400, "title, projectId, and columnId are required");
    }

    // ── Verify project exists and user has access ─────
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

    // ── Verify column exists in project ───────────────
    const column = project.columns.find((col) => col.id === columnId);
    if (!column) {
      throw new ApiError(404, `Column "${columnId}" not found in project`);
    }

    // ── Create task ───────────────────────────────────
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

    // ── Append task ID to column's taskIds (ONLY if not in backlog) ──
    if (!req.body.isInBacklog) {
      column.taskIds.push(task._id.toString());
      await project.save();
    }

    // ── Populate references for response ──────────────
    await task.populate("assignees", "username email avatar");

    // ── Emit socket event (after DB success) ──────────
    emitToProject(projectId, "task.created", {
      task,
      columnId,
    });

    // ── Notify Assignees ──────────────────────────────
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

// ──────────────────────────────────────────────────────
// PATCH /api/tasks/:id
// Update task fields (not for reordering/moving)
// ──────────────────────────────────────────────────────
export const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // ── Find existing task ────────────────────────────
    const task = await Task.findById(id);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    // ── Verify project access ─────────────────────────
    const project = await Project.findById(task.projectId);
    if (!project) {
      throw new ApiError(404, "Associated project not found");
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    // ── Allowed update fields ─────────────────────────
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

    // ── Build activity log entries for tracked changes ─
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

    // ── Evaluate Assignee Diffs Before Apply ──────────
    let newlyAssigned = [];
    if (updates.assignees) {
      const originalAssignees = new Set(
        task.assignees.map((id) => id.toString()),
      );
      
      // Calculate who was newly added
      newlyAssigned = updates.assignees.filter(
        (assigneeId) => !originalAssignees.has(assigneeId.toString())
      );
    }

    // ── Apply updates ─────────────────────────────────
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

    // ── Notify on Assignment Change ───────────────────
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

    // ── Emit socket event (after DB success) ──────────
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

// ──────────────────────────────────────────────────────
// PATCH /api/tasks/reorder
// Reorder tasks INSIDE a single column
//
// Per production-blueprint.md §6 – Reorder Inside Column
// Client sends: { projectId, columnId, taskIds }
// Server:       Update column.taskIds
//               No task document updates required
// ──────────────────────────────────────────────────────
export const reorderInsideColumn = async (req, res, next) => {
  try {
    const { projectId, columnId, taskIds } = req.body;

    // ── Validation ────────────────────────────────────
    if (!projectId || !columnId || !Array.isArray(taskIds)) {
      throw new ApiError(
        400,
        "projectId, columnId, and taskIds array are required",
      );
    }

    const userId = req.user.id;

    // ── Find project and verify access ────────────────
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    // ── Find target column ────────────────────────────
    const column = project.columns.find((col) => col.id === columnId);
    if (!column) {
      throw new ApiError(404, `Column "${columnId}" not found`);
    }

    // ── Update column taskIds (new order from client) ──
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

    // ── Emit socket event (after DB success) ──────────
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

// ──────────────────────────────────────────────────────
// PATCH /api/tasks/move
// Move task ACROSS columns (uses MongoDB transaction)
//
// Per production-blueprint.md §6 – Move Across Columns
// Client sends: {
//   projectId, taskId,
//   sourceColumnId, destinationColumnId,
//   newSourceTaskIds, newDestinationTaskIds
// }
// Server steps (inside transaction):
//   1. Update source column taskIds
//   2. Update destination column taskIds
//   3. Update task.columnId
//   4. (Emit socket event – future phase)
// ──────────────────────────────────────────────────────
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

    // ── Validation ────────────────────────────────────
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

    // ── Find project and verify access ────────────────
    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    // ── Locate columns ───────────────────────────────
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
    // Allowed task statuses: "active", "completed", "cancelled", "rejected"
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

    // ── Emit socket event (after DB success) ──────────
    emitToProject(projectId, "task.moved", responseData);

    res
      .status(200)
      .json(new ApiResponse(200, responseData, "Task moved successfully"));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// DELETE /api/tasks/:id
// Delete a task (removes from project also)
// ──────────────────────────────────────────────────────
export const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(id);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    // ── Verify project access ─────────────────────────
    const project = await Project.findById(task.projectId);
    if (!project) throw new ApiError(404, "Project not found");

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    // ── Remove from Column ────────────────────────────
    const column = project.columns.find((col) => col.id === task.columnId);
    if (column) {
      column.taskIds = column.taskIds.filter((tid) => tid !== id);
      await project.save();
    }

    // ── Delete Task ───────────────────────────────────
    await Task.findByIdAndDelete(id);

    // ── Emit socket event (after DB success) ──────────
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
