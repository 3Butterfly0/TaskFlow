import { createContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import socket from "../app/socket";
import { selectCurrentUser } from "../features/auth/authSlice";

export const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  // Track online users by room (projectId -> list of userIds)
  const [onlineUsersMap, setOnlineUsersMap] = useState({});

  useEffect(() => {
    // Only connect if user is logged in
    if (!user) {
      if (socket.connected) {
        socket.disconnect();
      }
      setIsConnected(false);
      return;
    }

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    // Connection events
    const onConnect = () => {
      setIsConnected(true);
      setError(null);
      // Authenticate
      socket.emit("setup");
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") {
        // Disconnect was initiated by server (maybe auth fail)
        setError("Disconnected by server");
      }
    };

    const onConnectError = (err) => {
      setError(err.message);
    };

    const onPresenceUpdate = ({ projectId, onlineUsers }) => {
      setOnlineUsersMap((prev) => ({
        ...prev,
        [projectId]: onlineUsers,
      }));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("presence.update", onPresenceUpdate);

    // Initial state check
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("presence.update", onPresenceUpdate);
    };
  }, [user?._id]); // Re-connect if user changes

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsersMap, error }}>
      {children}
    </SocketContext.Provider>
  );
};
