import { useDroppable } from "@dnd-kit/core";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";
import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Edit2, Trash2, X, Check } from "lucide-react";
import {
  useRenameColumnMutation,
  useDeleteColumnMutation,
} from "../projects/projectApi";
import { toast } from "react-hot-toast";

/**
 * A single board column with sortable task list.
 *
 * Per production-blueprint.md §2:
 *   Column defines order via taskIds array.
 *   Tasks are looked up from the task map by ID.
 *
 * Props:
 *   column  – { id, title, taskIds }
 *   taskMap – Map<taskId, taskDoc>
 */
const BoardColumn = ({
  column,
  columnIndex,
  taskMap,
  onOpen,
  isDoneColumn,
  projectId,
}) => {
  // Resolve taskIds to actual task documents, preserving order
  const tasks = (column.taskIds || []).map((id) => taskMap[id]).filter(Boolean);

  const [renameColumnReq] = useRenameColumnMutation();
  const [deleteColumnReq] = useDeleteColumnMutation();

  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(column.title);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRenaming]);

  const handleRenameSubmit = async (e) => {
    e?.preventDefault();
    if (!newTitle.trim() || newTitle === column.title) {
      setIsRenaming(false);
      return;
    }
    try {
      await renameColumnReq({
        projectId,
        columnId: column.id,
        title: newTitle.trim(),
      }).unwrap();
      setIsRenaming(false);
    } catch (err) {
      // Revert if error
      setNewTitle(column.title);
      setIsRenaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setNewTitle(column.title);
      setIsRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (tasks.length > 0) {
      toast.error("Cannot delete a column that contains tasks. Please move them first.");
      setIsMenuOpen(false);
      return;
    }
    if (columnIndex < 3) {
      toast.error("Cannot delete the default base columns (Todo, In Progress, Done).");
      setIsMenuOpen(false);
      return;
    }

    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-w-sm w-full mx-4">
            <h1 className="text-xl font-bold text-white mb-2">Delete Column</h1>
            <p className="text-sm text-slate-400 mb-6">Are you sure you want to delete the "{column.title}" column?</p>
            <div className="flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition">Cancel</button>
              <button
                onClick={async () => {
                  try {
                    await deleteColumnReq({ projectId, columnId: column.id }).unwrap();
                  } catch {
                    // Fallback or toast notification handles failure
                  }
                  onClose();
                }}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-lg shadow-red-500/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        );
      }
    });
    setIsMenuOpen(false);
  };

  // Make the column a droppable zone (for dropping into empty columns)
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      columnId: column.id,
    },
  });

  return (
    <div
      className={`flex h-full w-[300px] shrink-0 flex-col rounded bg-slate-900 transition-colors ${
        isOver ? "bg-slate-800/80 ring-2 ring-indigo-500/50" : ""
      }`}
    >
      <div className="flex items-center justify-between sticky top-0 px-3 py-3 z-10 rounded-t cursor-pointer hover:bg-slate-800/50 transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex w-full items-center gap-1">
              <input
                ref={inputRef}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRenameSubmit}
                className="w-full rounded bg-slate-800 px-2 py-1 text-xs font-bold text-slate-200 outline-none ring-1 ring-indigo-500/50"
              />
            </div>
          ) : (
            <>
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {column.title}
              </h3>
              <span className="flex items-center justify-center text-xs font-semibold text-slate-500 ml-1">
                {tasks.length}
              </span>
            </>
          )}
        </div>

        {!isRenaming && (
          <div className="relative ml-2" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-300"
            >
              <MoreHorizontal className="size-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-md border border-slate-700 bg-slate-800 py-1 shadow-xl z-50">
                <button
                  onClick={() => {
                    setIsRenaming(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700"
                >
                  <Edit2 className="size-3.5" />
                  Rename
                </button>
                <button
                  onClick={handleDelete}
                  disabled={tasks.length > 0 || columnIndex < 3}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    tasks.length > 0
                      ? "Empty the column before deleting"
                      : columnIndex < 3
                        ? "Cannot delete base columns"
                        : "Delete column"
                  }
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 overflow-y-auto p-2 min-h-[60px]"
      >
        <SortableContext
          items={column.taskIds || []}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 && (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-700 py-8">
              <p className="text-xs text-slate-500">No tasks</p>
            </div>
          )}

          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onOpen={onOpen}
              isDoneColumn={isDoneColumn}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default BoardColumn;
