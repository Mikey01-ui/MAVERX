-- Org-wide dashboard settings (notify email on register, etc.)
CREATE TABLE IF NOT EXISTS "OrgSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "notifyEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgSettings_pkey" PRIMARY KEY ("id")
);
