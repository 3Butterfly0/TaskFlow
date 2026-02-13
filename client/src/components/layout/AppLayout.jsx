import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

/**
 * Application shell for all protected pages.
 *
 * Structure:
 *   ┌──────────┬──────────────────────────┐
 *   │          │  Header                  │
 *   │ Sidebar  ├──────────────────────────┤
 *   │          │  <Outlet /> (page)       │
 *   │          │                          │
 *   └──────────┴──────────────────────────┘
 *
 * The <Outlet /> renders the matched child route.
 */
const AppLayout = () => {
  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
