import Link from "next/link";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { TournamentCard } from "@/components/TournamentCard";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, locale] = await Promise.all([searchParams, getLocale()]);
  const t = getDictionary(locale);

  const [players, tournaments] = q
    ? await Promise.all([
        db.user.findMany({
          where: {
            OR: [
              { playerTag: { contains: q } },
              { name: { contains: q } },
            ],
          },
          take: 10,
        }),
        db.tournament.findMany({
          where: { name: { contains: q } },
          include: {
            platform: true,
            _count: { select: { participants: true } },
          },
          take: 12,
        }),
      ])
    : [[], []];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">{t.buscar.title}</h1>

      <form method="get" className="mb-8 flex gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t.buscar.placeholder}
          className="max-w-md"
        />
        <Button type="submit">{t.buscar.submit}</Button>
      </form>

      {!q ? (
        <p className="text-muted">{t.buscar.prompt}</p>
      ) : (
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="mb-3 text-lg font-semibold">
              {t.buscar.players} ({players.length})
            </h2>
            {players.length === 0 ? (
              <p className="text-sm text-muted">{t.buscar.noResults}</p>
            ) : (
              <Card className="divide-y divide-border">
                {players.map((p) => (
                  <Link
                    key={p.id}
                    href={`/jugadores/${p.playerTag}`}
                    className="flex items-center justify-between p-3 text-sm hover:bg-surface-hover"
                  >
                    <span>{p.name}</span>
                    <span className="text-muted">@{p.playerTag}</span>
                  </Link>
                ))}
              </Card>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">
              {t.buscar.tournaments} ({tournaments.length})
            </h2>
            {tournaments.length === 0 ? (
              <p className="text-sm text-muted">{t.buscar.noResults}</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tournaments.map((tour) => (
                  <TournamentCard key={tour.slug} tournament={tour} t={t} locale={locale} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}