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
  participantA: ParticipantRef | null;
  participantB: ParticipantRef | null;
  scoreA: number | null;
  scoreB: number | null;
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
    <div className="flex gap-6 overflow-x-auto pb-4">
      {rounds.map((round) => {
        const roundMatches = matches
          .filter((m) => m.round === round)
          .sort((a, b) => a.position - b.position);
        const isFinal = round === rounds[rounds.length - 1];

        return (
          <div key={round} className="flex min-w-[220px] flex-col gap-4">
            <h3 className="text-center text-xs font-semibold uppercase tracking-wide text-muted">
              {isFinal ? t.bracket.final : `${t.bracket.round} ${round}`}
            </h3>
            <div className="flex flex-1 flex-col justify-around gap-4">
              {roundMatches.map((m) => {
                const canReport =
                  m.status === "PENDING" &&
                  !!m.participantA &&
                  !!m.participantB &&
                  !!currentUserId &&
                  (currentUserId === organizerId ||
                    currentUserId === m.participantA.userId ||
                    currentUserId === m.participantB.userId);

                return (
                  <Card key={m.id} className="p-2">
                    <ParticipantRow
                      participant={m.participantA}
                      score={m.scoreA}
                      isWinner={m.winnerId === m.participantA?.id}
                      byeLabel={t.bracket.bye}
                    />
                    <div className="my-1 border-t border-border" />
                    <ParticipantRow
                      participant={m.participantB}
                      score={m.scoreB}
                      isWinner={m.winnerId === m.participantB?.id}
                      byeLabel={t.bracket.bye}
                    />
                    {canReport && (
                      <MatchResultForm
                        matchId={m.id}
                        loadLabel={t.bracket.load}
                        loadingLabel={t.bracket.loading}
                      />
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}