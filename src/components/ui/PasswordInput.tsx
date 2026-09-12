"use client";

import { useState } from "react";

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

const controlClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 pr-12 text-sm text-foreground focus:border-primary placeholder:text-muted";

export function PasswordInput({
  showLabel,
  hideLabel,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  showLabel: string;
  hideLabel: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(controlClass, className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : showLabel}
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted hover:text-foreground"
      >
        {visible ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
