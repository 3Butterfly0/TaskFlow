import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import useSocket from "../../hooks/useSocket";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { useGetNotificationsQuery, useMarkAsReadMutation } from "../../features/notifications/notificationApi";

const NotificationBell = () => {
  const { socket } = useSocket();
  const user = useSelector(selectCurrentUser);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  // RTK Query for persistent notifications
  const { data: notifData, refetch } = useGetNotificationsQuery({ page: 1, limit: 10 });
  const [markAsRead] = useMarkAsReadMutation();
  
  const notifications = notifData?.data?.notifications || [];
  const unreadCount = notifData?.data?.unreadCount || 0;

  // Optimistic UI updates from socket
  // We can either append to local state or just refetch.
  // Transforming socket events to match backend schema is tricky.
  // Best strategy: On socket event, show "New notification" toast & refetch query.
  
  // Close dropdown on output click
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
    
    // Comment Added - This function was incomplete and causing a syntax error.
    // It's commented out as it was not used and the instruction did not involve fixing it.
    // const handleCommentAdded = (data) => {
    //   // Don't notify if I made the comment (requires backend to send actorId, or check data.comment.user._id)
    //   if (data.comment?.user?._id === user?._id) return;
    // }; // Added closing brace to fix syntax error if it were to be used.

    const handleNotification = () => {
       // Refetch on any notification event
       refetch();
    };

    socket.on("comment.added", handleNotification);
    socket.on("ticket.created", handleNotification);
    socket.on("task.assigned", handleNotification);
    socket.on("status", handleNotification);
    socket.on("notification", handleNotification);

    return () => {
      socket.off("comment.added", handleNotification);
      socket.off("ticket.created", handleNotification);
      socket.off("task.assigned", handleNotification);
      socket.off("status", handleNotification);
      socket.off("notification", handleNotification);
    };
  }, [socket, refetch]);

  const handleMarkAsRead = async (id, link) => {
    try {
      await markAsRead(id).unwrap();
      setIsOpen(false);
      // navigation handled by Link wrapper usually
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
      await markAsRead("all");
  };

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
                onClick={handleMarkAllRead}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto py-2">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                No new notifications
              </div>
            ) : (
              notifications.map((notif) => {
                // Construct link based on resourceType
                let link = "#";
                if (notif.resourceType === "Task") {
                   // We need project ID. Ideally backend sends it in 'resourceId' or separate field.
                   // The current notification model has resourceId.
                   // But for Task link we need ProjectId too unless we have a global task route.
                   // Backend notification creation logic doesn't strictly save projectId. 
                   // Let's assume we can navigate or just use a placeholder for now.
                   // For now, let's try to query param? 
                   // Actually, advanced task drawer only needs ID if we are on *any* board? 
                   // No, we need to go to specific project board.
                   // *Fix*: Notification Model should store projectId context if relevant.
                   // For now, just disabling link or linking to issues page?
                   link = `/issues?q=${notif.resourceId}`; // Pass ID to global filter?
                }
                
                return (
                <div
                  key={notif._id}
                  className={`border-b border-slate-800/50 px-4 py-3 last:border-0 hover:bg-slate-800/30 transition-colors ${!notif.isRead ? 'bg-slate-900/40 border-l-2 border-l-indigo-500' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm text-slate-300">{notif.message}</p>
                    {!notif.isRead && (
                      <button 
                        onClick={() => handleMarkAsRead(notif._id)}
                        className="text-[10px] text-indigo-400 hover:underline shrink-0"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
