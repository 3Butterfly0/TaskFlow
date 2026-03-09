import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAcceptInvitationMutation } from "../features/team/teamApi";
import { Loader, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [acceptInvitation] = useAcceptInvitationMutation();

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const [projectId, setProjectId] = useState(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No invitation token provided.");
      return;
    }

    const processInvite = async () => {
      try {
        const res = await acceptInvitation(token).unwrap();
        setStatus("success");
        setProjectId(res.data?.projectId);
        setMessage("You have successfully joined the project.");
      } catch (err) {
        setStatus("error");
        setMessage(
          err?.data?.error?.message ||
            err?.data?.message ||
            "Failed to accept invitation. It may have expired or been revoked.",
        );
      }
    };

    processInvite();
  }, [token, acceptInvitation]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader className="size-10 animate-spin text-indigo-500" />
            <h2 className="text-xl font-bold text-white">
              Processing Invitation
            </h2>
            <p className="text-sm text-slate-400">Please wait a moment...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="size-12 text-emerald-500" />
            <h2 className="text-xl font-bold text-white">
              Invitation Accepted!
            </h2>
            <p className="text-sm text-slate-400">{message}</p>
            <div className="mt-4 flex w-full flex-col gap-3">
              <button
                onClick={() =>
                  navigate(projectId ? `/projects/${projectId}/board` : "/")
                }
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                Go to Project
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="size-12 text-red-500" />
            <h2 className="text-xl font-bold text-white">Invitation Failed</h2>
            <p className="text-sm text-slate-400">{message}</p>
            <div className="mt-4 flex w-full flex-col gap-3">
              <Link
                to="/"
                className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
