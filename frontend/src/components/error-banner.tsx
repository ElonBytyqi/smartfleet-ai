export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="rounded-lg border border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 px-6 py-3">
      <p className="text-[13px] text-[var(--status-warning)]">{message}</p>
    </div>
  );
}