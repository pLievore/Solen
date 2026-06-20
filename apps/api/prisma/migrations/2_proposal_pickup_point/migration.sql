-- Ponto de coleta escolhido pelo vendedor (ou "Envio pelos Correios").
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "pickupPoint" TEXT;
