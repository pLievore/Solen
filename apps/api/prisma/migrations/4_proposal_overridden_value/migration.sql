-- Valor ajustado manualmente no painel (mantem o calculatedValue original).
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "overriddenValue" INTEGER;
