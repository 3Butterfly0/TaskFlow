import { useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";
import { Bell, Moon, Shield, User, Smartphone, LogOut } from "lucide-react";
import { useLogoutMutation } from "../features/auth/authApi";
import { useDispatch } from "react-redux";
import { clearCredentials } from "../features/auth/authSlice";
import { baseApi } from "../app/baseApi";
import { useNavigate } from "react-router-dom";

const SettingsSection = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      {children}
    </div>
  </div>
);

const SettingRow = ({ icon: Icon, title, description, action }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className="flex size-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-medium text-slate-200">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
    <div>{action}</div>
  </div>
);

const Settings = () => {
  const user = useSelector(selectCurrentUser);
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("dark");
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // ignore
    } finally {
      dispatch(clearCredentials());
      dispatch(baseApi.util.resetApiState());
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="mx-auto max-w-3xl py-8">
      <h1 className="mb-8 text-2xl font-bold text-white">Settings</h1>

      {/* ── Profile ─────────────────────────────────────── */}
      <SettingsSection title="Profile">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{user?.username}</p>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
          <button className="ml-auto rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
            Edit Profile
          </button>
        </div>
      </SettingsSection>

      {/* ── Appearance ──────────────────────────────────── */}
      <SettingsSection title="Appearance">
        <SettingRow
          icon={Moon}
          title="Dark Mode"
          description="Use dark theme for the application"
          action={
            <div className="flex items-center gap-2 rounded-lg bg-slate-800 p-1">
              <button
                onClick={() => setTheme("dark")}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  theme === "dark"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                On
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  theme === "light"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Off
              </button>
            </div>
          }
        />
      </SettingsSection>

      {/* ── Notifications ───────────────────────────────── */}
      <SettingsSection title="Notifications">
        <SettingRow
          icon={Bell}
          title="Email Notifications"
          description="Receive email updates about your tasks"
          action={
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={notifications}
                onChange={() => setNotifications(!notifications)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-slate-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500/50"></div>
            </label>
          }
        />
        <div className="my-4 border-t border-slate-800" />
        <SettingRow
          icon={Smartphone}
          title="Push Notifications"
          description="Receive push notifications on your device"
          action={
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" disabled />
              <div className="h-6 w-11 rounded-full bg-slate-700 opacity-50 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-slate-400 after:content-['']"></div>
            </label>
          }
        />
      </SettingsSection>

      {/* ── Security ────────────────────────────────────── */}
      <SettingsSection title="Security">
        <SettingRow
          icon={Shield}
          title="Password"
          description="Change your password"
          action={
            <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
              Update
            </button>
          }
        />
        <div className="my-4 border-t border-slate-800" />
        <SettingRow
          icon={LogOut}
          title="Log out"
          description="Sign out of your account"
          action={
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-400 hover:text-red-300"
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          }
        />
      </SettingsSection>
    </div>
  );
};

export default Settings;
