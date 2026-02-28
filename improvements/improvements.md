# TaskFlow — Final Improvements & Deployment Readiness

> This document contains **all remaining work** needed to ship the app.
> Items marked ✅ are already done. Items marked ⬜ are pending.

---

## Wave 6A — App Settings (Functional)

✅ **1. Update Profile (Username)**

- Backend: `PATCH /api/auth/profile` → update username (requires current password for verification).
- Frontend: Wire the "Username" input in `AppSettings.jsx → Account` tab to call the new API.

✅ **2. Change Password**

- Backend: `PATCH /api/auth/password` → accepts `currentPassword`, `newPassword`.
- Frontend: Build a "Change Password" form in `AppSettings.jsx → Security` tab (currently just a button).

✅ **3. MFA (Two-Factor Authentication)**

- Backend: Use `speakeasy` (secure, minimal) for TOTP secrets + `qrcode` for QR generation.
- `POST /api/auth/mfa/setup` → generate secret, return QR code data URI.
- `POST /api/auth/mfa/verify` → verify TOTP token, enable MFA on user.
- `POST /api/auth/mfa/validate` → called during login if MFA is enabled.
- Frontend: Wire "Enable 2FA" button → show QR modal → verify code → done.
- On login, if user has MFA enabled, show TOTP input after password verified.

---

## Wave 6B — Workspace (Project) Settings (Functional)

✅ **4. Update Project Name / Description**

- Backend: `PATCH /api/projects/:id` → update name, description, visibility. Only owner/admin.
- Frontend: Wire the "Save Changes" button in `Settings.jsx → General` tab (currently static).

✅ **5. Remove "Pin Project" from Workspace Settings**

- Remove pin button from `Settings.jsx → General` — pinning should only be in the sidebar.

✅ **6. Owner-only Workspace Delete**

- Already enforced in backend. Frontend should hide/disable the "Delete Project" button for non-owners.

✅ **7. Transfer Ownership**

- Backend: `PATCH /api/projects/:id/transfer` → transfers ownership (owner-only).
- Frontend: Add a "Transfer Ownership" card in `Settings.jsx → Danger Zone` with member dropdown.

---

## Wave 6C — Navigation & UX Polish

✅ **8. Remove Breadcrumb from Project Layout**

- Remove the `Workspaces / ProjectName` breadcrumb line in `ProjectLayout.jsx` (lines 30-36).
- The project heading and settings button are sufficient.

✅ **9. Smooth Page Transitions**

- Wrap `<Outlet />` in a `framer-motion` `<AnimatePresence>` with a subtle fade/slide.
- Apply to both `AppLayout` and `ProjectLayout`.

✅ **10. Back Button on Settings Pages**

- Add a "← Back" button at the top of both `Settings.jsx` and `AppSettings.jsx` using `navigate(-1)`.

✅ **11. Scrollbar Overflow Audit**

- Ensure every content section that may overflow uses `overflow-y-auto` with `custom-scrollbar`.
- Key pages to check: `Team.jsx` member list, `Tickets.jsx`, `GlobalIssues.jsx`, `History.jsx`.

---

## Wave 6D — Analytics Redesign

✅ **12. Summary Cards Row**

- Add stat cards: Total Tasks, Completed, Pending, Completion Rate (%), Overdue Tasks.
- Display above the charts.

✅ **13. Role-Based Scope**

- **Owner / Admin**: See project-wide analytics + per-member breakdown.
- **Member**: See only their own tasks analytics.
- Backend: Add a `scope` query param to `GET /api/analytics/:projectId?scope=me|all`.
- Frontend: Toggle between "My Stats" and "Project Overview" based on role.

✅ **14. Priority Completion Rate Chart**

- Show completion rate grouped by priority (low/medium/high/critical).
- E.g., "60% of high-priority tasks are completed."

✅ **15. Per-Member Performance (Owner/Admin only)**

- Show each member's task count, completion rate, and average time-to-complete.
- Render as a table or card grid.

---

## Wave 6E — Final Hardening

✅ **16. Environment Variable Validation**

- Add a startup check (`server.js`) that throws if critical env vars are missing: `JWT_SECRET`, `MONGO_URI`, `CLIENT_URL`.

✅ **17. Production Build Test**

- Run `pnpm run build` on client and verify zero errors.
- Run `node src/server.js` with `NODE_ENV=production` and verify clean start.

---

## Deferred (Later Pass)

🔜 **Theme Switching (Dark / Light / System)**

- Requires full audit of all Tailwind classes for dual-theme support.

🔜 **Dockerfile / Docker Compose / Deployment Config**

- Depends on hosting target decision.

🔜 **README.md**

- Setup instructions, env vars table, architecture overview.
