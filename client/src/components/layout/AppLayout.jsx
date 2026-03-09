import { useEffect } from "react";
import { Outlet, useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
const AppLayout = ({ children }) => {
  const { projectId } = useParams();
  const location = useLocation();
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
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto w-full relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full w-full flex flex-col"
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
