"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function MobileMenu({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  return (
    <details
      ref={ref}
      className="group relative md:hidden [&_summary::-webkit-details-marker]:hidden"
    >
      <summary
        aria-label={label}
        className="flex cursor-pointer list-none items-center justify-center rounded-lg p-2 hover:bg-surface-hover"
      >
        <span className="flex flex-col gap-1">
          <span className="block h-0.5 w-5 bg-foreground" />
          <span className="block h-0.5 w-5 bg-foreground" />
          <span className="block h-0.5 w-5 bg-foreground" />
        </span>
      </summary>
      <div className="fixed inset-x-0 top-[57px] z-30 border-b border-border bg-background px-4 py-4 shadow-lg">
        {children}
      </div>
    </details>
  );
}
