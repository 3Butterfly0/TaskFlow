import { NavLink, useParams } from "react-router-dom";
import { useGetMeQuery } from "../../features/auth/authApi";
import { Pin } from "lucide-react";

const mainNav = [
  { label: "Dashboard", to: "/", icon: "grid" },
  { label: "Issues", to: "/issues", icon: "ticket" },
];



/* ── Simple SVG icon map ──────────────────────────── */
const icons = {
  barChart: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  ),
  grid: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  columns: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  ticket: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
    </svg>
  ),
  users: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  settings: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  list: (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
};

const NavItem = ({ to, label, icon, end = false }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "bg-white/10 text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      }`
    }
  >
    {icons[icon]}
    <span>{label}</span>
  </NavLink>
);

const Sidebar = () => {
  const { projectId } = useParams();
  const { data } = useGetMeQuery();
  const user = data?.data;

  // Filter out the current project from recent list to avoid redundancy if needed,
  // but requirements say "any two Workspaces recently opened".
  // We'll just take the top 2 from lastAccessedProjects.
  const recentProjects = user?.lastAccessedProjects
    ?.slice()
    .sort((a, b) => new Date(b.accessedAt) - new Date(a.accessedAt))
    .map((p) => p.projectId)
    .filter(Boolean)
    .filter((p, index, self) => index === self.findIndex((t) => t._id === p._id))
    .slice(0, 2) || [];

  const pinnedProjects = user?.pinnedProjects?.slice().reverse().slice(0, 5) || [];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950">
      {/* ── Brand ──────────────────────────────────── */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-800 px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
          T
        </div>
        <span className="text-lg font-semibold text-white tracking-tight">
          TaskFlow
        </span>
      </div>

      {/* ── Navigation ─────────────────────────────── */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {/* Main */}
        <div className="mb-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main
          </p>
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} end={item.to === "/"} />
          ))}
        </div>

        {/* Recent */}
        {recentProjects.length > 0 && (
          <div className="mb-4">
             <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Recent
            </p>
            {recentProjects.map((project) => (
               <NavItem
                key={project._id}
                to={`/projects/${project._id}/board`}
                label={project.name}
                icon="grid" // Reusing grid icon for now, or could use custom
              />
            ))}
          </div>
        )}

        {/* Pinned */}
        {pinnedProjects.length > 0 && (
          <div className="mb-4">
             <div className="mb-2 flex items-center justify-between px-3">
               <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pinned
              </p>
               <Pin className="size-3 text-slate-600" />
             </div>
            {pinnedProjects.map((project) => (
               <NavItem
                key={project._id}
                to={`/projects/${project._id}/board`}
                label={project.name}
                icon="grid"
              />
            ))}
          </div>
        )}


      </nav>

      {/* ── Footer ─────────────────────────────────── */}
      <div className="border-t border-slate-800 p-3">
        <p className="px-3 text-xs text-slate-600">v1.0.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;
