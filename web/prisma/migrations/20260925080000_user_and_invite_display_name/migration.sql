-- AlterTable
ALTER TABLE "Invite" ADD COLUMN IF NOT EXISTS "playerName" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;
