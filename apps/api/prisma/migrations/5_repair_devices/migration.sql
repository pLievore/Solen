-- Aparelhos em assistência técnica.
CREATE TABLE IF NOT EXISTS "repair_devices" (
  "id" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "imageUrl" TEXT,
  "technicianId" TEXT,
  "technicianEmail" TEXT,
  "accessNotes" TEXT,
  "priorDefects" TEXT,
  "services" TEXT,
  "status" TEXT NOT NULL DEFAULT 'RECEBIDO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "repair_devices_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "repair_devices_status_idx" ON "repair_devices" ("status");
CREATE INDEX IF NOT EXISTS "repair_devices_technicianId_idx" ON "repair_devices" ("technicianId");
