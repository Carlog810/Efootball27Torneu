"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/dictionary";
import { LOCALE_COOKIE } from "@/lib/i18n/locale";

export async function setLocaleAction(locale: Locale, formData: FormData) {
  if (!(locales as readonly string[]).includes(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const pathname = formData.get("pathname");
  redirect(typeof pathname === "string" && pathname ? pathname : "/");
}