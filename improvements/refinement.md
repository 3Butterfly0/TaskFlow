# TaskFlow — Refinement Plan

A comprehensive audit of every page, component, layout, and server controller.
Items are grouped by category and ordered by severity.

---

## 🔴 Functional Bugs

### ✅ R-01 · Backlog uses wrong field name for description

- **File:** `Backlog.jsx` line 159
- **Issue:** Renders `task.description` but the Task model field is `content`. Column always shows "No description".
- **Fix:** Replace `task.description` with `task.content` in the backlog table and sticky-note modal.

### ✅ R-02 · AppSettings profile update uses `window.location.reload()`

- **File:** `AppSettings.jsx` lines 84, 136, 154
- **Issue:** Three separate `window.location.reload()` calls instead of proper Redux state updates. Causes full page flicker and loss of toast feedback. `authApi.js` already has `invalidatesTags: ["User"]` on `updateProfile`, `verifyMfa`, and `disableMfa` — so the cache auto-refreshes and the reloads are completely unnecessary.
- **Fix:** Remove all three `window.location.reload()` calls. Remove the `clearCredentials()` dispatch on profile update (line 82). The existing `invalidatesTags` on the mutations will auto-refetch `getMe`.

### ✅ R-03 · Analytics page has a stale breadcrumb

- **File:** `Analytics.jsx` lines 13-16
- **Issue:** Wave 6C removed breadcrumbs from `ProjectLayout`, but `Analytics.jsx` still renders its own manual breadcrumb ("Projects / {name}"). This creates a redundant UI element that other pages don't have.
- **Fix:** Remove the breadcrumb `<div>` and the unused `Link`/`useGetProjectByIdQuery` imports.

### ✅ R-04 · Ticket filters are client-side only

- **File:** `Tickets.jsx` lines 176-180
- **Issue:** `useGetTicketsQuery` always fetches with `status: undefined, severity: undefined`. The filters in `statusFilter`/`severityFilter` state only apply via `.filter()` on the full list. On large datasets this is wasteful.
- **Fix:** Pass `statusFilter` and `severityFilter` into the RTK Query hook so the backend can filter server-side.

---

## 🟡 Dead Code & Unused Imports

### R-05 · Unused `Pin` import in Settings.jsx

- **File:** `Settings.jsx` line 17
- **Issue:** `Pin` is imported from `lucide-react` but never used (Pin Project was removed in Wave 6B).
- **Fix:** Remove `Pin` from the import statement.

### R-06 · Unused imports in Board.jsx

- **File:** `Board.jsx` lines 9
- **Issue:** `Search`, `Filter`, and `User` are imported but never used in the component JSX.
- **Fix:** Remove them from the import.

### ✅ R-07 · Debug `console.log` left in task controller

- **File:** `server/src/controllers/task.controller.js` line ~571
- **Issue:** A `console.log("moveAcrossColumns payload:", req.body)` was left from debugging. Should not exist in production.
- **Fix:** Remove the `console.log` line.

---

## 🟢 UI Polish & Consistency

### R-08 · GlobalIssues header says "Global Tickets" instead of "Global Issues"

- **File:** `GlobalIssues.jsx` line 103
- **Issue:** The header text says "Global Tickets" but the sidebar and URL say "Issues". Inconsistent labelling.
- **Fix:** Change the heading to "Global Issues" and update the subtitle accordingly.

### R-09 · Backlog sticky-note modal uses yellow/light theme

- **File:** `Backlog.jsx` lines 222-265
- **Issue:** The description popup uses `bg-yellow-100 text-yellow-900` — a bright light-mode style that clashes with the dark theme.
- **Fix:** Restyle the popup to match the dark glass style (`bg-slate-900 border-slate-800 text-slate-200`).

### R-10 · `<Toaster>` is duplicated across pages

- **Files:** `AppSettings.jsx` line 169, `Settings.jsx` line 124
- **Issue:** Both settings pages render their own `<Toaster>`, but `App.jsx` (line 9) already renders a global `<Toaster position="top-right" />`. This causes duplicate toast notifications.
- **Fix:** Remove `<Toaster>` and its import from both `AppSettings.jsx` and `Settings.jsx`.

### R-11 · Dashboard page lacks scrollbar styling

- **File:** `Dashboard.jsx` line 85
- **Issue:** Missing `overflow-y-auto custom-scrollbar` on the main container. Wave 6C audit missed this page.
- **Fix:** Add `overflow-y-auto custom-scrollbar` to the wrapper `<div>`.

### R-12 · Header left side is an empty `<div />`

- **File:** `Header.jsx` line 45
- **Issue:** The header renders `<div />` as a placeholder on the left side, which occupies flex space and is semantically empty.
- **Fix:** Remove the empty `<div />`; use `ml-auto` on the right-side container instead.

### R-13 · ProjectNavbar gap too large on smaller screens

- **File:** `ProjectNavbar.jsx` line 18
- **Issue:** Uses `gap-12` between nav items, which overflows on medium-sized screens.
- **Fix:** Reduce to `gap-6 lg:gap-8` and add `overflow-x-auto` for horizontal scroll on smaller viewports.

### R-14 · Sidebar "Pinned" section still shows even though Pin was removed

- **File:** `Sidebar.jsx` lines 171–199
- **Issue:** Wave 6B removed Pin functionality from Settings, yet the sidebar still renders a "Pinned" section. Since users can no longer pin projects, this section will always be empty for new users.
- **Fix:** Remove the entire Pinned Projects section from the sidebar (or hide when `pinnedProjects.length === 0` which it already does, so this is low-priority).

### R-15 · Calendar page lacks `custom-scrollbar` class

- **File:** `Calendar.jsx` line 85
- **Issue:** The outer `<div>` uses `flex h-full flex-col` but the inner content area doesn't have `custom-scrollbar`.
- **Fix:** Add `custom-scrollbar` to the calendar wrapper for visual consistency.

### R-16 · Settings "Private (Components only)" label is confusing

- **File:** `Settings.jsx` line 178
- **Issue:** The visibility dropdown option says "Private (Components only)" — unclear wording. Should say "Private (Members only)".
- **Fix:** Update the option text.

---

## 🔵 Minor Enhancements

### R-17 · Auth pages lack meta title tags

- **Files:** `Login.jsx`, `Register.jsx`
- **Issue:** No `<title>` set for login/register pages. Browser tab shows the generic app name.
- **Fix:** Add `document.title` effect or use `react-helmet` to set page-specific titles.

### R-18 · Board page `taskParam` from URL is never used

- **File:** `Board.jsx` line 97
- **Issue:** `taskParam = searchParams.get("task")` is read but never consumed (e.g., to auto-open a task from a link).
- **Fix:** Wire it up to auto-set `selectedTaskId` on mount, or remove the dead code.

### R-19 · Backlog "Created By" column shows first assignee, not reporter

- **File:** `Backlog.jsx` lines 162-181
- **Issue:** The "Created By" column renders `task.assignees[0]` instead of `task.reporter`. This is semantically wrong.
- **Fix:** Use `task.reporter` data (if populated) for the "Created By" column.

### R-20 · Integrations tab in Settings is a non-functional placeholder

- **File:** `Settings.jsx` lines 232-257
- **Issue:** The "Integrations" tab shows GitHub/Slack/Jira/Figma with "Connect" buttons that do nothing.
- **Fix:** Either add a "Coming Soon" badge with disabled buttons, or remove the tab entirely to avoid user confusion.

---

## Implementation Priority

| Wave                             | Items                                                | Effort  |
| -------------------------------- | ---------------------------------------------------- | ------- |
| **Wave R1 — Bug fixes**          | R-01, R-02, R-03, R-04, R-07                         | ~30 min |
| **Wave R2 — Dead code cleanup**  | R-05, R-06, R-18                                     | ~10 min |
| **Wave R3 — UI polish**          | R-08, R-09, R-10, R-11, R-12, R-13, R-15, R-16, R-20 | ~30 min |
| **Wave R4 — Minor enhancements** | R-14, R-17, R-19                                     | ~15 min |
