export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-foreground/[0.06] ${className}`} />
  );
}