import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";

// ── Public pages ─────────────────────────────────────
import Login from "../pages/Login";
import Register from "../pages/Register";

// ── Protected pages ──────────────────────────────────
import Dashboard from "../pages/Dashboard";
import PublicOrDashboard from "./PublicOrDashboard";
import AcceptInvite from "../pages/AcceptInvite";
import Board from "../pages/Board";
import Tickets from "../pages/Tickets";
import Settings from "../pages/Settings";
import Team from "../pages/Team";
import Backlog from "../pages/Backlog";
import History from "../pages/History";
import Calendar from "../pages/Calendar";
import AppSettings from "../pages/AppSettings";
import GlobalIssues from "../pages/GlobalIssues";
import Analytics from "../pages/Analytics";
import ProjectLayout from "../components/layout/ProjectLayout";

/**
 * Application router.
 *
 * Public routes:    /login, /register
 * Protected routes: Nested under AppLayout
 *   /                                  → Dashboard
 *   /projects/:projectId/board         → Board
 *   /projects/:projectId/tickets       → Tickets
 *   /projects/:projectId/team          → Team
 *   /projects/:projectId/settings      → Settings
 */
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes (no layout) ──────────── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Root Entry Point (Public Landing or Dashboard) ── */}
        <Route path="/" element={<PublicOrDashboard />} />

        {/* ── Protected routes (inside AppLayout) ── */}
        <Route
          element={
            <ProtectedRoute>
              <AcceptInvite />
            </ProtectedRoute>
          }
          path="/accept-invite"
        />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="projects/:projectId" element={<ProjectLayout />}>
            <Route path="board" element={<Board />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="backlog" element={<Backlog />} />
            <Route path="history" element={<History />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="team" element={<Team />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="settings" element={<AppSettings />} />
          <Route path="issues" element={<GlobalIssues />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
