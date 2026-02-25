import { NavLink, useParams } from "react-router-dom";
import { Layout, List, Ticket, BarChart2, Users, Archive, Calendar as CalendarIcon } from "lucide-react";

const navItems = [
  { label: "Kanban", path: "board", icon: Layout },
  { label: "Tickets", path: "tickets", icon: Ticket },
  { label: "Calendar", path: "calendar", icon: CalendarIcon },
  { label: "Backlog", path: "backlog", icon: List },
  { label: "Analytics", path: "analytics", icon: BarChart2 },
  { label: "Team", path: "team", icon: Users },
  { label: "History", path: "history", icon: Archive },
];

const ProjectNavbar = () => {
  const { projectId } = useParams();

  return (
    <nav className="flex items-center gap-12">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={`/projects/${projectId}/${item.path}`}
          className={({ isActive }) =>
            `flex items-center gap-2 border-b-[3px] py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
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
