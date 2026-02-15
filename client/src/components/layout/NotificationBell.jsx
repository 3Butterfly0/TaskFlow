import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useSocket from "../../hooks/useSocket";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";

const NotificationBell = () => {
  const { socket } = useSocket();
  const user = useSelector(selectCurrentUser);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // ── Listeners ─────────────────────────────────────
    
    // Comment Added
    const handleCommentAdded = (data) => {
      // Don't notify if I made the comment (requires backend to send actorId, or check data.comment.user._id)
      if (data.comment?.user?._id === user?._id) return;

      const newNotif = {
        id: Date.now(),
        type: "comment",
        message: `New comment on task`,
        time: new Date(),
        link: `/projects/${data.comment.projectId || "unknown"}/board?taskId=${data.taskId}`, // link strategy? 
        // We lack projectId in comment payload usually. But let's assume we are in the project room for now.
        // Wait, socket only receives if we are in the room. 
      };
      // Actually taskId is enough to identify, but URL needs projectId.
      // Front-end context usually knows projectId, but this is global component?
      // If we are in the project, we can infer projectId?
      // Or update backend to include projectId in payload.
      
      setNotifications((prev) => [newNotif, ...prev]);
    };

    // Task Assigned (via task.updated for now, logic is tricky without specific event)
    const handleTaskUpdated = (data) => {
      const task = data.task;
      // Check if I am assigned
      const isAssigned = task.assignees.some(a => a._id === user?._id || a === user?._id);
      if (isAssigned) {
         // Potential spam if every update triggers this. 
         // Skip for MVP unless we have "task.assigned" event.
      }
    };

    // Ticket Created
    const handleTicketCreated = (data) => {
      setNotifications((prev) => [{
        id: Date.now(),
        type: "ticket",
        message: `New ticket: ${data.ticket.subject}`,
        time: new Date(),
        link: `/projects/${data.ticket.projectId}/tickets`,
      }, ...prev]);
    };

    socket.on("comment.added", handleCommentAdded);
    socket.on("ticket.created", handleTicketCreated);
    // socket.on("task.assigned", ...) // Not implemented yet

    return () => {
      socket.off("comment.added", handleCommentAdded);
      socket.off("ticket.created", handleTicketCreated);
    };
  }, [socket, user?._id]);

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-slate-800 bg-slate-950 shadow-2xl ring-1 ring-black/5 focus:outline-none z-50">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => setNotifications([])}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto py-2">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                No new notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="border-b border-slate-800/50 px-4 py-3 last:border-0 hover:bg-slate-800/30"
                >
                  <p className="text-sm text-slate-300">{notif.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {notif.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
