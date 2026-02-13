import { useParams } from "react-router-dom";

const Board = () => {
  const { projectId } = useParams();

  return (
    <div>
      <h1>Board</h1>
      <p>Kanban board for project: {projectId}</p>
    </div>
  );
};

export default Board;
