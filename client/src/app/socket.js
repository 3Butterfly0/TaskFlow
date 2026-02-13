import { io } from "socket.io-client";

/**
 * Socket.io client singleton.
 *
 * Per architecture.md §9 – Client Pattern:
 *   socket.emit("join-project", projectId)
 *   socket.on("task-updated", handler)
 *
 * The socket connects to "/" which is proxied to the backend
 * in development (see vite.config.js).
 *
 * autoConnect is false so we control when to connect
 * (after authentication is confirmed).
 */
const socket = io("/", {
  autoConnect: false,
  withCredentials: true,
});

export default socket;
