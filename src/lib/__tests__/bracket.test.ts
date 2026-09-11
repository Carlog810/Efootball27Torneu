import { describe, expect, it } from "vitest";
import {
  generateSingleEliminationBracket,
  recordMatchResult,
  recordLegResult,
  resolveTwoLegTie,
  generateRoundRobinSchedule,
  computeStandings,
  computeTournamentStats,
  type BracketMatch,
} from "../bracket";

describe("generateSingleEliminationBracket", () => {
  it("builds a full bracket for a power-of-two field", () => {
    const matches = generateSingleEliminationBracket(["a", "b", "c", "d"]);
    const round1 = matches.filter((m) => m.round === 1);
    const round2 = matches.filter((m) => m.round === 2);
    expect(round1).toHaveLength(2);
    expect(round2).toHaveLength(1);
    expect(round1.every((m) => m.status === "PENDING")).toBe(true);
  });

  it("auto-resolves byes for a non-power-of-two field", () => {
    // 3 participants -> size 4, one bye in round 1.
    const matches = generateSingleEliminationBracket(["a", "b", "c"]);
    const round1 = matches.filter((m) => m.round === 1);
    const byeMatch = round1.find(
      (m) => !m.participantAId || !m.participantBId
    );
    expect(byeMatch?.status).toBe("PLAYED");
    expect(byeMatch?.winnerId).toBeTruthy();

    // The round-2 final should already have the bye winner seeded in...
    const final = matches.find((m) => m.round === 2);
    expect(final?.participantAId || final?.participantBId).toBeTruthy();
    // ...but NOT be auto-resolved: the other semifinal is a real match
    // between two real participants that hasn't been played yet, so the
    // final must stay PENDING with only one side filled in.
    expect(final?.status).toBe("PENDING");
    expect(final?.winnerId).toBeFalsy();
    expect(final?.participantAId && final?.participantBId).toBeFalsy();
  });

  it("cascades a walkover only through a genuinely dead branch, not a pending real match", () => {
    // 5 participants -> size 8. Slots: [a,b,c,d,e,null,null,null].
    // Round 1: (a,b) real pending, (c,d) real pending, (e,bye)->e advances,
    // (null,null) truly dead.
    const matches = generateSingleEliminationBracket(["a", "b", "c", "d", "e"]);

    const round2 = matches.filter((m) => m.round === 2);
    expect(round2).toHaveLength(2);

    // Fed by two real pending matches (a-vs-b, c-vs-d): must stay untouched.
    const pendingFed = round2.find(
      (m) => !m.participantAId && !m.participantBId
    );
    expect(pendingFed?.status).toBe("PENDING");

    // Fed by (e's bye) + (a fully dead match): e should walk over immediately.
    const deadFed = round2.find((m) => m.participantAId || m.participantBId);
    expect(deadFed?.status).toBe("PLAYED");
    expect(deadFed?.winnerId).toBe("e");
  });

  it("rejects fields smaller than 2", () => {
    expect(() => generateSingleEliminationBracket(["a"])).toThrow();
  });

  describe("legs: 2 (two-legged ties)", () => {
    it("gives every genuinely two-sided position a swapped leg-2 match", () => {
      const matches = generateSingleEliminationBracket(["a", "b", "c", "d"], 2);
      const round1 = matches.filter((m) => m.round === 1);
      const round2 = matches.filter((m) => m.round === 2);
      // 2 positions in round 1, 1 in round 2, all two-sided -> doubled.
      expect(round1).toHaveLength(4);
      expect(round2).toHaveLength(2);

      const leg1 = round1.find((m) => m.position === 0 && m.leg === 1)!;
      const leg2 = round1.find((m) => m.position === 0 && m.leg === 2)!;
      expect(leg2.participantAId).toBe(leg1.participantBId);
      expect(leg2.participantBId).toBe(leg1.participantAId);
      expect(leg2.status).toBe("PENDING");
    });

    it("does not give a bye/walkover position a second leg", () => {
      // 3 participants -> size 4, round 1 has one real match + one bye.
      const matches = generateSingleEliminationBracket(["a", "b", "c"], 2);
      const round1 = matches.filter((m) => m.round === 1);
      const byePosition = round1.find(
        (m) => m.leg === 1 && (!m.participantAId || !m.participantBId)
      )!;
      const byeLeg2 = round1.find(
        (m) => m.position === byePosition.position && m.leg === 2
      );
      expect(byeLeg2).toBeUndefined();

      const realPosition = round1.find(
        (m) => m.leg === 1 && m.participantAId && m.participantBId
      )!;
      const realLeg2 = round1.find(
        (m) => m.position === realPosition.position && m.leg === 2
      );
      expect(realLeg2).toBeDefined();
    });

    it("still only produces a single match per position when legs is 1 (default)", () => {
      const matches = generateSingleEliminationBracket(["a", "b", "c", "d"]);
      expect(matches.filter((m) => (m.leg ?? 1) === 2)).toHaveLength(0);
    });
  });
});

describe("recordLegResult", () => {
  it("allows a drawn leg score and does not compute a winner", () => {
    const match: BracketMatch = {
      round: 1,
      position: 0,
      leg: 1,
      participantAId: "a",
      participantBId: "b",
      status: "PENDING",
    };
    const updated = recordLegResult(match, 1, 1);
    expect(updated.status).toBe("PLAYED");
    expect(updated.scoreA).toBe(1);
    expect(updated.scoreB).toBe(1);
    expect(updated.winnerId).toBeUndefined();
  });

  it("throws when the leg already has a result", () => {
    const match: BracketMatch = {
      round: 1,
      position: 0,
      leg: 1,
      participantAId: "a",
      participantBId: "b",
      status: "PLAYED",
    };
    expect(() => recordLegResult(match, 1, 1)).toThrow();
  });
});

describe("resolveTwoLegTie", () => {
  const leg1 = { participantAId: "a", participantBId: "b" };

  it("decides by aggregate goals", () => {
    // a: 2 (leg1) + 1 (leg2, away) = 3. b: 1 (leg1) + 0 (leg2, away) = 1.
    const winner = resolveTwoLegTie(
      { ...leg1, scoreA: 2, scoreB: 1 },
      { scoreA: 0, scoreB: 1 }
    );
    expect(winner).toBe("a");
  });

  it("falls back to away goals when aggregate is level", () => {
    // Aggregate: a = 1(leg1) + 1(leg2 away) = 2; b = 1(leg1) + 1(leg2 away) = 2.
    // Away goals: a's away goal (leg2.scoreB) = 1; b's away goal (leg1.scoreB) = 1... need a real split.
    // leg1: a 2 - 1 b. leg2 (b home, a away): b 1 - 2 a.
    // Aggregate: a = 2 + 2 = 4, b = 1 + 1 = 2 -> not level, adjust:
    // Use: leg1: a 1 - 2 b (b ahead by 1). leg2: b(home) 0 - 1 a(away) (a wins leg2 by 1).
    // Aggregate: a = 1 + 1 = 2, b = 2 + 0 = 2 -> level.
    // Away goals: a's away goal = leg2.scoreB = 1. b's away goal = leg1.scoreB = 2.
    const winner = resolveTwoLegTie(
      { ...leg1, scoreA: 1, scoreB: 2 },
      { scoreA: 0, scoreB: 1 }
    );
    // a away goals = 1, b away goals = 2 -> b wins on away goals.
    expect(winner).toBe("b");
  });

  it("requires a penalty shootout when still level after away goals, and honors it", () => {
    // leg1: a 1 - 1 b. leg2: b(home) 1 - 1 a(away). Aggregate 2-2, away goals 1-1.
    expect(() =>
      resolveTwoLegTie(
        { ...leg1, scoreA: 1, scoreB: 1 },
        { scoreA: 1, scoreB: 1 }
      )
    ).toThrow();

    const winner = resolveTwoLegTie(
      { ...leg1, scoreA: 1, scoreB: 1 },
      { scoreA: 1, scoreB: 1 },
      { scoreForLeg2A: 4, scoreForLeg2B: 5 }
    );
    // leg2's A is b (home in leg2), leg2's B is a (away in leg2) -> a wins penalties.
    expect(winner).toBe("a");
  });
});

describe("recordMatchResult", () => {
  it("advances the winner into the correct next-round slot", () => {
    const matches = generateSingleEliminationBracket(["a", "b", "c", "d"]);
    const match0 = matches.find((m) => m.round === 1 && m.position === 0)!;
    const { updated, nextRound, nextPosition, advanceAsA } =
      recordMatchResult(match0, 3, 1);

    expect(updated.winnerId).toBe("a");
    expect(nextRound).toBe(2);
    expect(nextPosition).toBe(0);
    expect(advanceAsA).toBe(true);
  });

  it("throws on a tie (no draws in knockout)", () => {
    const matches = generateSingleEliminationBracket(["a", "b", "c", "d"]);
    const match0 = matches.find((m) => m.round === 1 && m.position === 0)!;
    expect(() => recordMatchResult(match0, 2, 2)).toThrow();
  });

  it("throws when the match already has a result", () => {
    const matches = generateSingleEliminationBracket(["a", "b", "c", "d"]);
    const match0 = matches.find((m) => m.round === 1 && m.position === 0)!;
    const { updated } = recordMatchResult(match0, 3, 1);
    expect(() => recordMatchResult(updated, 1, 0)).toThrow();
  });
});

describe("generateRoundRobinSchedule", () => {
  it("schedules n-1 rounds for an even number of teams", () => {
    const matches = generateRoundRobinSchedule(["a", "b", "c", "d"]);
    const rounds = new Set(matches.map((m) => m.round));
    expect(rounds.size).toBe(3);
    expect(matches).toHaveLength(6); // C(4,2)
  });

  it("gives every team a bye exactly once for an odd number of teams", () => {
    const teams = ["a", "b", "c", "d", "e"];
    const matches = generateRoundRobinSchedule(teams);
    const rounds = new Set(matches.map((m) => m.round));
    expect(rounds.size).toBe(5); // n rounds when n is odd (with byes)

    for (const round of rounds) {
      const playing = matches
        .filter((m) => m.round === round)
        .flatMap((m) => [m.participantAId, m.participantBId]);
      const resting = teams.filter((t) => !playing.includes(t));
      expect(resting).toHaveLength(1);
    }

    // Every pair of teams meets exactly once.
    const pairs = new Set(
      matches.map((m) =>
        [m.participantAId, m.participantBId].sort().join("-")
      )
    );
    expect(pairs.size).toBe((teams.length * (teams.length - 1)) / 2);
  });

  describe("legs: 2 (double round-robin)", () => {
    it("doubles the fixtures with leg 2 rounds continuing past leg 1 and swapped participants", () => {
      const single = generateRoundRobinSchedule(["a", "b", "c", "d"]);
      const double = generateRoundRobinSchedule(["a", "b", "c", "d"], 2);
      expect(double).toHaveLength(single.length * 2);

      const maxRound = Math.max(...single.map((m) => m.round));
      const leg1 = double.filter((m) => m.round <= maxRound);
      const leg2 = double.filter((m) => m.round > maxRound);
      expect(leg2).toHaveLength(leg1.length);

      for (const m1 of leg1) {
        const mirrored = leg2.find(
          (m2) => m2.round === m1.round + maxRound && m2.position === m1.position
        )!;
        expect(mirrored.participantAId).toBe(m1.participantBId);
        expect(mirrored.participantBId).toBe(m1.participantAId);
      }
    });
  });
});

describe("computeStandings", () => {
  it("ranks by points, then goal difference, then goals for", () => {
    const ids = ["a", "b", "c"];
    const matches: BracketMatch[] = [
      {
        round: 1,
        position: 0,
        participantAId: "a",
        participantBId: "b",
        scoreA: 3,
        scoreB: 1,
        status: "PLAYED",
      },
      {
        round: 1,
        position: 1,
        participantAId: "b",
        participantBId: "c",
        scoreA: 2,
        scoreB: 2,
        status: "PLAYED",
      },
      {
        round: 2,
        position: 0,
        participantAId: "a",
        participantBId: "c",
        scoreA: 1,
        scoreB: 1,
        status: "PLAYED",
      },
    ];

    const standings = computeStandings(ids, matches);
    // a: win + draw = 4pts; c: draw + draw = 2pts; b: loss + draw = 1pt.
    expect(standings.map((r) => r.participantId)).toEqual(["a", "c", "b"]);
    expect(standings[0].points).toBe(4); // 1 win + 1 draw
    expect(standings[0].goalDifference).toBe(2);
  });

  it("ignores matches that have not been played yet", () => {
    const ids = ["a", "b"];
    const matches: BracketMatch[] = [
      {
        round: 1,
        position: 0,
        participantAId: "a",
        participantBId: "b",
        status: "PENDING",
      },
    ];
    const standings = computeStandings(ids, matches);
    expect(standings.every((r) => r.played === 0)).toBe(true);
  });
});

describe("computeTournamentStats", () => {
  // a: GF 7 GA 4, b: GF 1 GA 6, c: GF 5 GA 3.
  const matches: BracketMatch[] = [
    {
      round: 1,
      position: 0,
      participantAId: "a",
      participantBId: "b",
      scoreA: 4,
      scoreB: 1,
      status: "PLAYED",
    },
    {
      round: 1,
      position: 1,
      participantAId: "b",
      participantBId: "c",
      scoreA: 0,
      scoreB: 2,
      status: "PLAYED",
    },
    {
      round: 2,
      position: 0,
      participantAId: "a",
      participantBId: "c",
      scoreA: 3,
      scoreB: 3,
      status: "PLAYED",
    },
  ];

  it("computes totals across every played match", () => {
    const stats = computeTournamentStats(["a", "b", "c"], matches);
    expect(stats.totalMatches).toBe(3);
    expect(stats.totalGoals).toBe(4 + 1 + 0 + 2 + 3 + 3);
    expect(stats.goalsPerMatch).toBeCloseTo(13 / 3);
    expect(stats.draws).toBe(1);
  });

  it("ranks best/worst attack and defense correctly", () => {
    const stats = computeTournamentStats(["a", "b", "c"], matches);
    expect(stats.bestAttack.map((r) => r.participantId)).toEqual(["a", "c", "b"]);
    expect(stats.worstAttack.map((r) => r.participantId)).toEqual(["b", "c", "a"]);
    expect(stats.bestDefense.map((r) => r.participantId)).toEqual(["c", "a", "b"]);
    expect(stats.worstDefense.map((r) => r.participantId)).toEqual(["b", "a", "c"]);
  });

  it("excludes participants who haven't played yet", () => {
    const stats = computeTournamentStats(["a", "b", "c", "d"], matches);
    expect(stats.bestAttack).toHaveLength(3);
    expect(stats.bestAttack.some((r) => r.participantId === "d")).toBe(false);
  });

  it("respects a smaller topN", () => {
    const stats = computeTournamentStats(["a", "b", "c"], matches, 1);
    expect(stats.bestAttack).toEqual([{ participantId: "a", goals: 7 }]);
    expect(stats.worstDefense).toEqual([{ participantId: "b", goals: 6 }]);
  });

  it("returns zeros when nothing has been played", () => {
    const stats = computeTournamentStats(["a", "b"], [
      { round: 1, position: 0, participantAId: "a", participantBId: "b", status: "PENDING" },
    ]);
    expect(stats.totalMatches).toBe(0);
    expect(stats.goalsPerMatch).toBe(0);
    expect(stats.bestAttack).toHaveLength(0);
  });
});
