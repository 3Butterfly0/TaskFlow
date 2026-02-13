import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { useGetMeQuery } from "../features/auth/authApi";
import { setCredentials, clearCredentials } from "../features/auth/authSlice";

/**
 * Wraps routes that require authentication.
 *
 * - Calls GET /api/auth/me on mount (via RTK Query cache).
 * - On success → syncs user into Redux, renders children.
 * - On failure → clears Redux, redirects to /login.
 * - Preserves intended destination in location.state.from
 *   so Login can redirect back after success.
 */
const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { data, isLoading, isError } = useGetMeQuery();
  const location = useLocation();

  useEffect(() => {
    if (data?.data) {
      dispatch(setCredentials(data.data));
    }
    if (isError) {
      dispatch(clearCredentials());
    }
  }, [data, isError, dispatch]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />
          <p className="text-sm text-slate-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (isError || !data?.data) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
