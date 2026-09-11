import { db } from "@/lib/db";

export interface RankingRow {
  userId: string;
  playerTag: string;
  name: string;
  tournamentsPlayed: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

export async function getGlobalRankings(): Promise<RankingRow[]> {
  const participants = await db.participant.findMany({
    include: {
      user: { select: { id: true, playerTag: true, name: true } },
      matchesAsA: {
        where: { status: "PLAYED" },
        select: { scoreA: true, scoreB: true, winnerId: true },
      },
      matchesAsB: {
        where: { status: "PLAYED" },
        select: { scoreA: true, scoreB: true, winnerId: true },
      },
    },
  });

  const byUser = new Map<string, RankingRow>();

  for (const participant of participants) {
    const row = byUser.get(participant.userId) ?? {
      userId: participant.userId,
      playerTag: participant.user.playerTag,
      name: participant.user.name,
      tournamentsPlayed: 0,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      points: 0,
    };

    row.tournamentsPlayed += 1;

    for (const m of participant.matchesAsA) {
      row.matchesPlayed += 1;
      if (m.winnerId === null) {
        row.draws += 1;
        row.points += 1;
      } else if (m.winnerId === participant.id) {
        row.wins += 1;
        row.points += 3;
      } else {
        row.losses += 1;
      }
    }
    for (const m of participant.matchesAsB) {
      row.matchesPlayed += 1;
      if (m.winnerId === null) {
        row.draws += 1;
        row.points += 1;
      } else if (m.winnerId === participant.id) {
        row.wins += 1;
        row.points += 3;
      } else {
        row.losses += 1;
      }
    }

    byUser.set(participant.userId, row);
  }

  return Array.from(byUser.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.wins - a.wins;
  });
}