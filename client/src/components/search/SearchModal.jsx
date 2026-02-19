import { useState, useEffect } from "react";
import CommandPalette, { filterItems, getItemIndex } from "react-cmdk";
// import "react-cmdk/dist/cmdk.css";
import { useNavigate } from "react-router-dom";
import { useGetProjectsQuery } from "../../features/projects/projectApi";

const SearchModal = ({ isOpen, onClose }) => {
  const [page, setPage] = useState("root");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  
  const { data: projectsData } = useGetProjectsQuery();
  const projects = projectsData?.data || [];

  const projectItems = projects.map((project) => ({
    id: project._id,
    children: project.name,
    to: `/projects/${project._id}/board`, // Use 'to' instead of 'href' to avoid default anchor behavior if library uses it
    icon: "FolderIcon", // Safe icon
  }));

  const pages = [
    { id: "dashboard", children: "Dashboard", to: "/", icon: "HomeIcon" },
    { id: "settings", children: "Settings", to: "/settings", icon: "CogIcon" },
    { id: "global-issues", children: "All Issues", to: "/issues", icon: "TicketIcon" },
  ];

  const filteredItems = filterItems(
    [
      {
        heading: "Pages",
        id: "pages",
        items: pages,
      },
      {
        heading: "Projects",
        id: "projects",
        items: projectItems,
      },
    ],
    search
  );

  return (
    <CommandPalette
      onChangeSearch={setSearch}
      onChangeOpen={(isOpen) => {
        if (!isOpen) onClose();
      }}
      search={search}
      isOpen={isOpen}
      page={page}
    >
      <CommandPalette.Page id="root">
        {filteredItems.length ? (
          filteredItems.map((list) => (
            <CommandPalette.List key={list.id} heading={list.heading}>
              {list.items.map(({ id, to, ...rest }) => (
                <CommandPalette.ListItem
                  key={id}
                  index={getItemIndex(filteredItems, id)}
                  {...rest}
                  onClick={() => {
                    if (to) {
                      navigate(to);
                      onClose();
                    }
                  }}
                />
              ))}
            </CommandPalette.List>
          ))
        ) : (
          <CommandPalette.FreeSearchAction />
        )}
      </CommandPalette.Page>
    </CommandPalette>
  );
};

export default SearchModal;
