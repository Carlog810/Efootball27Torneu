import { cookies } from "next/headers";
import { DEFAULT_LOCALE, locales, type Locale } from "@/lib/i18n/dictionary";

export const LOCALE_COOKIE = "locale";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return (locales as readonly string[]).includes(value ?? "")
    ? (value as Locale)
    : DEFAULT_LOCALE;
}