import { AlertCircle, AlertOctagon, ShieldAlert, FileQuestion } from "lucide-react";
import { Link } from "react-router-dom";

const ErrorState = ({
  statusCode,
  title,
  message,
  onRetry,
  variant = "inline", // "inline" | "fullPage"
}) => {
  let defaultTitle = "Error";
  let defaultMessage = "Something didn't work as expected.";
  let Icon = AlertCircle;

  if (statusCode === 403) {
    defaultTitle = "Access Denied";
    defaultMessage = "You don't have permission to view this resource.";
    Icon = ShieldAlert;
  } else if (statusCode === 404) {
    defaultTitle = "Page Not Found";
    defaultMessage = "The page you are looking for doesn't exist or has been moved. Let's get you back on track.";
    Icon = FileQuestion;
  } else if (statusCode === 500) {
    defaultTitle = "Something Went Wrong";
    defaultMessage = "An unexpected error occurred. Please try again.";
    Icon = AlertOctagon;
  }

  const displayTitle = title || defaultTitle;
  const displayMessage = message || defaultMessage;

  if (variant === "fullPage") {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-slate-900 shadow-inner">
          <Icon className="size-10 text-indigo-500" />
        </div>
        
        {statusCode && (
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {statusCode}
          </h1>
        )}
        
        <h2 className="mb-6 text-xl font-medium text-slate-300">
          {displayTitle}
        </h2>
        
        <p className="mb-10 max-w-md text-base text-slate-400">
          {displayMessage}
        </p>

        {onRetry ? (
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Try Again
          </button>
        ) : (
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Go back home
          </Link>
        )}
      </div>
    );
  }

  // Inline variant
  return (
    <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400 border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-start sm:items-center gap-3">
        <Icon className="size-5 shrink-0 text-red-500" />
        <div>
          {title && <h3 className="font-semibold text-red-300">{displayTitle}</h3>}
          <p className="text-red-400 flex-1">{displayMessage}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
