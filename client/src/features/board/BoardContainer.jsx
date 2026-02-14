import { useMemo } from "react";
import BoardColumn from "./BoardColumn";

/**
 * Board container – renders columns horizontally with tasks.
 *
 * Per production-blueprint.md §2:
 *   Board = Project.columns (order array) + Tasks (data)
 *   A task map (keyed by _id) is built once for O(1) lookups.
 *
 * Props:
 *   columns – array of { id, title, taskIds } from the project
 *   tasks   – flat array of task documents from the API
 */
const BoardContainer = ({ columns, tasks }) => {
  // Build a lookup map: taskId → task document
  const taskMap = useMemo(() => {
    const map = {};
    for (const task of tasks) {
      map[task._id] = task;
    }
    return map;
  }, [tasks]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <BoardColumn key={column.id} column={column} taskMap={taskMap} />
      ))}
    </div>
  );
};

export default BoardContainer;
