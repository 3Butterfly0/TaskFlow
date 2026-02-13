import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";

// ── Public pages ─────────────────────────────────────
import Login from "../pages/Login";
import Register from "../pages/Register";

// ── Protected pages ──────────────────────────────────
import Dashboard from "../pages/Dashboard";
import Board from "../pages/Board";
import Tickets from "../pages/Tickets";
import Settings from "../pages/Settings";
import Team from "../pages/Team";

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

        {/* ── Protected routes (inside AppLayout) ── */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="projects/:projectId/board" element={<Board />} />
          <Route path="projects/:projectId/tickets" element={<Tickets />} />
          <Route path="projects/:projectId/team" element={<Team />} />
          <Route path="projects/:projectId/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
