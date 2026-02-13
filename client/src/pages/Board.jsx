import { useParams } from "react-router-dom";

const Board = () => {
  const { projectId } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Board</h1>
      <p className="mt-2 text-slate-400">
        Kanban board for project: {projectId}
      </p>
    </div>
  );
};

export default Board;
