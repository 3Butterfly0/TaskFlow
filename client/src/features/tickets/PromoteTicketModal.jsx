import { useState } from "react";
import Modal from "../../components/ui/Modal";
import { usePromoteTicketMutation } from "./ticketApi";
import { useGetProjectByIdQuery } from "../projects/projectApi";

/**
 * Modal to promote a ticket to a task (PRD workflow step 4).
 *
 * Admin/Member selects which column the new task should land in.
 *
 * Props:
 *   isOpen    – boolean
 *   onClose   – callback
 *   ticket    – the ticket object to promote
 *   projectId – current project
 */
const PromoteTicketModal = ({ isOpen, onClose, ticket, projectId }) => {
  const [promoteTicket, { isLoading }] = usePromoteTicketMutation();
  const { data: projectData } = useGetProjectByIdQuery(projectId, {
    skip: !isOpen,
  });
  const [columnId, setColumnId] = useState("");
  const [error, setError] = useState("");

  const columns = projectData?.data?.columns || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!columnId) {
      setError("Please select a column");
      return;
    }

    try {
      const isBacklog = columnId === "BACKLOG";
      // If backlog, we still need a valid columnId for the model (use first available)
      const targetColumnId = isBacklog ? columns[0]?.id : columnId;

      if (!targetColumnId) {
        setError("Project has no columns to attach task to.");
        return;
      }

      await promoteTicket({
        id: ticket._id,
        projectId,
        columnId: targetColumnId,
        isInBacklog: isBacklog,
      }).unwrap();

      setColumnId("");
      onClose();
    } catch (err) {
      setError(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to promote ticket"
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Promote to Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Ticket info */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <h4 className="text-sm font-medium text-white">{ticket?.subject}</h4>
          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
            {ticket?.description}
          </p>
        </div>

        {/* Target selection */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Target
          </label>
          <div className="space-y-1.5">
            {/* Backlog Option */}
            <button
              type="button"
              onClick={() => setColumnId("BACKLOG")}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                columnId === "BACKLOG"
                  ? "bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/50"
                  : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span>Backlog</span>
              <span className="ml-auto text-xs text-slate-500">
                Wait for sprint
              </span>
            </button>

            {/* Board Columns */}
            {columns.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setColumnId(col.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  columnId === col.id
                    ? "bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/50"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
                </svg>
                {col.title}
                <span className="ml-auto text-xs text-slate-500">
                  {col.taskIds?.length || 0} tasks
                </span>
              </button>
            ))}
          </div>
          {columns.length === 0 && (
            <p className="text-xs text-slate-500">Loading columns…</p>
          )}
        </div>

        <p className="text-xs text-slate-500">
          The ticket will be converted to a task and placed in the selected column.
          Severity → priority mapping: minor → low, major → high, blocking → critical.
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !columnId}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {isLoading ? "Promoting…" : "Promote to Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PromoteTicketModal;
