import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary:
    "bg-surface-hover text-foreground border border-border hover:bg-border",
  ghost: "text-foreground hover:bg-surface-hover",
  danger: "bg-danger text-white hover:brightness-110",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

interface LinkButtonProps {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
    >
      {children}
    </Link>
  );
}
