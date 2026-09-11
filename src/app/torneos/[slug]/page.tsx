import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getOptionalUser } from "@/lib/auth-helpers";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import {
  TournamentStatusBadge,
  FeeBadge,
  Badge,
} from "@/components/ui/Badge";
import { JoinButton, LeaveButton, DrawButton } from "@/components/TournamentActions";
import { BracketView } from "@/components/BracketView";
import { StandingsTable } from "@/components/StandingsTable";
import { Card } from "@/components/ui/Card";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, user, locale] = await Promise.all([
    params,
    getOptionalUser(),
    getLocale(),
  ]);
  const t = getDictionary(locale);
  const d = t.tournamentDetail;

  const tournament = await db.tournament.findUnique({
    where: { slug },
    include: {
      platform: true,
      liga: true,
      organizer: true,
      participants: { include: { user: true } },
      matches: {
        include: {
          participantA: { select: { id: true, teamName: true, userId: true } },
          participantB: { select: { id: true, teamName: true, userId: true } },
        },
        orderBy: [{ round: "asc" }, { position: "asc" }],
      },
    },
  });

  if (!tournament) notFound();

  const myParticipant = tournament.participants.find(
    (p) => p.userId === user?.id
  );
  const isOrganizer = user?.id === tournament.organizerId;
  const canJoin =
    !!user &&
    tournament.status === "REGISTRATION" &&
    !myParticipant &&
    tournament.participants.length < tournament.maxParticipants;
  const canLeave =
    !!user && tournament.status === "REGISTRATION" && !!myParticipant;
  const canDraw =
    isOrganizer &&
    tournament.status === "REGISTRATION" &&
    tournament.participants.length >= 2;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {d.organizes} {tournament.organizer.name} ({tournament.organizer.playerTag})
            {tournament.liga && (
              <>
                {" · "}
                <Link
                  href={`/ligas/${tournament.liga.slug}`}
                  className="text-primary hover:underline"
                >
                  {tournament.liga.name}
                </Link>
              </>
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <TournamentStatusBadge status={tournament.status} t={t} />
            <FeeBadge feeType={tournament.feeType} t={t} />
            <Badge tone="neutral">{tournament.platform.name}</Badge>
            <Badge tone="neutral">{t.badges.format[tournament.format]}</Badge>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {canJoin && (
            <JoinButton
              tournamentId={tournament.id}
              label={d.join}
              pendingLabel={d.joining}
            />
          )}
          {canLeave && (
            <LeaveButton
              tournamentId={tournament.id}
              label={d.leave}
              pendingLabel={d.leaving}
            />
          )}
          {canDraw && (
            <DrawButton
              tournamentId={tournament.id}
              label={d.draw}
              pendingLabel={d.drawing}
            />
          )}
          {!user && tournament.status === "REGISTRATION" && (
            <Link href="/login" className="text-sm text-primary hover:underline">
              {d.loginToJoin}
            </Link>
          )}
        </div>
      </div>

      {tournament.description && (
        <Card className="mb-8 p-4 text-sm text-muted">
          {tournament.description}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">
            {tournament.status === "REGISTRATION"
              ? d.registrationTitle
              : tournament.format === "SINGLE_ELIM"
              ? d.bracketTitle
              : d.leagueTitle}
          </h2>

          {tournament.status === "REGISTRATION" ? (
            <Card className="p-6 text-center text-muted">{d.pendingDraw}</Card>
          ) : tournament.format === "SINGLE_ELIM" ? (
            <BracketView
              matches={tournament.matches}
              organizerId={tournament.organizerId}
              currentUserId={user?.id}
              t={t}
            />
          ) : (
            <StandingsTable
              participants={tournament.participants}
              matches={tournament.matches}
              organizerId={tournament.organizerId}
              currentUserId={user?.id}
              t={t}
            />
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">
            {d.participants} ({tournament.participants.length}/
            {tournament.maxParticipants})
          </h2>
          <Card className="divide-y divide-border">
            {tournament.participants.length === 0 ? (
              <p className="p-4 text-sm text-muted">{d.noParticipants}</p>
            ) : (
              tournament.participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 text-sm"
                >
                  <span>{p.teamName}</span>
                  <Link
                    href={`/jugadores/${p.user.playerTag}`}
                    className="text-muted hover:text-foreground"
                  >
                    {p.user.playerTag}
                  </Link>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}