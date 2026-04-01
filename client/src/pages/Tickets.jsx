import { useState, useMemo } from "react";
import ErrorState from "../components/ui/ErrorState";
import { useParams, Link } from "react-router-dom";
import { useGetTicketsQuery } from "../features/tickets/ticketApi";
import RaiseTicketModal from "../features/tickets/RaiseTicketModal";
import PromoteTicketModal from "../features/tickets/PromoteTicketModal";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "All" },
  { value: "minor", label: "Minor" },
  { value: "major", label: "Major" },
  { value: "blocking", label: "Blocking" },
];

const severityColors = {
  minor: "bg-slate-500/20 text-slate-400",
  major: "bg-amber-500/20 text-amber-400",
  blocking: "bg-red-500/20 text-red-400",
};

const statusColors = {
  open: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-indigo-500/20 text-indigo-400",
  resolved: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-slate-500/20 text-slate-500",
};

const statusLabels = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

const StatsBar = ({ tickets }) => {
  const stats = useMemo(() => {
    const s = { total: tickets.length, open: 0, in_progress: 0, blocking: 0 };
    for (const t of tickets) {
      if (t.status === "open") s.open++;
      if (t.status === "in_progress") s.in_progress++;
      if (t.severity === "blocking") s.blocking++;
    }
    return s;
  }, [tickets]);

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: "Total", value: stats.total, color: "text-white" },
        { label: "Open", value: stats.open, color: "text-blue-400" },
        {
          label: "In Progress",
          value: stats.in_progress,
          color: "text-indigo-400",
        },
        { label: "Blocking", value: stats.blocking, color: "text-red-400" },
      ].map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
        >
          <p className="text-xs font-medium text-slate-500">{stat.label}</p>
          <p className={`mt-1 text-xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
};

const TicketRow = ({ ticket, projectId, onPromote }) => {
  const isPromotable =
    !ticket.linkedTaskId &&
    ticket.status !== "resolved" &&
    ticket.status !== "rejected";

  return (
    <div className="group flex flex-wrap items-center gap-3 border-b border-slate-800/50 px-4 py-3 transition-colors hover:bg-slate-900/50 sm:flex-nowrap">
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
          severityColors[ticket.severity]
        }`}
      >
        {ticket.severity}
      </span>

      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-medium text-white truncate">
          {ticket.subject}
        </h4>
        <p className="mt-0.5 text-xs text-slate-500 truncate">
          {ticket.description}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
          statusColors[ticket.status]
        }`}
      >
        {statusLabels[ticket.status]}
      </span>

      <div className="flex shrink-0 items-center gap-1.5">
        <div className="flex size-5 items-center justify-center rounded-full bg-slate-700 text-[9px] font-medium text-white">
          {ticket.reporter?.username?.charAt(0).toUpperCase() || "?"}
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          {ticket.reporter?.username}
        </span>
      </div>

      <span className="shrink-0 text-[11px] text-slate-600">
        {new Date(ticket.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>

      {ticket.linkedTaskId && (
        <Link
          to={`/projects/${projectId}/board`}
          className="shrink-0 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
        >
          → Task
        </Link>
      )}

      {isPromotable && (
        <button
          onClick={() => onPromote(ticket)}
          className="shrink-0 rounded-lg bg-indigo-600/20 px-2.5 py-1 text-[11px] font-medium text-indigo-400 opacity-0 transition-all hover:bg-indigo-600/30 group-hover:opacity-100"
        >
          Promote
        </button>
      )}
    </div>
  );
};

const TicketsSkeleton = () => (
  <div className="space-y-0 rounded-xl border border-slate-800 bg-slate-950">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 border-b border-slate-800/50 px-4 py-3"
      >
        <div className="h-5 w-16 animate-pulse rounded-full bg-slate-800" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-slate-800" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800/60" />
        </div>
        <div className="h-5 w-14 animate-pulse rounded-full bg-slate-800/40" />
      </div>
    ))}
  </div>
);

const Tickets = () => {
  const { projectId } = useParams();

  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const {
    data: ticketsData,
    isLoading,
    isError,
    error,
  } = useGetTicketsQuery({
    projectId,
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
  });

  const tickets = ticketsData?.data || [];

  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [promoteTicket, setPromoteTicket] = useState(null);

  return (
    <div className="flex flex-1 flex-col w-full px-6 py-4 overflow-y-auto custom-scrollbar">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <button
          onClick={() => setShowRaiseModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-colors hover:bg-indigo-500"
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ticket
        </button>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/50 hover:border-slate-600 transition-colors">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-transparent pl-3 pr-16 py-1.5 text-xs font-medium text-white outline-none cursor-pointer [&>option]:bg-slate-900"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2 flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
              <span>Status</span>
              <svg
                className="size-3 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div className="relative inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/50 hover:border-slate-600 transition-colors">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="appearance-none bg-transparent pl-3 pr-20 py-1.5 text-xs font-medium text-white outline-none cursor-pointer [&>option]:bg-slate-900"
            >
              {SEVERITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2 flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
              <span>Severity</span>
              <svg
                className="size-3 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {!isLoading && tickets.length > 0 && <StatsBar tickets={tickets} />}

      {isError && (
        <div className="mb-4">
          <ErrorState message={error?.data?.message || "Failed to load tickets"} />
        </div>
      )}

      {isLoading && <TicketsSkeleton />}

      {!isLoading && !isError && tickets.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-16">
          <svg
            className="mb-4 size-12 text-slate-700"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
          </svg>
          <h3 className="text-base font-semibold text-white">No tickets yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            {statusFilter || severityFilter
              ? "No tickets match the selected filters."
              : "Raise an issue to get started."}
          </p>
          {!statusFilter && !severityFilter && (
            <button
              onClick={() => setShowRaiseModal(true)}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Raise Issue
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && tickets.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket._id}
              ticket={ticket}
              projectId={projectId}
              onPromote={setPromoteTicket}
            />
          ))}
          {tickets.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No tickets match the selected filters.
            </div>
          )}
        </div>
      )}

      <RaiseTicketModal
        isOpen={showRaiseModal}
        onClose={() => setShowRaiseModal(false)}
        projectId={projectId}
      />

      {promoteTicket && (
        <PromoteTicketModal
          isOpen={!!promoteTicket}
          onClose={() => setPromoteTicket(null)}
          ticket={promoteTicket}
          projectId={projectId}
        />
      )}
    </div>
  );
};

export default Tickets;
