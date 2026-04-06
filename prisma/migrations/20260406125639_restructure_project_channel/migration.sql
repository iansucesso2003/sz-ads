-- DropIndex
DROP INDEX "CampaignSnapshot_adAccountId_datePreset_capturedAt_key";

-- AlterTable
ALTER TABLE "Channel" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "updatedAt" DROP DEFAULT;
