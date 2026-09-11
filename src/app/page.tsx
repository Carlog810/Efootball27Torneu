import Link from "next/link";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { LinkButton } from "@/components/ui/Button";
import { TournamentCard } from "@/components/TournamentCard";
import { LigaCard } from "@/components/LigaCard";

export default async function Home() {
  const soon = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const locale = await getLocale();
  const t = getDictionary(locale);

  const [tournamentsCount, playersCount, matchesPlayedCount, ligasCount, relampago, ligasDestacadas] =
    await Promise.all([
      db.tournament.count(),
      db.user.count(),
      db.match.count({ where: { status: "PLAYED" } }),
      db.liga.count(),
      db.tournament.findMany({
        where: { status: "REGISTRATION", registrationClosesAt: { lte: soon } },
        include: { platform: true, _count: { select: { participants: true } } },
        orderBy: { registrationClosesAt: "asc" },
        take: 3,
      }),
      db.liga.findMany({
        include: { platform: true, _count: { select: { tournaments: true } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

  const stats = [
    { label: t.home.stats.tournaments, value: tournamentsCount },
    { label: t.home.stats.players, value: playersCount },
    { label: t.home.stats.matchesPlayed, value: matchesPlayedCount },
    { label: t.home.stats.ligas, value: ligasCount },
  ];

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-surface to-background">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20">
          <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
            {t.home.heroTitlePrefix}{" "}
            <span className="text-primary">{t.home.heroTitleHighlight}</span>{" "}
            {t.home.heroTitleSuffix}
          </h1>
          <p className="max-w-xl text-muted">{t.home.heroSubtitle}</p>
          <div className="flex gap-3">
            <LinkButton href="/registro" size="lg">
              {t.home.ctaRegister}
            </LinkButton>
            <LinkButton href="/torneos" variant="secondary" size="lg">
              {t.home.ctaTournaments}
            </LinkButton>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-sm text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <span>⚡</span> {t.home.relampagoTitle}
          </h2>
          <Link href="/relampago" className="text-sm text-primary hover:underline">
            {t.home.seeAll}
          </Link>
        </div>
        {relampago.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
            {t.home.relampagoEmpty}{" "}
            <Link href="/torneos" className="text-primary hover:underline">
              {t.home.relampagoEmptyLink}
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relampago.map((tour) => (
              <TournamentCard key={tour.slug} tournament={tour} t={t} locale={locale} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t.home.ligasDestacadasTitle}</h2>
          <Link href="/ligas" className="text-sm text-primary hover:underline">
            {t.home.seeAll}
          </Link>
        </div>
        {ligasDestacadas.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
            {t.home.ligasEmpty}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ligasDestacadas.map((l) => (
              <LigaCard
                key={l.slug}
                liga={l}
                tournamentsLabel={t.nav.torneos.toLowerCase()}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}