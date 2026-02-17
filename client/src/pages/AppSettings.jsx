import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, clearCredentials } from "../features/auth/authSlice";
import { useLogoutMutation } from "../features/auth/authApi";
import { baseApi } from "../app/baseApi";
import { useNavigate } from "react-router-dom";
import { User, Bell, Palette, Shield, LogOut } from "lucide-react";
import SettingsLayout from "../components/settings/SettingsLayout";
import { Toaster } from "react-hot-toast";

const AppSettings = () => {
    const user = useSelector(selectCurrentUser);
    const [activeTab, setActiveTab] = useState("account");
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

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
                        <p className="text-sm text-slate-400">Update your personal information.</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Username</label>
                            <input
                                type="text"
                                defaultValue={user?.username}
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Email</label>
                            <input
                                type="email"
                                defaultValue={user?.email}
                                disabled
                                className="w-full cursor-not-allowed rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-400 outline-none"
                            />
                        </div>
                    </div>

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
                        <p className="text-sm text-slate-400">Choose how you want to be notified.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-slate-200">Email Notifications</h3>
                                <p className="text-xs text-slate-500">Receive updates via email.</p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input type="checkbox" defaultChecked className="peer sr-only" />
                                <div className="h-6 w-11 rounded-full bg-slate-700 peer-checked:bg-indigo-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium text-slate-200">Push Notifications</h3>
                                <p className="text-xs text-slate-500">Receive updates on your device.</p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input type="checkbox" defaultChecked className="peer sr-only" />
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
                        <p className="text-sm text-slate-400">Customize the look and feel.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-300">Theme</label>
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
                        <p className="text-sm text-slate-400">Manage your password and security settings.</p>
                    </div>

                    <div className="space-y-4">
                        <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                            Change Password
                        </button>
                        <button className="block text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                            Enable Two-Factor Authentication
                        </button>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
};

export default AppSettings;
