-- Mídias de comprovação (fotos/vídeos) dos aparelhos em assistência.
CREATE TABLE IF NOT EXISTS "repair_media" (
  "id" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "slot" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "repair_media_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "repair_media_deviceId_idx" ON "repair_media" ("deviceId");
CREATE INDEX IF NOT EXISTS "repair_media_createdAt_idx" ON "repair_media" ("createdAt");
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'repair_media_deviceId_fkey'
  ) THEN
    ALTER TABLE "repair_media"
      ADD CONSTRAINT "repair_media_deviceId_fkey"
      FOREIGN KEY ("deviceId") REFERENCES "repair_devices"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
