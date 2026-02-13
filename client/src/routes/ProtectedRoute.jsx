import { useGetMeQuery } from "../features/auth/authApi";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Wraps routes that require authentication.
 * Redirects to /login if not authenticated.
 */
const ProtectedRoute = ({ children }) => {
  const { data, isLoading, isError } = useGetMeQuery();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading…</div>;
  }

  if (isError || !data?.data) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
