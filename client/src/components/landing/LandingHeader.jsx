import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const LandingHeader = ({ visible = true }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      } ${
        scrolled
          ? "bg-yellow-50/80 backdrop-blur-md border-b border-red-100 py-3 shadow-sm"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 max-w-7xl flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-red-600 text-lg font-bold text-white shadow-sm">
            T
          </div>
          <span className="text-xl font-bold tracking-tight text-red-900">
            TaskFlow
          </span>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-sm font-medium text-red-800 hover:text-red-600 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 hover:shadow"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
