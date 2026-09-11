// Pure functions for tournament logic: single-elimination brackets, round-robin
// scheduling and league standings. No DB/framework dependencies so they are
// trivial to unit test.

export interface BracketMatch {
  round: number;
  position: number;
  leg?: number;
  participantAId: string | null;
  participantBId: string | null;
  scoreA?: number | null;
  scoreB?: number | null;
  winnerId?: string | null;
  status: "PENDING" | "PLAYED";
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

interface InternalMatch extends BracketMatch {
  // A match is "dead" when neither side can ever be filled by a real
  // participant (both its own slots, and everything feeding into it, are
  // empty). Only dead matches or byes may auto-resolve a later round —
  // a slot that is merely "not decided yet" (a real, still-pending match)
  // must never be treated as a walkover.
  dead: boolean;
  // A position is "two-sided" when it is structurally guaranteed to end up
  // with two real participants (as opposed to a bye/walkover, where only
  // one side will ever be filled). This is *not* the same as `!dead`: a
  // walkover position also has `dead === false` (one side is alive) but
  // is not two-sided. Only two-sided positions get a second leg.
  twoSided: boolean;
}

/**
 * Builds every round of a single-elimination bracket for the given
 * (already-shuffled) participant ids. A round-1 bye (one empty slot)
 * auto-advances immediately. A later-round match is only auto-resolved as
 * a walkover when its *other* feeder branch is permanently empty (dead) —
 * if the other branch is a real match that simply hasn't been played yet,
 * the new match stays PENDING with just the known side pre-filled.
 *
 * With `legs: 2`, every position that is structurally guaranteed to be a
 * genuine two-sided tie (not a bye) also gets a mirrored second-leg match
 * (same round/position, `leg: 2`, participants swapped) — see
 * `resolveTwoLegTie` for how the aggregate winner of a two-legged tie is
 * determined once both legs are played.
 */
export function generateSingleEliminationBracket(
  participantIds: string[],
  legs: 1 | 2 = 1
): BracketMatch[] {
  if (participantIds.length < 2) {
    throw new Error("Se necesitan al menos 2 participantes");
  }

  const size = nextPowerOfTwo(participantIds.length);
  const totalRounds = Math.log2(size);
  const slots: (string | null)[] = [...participantIds];
  while (slots.length < size) slots.push(null);

  const matches: InternalMatch[] = [];

  // Round 1: pair sequential slots.
  const round1: InternalMatch[] = [];
  for (let i = 0; i < size / 2; i++) {
    const a = slots[i * 2];
    const b = slots[i * 2 + 1];
    const match: InternalMatch = {
      round: 1,
      position: i,
      leg: 1,
      participantAId: a,
      participantBId: b,
      status: "PENDING",
      dead: !a && !b,
      twoSided: !!a && !!b,
    };
    if (a && !b) {
      match.winnerId = a;
      match.status = "PLAYED";
    } else if (b && !a) {
      match.winnerId = b;
      match.status = "PLAYED";
    }
    round1.push(match);
  }
  matches.push(...round1);

  // Empty shells for subsequent rounds; only cascade a winner in when the
  // sibling branch is dead (a true walkover), never just because it hasn't
  // been played yet.
  let previousRound = round1;
  for (let r = 2; r <= totalRounds; r++) {
    const roundMatches: InternalMatch[] = [];
    for (let i = 0; i < previousRound.length / 2; i++) {
      const feederA = previousRound[i * 2];
      const feederB = previousRound[i * 2 + 1];
      const a = feederA.status === "PLAYED" ? feederA.winnerId ?? null : null;
      const b = feederB.status === "PLAYED" ? feederB.winnerId ?? null : null;
      const dead = feederA.dead && feederB.dead;
      const twoSided = !feederA.dead && !feederB.dead;

      const match: InternalMatch = {
        round: r,
        position: i,
        leg: 1,
        participantAId: a,
        participantBId: b,
        status: "PENDING",
        dead,
        twoSided,
      };

      if (!dead) {
        if (a && feederB.dead) {
          match.winnerId = a;
          match.status = "PLAYED";
        } else if (b && feederA.dead) {
          match.winnerId = b;
          match.status = "PLAYED";
        }
      }

      roundMatches.push(match);
    }
    matches.push(...roundMatches);
    previousRound = roundMatches;
  }

  // Dead matches (only possible when the field is much smaller than the
  // bracket size) can never be played — close them out so they don't block
  // the tournament from ever finishing.
  const resolved = matches.map(({ dead, twoSided, ...m }) => {
    void twoSided;
    if (dead && m.status === "PENDING") {
      return { ...m, status: "PLAYED" as const, winnerId: null };
    }
    void dead;
    return m;
  });

  if (legs !== 2) return resolved;

  const secondLegs: BracketMatch[] = matches
    .filter((m) => m.twoSided)
    .map((m) => ({
      round: m.round,
      position: m.position,
      leg: 2,
      participantAId: m.participantBId,
      participantBId: m.participantAId,
      status: "PENDING" as const,
    }));

  return [...resolved, ...secondLegs];
}

/**
 * Resolves a two-legged knockout tie once both legs have a score. Leg 2 is
 * constructed as leg 1 with participants A/B swapped, so team P
 * (leg1.participantAId) scored `leg1.scoreA + leg2.scoreB` in aggregate and
 * `leg2.scoreB` away; team Q (leg1.participantBId) scored
 * `leg1.scoreB + leg2.scoreA` in aggregate and `leg1.scoreB` away.
 *
 * Tiebreak order: aggregate goals, then away goals, then a penalty
 * shootout (only consulted, and only required, if still level after away
 * goals).
 */
export function resolveTwoLegTie(
  leg1: {
    participantAId: string;
    participantBId: string;
    scoreA: number;
    scoreB: number;
  },
  leg2: { scoreA: number; scoreB: number },
  penalties?: { scoreForLeg2A: number; scoreForLeg2B: number }
): string {
  const p = leg1.participantAId;
  const q = leg1.participantBId;

  const pAggregate = leg1.scoreA + leg2.scoreB;
  const qAggregate = leg1.scoreB + leg2.scoreA;
  if (pAggregate !== qAggregate) return pAggregate > qAggregate ? p : q;

  const pAway = leg2.scoreB;
  const qAway = leg1.scoreB;
  if (pAway !== qAway) return pAway > qAway ? p : q;

  if (!penalties || penalties.scoreForLeg2A === penalties.scoreForLeg2B) {
    throw new Error(
      "La eliminatoria sigue empatada tras el gol de visitante: se necesita un resultado de penales"
    );
  }
  // scoreForLeg2A/B follow leg 2's own A/B slots: leg2.participantA is Q
  // (home in leg 2), leg2.participantB is P (away in leg 2).
  return penalties.scoreForLeg2A > penalties.scoreForLeg2B ? q : p;
}

/**
 * Records an individual leg's own score for a two-legged tie. Unlike
 * `recordMatchResult`, a drawn leg is completely normal here (the tie
 * itself may still need a second leg, or `resolveTwoLegTie`, to be
 * decided) — no winner is computed at the leg level.
 */
export function recordLegResult(
  match: BracketMatch,
  scoreA: number,
  scoreB: number
): BracketMatch {
  if (match.status === "PLAYED") {
    throw new Error("Este partido ya tiene resultado cargado");
  }
  if (!match.participantAId || !match.participantBId) {
    throw new Error("Faltan participantes para cargar el resultado");
  }
  return { ...match, scoreA, scoreB, status: "PLAYED" };
}

/**
 * Records a result for a PENDING match and returns the updated match plus,
 * when applicable, the patch to apply to the match it feeds into.
 */
export function recordMatchResult(
  match: BracketMatch,
  scoreA: number,
  scoreB: number
): {
  updated: BracketMatch;
  nextRound: number;
  nextPosition: number;
  advanceAsA: boolean;
} {
  if (match.status === "PLAYED") {
    throw new Error("Este partido ya tiene resultado cargado");
  }
  if (!match.participantAId || !match.participantBId) {
    throw new Error("Faltan participantes para cargar el resultado");
  }
  if (scoreA === scoreB) {
    throw new Error("En eliminación directa no se permiten empates");
  }
  const winnerId = scoreA > scoreB ? match.participantAId : match.participantBId;
  return {
    updated: { ...match, scoreA, scoreB, winnerId, status: "PLAYED" },
    nextRound: match.round + 1,
    nextPosition: Math.floor(match.position / 2),
    advanceAsA: match.position % 2 === 0,
  };
}

/**
 * Circle-method round-robin scheduler. Odd counts get a bye (null) slot.
 * With `legs: 2`, a mirrored second leg (same position, swapped A/B) is
 * appended with round numbers continuing past the first leg's — this is a
 * "double round-robin" / "ida y vuelta" league, where each leg is just an
 * independent match contributing to the same table.
 */
export function generateRoundRobinSchedule(
  participantIds: string[],
  legs: 1 | 2 = 1
): BracketMatch[] {
  if (participantIds.length < 2) {
    throw new Error("Se necesitan al menos 2 participantes");
  }

  const ids: (string | null)[] = [...participantIds];
  if (ids.length % 2 !== 0) ids.push(null);

  const n = ids.length;
  const roundsCount = n - 1;
  const half = n / 2;
  const matches: BracketMatch[] = [];

  let arr = [...ids];
  for (let round = 1; round <= roundsCount; round++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a === null || b === null) continue; // bye
      matches.push({
        round,
        position: i,
        participantAId: a,
        participantBId: b,
        status: "PENDING",
      });
    }
    // Rotate all but the first element.
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop() as string | null);
    arr = [fixed, ...rest];
  }

  if (legs === 2) {
    const maxRound = Math.max(...matches.map((m) => m.round));
    const secondLeg = matches.map((m) => ({
      ...m,
      round: m.round + maxRound,
      participantAId: m.participantBId,
      participantBId: m.participantAId,
    }));
    return [...matches, ...secondLeg];
  }

  return matches;
}

export interface StandingRow {
  participantId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/** Computes a football-style (3/1/0) league table from played matches. */
export function computeStandings(
  participantIds: string[],
  matches: BracketMatch[]
): StandingRow[] {
  const table = new Map<string, StandingRow>();
  for (const id of participantIds) {
    table.set(id, {
      participantId: id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const m of matches) {
    if (
      m.status !== "PLAYED" ||
      m.scoreA == null ||
      m.scoreB == null ||
      !m.participantAId ||
      !m.participantBId
    ) {
      continue;
    }
    const a = table.get(m.participantAId);
    const b = table.get(m.participantBId);
    if (!a || !b) continue;

    a.played++;
    b.played++;
    a.goalsFor += m.scoreA;
    a.goalsAgainst += m.scoreB;
    b.goalsFor += m.scoreB;
    b.goalsAgainst += m.scoreA;

    if (m.scoreA > m.scoreB) {
      a.won++;
      a.points += 3;
      b.lost++;
    } else if (m.scoreB > m.scoreA) {
      b.won++;
      b.points += 3;
      a.lost++;
    } else {
      a.drawn++;
      b.drawn++;
      a.points += 1;
      b.points += 1;
    }
  }

  const rows = Array.from(table.values()).map((row) => ({
    ...row,
    goalDifference: row.goalsFor - row.goalsAgainst,
  }));

  rows.sort((x, y) => {
    if (y.points !== x.points) return y.points - x.points;
    if (y.goalDifference !== x.goalDifference)
      return y.goalDifference - x.goalDifference;
    return y.goalsFor - x.goalsFor;
  });

  return rows;
}

export interface AttackDefenseRow {
  participantId: string;
  goals: number;
}

export interface TournamentStats {
  totalMatches: number;
  totalGoals: number;
  goalsPerMatch: number;
  draws: number;
  bestAttack: AttackDefenseRow[];
  worstAttack: AttackDefenseRow[];
  bestDefense: AttackDefenseRow[];
  worstDefense: AttackDefenseRow[];
}

/**
 * Aggregate stats for a whole tournament: totals plus best/worst attack
 * (goals scored) and defense (goals conceded), built on top of
 * `computeStandings` so goalsFor/goalsAgainst per team are computed once.
 * Teams that haven't played yet are excluded from the attack/defense
 * lists (nothing to rank them by).
 */
export function computeTournamentStats(
  participantIds: string[],
  matches: BracketMatch[],
  topN = 3
): TournamentStats {
  const standings = computeStandings(participantIds, matches);
  const played = standings.filter((row) => row.played > 0);

  const playedMatches = matches.filter(
    (m) => m.status === "PLAYED" && m.scoreA != null && m.scoreB != null
  );
  const totalMatches = playedMatches.length;
  const totalGoals = playedMatches.reduce(
    (sum, m) => sum + (m.scoreA ?? 0) + (m.scoreB ?? 0),
    0
  );
  const draws = playedMatches.filter((m) => m.scoreA === m.scoreB).length;

  const byAttackDesc = [...played].sort((a, b) => b.goalsFor - a.goalsFor);
  const byAttackAsc = [...played].sort((a, b) => a.goalsFor - b.goalsFor);
  const byDefenseAsc = [...played].sort(
    (a, b) => a.goalsAgainst - b.goalsAgainst
  );
  const byDefenseDesc = [...played].sort(
    (a, b) => b.goalsAgainst - a.goalsAgainst
  );

  return {
    totalMatches,
    totalGoals,
    goalsPerMatch: totalMatches > 0 ? totalGoals / totalMatches : 0,
    draws,
    bestAttack: byAttackDesc
      .slice(0, topN)
      .map((r) => ({ participantId: r.participantId, goals: r.goalsFor })),
    worstAttack: byAttackAsc
      .slice(0, topN)
      .map((r) => ({ participantId: r.participantId, goals: r.goalsFor })),
    bestDefense: byDefenseAsc
      .slice(0, topN)
      .map((r) => ({ participantId: r.participantId, goals: r.goalsAgainst })),
    worstDefense: byDefenseDesc
      .slice(0, topN)
      .map((r) => ({ participantId: r.participantId, goals: r.goalsAgainst })),
  };
}
