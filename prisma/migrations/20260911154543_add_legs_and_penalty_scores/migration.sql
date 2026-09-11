-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "leg" INTEGER NOT NULL DEFAULT 1,
    "participantAId" TEXT,
    "participantBId" TEXT,
    "scoreA" INTEGER,
    "scoreB" INTEGER,
    "penaltyScoreA" INTEGER,
    "penaltyScoreB" INTEGER,
    "winnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_participantAId_fkey" FOREIGN KEY ("participantAId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_participantBId_fkey" FOREIGN KEY ("participantBId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("id", "participantAId", "participantBId", "position", "round", "scoreA", "scoreB", "status", "tournamentId", "winnerId") SELECT "id", "participantAId", "participantBId", "position", "round", "scoreA", "scoreB", "status", "tournamentId", "winnerId" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE UNIQUE INDEX "Match_tournamentId_round_position_leg_key" ON "Match"("tournamentId", "round", "position", "leg");
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTRATION',
    "feeType" TEXT NOT NULL DEFAULT 'FREE',
    "legs" INTEGER NOT NULL DEFAULT 1,
    "maxParticipants" INTEGER NOT NULL,
    "registrationClosesAt" DATETIME NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "platformId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "ligaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tournament_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tournament_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tournament_ligaId_fkey" FOREIGN KEY ("ligaId") REFERENCES "Liga" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("coverImage", "createdAt", "description", "feeType", "format", "id", "ligaId", "maxParticipants", "name", "organizerId", "platformId", "registrationClosesAt", "slug", "startsAt", "status") SELECT "coverImage", "createdAt", "description", "feeType", "format", "id", "ligaId", "maxParticipants", "name", "organizerId", "platformId", "registrationClosesAt", "slug", "startsAt", "status" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
