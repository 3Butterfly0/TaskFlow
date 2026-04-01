import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SettingsLayout = ({
  title,
  description,
  tabs,
  activeTab,
  onTabChange,
  children,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col space-y-4 px-6 py-4">
      <div className="flex shrink-0 items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5 text-sm font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700/50"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-8 lg:flex-row">
        <aside className="w-full lg:w-64 shrink-0 space-y-1 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={[
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-600/10 text-indigo-400"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
                ].join(" ")}
              >
                {Icon && <Icon className="size-4" />}
                {tab.label}
              </button>
            );
          })}
        </aside>

        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
