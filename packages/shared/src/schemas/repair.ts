/** Itens de comprovação que o técnico anexa por aparelho. */
export const REPAIR_CHECKLIST = [
  {
    slot: "carcaca",
    label: "Carcaça",
    kind: "video",
    hint: "Vídeo até 5s: frente com a tela ligada, verso e laterais.",
  },
  {
    slot: "biometria",
    label: "Biometria",
    kind: "photo",
    hint: "Face ID / Touch ID funcionando (tela de cadastro iniciada sem erro).",
  },
  {
    slot: "cameras",
    label: "Câmeras",
    kind: "video",
    hint: "Vídeo até 10s: traseira 1x, ultra wide, teleobjetiva (se houver), frontal e flash.",
  },
  {
    slot: "energia",
    label: "Energia",
    kind: "photo",
    hint: "Foto da saúde da bateria.",
  },
  {
    slot: "botoes",
    label: "Botões",
    kind: "video",
    hint: "Vídeo até 5s: volume, power, botão de ação (15 Pro+) ou chave de silêncio.",
  },
] as const;

export type RepairSlot = (typeof REPAIR_CHECKLIST)[number]["slot"];

export const REPAIR_SLOTS: string[] = REPAIR_CHECKLIST.map((c) => c.slot);

/** Limite de duração de vídeo (segundos) para as comprovações. */
export const REPAIR_VIDEO_MAX_SECONDS = 10;

/**
 * Páginas do painel que podem ser concedidas a um papel personalizado.
 * "permissoes" e a gestão de usuários ficam de fora (sempre admin).
 */
export const ADMIN_PAGES = [
  { key: "dashboard", label: "Visão geral" },
  { key: "propostas", label: "Propostas" },
  { key: "catalogo", label: "Catálogo" },
  { key: "regras", label: "Regras de preço" },
  { key: "blog", label: "Blog" },
  { key: "assistencia", label: "Assistência técnica" },
  { key: "settings", label: "Configurações" },
] as const;

export type AdminPageKey = (typeof ADMIN_PAGES)[number]["key"];
export const ADMIN_PAGE_KEYS: string[] = ADMIN_PAGES.map((p) => p.key);
