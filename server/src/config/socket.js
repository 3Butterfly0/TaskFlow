import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

// In-memory presence map: userId → Set<socketId>
const onlineUsers = new Map();

let io = null;

/**
 * Returns the active Socket.io server instance.
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized – call initializeSocket first");
  }
  return io;
};

//  Returns an array of user IDs currently online in a project room.

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
 * Each project maps to one room for scoped broadcasts.
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Verify JWT before accepting connection
  io.use((socket, next) => {
    try {
      const cookieString = socket.handshake.headers.cookie;
      const match = cookieString?.match(/(?:^|;)\s*token\s*=\s*([^;]+)/);
      const token = match ? match[1] : socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // User setup and presence tracking
    socket.on("setup", () => {
      const userId = socket.userId;

      socket.join(userId);

      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      logger.info(`User ${userId} identified on socket ${socket.id}`);
    });

    // Join a project room
    socket.on("join-project", (projectId) => {
      socket.join(projectId);
      logger.debug(`Socket ${socket.id} joined room: ${projectId}`);

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
 * Events are only emitted after successful DB writes.
 */
export const emitToProject = (projectId, event, data, excludeSocketId) => {
  if (!io) {
    logger.warn(`Socket.io not initialized – skipping emit: ${event}`);
    return;
  }

  if (excludeSocketId) {
    io.to(projectId).except(excludeSocketId).emit(event, data);
  } else {
    io.to(projectId).emit(event, data);
  }

  logger.debug(`Emitted "${event}" to room ${projectId}`);
};
