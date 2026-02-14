import { useState } from "react";
import Modal from "../../components/ui/Modal";
import { useCreateTicketMutation } from "./ticketApi";

const SEVERITIES = [
  { value: "minor", label: "Minor", color: "bg-slate-500" },
  { value: "major", label: "Major", color: "bg-amber-500" },
  { value: "blocking", label: "Blocking", color: "bg-red-500" },
];

/**
 * Modal to raise a new ticket (PRD workflow step 1-2).
 *
 * Props:
 *   isOpen    – boolean
 *   onClose   – callback
 *   projectId – current project
 */
const RaiseTicketModal = ({ isOpen, onClose, projectId }) => {
  const [createTicket, { isLoading }] = useCreateTicketMutation();
  const [form, setForm] = useState({
    subject: "",
    description: "",
    severity: "minor",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.subject.trim()) {
      setError("Subject is required");
      return;
    }
    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }

    try {
      await createTicket({
        subject: form.subject.trim(),
        description: form.description.trim(),
        severity: form.severity,
        projectId,
      }).unwrap();

      setForm({ subject: "", description: "", severity: "minor" });
      onClose();
    } catch (err) {
      setError(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to create ticket"
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Raise Issue">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Subject
          </label>
          <input
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Brief summary of the issue"
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe the issue in detail…"
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Severity */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Severity
          </label>
          <div className="flex gap-2">
            {SEVERITIES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, severity: s.value }))
                }
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  form.severity === s.value
                    ? "bg-slate-800 text-white ring-1 ring-indigo-500/50"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <span className={`inline-block size-2 rounded-full ${s.color}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

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
            disabled={isLoading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {isLoading ? "Submitting…" : "Raise Issue"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RaiseTicketModal;
