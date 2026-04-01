import mongoose from "mongoose";
import Ticket from "../models/Ticket.model.js";
import Task from "../models/Task.model.js";
import Project from "../models/Project.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { emitToProject } from "../config/socket.js";

// POST /api/tickets
export const createTicket = async (req, res, next) => {
  try {
    const { subject, description, severity, projectId } = req.body;

    if (!subject || !description || !projectId) {
      throw new ApiError(
        400,
        "subject, description, and projectId are required",
      );
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const ticket = await Ticket.create({
      subject,
      description,
      severity,
      projectId,
      reporter: req.user.id,
    });

    await ticket.populate("reporter", "username email avatar");

    emitToProject(projectId, "ticket.created", { ticket });

    res
      .status(201)
      .json(new ApiResponse(201, ticket, "Ticket created successfully"));
  } catch (error) {
    next(error);
  }
};

// GET /api/tickets?projectId=xxx&status=open&severity=blocking
export const getTickets = async (req, res, next) => {
  try {
    const { projectId, status, severity } = req.query;

    if (!projectId) {
      throw new ApiError(400, "projectId query parameter is required");
    }

    const filter = { projectId };
    if (status) filter.status = status;
    if (severity) filter.severity = severity;

    const tickets = await Ticket.find(filter)
      .populate("reporter", "username email avatar")
      .populate("triagedBy", "username email avatar")
      .populate("linkedTaskId", "title columnId priority")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json(new ApiResponse(200, tickets, "Tickets fetched successfully"));
  } catch (error) {
    next(error);
  }
};

// POST /api/tickets/:id/promote
// Promotes a ticket to a task using a MongoDB transaction
export const promoteToTask = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { projectId, columnId } = req.body;
    const userId = req.user.id;

    if (!projectId || !columnId) {
      throw new ApiError(400, "projectId and columnId are required");
    }

    const ticket = await Ticket.findById(id).session(session);
    if (!ticket) {
      throw new ApiError(404, "Ticket not found");
    }

    if (ticket.linkedTaskId) {
      throw new ApiError(409, "Ticket has already been promoted to a task");
    }

    if (ticket.status === "resolved" || ticket.status === "rejected") {
      throw new ApiError(
        400,
        `Cannot promote a ticket with status "${ticket.status}"`,
      );
    }

    const project = await Project.findById(projectId).session(session);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const isOwner = project.owner.toString() === userId;
    const isMember = project.members.some((m) => m.toString() === userId);
    if (!isOwner && !isMember) {
      throw new ApiError(403, "You do not have access to this project");
    }

    const column = project.columns.find((col) => col.id === columnId);
    if (!column) {
      throw new ApiError(404, `Column "${columnId}" not found in project`);
    }

    // Map severity to priority
    const severityToPriority = {
      minor: "low",
      major: "high",
      blocking: "critical",
    };

    // Create task from ticket data
    const [task] = await Task.create(
      [
        {
          title: ticket.subject,
          content: ticket.description,
          priority: severityToPriority[ticket.severity] || "medium",
          projectId,
          columnId,
          assignees: [],
          isInBacklog: !!req.body.isInBacklog,
          reporter: ticket.reporter,
          activityLog: [
            {
              type: "task_created",
              actorId: userId,
              metadata: {
                source: "ticket",
                ticketId: ticket._id.toString(),
                columnTitle: column.title,
              },
            },
          ],
        },
      ],
      { session },
    );

    // Append task ID to column (only if not backlog)
    if (!req.body.isInBacklog) {
      column.taskIds.push(task._id.toString());
      await project.save({ session });
    }

    // Link ticket to task and update status
    ticket.linkedTaskId = task._id;
    ticket.status = "in_progress";
    ticket.triagedBy = userId;
    await ticket.save({ session });

    await session.commitTransaction();

    await ticket.populate([
      { path: "reporter", select: "username email avatar" },
      { path: "triagedBy", select: "username email avatar" },
      { path: "linkedTaskId", select: "title columnId priority" },
    ]);

    emitToProject(projectId, "ticket.promoted", { ticket, task });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { ticket, task },
          "Ticket promoted to task successfully",
        ),
      );
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    if (session) {
      session.endSession();
    }
  }
};
