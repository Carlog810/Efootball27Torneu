import { describe, expect, it } from "vitest";
import {
  generateSingleEliminationBracket,
  recordMatchResult,
  generateRoundRobinSchedule,
  computeStandings,
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
