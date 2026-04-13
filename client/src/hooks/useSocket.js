import { useContext } from "react";
import { SocketContext } from "../context/SocketContext";

/**
 * Hook to access global socket instance and connection state.
 */
export default function useSocket() {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }

  const { socket, isConnected, onlineUsersMap, error } = context;

  return {
    socket,
    isConnected,
    onlineUsersMap,
    error,
    // Helper to join a project room automatically
    joinProject: (projectId) => {
      if (socket && isConnected) {
        socket.emit("join-project", projectId);
      }
    },
    // Helper to leave a project room
    leaveProject: (projectId) => {
      if (socket && isConnected) {
        socket.emit("leave-project", projectId);
      }
    }
  };
}
