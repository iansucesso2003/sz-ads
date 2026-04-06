-- Restructure: AdAccount → Project + Channel
-- Existing AdAccount rows are migrated automatically
-- Project.id = AdAccount.id (preserves all existing URLs/references)

-- 1. Create Project table
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- 2. Create Channel table
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "adAccountId" TEXT,
    "accountName" TEXT,
    "accessToken" TEXT,
    "customerId" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- 3. Migrate AdAccount → Project (keep same IDs)
INSERT INTO "Project" ("id", "organizationId", "name", "createdAt", "updatedAt")
SELECT
    "id",
    "organizationId",
    COALESCE("accountName", "adAccountId"),
    "createdAt",
    "updatedAt"
FROM "AdAccount";

-- 4. Migrate AdAccount → Channel (META)
INSERT INTO "Channel" ("id", "projectId", "platform", "adAccountId", "accountName", "accessToken", "tokenExpiresAt", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "id",
    'META',
    "adAccountId",
    "accountName",
    "accessToken",
    "tokenExpiresAt",
    "createdAt",
    "updatedAt"
FROM "AdAccount";

-- 5. Add FK: Project → Organization
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Add FK + unique: Channel → Project
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Channel" ADD CONSTRAINT "Channel_projectId_platform_key"
    UNIQUE ("projectId", "platform");

-- 7. Update CampaignSnapshot: adAccountId → projectId, platform column, update FK
ALTER TABLE "CampaignSnapshot" RENAME COLUMN "adAccountId" TO "projectId";

ALTER TABLE "CampaignSnapshot" ADD COLUMN IF NOT EXISTS "platform" TEXT NOT NULL DEFAULT 'META';

ALTER TABLE "CampaignSnapshot" DROP CONSTRAINT IF EXISTS "CampaignSnapshot_adAccountId_fkey";
ALTER TABLE "CampaignSnapshot" DROP CONSTRAINT IF EXISTS "CampaignSnapshot_adAccountId_datePreset_capturedAt_key";

ALTER TABLE "CampaignSnapshot" ADD CONSTRAINT "CampaignSnapshot_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Recreate indexes
DROP INDEX IF EXISTS "CampaignSnapshot_adAccountId_datePreset_capturedAt_idx";
CREATE INDEX "CampaignSnapshot_projectId_platform_datePreset_capturedAt_idx"
    ON "CampaignSnapshot"("projectId", "platform", "datePreset", "capturedAt");

CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");
CREATE INDEX "Channel_projectId_idx" ON "Channel"("projectId");

-- 9. Drop old AdAccount table
DROP TABLE "AdAccount";
