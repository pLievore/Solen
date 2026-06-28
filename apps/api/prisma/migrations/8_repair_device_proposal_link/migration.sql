-- Vincula aparelhos da assistência a propostas/leads (opcional).
ALTER TABLE "repair_devices" ADD COLUMN IF NOT EXISTS "proposalId" TEXT;

CREATE INDEX IF NOT EXISTS "repair_devices_proposalId_idx" ON "repair_devices" ("proposalId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'repair_devices_proposalId_fkey'
  ) THEN
    ALTER TABLE "repair_devices"
      ADD CONSTRAINT "repair_devices_proposalId_fkey"
      FOREIGN KEY ("proposalId") REFERENCES "proposals" ("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
