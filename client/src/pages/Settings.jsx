import { useParams } from "react-router-dom";

const Settings = () => {
  const { projectId } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <p className="mt-2 text-slate-400">
        Project settings for: {projectId}
      </p>
    </div>
  );
};

export default Settings;
