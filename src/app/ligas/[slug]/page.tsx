import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { TournamentCard } from "@/components/TournamentCard";
import { Badge } from "@/components/ui/Badge";

export default async function LigaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const t = getDictionary(locale);

  const liga = await db.liga.findUnique({
    where: { slug },
    include: {
      platform: true,
      tournaments: {
        include: { platform: true, _count: { select: { participants: true } } },
        orderBy: { startsAt: "desc" },
      },
    },
  });

  if (!liga) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{liga.name}</h1>
        {liga.platform && (
          <Badge tone="neutral" className="mt-2">
            {liga.platform.name}
          </Badge>
        )}
        {liga.description && (
          <p className="mt-3 max-w-2xl text-sm text-muted">
            {liga.description}
          </p>
        )}
      </div>

      <h2 className="mb-4 text-lg font-semibold">
        {t.ligaDetail.tournamentsCount} ({liga.tournaments.length})
      </h2>

      {liga.tournaments.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          {t.ligaDetail.empty}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liga.tournaments.map((tour) => (
            <TournamentCard key={tour.slug} tournament={tour} t={t} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}