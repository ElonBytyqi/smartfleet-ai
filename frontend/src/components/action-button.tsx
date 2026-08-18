export function ActionButton({
  label,
  tone = "primary",
  disabled,
  onClick,
  width = 74,
}: {
  label: string;
  tone?: "primary" | "danger" | "neutral";
  disabled?: boolean;
  onClick: () => void;
  width?: number;
}) {
  const tones = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent",
    danger:
      "bg-transparent text-[var(--status-warning)] border-[var(--status-warning)]/40 hover:bg-[var(--status-warning)]/10",
    neutral: "bg-transparent text-foreground border-border hover:bg-muted",
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{ width }}
      className={`h-7 cursor-pointer rounded-md border px-0 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}
    >
      {label}
    </button>
  );
}