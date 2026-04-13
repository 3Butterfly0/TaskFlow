import { Server } from "socket.io";
// import { createAdapter } from "@socket.io/redis-adapter";
// import Redis from "ioredis";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import Project from "../models/Project.model.js";

// In-memory presence map: userId → Set<socketId>
const onlineUsers = new Map();

let io = null;

// Redis setup for scalability
const createRedisClient = () => {
  // To enable Redis, uncomment the imports at the top and the logic below
  return null;
  
  /*
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  client.on("error", (err) => {
    logger.error("Redis Error:", err);
  });

  return client;
  */
};

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

export const getOnlineUsersInRoom = async (projectId) => {
  // room members can be across different nodes when using redis adapter
  // io.sockets.adapter.rooms.get(projectId) only works locally
  // instead we use io.in(projectId).fetchSockets()
  const sockets = await io.in(projectId).fetchSockets();
  const userIds = new Set();
  
  for (const socket of sockets) {
    if (socket.userId) {
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

  // Setup Redis Adapter
  try {
    const pubClient = createRedisClient();
    if (pubClient) {
      const subClient = pubClient.duplicate();
      // io.adapter(createAdapter(pubClient, subClient));
      logger.info("Socket.io Redis adapter initialized");
    } else {
      logger.info("Redis disabled - using in-memory adapter");
    }
  } catch (err) {
    logger.error("Failed to initialize Socket.io Redis adapter:", err);
    logger.info("Falling back to default in-memory adapter");
  }

  // Verify JWT before accepting connection - STRICTLY from cookies
  io.use((socket, next) => {
    try {
      const cookieString = socket.handshake.headers.cookie;
      if (!cookieString) {
        return next(new Error("Authentication error: Session cookie missing"));
      }

      // Simple parser for 'token' cookie
      const token = cookieString
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        return next(new Error("Authentication error: Token not found in cookie"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      logger.error(`Socket Auth Failed: ${err.message}`);
      next(new Error("Authentication error: Invalid session"));
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

    // Join a project room (SECURE: check membership)
    socket.on("join-project", async (projectId) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          return logger.warn(`Invalid project ID join attempt: ${projectId}`);
        }

        // Verify user is member of project
        const isMember = await Project.exists({
          _id: projectId,
          $or: [
            { members: socket.userId },
            { owner: socket.userId },
            { "roles.userId": socket.userId }
          ]
        });

        if (!isMember) {
          logger.warn(`Unauthorized join attempt: User ${socket.userId} -> Project ${projectId}`);
          return;
        }

        socket.join(projectId);
        logger.debug(`Socket ${socket.id} joined room: ${projectId}`);

        const onlineInRoom = await getOnlineUsersInRoom(projectId);
        io.to(projectId).emit("presence.update", {
          projectId,
          onlineUsers: onlineInRoom,
        });
      } catch (err) {
        logger.error(`Join project error: ${err.message}`);
      }
    });

    // Leave a project room
    socket.on("leave-project", async (projectId) => {
      socket.leave(projectId);
      logger.debug(`Socket ${socket.id} left room: ${projectId}`);

      const onlineInRoom = await getOnlineUsersInRoom(projectId);
      io.to(projectId).emit("presence.update", {
        projectId,
        onlineUsers: onlineInRoom,
      });
    });

    // Disconnect
    socket.on("disconnect", async () => {
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
          const onlineInRoom = await getOnlineUsersInRoom(room);
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
