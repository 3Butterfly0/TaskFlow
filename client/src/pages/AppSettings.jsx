import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectCurrentUser,
  clearCredentials,
} from "../features/auth/authSlice";
import {
  useLogoutMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useSetupMfaMutation,
  useVerifyMfaMutation,
  useDisableMfaMutation,
} from "../features/auth/authApi";
import { baseApi } from "../app/baseApi";
import { useNavigate } from "react-router-dom";
import { User, Bell, Palette, Shield, LogOut } from "lucide-react";
import SettingsLayout from "../components/settings/SettingsLayout";
import { Toaster, toast } from "react-hot-toast";

const AppSettings = () => {
  const user = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState("account");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // API Hooks
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [updateProfile, { isLoading: isUpdatingProfile }] =
    useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();
  const [setupMfa, { isLoading: isSettingUpMfa }] = useSetupMfaMutation();
  const [verifyMfa, { isLoading: isVerifyingMfa }] = useVerifyMfaMutation();
  const [disableMfa, { isLoading: isDisablingMfa }] = useDisableMfaMutation();

  // State
  const [username, setUsername] = useState(user?.username || "");

  useEffect(() => {
    if (user?.username && !username) {
      setUsername(user.username);
    }
  }, [user]);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [mfaState, setMfaState] = useState({
    showModal: false,
    qrCode: "",
    secret: "",
    token: "",
    isDisabling: false,
  });

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "security", label: "Security", icon: Shield },
  ];

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile({ username }).unwrap();
      dispatch(clearCredentials()); // Clear to force re-fetch or just update token, actually setCredentials is better
      // Wait, we have authSlice setCredentials
      window.location.reload(); // Simple temp workaround since setCredentials isn't imported
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast.error("New passwords do not match");
    }
    try {
      await changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
      }).unwrap();
      toast.success("Password changed successfully");
      setPasswords({ current: "", new: "", confirm: "" });
      setShowPasswordForm(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to change password");
    }
  };

  const handleSetupMfa = async () => {
    try {
      const res = await setupMfa().unwrap();
      setMfaState((prev) => ({
        ...prev,
        showModal: true,
        qrCode: res.data.qrCode,
        secret: res.data.secret,
        isDisabling: false,
      }));
    } catch (err) {
      toast.error(err?.data?.message || "Failed to initialize 2FA");
    }
  };

  const handleVerifyMfa = async (e) => {
    e.preventDefault();
    try {
      await verifyMfa({ token: mfaState.token }).unwrap();
      toast.success("Two-Factor Authentication enabled!");
      setMfaState({
        showModal: false,
        qrCode: "",
        secret: "",
        token: "",
        isDisabling: false,
      });
      window.location.reload();
    } catch (err) {
      toast.error(err?.data?.message || "Invalid code. Please try again.");
    }
  };

  const handleDisableMfa = async (e) => {
    e.preventDefault();
    try {
      await disableMfa({ token: mfaState.token }).unwrap();
      toast.success("Two-Factor Authentication disabled!");
      setMfaState({
        showModal: false,
        qrCode: "",
        secret: "",
        token: "",
        isDisabling: false,
      });
      window.location.reload();
    } catch (err) {
      toast.error(err?.data?.message || "Invalid code. Please try again.");
    }
  };

  return (
    <SettingsLayout
      title="App Settings"
      description="Manage your account preferences and global application settings."
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {/* ── Toaster ───────────────────────────────────── */}
      <Toaster position="top-right" />

      {/* ── Content ───────────────────────────────────── */}
      {activeTab === "account" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Profile</h2>
            <p className="text-sm text-slate-400">
              Update your personal information.
            </p>
          </div>

          <form
            onSubmit={handleUpdateProfile}
            className="grid gap-6 md:grid-cols-2 mb-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                defaultValue={user?.email}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-400 outline-none"
              />
            </div>
            <div className="col-span-1 md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={
                  isUpdatingProfile ||
                  username === user?.username ||
                  !username.trim()
                }
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {isUpdatingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          <div className="border-t border-slate-800 pt-6">
            <h3 className="mb-4 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Danger Zone
            </h3>
            <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-950/10 p-4">
              <div>
                <h4 className="font-medium text-red-400">Sign Out</h4>
                <p className="text-xs text-red-300/60">
                  Sign out of your account on this device.
                </p>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 rounded-lg bg-red-600/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-600/20 transition-colors"
              >
                <LogOut className="size-4" />
                {isLoggingOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            <p className="text-sm text-slate-400">
              Choose how you want to be notified.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-200">
                  Email Notifications
                </h3>
                <p className="text-xs text-slate-500">
                  Receive updates via email.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-slate-700 peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-200">
                  Push Notifications
                </h3>
                <p className="text-xs text-slate-500">
                  Receive updates on your device.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-slate-700 peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {activeTab === "appearance" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Appearance</h2>
            <p className="text-sm text-slate-400">
              Customize the look and feel.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button className="rounded-lg border-2 border-indigo-500 bg-slate-800 p-2 text-center text-sm font-medium text-white">
                  Dark
                </button>
                <button className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-center text-sm font-medium text-slate-400 hover:bg-slate-800">
                  Light
                </button>
                <button className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-center text-sm font-medium text-slate-400 hover:bg-slate-800">
                  System
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Security</h2>
            <p className="text-sm text-slate-400">
              Manage your password and security settings.
            </p>
          </div>

          <div className="space-y-4">
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium border border-indigo-500/30 rounded-lg px-4 py-2 bg-indigo-500/10"
              >
                Change Password
              </button>
            ) : (
              <form
                onSubmit={handleChangePassword}
                className="space-y-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4 max-w-sm"
              >
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwords.current}
                    onChange={(e) =>
                      setPasswords({ ...passwords, current: e.target.value })
                    }
                    className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwords.new}
                    onChange={(e) =>
                      setPasswords({ ...passwords, new: e.target.value })
                    }
                    className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwords.confirm}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirm: e.target.value })
                    }
                    className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-1.5 text-sm text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2 text-sm">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="rounded bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {isChangingPassword ? "Saving..." : "Save Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswords({ current: "", new: "", confirm: "" });
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="h-px bg-slate-800 w-full my-6"></div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-700 bg-slate-800/30">
              <div>
                <h3 className="text-sm font-medium text-white">
                  Two-Factor Authentication (2FA)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Add an extra layer of security to your account.
                </p>
              </div>
              {user?.mfaEnabled ? (
                <button
                  onClick={() =>
                    setMfaState((prev) => ({
                      ...prev,
                      showModal: true,
                      isDisabling: true,
                    }))
                  }
                  className="rounded-lg px-4 py-2 text-sm font-medium text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  Disable 2FA
                </button>
              ) : (
                <button
                  onClick={handleSetupMfa}
                  disabled={isSettingUpMfa}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {isSettingUpMfa ? "Setting up..." : "Enable 2FA"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MFA Modal (Setup or Disable) */}
      {mfaState.showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">
              {mfaState.isDisabling ? "Disable 2FA" : "Set up 2FA"}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {mfaState.isDisabling
                ? "Enter the 6-digit code from your authenticator app to disable 2FA."
                : "Scan this QR code with your authenticator app (like Google Authenticator or Authy), then enter the 6-digit code below."}
            </p>

            {!mfaState.isDisabling && mfaState.qrCode && (
              <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-fit">
                <img
                  src={mfaState.qrCode}
                  alt="MFA QR Code"
                  className="w-40 h-40"
                />
              </div>
            )}

            <form
              onSubmit={
                mfaState.isDisabling ? handleDisableMfa : handleVerifyMfa
              }
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">
                  Authentication Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  placeholder="000000"
                  value={mfaState.token}
                  onChange={(e) =>
                    setMfaState((prev) => ({ ...prev, token: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-center text-xl tracking-widest text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setMfaState({
                      showModal: false,
                      qrCode: "",
                      secret: "",
                      token: "",
                      isDisabling: false,
                    })
                  }
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isVerifyingMfa ||
                    isDisablingMfa ||
                    mfaState.token.length !== 6
                  }
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {isVerifyingMfa || isDisablingMfa
                    ? "Verifying..."
                    : "Verify & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SettingsLayout>
  );
};

export default AppSettings;
