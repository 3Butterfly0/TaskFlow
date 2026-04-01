
const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={["animate-pulse rounded bg-slate-800", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
};

export { Skeleton };
