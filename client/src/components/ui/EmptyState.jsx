const EmptyState = ({ icon: Icon, title, description, action, className }) => {
  return (
    <div
      className={[
        "flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center",
        className,
      ].filter(Boolean).join(" ")}
    >
      {Icon && (
        <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-800/50 text-slate-500 shadow-inner">
          <Icon className="size-7" strokeWidth={1.5} />
        </div>
      )}
      <div className="max-w-sm space-y-1">
        <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
