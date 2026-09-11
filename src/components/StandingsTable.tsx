import { computeStandings } from "@/lib/bracket";
import { MatchResultForm } from "@/components/MatchResultForm";
import { Card } from "@/components/ui/Card";
import type { MatchWithParticipants } from "@/components/BracketView";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function StandingsTable({
  participants,
  matches,
  organizerId,
  currentUserId,
  t,
}: {
  participants: { id: string; teamName: string }[];
  matches: MatchWithParticipants[];
  organizerId: string;
  currentUserId?: string;
  t: Dictionary;
}) {
  const nameById = new Map(participants.map((p) => [p.id, p.teamName]));
  const s = t.standings;

  const standings = computeStandings(
    participants.map((p) => p.id),
    matches.map((m) => ({
      round: m.round,
      position: m.position,
      participantAId: m.participantA?.id ?? null,
      participantBId: m.participantB?.id ?? null,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      status: m.status,
    }))
  );

  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort(
    (a, b) => a - b
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="py-2 pr-2">{s.pos}</th>
              <th className="py-2 pr-2">{s.team}</th>
              <th className="py-2 pr-2 text-center">{s.played}</th>
              <th className="py-2 pr-2 text-center">{s.won}</th>
              <th className="py-2 pr-2 text-center">{s.drawn}</th>
              <th className="py-2 pr-2 text-center">{s.lost}</th>
              <th className="py-2 pr-2 text-center">{s.goalDiff}</th>
              <th className="py-2 text-center">{s.points}</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr key={row.participantId} className="border-b border-border/50">
                <td className="py-2 pr-2 text-muted">{i + 1}</td>
                <td className="py-2 pr-2 font-medium">
                  {nameById.get(row.participantId)}
                </td>
                <td className="py-2 pr-2 text-center">{row.played}</td>
                <td className="py-2 pr-2 text-center">{row.won}</td>
                <td className="py-2 pr-2 text-center">{row.drawn}</td>
                <td className="py-2 pr-2 text-center">{row.lost}</td>
                <td className="py-2 pr-2 text-center">
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </td>
                <td className="py-2 text-center font-semibold text-primary">
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-6">
        {rounds.map((round) => (
          <div key={round}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {s.matchday} {round}
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {matches
                .filter((m) => m.round === round)
                .map((m) => {
                  const canReport =
                    m.status === "PENDING" &&
                    !!m.participantA &&
                    !!m.participantB &&
                    !!currentUserId &&
                    (currentUserId === organizerId ||
                      currentUserId === m.participantA.userId ||
                      currentUserId === m.participantB.userId);
                  return (
                    <Card key={m.id} className="p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>{m.participantA?.teamName}</span>
                        <span className="tabular-nums text-muted">
                          {m.status === "PLAYED"
                            ? `${m.scoreA} - ${m.scoreB}`
                            : "vs"}
                        </span>
                        <span>{m.participantB?.teamName}</span>
                      </div>
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
        ))}
      </div>
    </div>
  );
}