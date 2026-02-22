import { useState, useEffect } from "react";
import CommandPalette, { filterItems, getItemIndex } from "react-cmdk";
import { useNavigate } from "react-router-dom";
import { useSearchQuery } from "../../features/search/searchApi";
import { useGetProjectsQuery } from "../../features/projects/projectApi";
import { Loader } from "lucide-react";

// react-cmdk styles should be imported via index.css or here if not there, assuming it's already there
import "react-cmdk/dist/cmdk.css";

const SearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState("root");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch local projects for immediate matching
  const { data: projectsData } = useGetProjectsQuery();
  const localProjects = projectsData?.data || [];

  // Fetch from global search endpoint
  const { data: searchData, isFetching } = useSearchQuery(
    { q: debouncedSearch, type: "all" },
    { skip: !debouncedSearch || debouncedSearch.length < 2 }
  );

  const globalTasks = searchData?.data?.tasks || [];
  const globalProjects = searchData?.data?.projects || [];
  const globalUsers = searchData?.data?.users || [];

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
    setSearch("");
  };

  // 1. Static Pages
  const pages = [
    { id: "workspaces", children: "Workspaces", onClick: () => handleNavigate("/"), icon: "HomeIcon" },
    { id: "settings", children: "Settings", onClick: () => handleNavigate("/settings"), icon: "CogIcon" },
    { id: "global-issues", children: "All Issues", onClick: () => handleNavigate("/issues"), icon: "TicketIcon" },
  ];

  // 2. Build the lists for react-cmdk
  const lists = [];

  // If there's a search term, prioritize API results
  if (debouncedSearch && debouncedSearch.length >= 2) {
    if (globalProjects.length > 0) {
      lists.push({
        heading: "Projects",
        id: "api-projects",
        items: globalProjects.map((p) => ({
          id: `p-${p._id}`,
          children: p.name,
          icon: "FolderIcon",
          onClick: () => handleNavigate(`/projects/${p._id}/board`),
        })),
      });
    }

    if (globalTasks.length > 0) {
      lists.push({
        heading: "Tasks",
        id: "api-tasks",
        items: globalTasks.map((t) => ({
          id: `t-${t._id}`,
          children: t.title,
          icon: "DocumentIcon",
          onClick: () => handleNavigate(`/projects/${t.projectId?._id || t.projectId}/board?taskId=${t._id}`),
        })),
      });
    }
    
    if (globalUsers.length > 0) {
      lists.push({
        heading: "Users",
        id: "api-users",
        items: globalUsers.map((u) => ({
          id: `u-${u._id}`,
          children: u.username,
          icon: "UserIcon",
          onClick: () => handleNavigate("/settings"), // Or wherever user profiles are
        })),
      });
    }
  } else {
    // Default empty state showing pages and local projects
    lists.push({
      heading: "Pages",
      id: "pages",
      items: pages,
    });

    if (localProjects.length > 0) {
      lists.push({
        heading: "Your Workspaces",
        id: "local-projects",
        items: localProjects.map((p) => ({
          id: p._id,
          children: p.name,
          icon: "FolderIcon",
          onClick: () => handleNavigate(`/projects/${p._id}/board`),
        })),
      });
    }
  }

  // Filter items using cmdk's built-in, though API results are already filtered.
  // We still pass it through filterItems for the pages array and local projects.
  const filteredItems = filterItems(lists, debouncedSearch && debouncedSearch.length < 2 ? search : "");

  return (
    <CommandPalette
      onChangeSearch={setSearch}
      onChangeOpen={(open) => {
        if (!open) {
          onClose();
          setSearch("");
        }
      }}
      search={search}
      isOpen={isOpen}
      page={page}
    >
      <CommandPalette.Page id="root">
        {isFetching ? (
          <div className="flex items-center justify-center p-4 py-8 text-slate-400">
            <Loader className="mr-3 size-5 animate-spin" />
            <span>Searching...</span>
          </div>
        ) : filteredItems.length ? (
          filteredItems.map((list) => (
            <CommandPalette.List key={list.id} heading={list.heading}>
              {list.items.map(({ id, ...rest }) => (
                <CommandPalette.ListItem
                  key={id}
                  index={getItemIndex(filteredItems, id)}
                  {...rest}
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
