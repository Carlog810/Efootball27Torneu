import Link from "next/link";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { TournamentFilters } from "@/components/TournamentFilters";
import { TournamentCard } from "@/components/TournamentCard";
import { LinkButton } from "@/components/ui/Button";

export default async function TorneosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    platformId?: string;
    status?: string;
    feeType?: string;
  }>;
}) {
  const [params, platforms, locale] = await Promise.all([
    searchParams,
    db.platform.findMany({ orderBy: { name: "asc" } }),
    getLocale(),
  ]);
  const t = getDictionary(locale);

  const where: Prisma.TournamentWhereInput = {
    ...(params.q ? { name: { contains: params.q } } : {}),
    ...(params.platformId ? { platformId: params.platformId } : {}),
    ...(params.status
      ? { status: params.status as Prisma.EnumTournamentStatusFilter["equals"] }
      : {}),
    ...(params.feeType
      ? { feeType: params.feeType as Prisma.EnumFeeTypeFilter["equals"] }
      : {}),
  };

  const tournaments = await db.tournament.findMany({
    where,
    include: { platform: true, _count: { select: { participants: true } } },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t.tournamentsPage.title}</h1>
        <LinkButton href="/torneos/nuevo">{t.tournamentsPage.create}</LinkButton>
      </div>

      <div className="mb-6">
        <TournamentFilters platforms={platforms} defaults={params} t={t} />
      </div>

      <h2 className="sr-only">{t.tournamentsPage.title}</h2>
      {tournaments.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          {t.tournamentsPage.empty}{" "}
          <Link href="/torneos" className="text-primary underline">
            {t.tournamentsPage.clearFilters}
          </Link>
        </p>
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