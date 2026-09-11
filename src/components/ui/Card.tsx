function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface",
        className
      )}
    >
      {children}
    </div>
  );
}