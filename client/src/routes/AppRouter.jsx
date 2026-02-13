import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// Pages
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Board from "../pages/Board";
import Tickets from "../pages/Tickets";

/**
 * Application router.
 *
 * Public routes:  /login, /register
 * Protected routes: /, /projects/:projectId/board, /projects/:projectId/tickets
 */
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes ──────────────────────── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Protected routes ───────────────────── */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/board"
          element={
            <ProtectedRoute>
              <Board />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/tickets"
          element={
            <ProtectedRoute>
              <Tickets />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
