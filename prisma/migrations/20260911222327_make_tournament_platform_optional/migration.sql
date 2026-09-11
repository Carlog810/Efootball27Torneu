-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTRATION',
    "feeType" TEXT NOT NULL DEFAULT 'FREE',
    "legs" INTEGER NOT NULL DEFAULT 1,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "maxParticipants" INTEGER NOT NULL,
    "registrationClosesAt" DATETIME NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "platformId" TEXT,
    "organizerId" TEXT NOT NULL,
    "ligaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tournament_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tournament_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tournament_ligaId_fkey" FOREIGN KEY ("ligaId") REFERENCES "Liga" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("coverImage", "createdAt", "description", "feeType", "format", "id", "legs", "ligaId", "maxParticipants", "name", "organizerId", "platformId", "registrationClosesAt", "requireApproval", "slug", "startsAt", "status") SELECT "coverImage", "createdAt", "description", "feeType", "format", "id", "legs", "ligaId", "maxParticipants", "name", "organizerId", "platformId", "registrationClosesAt", "requireApproval", "slug", "startsAt", "status" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
