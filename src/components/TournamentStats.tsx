import { computeTournamentStats } from "@/lib/bracket";
import { TeamBadge } from "@/components/TeamBadge";
import { Card } from "@/components/ui/Card";
import type { BracketMatch } from "@/lib/bracket";
import type { Dictionary } from "@/lib/i18n/dictionary";

interface ParticipantInfo {
  id: string;
  teamName: string;
  team: { crestUrl: string | null } | null;
}

function AttackDefenseList({
  title,
  rows,
  participantById,
  goalsLabel,
}: {
  title: string;
  rows: { participantId: string; goals: number }[];
  participantById: Map<string, ParticipantInfo>;
  goalsLabel: string;
}) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold text-muted">{title}</h3>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => {
          const participant = participantById.get(row.participantId);
          if (!participant) return null;
          return (
            <li
              key={row.participantId}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <TeamBadge
                  name={participant.teamName}
                  crestUrl={participant.team?.crestUrl}
                />
                <span className="truncate">{participant.teamName}</span>
              </span>
              <span className="tabular-nums text-muted">
                {row.goals} {goalsLabel}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function TournamentStats({
  participants,
  matches,
  t,
}: {
  participants: ParticipantInfo[];
  matches: BracketMatch[];
  t: Dictionary;
}) {
  const s = t.tournamentStats;
  const stats = computeTournamentStats(
    participants.map((p) => p.id),
    matches
  );
  const participantById = new Map(participants.map((p) => [p.id, p]));

  if (stats.totalMatches === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
        {s.empty}
      </p>
    );
  }

  const tiles = [
    { label: s.matches, value: stats.totalMatches },
    { label: s.goals, value: stats.totalGoals },
    { label: s.goalsPerMatch, value: stats.goalsPerMatch.toFixed(1) },
    { label: s.draws, value: stats.draws },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{tile.value}</p>
            <p className="text-xs text-muted">{tile.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AttackDefenseList
          title={s.bestAttack}
          rows={stats.bestAttack}
          participantById={participantById}
          goalsLabel={s.goalsForAbbr}
        />
        <AttackDefenseList
          title={s.worstAttack}
          rows={stats.worstAttack}
          participantById={participantById}
          goalsLabel={s.goalsForAbbr}
        />
        <AttackDefenseList
          title={s.bestDefense}
          rows={stats.bestDefense}
          participantById={participantById}
          goalsLabel={s.goalsAgainstAbbr}
        />
        <AttackDefenseList
          title={s.worstDefense}
          rows={stats.worstDefense}
          participantById={participantById}
          goalsLabel={s.goalsAgainstAbbr}
        />
      </div>
    </div>
  );
}
