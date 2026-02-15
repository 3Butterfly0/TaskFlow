import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";
import {
  useGetMembersQuery,
  useRemoveMemberMutation,
  useTransferOwnershipMutation,
} from "../features/team/teamApi";
import InviteMemberModal from "../features/team/InviteMemberModal";

/* ═══════════════════════════════════════════════════════
   Role badge config
   ═══════════════════════════════════════════════════════ */
const roleBadge = {
  admin: {
    label: "Admin",
    className: "bg-amber-500/15 text-amber-400 ring-amber-500/30",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  member: {
    label: "Member",
    className: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/30",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  observer: {
    label: "Observer",
    className: "bg-slate-500/15 text-slate-400 ring-slate-500/30",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
};

/* ═══════════════════════════════════════════════════════
   RoleBadge component
   ═══════════════════════════════════════════════════════ */
const RoleBadge = ({ role }) => {
  const config = roleBadge[role] || roleBadge.member;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════
   Stats bar
   ═══════════════════════════════════════════════════════ */
const StatsBar = ({ members }) => {
  const stats = useMemo(() => {
    const s = { total: members.length, admins: 0, online: 0 };
    for (const m of members) {
      if (m.role === "admin") s.admins++;
      if (m.isOnline) s.online++;
    }
    return s;
  }, [members]);

  const statItems = [
    { label: "Total Members", value: stats.total, color: "bg-indigo-500" },
    { label: "Admins", value: stats.admins, color: "bg-amber-500" },
    { label: "Online Now", value: stats.online, color: "bg-emerald-500" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-3"
        >
          <div className={`size-2.5 rounded-full ${item.color}`} />
          <div>
            <p className="text-lg font-bold text-white">{item.value}</p>
            <p className="text-xs text-slate-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MemberCard
   ═══════════════════════════════════════════════════════ */
const MemberCard = ({ member, isOwner, currentUserId, onRemove, onTransfer }) => {
  const isSelf = member._id === currentUserId;
  const isAdmin = member.role === "admin";

  const getInitials = (name) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const timeAgo = (dateStr) => {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-slate-800/60 bg-slate-900/40 px-5 py-4 transition-colors hover:border-slate-700/60 hover:bg-slate-900/70">
      {/* Avatar */}
      <div className="relative shrink-0">
        {member.avatar ? (
          <img
            src={member.avatar}
            alt={member.username}
            className="size-11 rounded-full object-cover ring-2 ring-slate-800"
          />
        ) : (
          <div className="flex size-11 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white ring-2 ring-slate-800">
            {getInitials(member.username)}
          </div>
        )}
        {/* Online indicator */}
        {member.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-slate-900 bg-emerald-500" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">
            {member.username}
          </p>
          {isSelf && (
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500">
              You
            </span>
          )}
        </div>
        <p className="truncate text-xs text-slate-500">{member.email}</p>
      </div>

      {/* Role badge */}
      <RoleBadge role={member.role} />

      {/* Last seen */}
      <div className="hidden w-24 text-right sm:block">
        <p className="text-xs text-slate-500">
          {member.isOnline ? (
            <span className="text-emerald-400">Online</span>
          ) : (
            timeAgo(member.lastSeen)
          )}
        </p>
      </div>

      {/* Actions (only for owner, not on self/admin) */}
      {isOwner && !isSelf && (
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!isAdmin && (
            <button
              onClick={() => onTransfer(member)}
              title="Make admin"
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-amber-500/10 hover:text-amber-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => onRemove(member)}
            title="Remove member"
            className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="17" y1="11" x2="22" y2="11" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   ConfirmDialog
   ═══════════════════════════════════════════════════════ */
const ConfirmDialog = ({ isOpen, title, message, confirmLabel, confirmColor, onConfirm, onCancel, isLoading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
              confirmColor === "red"
                ? "bg-red-600 hover:bg-red-500"
                : "bg-amber-600 hover:bg-amber-500"
            }`}
          >
            {isLoading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Team page
   ═══════════════════════════════════════════════════════ */
const Team = () => {
  const { projectId } = useParams();
  const currentUser = useSelector(selectCurrentUser);

  const {
    data: membersData,
    isLoading,
    isError,
    error,
  } = useGetMembersQuery(projectId);

  const [removeMember, { isLoading: isRemoving }] = useRemoveMemberMutation();
  const [transferOwnership, { isLoading: isTransferring }] = useTransferOwnershipMutation();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [transferTarget, setTransferTarget] = useState(null);

  const members = membersData?.data || [];
  const isOwner = members.some(
    (m) => m._id === currentUser?._id && m.role === "admin"
  );

  // ── Handlers ───────────────────────────────────────
  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      await removeMember({
        projectId,
        memberId: removeTarget._id,
      }).unwrap();
      setRemoveTarget(null);
    } catch {
      // Error handled by RTK Query
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget) return;
    try {
      await transferOwnership({
        projectId,
        memberId: transferTarget._id,
      }).unwrap();
      setTransferTarget(null);
    } catch {
      // Error handled by RTK Query
    }
  };

  // ── Search / filter ────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.username.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  // ── Loading state ──────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />
          <p className="text-sm text-slate-500">Loading team…</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────
  if (isError) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-4 text-center">
          <p className="text-sm text-red-400">
            {error?.data?.message || "Failed to load team members"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ── Header ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your project collaborators
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => setInviteOpen(true)}
            id="invite-member-btn"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 hover:shadow-indigo-600/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Invite Member
          </button>
        )}
      </div>

      {/* ── Stats bar ───────────────────────────────── */}
      <StatsBar members={members} />

      {/* ── Search ──────────────────────────────────── */}
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members by name or email…"
          className="w-full rounded-xl border border-slate-800 bg-slate-900/50 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500/50"
        />
      </div>

      {/* ── Members list ────────────────────────────── */}
      <div className="space-y-2">
        {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-800/50 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-7 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-400">
              {searchQuery ? "No members match your search" : "No team members yet"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {searchQuery
                ? "Try a different search term"
                : "Invite collaborators to get started"}
            </p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <MemberCard
              key={member._id}
              member={member}
              isOwner={isOwner}
              currentUserId={currentUser?._id}
              onRemove={setRemoveTarget}
              onTransfer={setTransferTarget}
            />
          ))
        )}
      </div>

      {/* ── Invite modal ────────────────────────────── */}
      <InviteMemberModal
        isOpen={inviteOpen}
        onClose={() => setInviteOpen(false)}
        projectId={projectId}
      />

      {/* ── Remove confirmation ─────────────────────── */}
      <ConfirmDialog
        isOpen={!!removeTarget}
        title="Remove Member"
        message={`Are you sure you want to remove ${removeTarget?.username} from this project? They will lose access to all boards, tickets, and tasks.`}
        confirmLabel="Remove"
        confirmColor="red"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
        isLoading={isRemoving}
      />

      {/* ── Transfer ownership confirmation ──────────── */}
      <ConfirmDialog
        isOpen={!!transferTarget}
        title="Transfer Ownership"
        message={`Are you sure you want to transfer project ownership to ${transferTarget?.username}? You will become a regular member.`}
        confirmLabel="Transfer"
        confirmColor="amber"
        onConfirm={handleTransfer}
        onCancel={() => setTransferTarget(null)}
        isLoading={isTransferring}
      />
    </div>
  );
};

export default Team;
