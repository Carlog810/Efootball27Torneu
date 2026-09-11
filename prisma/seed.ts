import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateSingleEliminationBracket, recordMatchResult } from "../src/lib/bracket";

const db = new PrismaClient();

async function main() {
  console.log("Sembrando plataformas...");
  const platformNames = ["PS4", "PS5", "Xbox Series", "PC"];
  const platforms = new Map<string, string>();
  for (const name of platformNames) {
    const p = await db.platform.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    platforms.set(name, p.id);
  }

  console.log("Sembrando usuarios demo (password: Demo1234!)...");
  const passwordHash = await bcrypt.hash("Demo1234!", 10);
  const demoUsers = [
    { name: "Carlos Gaona", playerTag: "carlosg", email: "carlos@example.com" },
    { name: "Ana Torres", playerTag: "anat", email: "ana@example.com" },
    { name: "Luis Pérez", playerTag: "luisp", email: "luis@example.com" },
    { name: "Marta Ríos", playerTag: "martar", email: "marta@example.com" },
    { name: "Diego Fernández", playerTag: "diegof", email: "diego@example.com" },
    { name: "Sofía Castro", playerTag: "sofiac", email: "sofia@example.com" },
    { name: "Pedro Ramírez", playerTag: "pedror", email: "pedro@example.com" },
    { name: "Valentina Cruz", playerTag: "valec", email: "valentina@example.com" },
  ];

  const users = [];
  for (const u of demoUsers) {
    const user = await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        ...u,
        passwordHash,
        platformPrefId: platforms.get("PS5"),
      },
    });
    users.push(user);
  }

  console.log("Sembrando liga...");
  const liga = await db.liga.upsert({
    where: { slug: "liga-efootball-series" },
    update: {},
    create: {
      name: "Liga eFootball Series",
      slug: "liga-efootball-series",
      description:
        "Liga comunitaria recurrente de eFootball, con torneos de temporada regular y copas relámpago.",
      platformId: platforms.get("PS5"),
    },
  });

  console.log("Sembrando torneo de eliminación simple (en curso, con resultados)...");
  const bracketTournament = await db.tournament.upsert({
    where: { slug: "copa-relampago-1" },
    update: {},
    create: {
      name: "Copa Relámpago #1",
      slug: "copa-relampago-1",
      format: "SINGLE_ELIM",
      status: "IN_PROGRESS",
      feeType: "FREE",
      maxParticipants: 8,
      registrationClosesAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      startsAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      description: "Copa de eliminación directa a un partido, sorteo aleatorio.",
      platformId: platforms.get("PS5")!,
      organizerId: users[0].id,
      ligaId: liga.id,
    },
  });

  const existingParticipants = await db.participant.findMany({
    where: { tournamentId: bracketTournament.id },
  });

  let participants = existingParticipants;
  if (existingParticipants.length === 0) {
    participants = await Promise.all(
      users.map((u, i) =>
        db.participant.create({
          data: {
            tournamentId: bracketTournament.id,
            userId: u.id,
            teamName: `Equipo ${u.name.split(" ")[0]}`,
            seed: i + 1,
          },
        })
      )
    );

    const bracket = generateSingleEliminationBracket(participants.map((p) => p.id));
    const byId = new Map(bracket.map((m) => [`${m.round}-${m.position}`, m]));

    // Simulate round 1 results deterministically so the seeded tournament
    // shows a realistic in-progress bracket.
    for (const match of bracket.filter((m) => m.round === 1 && m.status === "PENDING")) {
      const { updated, nextRound, nextPosition, advanceAsA } = recordMatchResult(
        match,
        3,
        1
      );
      byId.set(`${match.round}-${match.position}`, updated);
      const next = byId.get(`${nextRound}-${nextPosition}`);
      if (next) {
        if (advanceAsA) next.participantAId = updated.winnerId ?? null;
        else next.participantBId = updated.winnerId ?? null;
      }
    }

    for (const m of byId.values()) {
      await db.match.create({
        data: {
          tournamentId: bracketTournament.id,
          round: m.round,
          position: m.position,
          participantAId: m.participantAId,
          participantBId: m.participantBId,
          scoreA: m.scoreA ?? null,
          scoreB: m.scoreB ?? null,
          winnerId: m.winnerId ?? null,
          status: m.status,
        },
      });
    }
  }

  console.log("Sembrando torneo de liga (abierto a inscripción)...");
  const leagueTournament = await db.tournament.upsert({
    where: { slug: "liga-clausura-efootball" },
    update: {},
    create: {
      name: "Liga eFootball Clausura",
      slug: "liga-clausura-efootball",
      format: "LEAGUE",
      status: "REGISTRATION",
      feeType: "FREE",
      maxParticipants: 6,
      registrationClosesAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      description: "Todos contra todos a una vuelta. Inscripción abierta.",
      platformId: platforms.get("PC")!,
      organizerId: users[0].id,
      ligaId: liga.id,
    },
  });

  const leagueParticipants = await db.participant.findMany({
    where: { tournamentId: leagueTournament.id },
  });
  if (leagueParticipants.length === 0) {
    await Promise.all(
      users.slice(0, 3).map((u) =>
        db.participant.create({
          data: {
            tournamentId: leagueTournament.id,
            userId: u.id,
            teamName: `Equipo ${u.name.split(" ")[0]}`,
          },
        })
      )
    );
  }

  console.log("Sembrando torneo relámpago (por comenzar, sin inscritos)...");
  await db.tournament.upsert({
    where: { slug: "relampago-express" },
    update: {},
    create: {
      name: "Relámpago Express",
      slug: "relampago-express",
      format: "SINGLE_ELIM",
      status: "REGISTRATION",
      feeType: "FREE",
      maxParticipants: 4,
      registrationClosesAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      startsAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
      description: "Torneo rápido de 4 participantes, empieza en un par de horas.",
      platformId: platforms.get("PS4")!,
      organizerId: users[1].id,
    },
  });

  console.log("Listo. Usuarios demo con password: Demo1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });