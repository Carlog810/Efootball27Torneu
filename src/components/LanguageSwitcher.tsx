"use client";

import { usePathname } from "next/navigation";
import { setLocaleAction } from "@/lib/actions/locale";
import type { Locale } from "@/lib/i18n/dictionary";

const options: { locale: Locale; flag: string; label: string }[] = [
  { locale: "pt", flag: "🇧🇷", label: "PT" },
  { locale: "es", flag: "🇪🇸", label: "ES" },
];

export function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1">
      {options.map((opt) => (
        <form key={opt.locale} action={setLocaleAction.bind(null, opt.locale)}>
          <input type="hidden" name="pathname" value={pathname} />
          <button
            type="submit"
            title={opt.label}
            aria-current={current === opt.locale}
            className={`rounded-md px-1.5 py-1 text-sm transition-opacity ${
              current === opt.locale
                ? "opacity-100"
                : "opacity-40 hover:opacity-80"
            }`}
          >
            {opt.flag}
          </button>
        </form>
      ))}
    </div>
  );
}