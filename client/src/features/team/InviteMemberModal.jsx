import { useState } from "react";
import Modal from "../../components/ui/Modal";
import { useAddMemberMutation } from "./teamApi";

/**
 * Modal to invite a user to the project by email.
 *
 * Props:
 *   isOpen    – boolean
 *   onClose   – callback
 *   projectId – current project
 */
const InviteMemberModal = ({ isOpen, onClose, projectId }) => {
  const [addMember, { isLoading }] = useAddMemberMutation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Email address is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      const result = await addMember({
        projectId,
        email: email.trim(),
      }).unwrap();

      setSuccess(`${result.data?.username || email.trim()} has been added to the project`);
      setEmail("");

      // Auto-close after brief success message
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err?.data?.error?.message ||
          err?.data?.message ||
          "Failed to add member"
      );
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Team Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400 border border-emerald-500/20">
            {success}
          </div>
        )}

        {/* Info */}
        <p className="text-sm text-slate-400">
          Enter the email address of the person you'd like to invite. They must
          already have a TaskFlow account.
        </p>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            autoFocus
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !!success}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {isLoading ? "Inviting…" : "Send Invite"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteMemberModal;
