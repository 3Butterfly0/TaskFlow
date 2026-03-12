import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useGetMeQuery } from "../features/auth/authApi";
import { setCredentials, clearCredentials } from "../features/auth/authSlice";
import LandingPage from "../pages/LandingPage";
import Dashboard from "../pages/Dashboard";
import AppLayout from "../components/layout/AppLayout";

const PublicOrDashboard = () => {
  const dispatch = useDispatch();
  const { data, isLoading, isError } = useGetMeQuery();

  useEffect(() => {
    if (data?.data) {
      dispatch(setCredentials(data.data));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (isError) {
      dispatch(clearCredentials());
    }
  }, [isError, dispatch]);

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

  // If unauthenticated, show Landing Page
  if (isError || !data?.data) {
    return <LandingPage />;
  }

  // If authenticated, show Dashboard within AppLayout
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
};

export default PublicOrDashboard;
