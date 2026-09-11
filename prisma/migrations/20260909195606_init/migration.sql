-- CreateTable
CREATE TABLE "Platform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "playerTag" TEXT NOT NULL,
    "platformPrefId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_platformPrefId_fkey" FOREIGN KEY ("platformPrefId") REFERENCES "Platform" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Liga" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "platformId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Liga_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTRATION',
    "feeType" TEXT NOT NULL DEFAULT 'FREE',
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

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "seed" INTEGER,
    "eliminatedRound" INTEGER,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Participant_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "participantAId" TEXT,
    "participantBId" TEXT,
    "scoreA" INTEGER,
    "scoreB" INTEGER,
    "winnerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_participantAId_fkey" FOREIGN KEY ("participantAId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_participantBId_fkey" FOREIGN KEY ("participantBId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "Participant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Platform_name_key" ON "Platform"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_playerTag_key" ON "User"("playerTag");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Liga_slug_key" ON "Liga"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_tournamentId_userId_key" ON "Participant"("tournamentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Match_tournamentId_round_position_key" ON "Match"("tournamentId", "round", "position");
