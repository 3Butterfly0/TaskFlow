import { createContext, useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { selectCurrentUser } from "../features/auth/authSlice";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Track online users by room (projectId -> list of userIds)
  // Or simpler: just track presence updates.
  // The backend sends { projectId, onlineUsers: [] } on "presence.update"
  // We can store this in a map: projectId -> userIds[]
  const [onlineUsersMap, setOnlineUsersMap] = useState({});

  useEffect(() => {
    // Only connect if user is logged in
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket
    // In dev: proxy handles /api, but socket.io client might need explicit URL if on different port
    // Vite proxy usually handles ws too if configured, but let's see.
    // If backend is on 5000 and frontend on 5173.
    // Best practice: allow url from env or relative if proxy.
    // The backend initializes socket on the same HTTP server as Express.
    const socketUrl = import.meta.env.VITE_API_URL || "/";
    // Wait, if VITE_API_URL is defined (e.g. http://localhost:5000/api), we need the root http://localhost:5000
    // But usually socket.io client auto-connects to window.location if no url provided, or relative path.
    // Let's try relative path "/" with options.transports if needed.

    // Actually, backend cors origin is set to client url.
    // If we rely on proxy, we connect to "/" (dev server), which proxies to backend.

    const newSocket = io("/", {
      path: "/socket.io", // Default
      reconnectionAttempts: 5,
      // Sending credentials for handshake if needed (cookies are sent automatically by browser if withCredentials is true, usually)
      withCredentials: true,
      autoConnect: true,
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      setIsConnected(true);
      // Authenticate
      newSocket.emit("setup");
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    // Global Presence Listener
    // The backend broadcasts "presence.update" to rooms.
    // So we only get updates for projects we've joined via "join-project".
    newSocket.on("presence.update", ({ projectId, onlineUsers }) => {
      setOnlineUsersMap((prev) => ({
        ...prev,
        [projectId]: onlineUsers,
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]); // Re-connect if user changes

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsersMap }}>
      {children}
    </SocketContext.Provider>
  );
};
