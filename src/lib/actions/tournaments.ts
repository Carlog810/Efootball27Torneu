"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { slugify } from "@/lib/slug";
import { getTournamentSchema } from "@/lib/validation";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import {
  generateSingleEliminationBracket,
  generateRoundRobinSchedule,
  recordMatchResult,
  recordLegResult,
  resolveTwoLegTie,
} from "@/lib/bracket";
import type { ActionState } from "@/lib/actions/auth";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function createTournamentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const t = getDictionary(await getLocale());

  const parsed = getTournamentSchema(t).safeParse({
    name: formData.get("name"),
    format: formData.get("format"),
    platformId: formData.get("platformId") || undefined,
    ligaId: formData.get("ligaId") || undefined,
    feeType: formData.get("feeType"),
    legs: formData.get("legs"),
    requireApproval: formData.get("requireApproval") ?? "false",
    maxParticipants: Number(formData.get("maxParticipants")),
    registrationClosesAt: formData.get("registrationClosesAt"),
    startsAt: formData.get("startsAt"),
    description: formData.get("description") || undefined,
    coverImage: formData.get("coverImage") || "",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const baseSlug = slugify(data.name) || "torneo";
  let slug = baseSlug;
  let attempt = 0;
  while (await db.tournament.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const tournament = await db.tournament.create({
    data: {
      name: data.name,
      slug,
      format: data.format,
      feeType: data.feeType,
      legs: data.legs,
      requireApproval: data.requireApproval,
      maxParticipants: data.maxParticipants,
      registrationClosesAt: data.registrationClosesAt,
      startsAt: data.startsAt,
      description: data.description || null,
      coverImage: data.coverImage || null,
      platformId: data.platformId || null,
      ligaId: data.ligaId || null,
      organizerId: user.id,
    },
  });

  revalidatePath("/torneos");
  redirect(`/torneos/${tournament.slug}`);
}

export async function joinTournamentAction(tournamentId: string, teamId: string) {
  const user = await requireUser();
  const t = getDictionary(await getLocale());
  const e = t.tournamentErrors;

  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    include: { _count: { select: { participants: true } } },
  });
  if (!tournament) throw new Error(e.notFound);
  if (tournament.status !== "REGISTRATION") {
    throw new Error(e.registrationClosed);
  }
  if (tournament._count.participants >= tournament.maxParticipants) {
    throw new Error(e.full);
  }

  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team) throw new Error(e.teamNotFound);

  const existing = await db.participant.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: user.id } },
  });
  if (existing) throw new Error(e.alreadyJoined);

  await db.participant.create({
    data: {
      tournamentId,
      userId: user.id,
      teamId: team.id,
      teamName: team.name,
      status: tournament.requireApproval ? "PENDING_APPROVAL" : "CONFIRMED",
    },
  });

  revalidatePath(`/torneos`);
}

export async function inviteParticipantAction(
  tournamentId: string,
  playerTag: string,
  teamId: string
) {
  const user = await requireUser();
  const t = getDictionary(await getLocale());
  const e = t.tournamentErrors;

  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    include: { _count: { select: { participants: true } } },
  });
  if (!tournament) throw new Error(e.notFound);
  if (tournament.organizerId !== user.id) {
    throw new Error(e.onlyOrganizer);
  }
  if (tournament.status !== "REGISTRATION") {
    throw new Error(e.registrationClosed);
  }
  if (tournament._count.participants >= tournament.maxParticipants) {
    throw new Error(e.full);
  }

  const invitedUser = await db.user.findUnique({ where: { playerTag } });
  if (!invitedUser) throw new Error(e.userNotFound);

  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team) throw new Error(e.teamNotFound);

  const existing = await db.participant.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: invitedUser.id } },
  });
  if (existing) throw new Error(e.alreadyJoined);

  await db.participant.create({
    data: {
      tournamentId,
      userId: invitedUser.id,
      teamId: team.id,
      teamName: team.name,
      status: "PENDING_CONFIRMATION",
    },
  });

  revalidatePath(`/torneos`);
}

export async function respondToInviteAction(
  participantId: string,
  accept: boolean
) {
  const user = await requireUser();
  const t = getDictionary(await getLocale());
  const e = t.tournamentErrors;

  const participant = await db.participant.findUnique({
    where: { id: participantId },
  });
  if (!participant) throw new Error(e.notFound);
  if (participant.userId !== user.id) {
    throw new Error(e.notYourInvite);
  }
  if (participant.status !== "PENDING_CONFIRMATION") {
    throw new Error(e.notYourInvite);
  }

  if (accept) {
    await db.participant.update({
      where: { id: participantId },
      data: { status: "CONFIRMED" },
    });
  } else {
    await db.participant.delete({ where: { id: participantId } });
  }

  revalidatePath(`/torneos`);
}

export async function approveParticipantAction(participantId: string) {
  const user = await requireUser();
  const t = getDictionary(await getLocale());
  const e = t.tournamentErrors;

  const participant = await db.participant.findUnique({
    where: { id: participantId },
    include: { tournament: true },
  });
  if (!participant) throw new Error(e.notFound);
  if (participant.tournament.organizerId !== user.id) {
    throw new Error(e.onlyOrganizer);
  }
  if (participant.status !== "PENDING_APPROVAL") {
    throw new Error(e.notPendingApproval);
  }

  await db.participant.update({
    where: { id: participantId },
    data: { status: "CONFIRMED" },
  });

  revalidatePath(`/torneos`);
}

export async function removeParticipantAction(participantId: string) {
  const user = await requireUser();
  const t = getDictionary(await getLocale());
  const e = t.tournamentErrors;

  const participant = await db.participant.findUnique({
    where: { id: participantId },
    include: { tournament: true },
  });
  if (!participant) throw new Error(e.notFound);
  if (participant.tournament.organizerId !== user.id) {
    throw new Error(e.onlyOrganizer);
  }
  if (participant.status === "CONFIRMED") {
    throw new Error(e.cannotRemoveConfirmed);
  }

  await db.participant.delete({ where: { id: participantId } });

  revalidatePath(`/torneos`);
}

export async function leaveTournamentAction(tournamentId: string) {
  const user = await requireUser();
  const t = getDictionary(await getLocale());
  const e = t.tournamentErrors;

  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
  });
  if (!tournament) throw new Error(e.notFound);
  if (tournament.status !== "REGISTRATION") {
    throw new Error(e.cannotLeaveStarted);
  }

  await db.participant.deleteMany({
    where: { tournamentId, userId: user.id },
  });

  revalidatePath(`/torneos`);
}

export async function drawTournamentAction(tournamentId: string) {
  const user = await requireUser();
  const t = getDictionary(await getLocale());
  const e = t.tournamentErrors;

  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    include: { participants: true },
  });
  if (!tournament) throw new Error(e.notFound);
  if (tournament.organizerId !== user.id) {
    throw new Error(e.onlyOrganizerDraw);
  }
  if (tournament.status !== "REGISTRATION") {
    throw new Error(e.alreadyDrawn);
  }
  const confirmed = tournament.participants.filter(
    (p) => p.status === "CONFIRMED"
  );
  if (confirmed.length < 2) {
    throw new Error(e.needTwoParticipants);
  }

  const shuffledIds = shuffle(confirmed.map((p) => p.id));
  const legs = tournament.legs === 2 ? 2 : 1;

  const matches =
    tournament.format === "SINGLE_ELIM"
      ? generateSingleEliminationBracket(shuffledIds, legs)
      : generateRoundRobinSchedule(shuffledIds, legs);

  const stalePendingIds = tournament.participants
    .filter((p) => p.status !== "CONFIRMED")
    .map((p) => p.id);

  await db.$transaction([
    ...(stalePendingIds.length > 0
      ? [db.participant.deleteMany({ where: { id: { in: stalePendingIds } } })]
      : []),
    ...matches.map((m) =>
      db.match.create({
        data: {
          tournamentId,
          round: m.round,
          position: m.position,
          leg: m.leg ?? 1,
          participantAId: m.participantAId,
          participantBId: m.participantBId,
          scoreA: m.scoreA ?? null,
          scoreB: m.scoreB ?? null,
          winnerId: m.winnerId ?? null,
          status: m.status,
        },
      })
    ),
    db.tournament.update({
      where: { id: tournamentId },
      data: { status: "IN_PROGRESS" },
    }),
  ]);

  revalidatePath(`/torneos`);
}

async function advanceWinner(
  tournamentId: string,
  round: number,
  position: number,
  winnerId: string,
  advanceAsA: boolean
) {
  const nextLegs = await db.match.findMany({
    where: { tournamentId, round, position },
  });
  for (const nextLeg of nextLegs) {
    // Leg 2 mirrors leg 1's participants, so the slot it fills is flipped.
    const fillsA = nextLeg.leg === 1 ? advanceAsA : !advanceAsA;
    await db.match.update({
      where: { id: nextLeg.id },
      data: fillsA ? { participantAId: winnerId } : { participantBId: winnerId },
    });
  }
}

export async function submitMatchResultAction(
  matchId: string,
  scoreA: number,
  scoreB: number,
  penaltyScoreA?: number,
  penaltyScoreB?: number
) {
  const user = await requireUser();
  const t = getDictionary(await getLocale());
  const e = t.tournamentErrors;

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      tournament: true,
      participantA: true,
      participantB: true,
    },
  });
  if (!match) throw new Error(e.matchNotFound);
  if (match.tournament.status !== "IN_PROGRESS") {
    throw new Error(e.notInProgress);
  }

  const canReport =
    match.tournament.organizerId === user.id ||
    match.participantA?.userId === user.id ||
    match.participantB?.userId === user.id;
  if (!canReport) {
    throw new Error(e.noPermission);
  }

  if (match.status === "PLAYED") {
    throw new Error(e.alreadyPlayed);
  }

  if (match.tournament.format === "LEAGUE") {
    if (!match.participantAId || !match.participantBId) {
      throw new Error(e.missingParticipants);
    }
    const winnerId =
      scoreA === scoreB
        ? null
        : scoreA > scoreB
        ? match.participantAId
        : match.participantBId;

    await db.match.update({
      where: { id: matchId },
      data: { scoreA, scoreB, winnerId, status: "PLAYED" },
    });
  } else {
    const sibling = await db.match.findUnique({
      where: {
        tournamentId_round_position_leg: {
          tournamentId: match.tournamentId,
          round: match.round,
          position: match.position,
          leg: match.leg === 1 ? 2 : 1,
        },
      },
    });

    if (!sibling) {
      // Legacy path: a single-match tie (legs=1 tournament, or a bye
      // position even under legs=2). Unchanged from before this feature.
      if (scoreA === scoreB) {
        throw new Error(e.noDrawsInKnockout);
      }

      const { updated, nextRound, nextPosition, advanceAsA } =
        recordMatchResult(
          {
            round: match.round,
            position: match.position,
            participantAId: match.participantAId,
            participantBId: match.participantBId,
            status: match.status,
          },
          scoreA,
          scoreB
        );

      await db.match.update({
        where: { id: matchId },
        data: {
          scoreA: updated.scoreA,
          scoreB: updated.scoreB,
          winnerId: updated.winnerId,
          status: "PLAYED",
        },
      });

      if (updated.winnerId) {
        await advanceWinner(
          match.tournamentId,
          nextRound,
          nextPosition,
          updated.winnerId,
          advanceAsA
        );
      }
    } else if (match.leg === 2 && sibling.status !== "PLAYED") {
      throw new Error(e.legOneNotPlayedYet);
    } else if (match.leg === 1) {
      // First leg of a two-legged tie: a drawn leg is fine, nothing to
      // advance yet — the tie isn't decided until leg 2 is played.
      const updated = recordLegResult(
        {
          round: match.round,
          position: match.position,
          leg: 1,
          participantAId: match.participantAId,
          participantBId: match.participantBId,
          status: match.status,
        },
        scoreA,
        scoreB
      );
      await db.match.update({
        where: { id: matchId },
        data: { scoreA: updated.scoreA, scoreB: updated.scoreB, status: "PLAYED" },
      });
    } else {
      // Second leg: this submission completes the tie. `sibling` here is
      // leg 1 (already played, guaranteed by the check above).
      if (!sibling.participantAId || !sibling.participantBId) {
        throw new Error(e.missingParticipants);
      }
      const penalties =
        penaltyScoreA != null && penaltyScoreB != null
          ? { scoreForLeg2A: penaltyScoreA, scoreForLeg2B: penaltyScoreB }
          : undefined;

      const winnerId = resolveTwoLegTie(
        {
          participantAId: sibling.participantAId,
          participantBId: sibling.participantBId,
          scoreA: sibling.scoreA!,
          scoreB: sibling.scoreB!,
        },
        { scoreA, scoreB },
        penalties
      );

      await db.match.update({
        where: { id: matchId },
        data: {
          scoreA,
          scoreB,
          winnerId,
          status: "PLAYED",
          penaltyScoreA: penalties?.scoreForLeg2A ?? null,
          penaltyScoreB: penalties?.scoreForLeg2B ?? null,
        },
      });

      const nextRound = match.round + 1;
      const nextPosition = Math.floor(match.position / 2);
      const advanceAsA = match.position % 2 === 0;
      await advanceWinner(
        match.tournamentId,
        nextRound,
        nextPosition,
        winnerId,
        advanceAsA
      );
    }
  }

  const remaining = await db.match.count({
    where: { tournamentId: match.tournamentId, status: "PENDING" },
  });
  if (remaining === 0) {
    await db.tournament.update({
      where: { id: match.tournamentId },
      data: { status: "FINISHED" },
    });
  }

  revalidatePath(`/torneos`);
}