import { cn } from "../../utils/cn";

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded bg-slate-800", className)}
      {...props}
    />
  );
};

export { Skeleton };
