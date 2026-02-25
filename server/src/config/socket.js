import { Server } from "socket.io";
import logger from "../utils/logger.js";

/**
 * In-memory presence map: userId → Set<socketId>
 * A user can have multiple tabs/devices, so we track a Set of socket IDs.
 *
 * Per production-blueprint.md §9:
 *   - Do NOT store online status permanently
 *   - Use socket tracking for presence
 */
const onlineUsers = new Map();

/**
 * Get the Socket.io server instance.
 * This is set after initializeSocket() runs and can be imported
 * by controllers to emit events after DB success.
 *
 * @type {Server|null}
 */
let io = null;

/**
 * Returns the active Socket.io server instance.
 * Controllers use this to emit events after successful DB writes.
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized – call initializeSocket first");
  }
  return io;
};

/**
 * Returns an array of user IDs currently online in a project room.
 */
export const getOnlineUsersInRoom = (projectId) => {
  const room = io?.sockets.adapter.rooms.get(projectId);
  if (!room) return [];

  const userIds = new Set();
  for (const socketId of room) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket?.userId) {
      userIds.add(socket.userId);
    }
  }
  return [...userIds];
};

/**
 * Initialize Socket.io on an existing HTTP server.
 *
 * Architecture (per architecture.md §9):
 *   - Each project = one room
 *   - Room strategy limits broadcast scope and scales better
 *
 * Events (per production-blueprint.md §14 – domain-driven):
 *   task.created, task.updated, task.moved, task.reordered
 *   comment.added, ticket.created, ticket.promoted
 *   presence.update
 *
 * @param {import("http").Server} httpServer
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Authenticate / identify user
    // Client sends: socket.emit("setup", userId)
    socket.on("setup", (userId) => {
      socket.userId = userId;

      socket.join(userId);

      // Track presence
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      logger.info(`User ${userId} identified on socket ${socket.id}`);
    });

    // Join a project room
    // Per architecture.md §9:
    //   socket.on("join-project", projectId => socket.join(projectId))
    socket.on("join-project", (projectId) => {
      socket.join(projectId);
      logger.debug(`Socket ${socket.id} joined room: ${projectId}`);

      // Broadcast updated presence to the room
      const onlineInRoom = getOnlineUsersInRoom(projectId);
      io.to(projectId).emit("presence.update", {
        projectId,
        onlineUsers: onlineInRoom,
      });
    });

    // Leave a project room
    socket.on("leave-project", (projectId) => {
      socket.leave(projectId);
      logger.debug(`Socket ${socket.id} left room: ${projectId}`);

      // Broadcast updated presence
      const onlineInRoom = getOnlineUsersInRoom(projectId);
      io.to(projectId).emit("presence.update", {
        projectId,
        onlineUsers: onlineInRoom,
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      const userId = socket.userId;

      if (userId && onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);

        // Clean up if no more sockets for this user
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);
        }
      }

      // Broadcast presence update to all rooms this socket was in
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          const onlineInRoom = getOnlineUsersInRoom(room);
          io.to(room).emit("presence.update", {
            projectId: room,
            onlineUsers: onlineInRoom,
          });
        }
      }

      logger.info(
        `Socket disconnected: ${socket.id} (user: ${userId || "unknown"})`,
      );
    });
  });

  logger.info("Socket.io initialized");

  return io;
};

/**
 * Emit a domain event to a project room.
 *
 * Per production-blueprint.md §14 & §20:
 *   - Use domain-driven events (task.created, task.moved, etc.)
 *   - Emit socket events ONLY after DB success
 *
 * @param {string} projectId  – Room to broadcast to
 * @param {string} event      – Domain event name (e.g. "task.created")
 * @param {*}      data       – Payload to broadcast
 * @param {string} [excludeSocketId] – Optional socket to exclude (sender)
 */
export const emitToProject = (projectId, event, data, excludeSocketId) => {
  if (!io) {
    logger.warn(`Socket.io not initialized – skipping emit: ${event}`);
    return;
  }

  if (excludeSocketId) {
    // Broadcast to room except the sender
    io.to(projectId).except(excludeSocketId).emit(event, data);
  } else {
    io.to(projectId).emit(event, data);
  }

  logger.debug(`Emitted "${event}" to room ${projectId}`);
};
