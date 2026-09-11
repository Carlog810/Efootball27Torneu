function cn(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

const controlClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted";

export function Label({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium">
      {children}
    </label>
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input {...props} className={cn(controlClass, props.className)} />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea {...props} className={cn(controlClass, props.className)} />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  return (
    <select {...props} className={cn(controlClass, props.className)} />
  );
}

export function FieldErrors({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="mt-1 text-xs text-danger">{errors.join(", ")}</p>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {message}
    </div>
  );
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
      {message}
    </div>
  );
}