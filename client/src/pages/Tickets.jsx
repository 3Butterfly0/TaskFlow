import { useParams } from "react-router-dom";

const Tickets = () => {
  const { projectId } = useParams();

  return (
    <div>
      <h1>Tickets</h1>
      <p>Triage dashboard for project: {projectId}</p>
    </div>
  );
};

export default Tickets;
