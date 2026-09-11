import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { LinkButton } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

export async function Navbar() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  const t = getDictionary(locale);

  const links = [
    { href: "/relampago", label: t.nav.relampago },
    { href: "/ligas", label: t.nav.ligas },
    { href: "/torneos", label: t.nav.torneos },
    { href: "/rankings", label: t.nav.rankings },
    { href: "/ayuda", label: t.nav.ayuda },
  ];

  const authControls = session?.user ? (
    <>
      <Link
        href={`/jugadores/${session.user.playerTag}`}
        className="text-sm text-muted hover:text-foreground"
      >
        {session.user.playerTag}
      </Link>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-surface-hover hover:text-foreground"
        >
          {t.nav.logout}
        </button>
      </form>
    </>
  ) : (
    <>
      <LinkButton href="/login" variant="ghost" size="sm">
        {t.nav.login}
      </LinkButton>
      <LinkButton href="/registro" variant="primary" size="sm">
        {t.nav.registro}
      </LinkButton>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-primary">EF</span>
          <span>Torneos</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-4 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form action="/buscar" className="hidden flex-1 max-w-xs md:block">
          <input
            type="search"
            name="q"
            placeholder={t.nav.searchPlaceholder}
            className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:border-primary"
          />
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <LanguageSwitcher current={locale} />

          <details className="group relative md:hidden [&_summary::-webkit-details-marker]:hidden">
            <summary
              aria-label={t.nav.menu}
              className="flex cursor-pointer list-none items-center justify-center rounded-lg p-2 hover:bg-surface-hover"
            >
              <span className="flex flex-col gap-1">
                <span className="block h-0.5 w-5 bg-foreground" />
                <span className="block h-0.5 w-5 bg-foreground" />
                <span className="block h-0.5 w-5 bg-foreground" />
              </span>
            </summary>
            <div className="fixed inset-x-0 top-[57px] z-30 border-b border-border bg-background px-4 py-4 shadow-lg">
              <form action="/buscar" className="mb-3">
                <input
                  type="search"
                  name="q"
                  placeholder={t.nav.searchPlaceholder}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary"
                />
              </form>
              <nav className="mb-3 flex flex-col gap-1 border-b border-border pb-3">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-2 py-2 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-2">{authControls}</div>
            </div>
          </details>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {authControls}
        </div>
      </div>
    </header>
  );
}
