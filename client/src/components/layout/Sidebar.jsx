import { useState, useEffect } from "react";
import { NavLink, useParams } from "react-router-dom";
import { useGetMeQuery } from "../../features/auth/authApi";
import { Pin, Clock, ChevronDown, ChevronRight, Menu, SquareTerminal } from "lucide-react";

/* ── Simple SVG icon map ──────────────────────────── */
const icons = {
  barChart: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  grid: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  columns: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  ticket: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
    </svg>
  ),
  users: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  list: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
};

const mainNav = [
  { label: "Workspaces", to: "/", icon: "grid" },
  { label: "Issues", to: "/issues", icon: "ticket" },
];

const NavItem = ({ to, label, icon, end = false, collapsed = false }) => (
  <NavLink
    to={to}
    end={end}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `flex items-center rounded-lg py-2.5 font-medium transition-all ${
        collapsed ? "justify-center px-0 w-10 shrink-0 mx-auto" : "gap-3 px-3 w-full"
      } ${
        isActive
          ? "bg-white/10 text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      }`
    }
  >
    {icons[icon] || <SquareTerminal className="size-5 shrink-0" />}
    {!collapsed && <span className="truncate text-sm">{label}</span>}
  </NavLink>
);

const Sidebar = () => {
  const { projectId } = useParams();
  const { data } = useGetMeQuery();
  const user = data?.data;

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("taskflow_sidebar_collapsed") === "true";
  });

  const [recentOpen, setRecentOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("taskflow_sidebar_collapsed", collapsed);
  }, [collapsed]);

  const recentProjects = user?.lastAccessedProjects
    ?.slice()
    .sort((a, b) => new Date(b.accessedAt) - new Date(a.accessedAt))
    .map((p) => p.projectId)
    .filter(Boolean)
    .filter((p, index, self) => index === self.findIndex((t) => t._id === p._id))
    .slice(0, 5) || [];

  const pinnedProjects = user?.pinnedProjects?.slice().reverse().slice(0, 5) || [];

  return (
    <>
      {/* Mobile backdrop */}
      {!collapsed && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setCollapsed(true)}
        />
      )}
      
      <aside 
        className={`flex h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-950 transition-all duration-300 z-50 ${
          collapsed ? "w-0 md:w-[72px] -translate-x-full md:translate-x-0" : "w-64 translate-x-0 fixed md:relative"
        }`}
      >
      {/* ── Brand & Toggle ──────────────────────────────────── */}
      <div className={`flex h-16 items-center border-b border-slate-800 ${collapsed ? "justify-center" : "justify-between px-5"}`}>
        <div className={`flex items-center gap-2.5 overflow-hidden ${collapsed ? "w-0 h-0 opacity-0" : "opacity-100"}`}>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            T
          </div>
          <span className="text-lg font-semibold text-white tracking-tight whitespace-nowrap">
            TaskFlow
          </span>
        </div>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={`flex size-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200 ${collapsed ? "" : "ml-auto"}`}
        >
          <Menu className="size-5" />
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────── */}
      <nav className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
        {/* Main */}
        <div className="flex flex-col gap-1">
          {!collapsed && (
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Main
            </p>
          )}
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} end={item.to === "/"} collapsed={collapsed} />
          ))}
        </div>

        {/* Recent */}
        {recentProjects.length > 0 && (
          <div className="flex flex-col gap-1">
            {collapsed ? (
               <div className="mx-auto mt-4 mb-2 flex items-center justify-center text-slate-500" title="Recent">
                 <Clock className="size-5" />
               </div>
            ) : (
              <button 
                onClick={() => setRecentOpen(!recentOpen)}
                className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-white/5 hover:text-slate-400 transition-colors"
               >
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5" />
                  <span>Recent</span>
                </div>
                {recentOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </button>
            )}
            
            {(recentOpen || collapsed) && recentProjects.map((project) => (
               <NavItem
                key={project._id}
                to={`/projects/${project._id}/board`}
                label={project.name}
                icon="grid" 
                collapsed={collapsed}
              />
            ))}
          </div>
        )}

        {/* Pinned */}
        {pinnedProjects.length > 0 && (
          <div className="flex flex-col gap-1">
             {collapsed ? (
               <div className="mx-auto mt-4 mb-2 flex items-center justify-center text-slate-500" title="Pinned">
                 <Pin className="size-5" />
               </div>
             ) : (
                <button 
                  onClick={() => setPinnedOpen(!pinnedOpen)}
                  className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:bg-white/5 hover:text-slate-400 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Pin className="size-3.5" />
                    <span>Pinned</span>
                  </div>
                  {pinnedOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                </button>
             )}
            
            {(pinnedOpen || collapsed) && pinnedProjects.map((project) => (
               <NavItem
                key={project._id}
                to={`/projects/${project._id}/board`}
                label={project.name}
                icon="grid"
                collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </nav>

      {/* ── Footer ─────────────────────────────────── */}
      <div className={`flex border-t border-slate-800 p-3 ${collapsed ? "justify-center" : ""}`}>
        {collapsed ? (
           <span className="text-[10px] text-slate-600 font-medium">v1.0</span>
        ) : (
           <p className="px-3 text-xs text-slate-600 font-medium">TaskFlow v1.0.0</p>
        )}
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
