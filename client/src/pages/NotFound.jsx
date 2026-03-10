import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-950 p-6 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-slate-900 shadow-inner">
        <AlertCircle className="size-10 text-indigo-500" />
      </div>
      <h1 className="mb-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
        404
      </h1>
      <h2 className="mb-6 text-xl font-medium text-slate-300">
        Page Not Found
      </h2>
      <p className="mb-10 max-w-md text-base text-slate-400">
        The page you are looking for doesn't exist or has been moved. Let's get
        you back on trace.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        Go back home
      </Link>
    </div>
  );
};

export default NotFound;
