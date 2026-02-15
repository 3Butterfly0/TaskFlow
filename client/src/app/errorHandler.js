import { isRejectedWithValue } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";

/**
 * RTK Query middleware that listens for API errors.
 *
 * It intercepts all rejected actions and displays a toast message,
 * unless status is 401/403 (handled via redirect usually).
 */
export const rtkQueryErrorLogger = (api) => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const status = action.payload?.status;

    // Filter out authentication errors which often redirect
    if (status !== 401 && status !== 403) {
      const message =
        action.payload?.data?.message || "An unexpected error occurred.";

      toast.error(message, {
        style: {
          background: "#0f172a", // slate-950
          color: "#e2e8f0", // slate-200
          border: "1px solid #1e293b", // slate-800
        },
        iconTheme: {
          primary: "#ef4444", // red-500
          secondary: "#0f172a",
        },
      });
    }
  }

  return next(action);
};
