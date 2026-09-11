import type { Dictionary } from "@/lib/i18n/dictionary";

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

const tones = {
  neutral: "bg-surface-hover text-muted border border-border",
  success: "bg-primary/15 text-primary border border-primary/30",
  warning: "bg-accent/15 text-accent border border-accent/30",
  info: "bg-info/15 text-info border border-info/30",
  danger: "bg-danger/15 text-danger border border-danger/30",
} as const;

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const statusTone = {
  REGISTRATION: "success" as const,
  IN_PROGRESS: "info" as const,
  FINISHED: "neutral" as const,
};

export function TournamentStatusBadge({
  status,
  t,
}: {
  status: keyof typeof statusTone;
  t: Dictionary;
}) {
  return <Badge tone={statusTone[status]}>{t.badges.status[status]}</Badge>;
}

export function FeeBadge({
  feeType,
  t,
}: {
  feeType: "FREE" | "PAID";
  t: Dictionary;
}) {
  return feeType === "FREE" ? (
    <Badge tone="success">{t.badges.fee.FREE}</Badge>
  ) : (
    <Badge tone="warning">{t.badges.fee.PAID}</Badge>
  );
}