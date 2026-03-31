import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useGetMeQuery, useLogoutMutation } from "../../features/auth/authApi";
import { clearCredentials } from "../../features/auth/authSlice";
import { baseApi } from "../../app/baseApi";
import NotificationBell from "./NotificationBell";
import { Settings, Search } from "lucide-react";
import { useState, useEffect } from "react";
import SearchModal from "../search/SearchModal";

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data } = useGetMeQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const user = data?.data;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
    } finally {
      dispatch(clearCredentials());
      dispatch(baseApi.util.resetApiState());
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-6">
      <div className="flex items-center gap-2">
        <div className="h-4 w-1 bg-indigo-500 rounded-full" />
        <span className="text-sm font-medium text-slate-300">TaskFlow</span>
        <span className="text-slate-600">/</span>
        <span className="text-sm font-bold text-white tracking-tight capitalize">
          {window.location.pathname.split("/").pop() || "Dashboard"}
        </span>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-[13px] text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <Search className="size-4" />
              <span className="hidden sm:inline w-32 text-left">Search...</span>
            </button>
            <SearchModal
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
            />

            <NotificationBell />

            <button
              onClick={() => navigate("/settings")}
              className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Settings"
            >
              <Settings className="size-[18px]" />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-[13px] font-bold text-white ring-2 ring-slate-950 transition-transform hover:scale-105 overflow-hidden"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="size-full object-cover"
                  />
                ) : (
                  user.username?.charAt(0).toUpperCase() || "U"
                )}
              </button>

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-10 w-48 rounded-xl border border-slate-800 bg-slate-900 py-2 shadow-2xl z-50">
                    <div className="px-4 py-2 border-b border-slate-800/60 mb-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.username}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/settings?tab=profile");
                      }}
                      className="w-full px-4 py-2 text-left text-[13px] text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      Profile Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full px-4 py-2 text-left text-[13px] text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      {isLoggingOut ? "Logging out…" : "Log out"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center size-8 animate-pulse rounded-full bg-slate-800" />
        )}
      </div>
    </header>
  );
};

export default Header;
