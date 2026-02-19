import { NavLink, useParams } from "react-router-dom";
import { Layout, List, Ticket, BarChart2, Users } from "lucide-react";

const navItems = [
  { label: "Board", path: "board", icon: Layout },
  { label: "Backlog", path: "backlog", icon: List },
  { label: "Tickets", path: "tickets", icon: Ticket },
  { label: "Analytics", path: "analytics", icon: BarChart2 },
  { label: "Team", path: "team", icon: Users },
];

const ProjectNavbar = () => {
  const { projectId } = useParams();

  return (
    <nav className="flex items-center gap-1 border-b border-slate-800 bg-slate-950 px-6">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={`/projects/${projectId}/${item.path}`}
          className={({ isActive }) =>
            `flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:border-slate-800 hover:text-slate-200"
            }`
          }
        >
          <item.icon className="size-4" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
};

export default ProjectNavbar;
