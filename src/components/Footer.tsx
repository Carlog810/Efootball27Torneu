import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export async function Footer() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted md:flex-row md:justify-between">
        <div>
          <p className="font-semibold text-foreground">EF Torneos</p>
          <p className="mt-1 max-w-sm">{t.footer.tagline}</p>
        </div>
        <div className="flex gap-8">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">
              {t.footer.plataforma}
            </span>
            <Link href="/torneos" className="hover:text-foreground">
              {t.nav.torneos}
            </Link>
            <Link href="/ligas" className="hover:text-foreground">
              {t.nav.ligas}
            </Link>
            <Link href="/rankings" className="hover:text-foreground">
              {t.nav.rankings}
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">
              {t.footer.soporte}
            </span>
            <Link href="/ayuda" className="hover:text-foreground">
              {t.nav.ayuda}
            </Link>
            <Link href="/terminos" className="hover:text-foreground">
              {t.footer.terminos}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}