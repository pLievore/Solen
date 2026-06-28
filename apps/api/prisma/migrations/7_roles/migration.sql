-- Papéis/permissões configuráveis.
CREATE TABLE IF NOT EXISTS "roles" (
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "isAdmin" BOOLEAN NOT NULL DEFAULT false,
  "builtin" BOOLEAN NOT NULL DEFAULT false,
  "pages" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("key")
);

-- Papéis padrão.
INSERT INTO "roles" ("key", "label", "isAdmin", "builtin", "pages", "updatedAt")
VALUES
  ('admin', 'Administrador', true, true, '[]'::jsonb, CURRENT_TIMESTAMP),
  ('tecnico', 'Técnico', false, true, '["assistencia"]'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
