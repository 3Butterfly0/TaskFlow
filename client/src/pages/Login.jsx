import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  useLoginMutation,
  useValidateMfaMutation,
} from "../features/auth/authApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "../features/auth/authSlice";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [validateMfa, { isLoading: isValidatingMfa }] =
    useValidateMfaMutation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  // MFA Step State
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaData, setMfaData] = useState({ tempToken: "", code: "" });

  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const res = await login(form).unwrap();

      if (res.data?.requiresMfa) {
        setMfaStep(true);
        setMfaData((prev) => ({ ...prev, tempToken: res.data.tempToken }));
        return;
      }

      // Store user in Redux (cookie is set by backend automatically)
      dispatch(setCredentials(res.data));
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err?.data?.error?.message || err?.data?.message || "Login failed",
      );
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mfaData.code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    try {
      const res = await validateMfa({
        tempToken: mfaData.tempToken,
        token: mfaData.code,
      }).unwrap();
      dispatch(setCredentials(res.data));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.data?.message || "Invalid authentication code");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
            T
          </div>
          <h1 className="text-2xl font-bold text-white">
            {mfaStep ? "Two-Factor Authentication" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {mfaStep
              ? "Enter the code from your authenticator app"
              : "Sign in to your TaskFlow account"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8">
          {mfaStep ? (
            <form onSubmit={handleMfaSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
                  {error}
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300 text-center">
                  Authentication Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  placeholder="000000"
                  value={mfaData.code}
                  onChange={(e) => {
                    setMfaData((prev) => ({ ...prev, code: e.target.value }));
                    setError("");
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-center text-2xl tracking-[0.5em] text-white outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={isValidatingMfa || mfaData.code.length !== 6}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isValidatingMfa ? "Verifying…" : "Verify code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMfaStep(false);
                  setMfaData({ tempToken: "", code: "" });
                  setError("");
                }}
                className="w-full text-sm text-slate-400 hover:text-white transition-colors pt-2"
              >
                Back to login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
