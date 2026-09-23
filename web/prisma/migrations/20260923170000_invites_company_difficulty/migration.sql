-- AlterTable
ALTER TABLE "Group" ADD COLUMN "company" TEXT;
ALTER TABLE "Group" ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'standard';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "User" ADD COLUMN "company" TEXT;

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "groupId" TEXT,
    "email" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "difficulty" TEXT NOT NULL DEFAULT 'standard',
    "company" TEXT,
    "cohortLabel" TEXT,
    "seats" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "usedByUserId" TEXT,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_status_idx" ON "Invite"("status");

-- CreateIndex
CREATE INDEX "Invite_groupId_idx" ON "Invite"("groupId");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
