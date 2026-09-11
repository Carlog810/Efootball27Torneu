import { MatchResultForm } from "@/components/MatchResultForm";
import { Card } from "@/components/ui/Card";
import type { Dictionary } from "@/lib/i18n/dictionary";

interface ParticipantRef {
  id: string;
  teamName: string;
  userId: string;
}

export interface MatchWithParticipants {
  id: string;
  round: number;
  position: number;
  leg: number;
  participantA: ParticipantRef | null;
  participantB: ParticipantRef | null;
  scoreA: number | null;
  scoreB: number | null;
  penaltyScoreA: number | null;
  penaltyScoreB: number | null;
  winnerId: string | null;
  status: "PENDING" | "PLAYED";
}

function ParticipantRow({
  participant,
  score,
  isWinner,
  byeLabel,
}: {
  participant: ParticipantRef | null;
  score: number | null;
  isWinner: boolean;
  byeLabel: string;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md px-2 py-1 text-sm ${
        isWinner ? "bg-primary/10 font-medium text-primary" : ""
      }`}
    >
      <span>{participant?.teamName ?? byeLabel}</span>
      <span className="tabular-nums">{score ?? "-"}</span>
    </div>
  );
}

function canReportMatch(
  m: MatchWithParticipants,
  organizerId: string,
  currentUserId: string | undefined
) {
  return (
    m.status === "PENDING" &&
    !!m.participantA &&
    !!m.participantB &&
    !!currentUserId &&
    (currentUserId === organizerId ||
      currentUserId === m.participantA.userId ||
      currentUserId === m.participantB.userId)
  );
}

function SingleLegCard({
  match,
  organizerId,
  currentUserId,
  t,
}: {
  match: MatchWithParticipants;
  organizerId: string;
  currentUserId?: string;
  t: Dictionary;
}) {
  return (
    <Card className="p-2">
      <ParticipantRow
        participant={match.participantA}
        score={match.scoreA}
        isWinner={match.winnerId === match.participantA?.id}
        byeLabel={t.bracket.bye}
      />
      <div className="my-1 border-t border-border" />
      <ParticipantRow
        participant={match.participantB}
        score={match.scoreB}
        isWinner={match.winnerId === match.participantB?.id}
        byeLabel={t.bracket.bye}
      />
      {canReportMatch(match, organizerId, currentUserId) && (
        <MatchResultForm
          matchId={match.id}
          loadLabel={t.bracket.load}
          loadingLabel={t.bracket.loading}
          scoreALabel={t.bracket.scoreA}
          scoreBLabel={t.bracket.scoreB}
        />
      )}
    </Card>
  );
}

function TwoLegCard({
  leg1,
  leg2,
  organizerId,
  currentUserId,
  t,
}: {
  leg1: MatchWithParticipants;
  leg2: MatchWithParticipants;
  organizerId: string;
  currentUserId?: string;
  t: Dictionary;
}) {
  const bothPlayed = leg1.status === "PLAYED" && leg2.status === "PLAYED";
  const aggregateA =
    bothPlayed && leg1.scoreA != null && leg2.scoreB != null
      ? leg1.scoreA + leg2.scoreB
      : null;
  const aggregateB =
    bothPlayed && leg1.scoreB != null && leg2.scoreA != null
      ? leg1.scoreB + leg2.scoreA
      : null;
  const decidedByAwayGoals =
    bothPlayed && aggregateA !== null && aggregateA === aggregateB;
  const hadPenalties = leg2.penaltyScoreA != null && leg2.penaltyScoreB != null;

  return (
    <Card className="p-2">
      <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted">
        {t.bracket.leg1}
      </p>
      <ParticipantRow
        participant={leg1.participantA}
        score={leg1.scoreA}
        isWinner={false}
        byeLabel={t.bracket.bye}
      />
      <div className="my-1 border-t border-border" />
      <ParticipantRow
        participant={leg1.participantB}
        score={leg1.scoreB}
        isWinner={false}
        byeLabel={t.bracket.bye}
      />
      {canReportMatch(leg1, organizerId, currentUserId) && (
        <MatchResultForm
          matchId={leg1.id}
          loadLabel={t.bracket.load}
          loadingLabel={t.bracket.loading}
          scoreALabel={t.bracket.scoreA}
          scoreBLabel={t.bracket.scoreB}
        />
      )}

      <p className="mt-3 mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted">
        {t.bracket.leg2}
      </p>
      <ParticipantRow
        participant={leg2.participantA}
        score={leg2.scoreA}
        isWinner={leg2.winnerId === leg2.participantA?.id}
        byeLabel={t.bracket.bye}
      />
      <div className="my-1 border-t border-border" />
      <ParticipantRow
        participant={leg2.participantB}
        score={leg2.scoreB}
        isWinner={leg2.winnerId === leg2.participantB?.id}
        byeLabel={t.bracket.bye}
      />
      {canReportMatch(leg2, organizerId, currentUserId) && (
        <MatchResultForm
          matchId={leg2.id}
          loadLabel={t.bracket.load}
          loadingLabel={t.bracket.loading}
          scoreALabel={t.bracket.scoreA}
          scoreBLabel={t.bracket.scoreB}
          allowPenalties
          penaltiesToggleLabel={t.bracket.penaltiesToggle}
          penaltyScoreALabel={t.bracket.penaltyScoreA}
          penaltyScoreBLabel={t.bracket.penaltyScoreB}
        />
      )}

      {bothPlayed && aggregateA !== null && aggregateB !== null && (
        <p className="mt-2 text-center text-xs text-muted">
          {t.bracket.aggregate}: {aggregateA} - {aggregateB}
          {decidedByAwayGoals && !hadPenalties && (
            <span className="block">{t.bracket.awayGoalsWinner}</span>
          )}
          {hadPenalties && (
            <span className="block">
              {t.bracket.penalties}: {leg2.penaltyScoreA} - {leg2.penaltyScoreB}
            </span>
          )}
        </p>
      )}
    </Card>
  );
}

export function BracketView({
  matches,
  organizerId,
  currentUserId,
  t,
}: {
  matches: MatchWithParticipants[];
  organizerId: string;
  currentUserId?: string;
  t: Dictionary;
}) {
  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort(
    (a, b) => a - b
  );

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 max-md:[-webkit-mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] max-md:[mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)]">
      {rounds.map((round) => {
        const roundMatches = matches
          .filter((m) => m.round === round)
          .sort((a, b) => a.position - b.position);
        const isFinal = round === rounds[rounds.length - 1];
        const positions = Array.from(
          new Set(roundMatches.map((m) => m.position))
        );

        return (
          <div key={round} className="flex min-w-[220px] flex-col gap-4">
            <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-muted">
              {isFinal ? t.bracket.final : `${t.bracket.round} ${round}`}
            </h3>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {positions.map((position) => {
                const positionMatches = roundMatches.filter(
                  (m) => m.position === position
                );
                const leg1 = positionMatches.find((m) => m.leg === 1)!;
                const leg2 = positionMatches.find((m) => m.leg === 2);

                if (!leg2) {
                  return (
                    <SingleLegCard
                      key={leg1.id}
                      match={leg1}
                      organizerId={organizerId}
                      currentUserId={currentUserId}
                      t={t}
                    />
                  );
                }

                return (
                  <TwoLegCard
                    key={leg1.id}
                    leg1={leg1}
                    leg2={leg2}
                    organizerId={organizerId}
                    currentUserId={currentUserId}
                    t={t}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
