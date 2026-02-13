import { useParams } from "react-router-dom";

const Team = () => {
  const { projectId } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Team</h1>
      <p className="mt-2 text-slate-400">
        Team members for project: {projectId}
      </p>
    </div>
  );
};

export default Team;
