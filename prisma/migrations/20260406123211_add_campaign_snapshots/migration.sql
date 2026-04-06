-- CreateTable
CREATE TABLE "CampaignSnapshot" (
    "id" TEXT NOT NULL,
    "adAccountId" TEXT NOT NULL,
    "datePreset" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "impressions" DOUBLE PRECISION,
    "clicks" DOUBLE PRECISION,
    "spend" DOUBLE PRECISION,
    "reach" DOUBLE PRECISION,
    "cpc" DOUBLE PRECISION,
    "cpm" DOUBLE PRECISION,
    "ctr" DOUBLE PRECISION,

    CONSTRAINT "CampaignSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSnapshot" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "adName" TEXT NOT NULL,
    "spend" DOUBLE PRECISION,
    "clicks" DOUBLE PRECISION,
    "ctr" DOUBLE PRECISION,
    "impressions" DOUBLE PRECISION,
    "cpc" DOUBLE PRECISION,
    "cpm" DOUBLE PRECISION,

    CONSTRAINT "AdSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignSnapshot_adAccountId_datePreset_capturedAt_idx" ON "CampaignSnapshot"("adAccountId", "datePreset", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignSnapshot_adAccountId_datePreset_capturedAt_key" ON "CampaignSnapshot"("adAccountId", "datePreset", "capturedAt");

-- AddForeignKey
ALTER TABLE "CampaignSnapshot" ADD CONSTRAINT "CampaignSnapshot_adAccountId_fkey" FOREIGN KEY ("adAccountId") REFERENCES "AdAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSnapshot" ADD CONSTRAINT "AdSnapshot_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "CampaignSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
