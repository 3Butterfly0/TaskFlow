import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import useSocket from "../../hooks/useSocket";
import { useUpdateLastAccessedMutation } from "../../features/projects/projectApi";
import Sidebar from "./Sidebar";
import Header from "./Header";

/**
 * Application shell for all protected pages.
 *
 * Structure:
 *   ┌──────────┬──────────────────────────┐
 *   │          │  Header                  │
 *   │ Sidebar  ├──────────────────────────┤
 *   │          │  <Outlet /> (page)       │
 *   │          │                          │
 *   └──────────┴──────────────────────────┘
 *
 * The <Outlet /> renders the matched child route.
 */
const AppLayout = () => {
  const { projectId } = useParams();
  const { socket } = useSocket();
  const [updateLastAccessed] = useUpdateLastAccessedMutation();

  useEffect(() => {
    if (projectId) {
      updateLastAccessed(projectId);
    }
  }, [projectId, updateLastAccessed]);

  useEffect(() => {
    if (socket && projectId) {
      socket.emit("join-project", projectId);
      
      return () => {
        socket.emit("leave-project", projectId);
      };
    }
  }, [socket, projectId]);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
