import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { TournamentCard } from "@/components/TournamentCard";

export default async function RelampagoPage() {
  const soon = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const locale = await getLocale();
  const t = getDictionary(locale);

  const tournaments = await db.tournament.findMany({
    where: { status: "REGISTRATION", registrationClosesAt: { lte: soon } },
    include: { platform: true, _count: { select: { participants: true } } },
    orderBy: { registrationClosesAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <span className="text-3xl">⚡</span>
        <div>
          <h1 className="text-2xl font-bold">{t.relampago.title}</h1>
          <p className="text-sm text-muted">{t.relampago.subtitle}</p>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-10 text-center text-muted">
          <p className="text-lg">{t.relampago.emptyTitle}</p>
          <p className="mt-2 text-sm">
            {t.relampago.emptyBody}{" "}
            <a href="/torneos" className="text-primary hover:underline">
              {t.relampago.emptyLink}
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tour) => (
            <TournamentCard key={tour.slug} tournament={tour} t={t} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}