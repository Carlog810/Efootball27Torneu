import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { Card } from "@/components/ui/Card";
import { TournamentStatusBadge } from "@/components/ui/Badge";
import { TeamBadge } from "@/components/TeamBadge";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerTag: string }>;
}) {
  const [{ playerTag }, locale] = await Promise.all([params, getLocale()]);
  const t = getDictionary(locale);

  const user = await db.user.findUnique({
    where: { playerTag },
    include: {
      platformPref: true,
      participants: {
        include: {
          tournament: { include: { platform: true } },
          matchesAsA: { where: { status: "PLAYED" } },
          matchesAsB: { where: { status: "PLAYED" } },
          team: true,
        },
        orderBy: { joinedAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  let wins = 0;
  let played = 0;
  for (const p of user.participants) {
    for (const m of [...p.matchesAsA, ...p.matchesAsB]) {
      played += 1;
      if (m.winnerId === p.id) wins += 1;
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
          {user.playerTag.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-muted">
            @{user.playerTag}
            {user.platformPref && ` · ${user.platformPref.name}`}
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{user.participants.length}</p>
          <p className="text-xs text-muted">{t.playerProfile.tournaments}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{played}</p>
          <p className="text-xs text-muted">{t.playerProfile.matches}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{wins}</p>
          <p className="text-xs text-muted">{t.playerProfile.wins}</p>
        </Card>
      </div>

      <h2 className="mb-3 text-lg font-semibold">{t.playerProfile.history}</h2>
      <Card className="divide-y divide-border">
        {user.participants.length === 0 ? (
          <p className="p-4 text-sm text-muted">{t.playerProfile.empty}</p>
        ) : (
          user.participants.map((p) => (
            <Link
              key={p.id}
              href={`/torneos/${p.tournament.slug}`}
              className="flex items-center justify-between p-4 text-sm hover:bg-surface-hover"
            >
              <div className="flex items-center gap-2">
                <TeamBadge name={p.teamName} crestUrl={p.team?.crestUrl} />
                <div>
                  <p className="font-medium">{p.tournament.name}</p>
                  <p className="text-xs text-muted">
                    {p.tournament.platform?.name ?? t.badges.crossplay} ·{" "}
                    {p.teamName}
                  </p>
                </div>
              </div>
              <TournamentStatusBadge status={p.tournament.status} t={t} />
            </Link>
          ))
        )}
      </Card>
    </div>
  );
}