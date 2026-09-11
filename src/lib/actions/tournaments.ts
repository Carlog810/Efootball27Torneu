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
    platformId: formData.get("platformId"),
    ligaId: formData.get("ligaId") || undefined,
    feeType: formData.get("feeType"),
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
      maxParticipants: data.maxParticipants,
      registrationClosesAt: data.registrationClosesAt,
      startsAt: data.startsAt,
      description: data.description || null,
      coverImage: data.coverImage || null,
      platformId: data.platformId,
      ligaId: data.ligaId || null,
      organizerId: user.id,
    },
  });

  revalidatePath("/torneos");
  redirect(`/torneos/${tournament.slug}`);
}

export async function joinTournamentAction(tournamentId: string) {
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

  const existing = await db.participant.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: user.id } },
  });
  if (existing) throw new Error(e.alreadyJoined);

  await db.participant.create({
    data: {
      tournamentId,
      userId: user.id,
      teamName: user.playerTag,
    },
  });

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
  if (tournament.participants.length < 2) {
    throw new Error(e.needTwoParticipants);
  }

  const shuffledIds = shuffle(tournament.participants.map((p) => p.id));

  const matches =
    tournament.format === "SINGLE_ELIM"
      ? generateSingleEliminationBracket(shuffledIds)
      : generateRoundRobinSchedule(shuffledIds);

  await db.$transaction([
    ...matches.map((m) =>
      db.match.create({
        data: {
          tournamentId,
          round: m.round,
          position: m.position,
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

export async function submitMatchResultAction(
  matchId: string,
  scoreA: number,
  scoreB: number
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
    if (scoreA === scoreB) {
      throw new Error(e.noDrawsInKnockout);
    }

    const { updated, nextRound, nextPosition, advanceAsA } = recordMatchResult(
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

    const nextMatch = await db.match.findUnique({
      where: {
        tournamentId_round_position: {
          tournamentId: match.tournamentId,
          round: nextRound,
          position: nextPosition,
        },
      },
    });

    if (nextMatch && updated.winnerId) {
      await db.match.update({
        where: { id: nextMatch.id },
        data: advanceAsA
          ? { participantAId: updated.winnerId }
          : { participantBId: updated.winnerId },
      });
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