import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useGetMeQuery, useLogoutMutation } from "../../features/auth/authApi";
import { clearCredentials } from "../../features/auth/authSlice";
import { baseApi } from "../../app/baseApi";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data } = useGetMeQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const user = data?.data;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Even if API fails, clear client state
    } finally {
      dispatch(clearCredentials());
      dispatch(baseApi.util.resetApiState());
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-6">
      {/* ── Left: breadcrumb / page title slot ──── */}
      <div />

      {/* ── Right: user info + logout ──────────── */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-medium text-white">
                {user.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="text-sm font-medium text-slate-300">
                {user.username}
              </span>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-200 disabled:opacity-50"
            >
              {isLoggingOut ? "Logging out…" : "Log out"}
            </button>
          </>
        ) : (
          <div className="h-8 w-24 animate-pulse rounded bg-slate-800" />
        )}
      </div>
    </header>
  );
};

export default Header;
