/**
 * Seed inicial do Vendy (Fase 0/1).
 * Idempotente: usa upsert por chaves estaveis (slug/key).
 * Valores em centavos.
 */
import { PrismaClient } from "@prisma/client";
import { OLDER_IPHONE_MODELS } from "./older-iphones";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});

const CATEGORIES = [
  "iPhones",
  "Apple Watches",
  "iPads",
  "AirPods",
  "Acessorios e perifericos",
  "Consoles",
  "Colecionaveis",
];

const CONDITION_STATES = [
  { key: "NEW", label: "Novo/lacrado", order: 0 },
  { key: "LIKE_NEW", label: "Seminovo sem marcas de uso", order: 1 },
  { key: "USED_LIGHT", label: "Usado com marcas de uso leves", order: 2 },
  { key: "USED_HEAVY", label: "Usado com marcas de uso fortes", order: 3 },
];

const KNOCKOUT = [
  {
    question: "O aparelho liga?",
    triggerAnswer: "NO",
    categorySlugs: [
      "iphones",
      "apple-watches",
      "ipads",
      "airpods",
      "consoles",
    ],
    order: 0,
  },
  {
    question: "O aparelho e bloqueado?",
    triggerAnswer: "YES",
    categorySlugs: ["iphones", "apple-watches", "ipads"],
    order: 1,
  },
];

// deltas em centavos (descontos negativos)
const DETAILED = [
  { key: "battery", question: "A bateria esta acima de 85%?", yesDelta: 0, noDelta: -10000, order: 0 },
  { key: "screen", question: "A tela do aparelho esta em perfeito funcionamento?", yesDelta: 0, noDelta: -25000, order: 1 },
  { key: "cameras", question: "As cameras funcionam perfeitamente?", yesDelta: 0, noDelta: -25000, order: 2 },
  { key: "face-id", question: "O Face ID funciona?", yesDelta: 0, noDelta: -25000, order: 3 },
  { key: "restriction", question: "O aparelho tem alguma restricao?", yesDelta: -15000, noDelta: 0, order: 4 },
  {
    key: "unknown-part",
    question: "O aparelho possui alguma mensagem de peca desconhecida?",
    helpText: "Como verificar: Ajustes > Geral > Sobre.",
    yesDelta: -15000,
    noDelta: 0,
    order: 5,
  },
  { key: "opened", question: "O aparelho ja foi aberto para manutencao?", yesDelta: -10000, noDelta: 0, order: 6 },
  { key: "charging", question: "O carregamento funciona normalmente?", yesDelta: 0, noDelta: -18000, order: 10 },
  { key: "audio-pair", question: "Os dois lados reproduzem audio normalmente?", yesDelta: 0, noDelta: -18000, order: 11 },
  { key: "case", question: "O estojo de carregamento funciona corretamente?", yesDelta: 0, noDelta: -15000, order: 12 },
  { key: "authentic", question: "O item e original e autentico?", yesDelta: 0, noDelta: -30000, order: 13 },
  { key: "complete", question: "Acompanha os acessorios essenciais originais?", yesDelta: 0, noDelta: -12000, order: 14 },
  { key: "ports", question: "Portas, botoes e conexoes funcionam corretamente?", yesDelta: 0, noDelta: -25000, order: 15 },
  { key: "video", question: "O aparelho transmite imagem e audio normalmente?", yesDelta: 0, noDelta: -35000, order: 16 },
  { key: "disc", question: "O leitor de discos funciona normalmente?", yesDelta: 0, noDelta: -30000, order: 17 },
  { key: "overheat", question: "O aparelho apresenta superaquecimento ou desligamentos?", yesDelta: -30000, noDelta: 0, order: 18 },
  { key: "box", question: "Possui caixa ou embalagem original?", yesDelta: 0, noDelta: -8000, order: 30 },
  { key: "collectible-auth", question: "A autenticidade pode ser comprovada?", yesDelta: 0, noDelta: -20000, order: 31 },
  { key: "collectible-complete", question: "O item esta completo, sem pecas ou componentes faltando?", yesDelta: 0, noDelta: -15000, order: 32 },
  { key: "collectible-damage", question: "Ha rasgos, trincas, manchas, restauracoes ou danos relevantes?", yesDelta: -20000, noDelta: 0, order: 33 },
];

const PHONE_DETAIL_KEYS = [
  "battery",
  "screen",
  "cameras",
  "face-id",
  "restriction",
  "unknown-part",
  "opened",
];

// ─── Catálogo de iPhones ───────────────────────────────────────────────────
// Preços em centavos [NEW, LIKE_NEW, USED_LIGHT, USED_HEAVY]
// Levemente abaixo do mercado de usados (posição de compra competitiva)
const IPHONE_MODELS = [
  ...OLDER_IPHONE_MODELS,
  {
    name: "iPhone 11", slug: "iphone-11", order: 0,
    variants: [
      { name: "iPhone 11 64GB",  storage: "64GB",  slug: "iphone-11-64gb",  scrap: 12000, prices: [90000,  78000,  62000,  48000]  },
      { name: "iPhone 11 128GB", storage: "128GB", slug: "iphone-11-128gb", scrap: 15000, prices: [99000,  86000,  70000,  54000]  },
      { name: "iPhone 11 256GB", storage: "256GB", slug: "iphone-11-256gb", scrap: 17000, prices: [108000, 95000,  78000,  60000]  },
    ],
  },
  {
    name: "iPhone 12 Mini", slug: "iphone-12-mini", order: 1,
    variants: [
      { name: "iPhone 12 Mini 64GB",  storage: "64GB",  slug: "iphone-12-mini-64gb",  scrap: 13000, prices: [99000,  86000,  70000,  55000]  },
      { name: "iPhone 12 Mini 128GB", storage: "128GB", slug: "iphone-12-mini-128gb", scrap: 16000, prices: [109000, 96000,  78000,  62000]  },
      { name: "iPhone 12 Mini 256GB", storage: "256GB", slug: "iphone-12-mini-256gb", scrap: 18000, prices: [120000, 106000, 86000,  69000]  },
    ],
  },
  {
    name: "iPhone 12", slug: "iphone-12", order: 2,
    variants: [
      { name: "iPhone 12 64GB",  storage: "64GB",  slug: "iphone-12-64gb",  scrap: 15000, prices: [120000, 105000, 85000,  68000]  },
      { name: "iPhone 12 128GB", storage: "128GB", slug: "iphone-12-128gb", scrap: 18000, prices: [130000, 115000, 95000,  76000]  },
      { name: "iPhone 12 256GB", storage: "256GB", slug: "iphone-12-256gb", scrap: 21000, prices: [144000, 127000, 105000, 84000]  },
    ],
  },
  {
    name: "iPhone 13 Mini", slug: "iphone-13-mini", order: 3,
    variants: [
      { name: "iPhone 13 Mini 128GB", storage: "128GB", slug: "iphone-13-mini-128gb", scrap: 18000, prices: [150000, 130000, 105000, 84000]  },
      { name: "iPhone 13 Mini 256GB", storage: "256GB", slug: "iphone-13-mini-256gb", scrap: 21000, prices: [165000, 143000, 116000, 93000]  },
      { name: "iPhone 13 Mini 512GB", storage: "512GB", slug: "iphone-13-mini-512gb", scrap: 24000, prices: [185000, 162000, 131000, 105000] },
    ],
  },
  {
    name: "iPhone 13", slug: "iphone-13", order: 4,
    variants: [
      { name: "iPhone 13 128GB", storage: "128GB", slug: "iphone-13-128gb", scrap: 20000, prices: [200000, 175000, 143000, 114000] },
      { name: "iPhone 13 256GB", storage: "256GB", slug: "iphone-13-256gb", scrap: 23000, prices: [220000, 193000, 158000, 126000] },
      { name: "iPhone 13 512GB", storage: "512GB", slug: "iphone-13-512gb", scrap: 28000, prices: [248000, 217000, 178000, 142000] },
    ],
  },
  {
    name: "iPhone 13 Pro", slug: "iphone-13-pro", order: 5,
    variants: [
      { name: "iPhone 13 Pro 128GB", storage: "128GB", slug: "iphone-13-pro-128gb", scrap: 25000, prices: [260000, 228000, 187000, 149000] },
      { name: "iPhone 13 Pro 256GB", storage: "256GB", slug: "iphone-13-pro-256gb", scrap: 29000, prices: [290000, 254000, 208000, 166000] },
      { name: "iPhone 13 Pro 512GB", storage: "512GB", slug: "iphone-13-pro-512gb", scrap: 33000, prices: [330000, 289000, 237000, 189000] },
      { name: "iPhone 13 Pro 1TB",   storage: "1TB",   slug: "iphone-13-pro-1tb",   scrap: 38000, prices: [380000, 333000, 273000, 218000] },
    ],
  },
  {
    name: "iPhone 13 Pro Max", slug: "iphone-13-pro-max", order: 6,
    variants: [
      { name: "iPhone 13 Pro Max 128GB", storage: "128GB", slug: "iphone-13-pro-max-128gb", scrap: 28000, prices: [290000, 254000, 208000, 166000] },
      { name: "iPhone 13 Pro Max 256GB", storage: "256GB", slug: "iphone-13-pro-max-256gb", scrap: 32000, prices: [320000, 280000, 230000, 184000] },
      { name: "iPhone 13 Pro Max 512GB", storage: "512GB", slug: "iphone-13-pro-max-512gb", scrap: 36000, prices: [360000, 315000, 258000, 206000] },
      { name: "iPhone 13 Pro Max 1TB",   storage: "1TB",   slug: "iphone-13-pro-max-1tb",   scrap: 41000, prices: [410000, 359000, 294000, 235000] },
    ],
  },
  {
    name: "iPhone 14", slug: "iphone-14", order: 7,
    variants: [
      { name: "iPhone 14 128GB", storage: "128GB", slug: "iphone-14-128gb", scrap: 30000, prices: [310000, 272000, 223000, 178000] },
      { name: "iPhone 14 256GB", storage: "256GB", slug: "iphone-14-256gb", scrap: 34000, prices: [345000, 302000, 247000, 198000] },
      { name: "iPhone 14 512GB", storage: "512GB", slug: "iphone-14-512gb", scrap: 39000, prices: [390000, 341000, 280000, 224000] },
    ],
  },
  {
    name: "iPhone 14 Plus", slug: "iphone-14-plus", order: 8,
    variants: [
      { name: "iPhone 14 Plus 128GB", storage: "128GB", slug: "iphone-14-plus-128gb", scrap: 33000, prices: [335000, 294000, 241000, 192000] },
      { name: "iPhone 14 Plus 256GB", storage: "256GB", slug: "iphone-14-plus-256gb", scrap: 37000, prices: [370000, 324000, 266000, 213000] },
      { name: "iPhone 14 Plus 512GB", storage: "512GB", slug: "iphone-14-plus-512gb", scrap: 42000, prices: [420000, 368000, 302000, 241000] },
    ],
  },
  {
    name: "iPhone 14 Pro", slug: "iphone-14-pro", order: 9,
    variants: [
      { name: "iPhone 14 Pro 128GB", storage: "128GB", slug: "iphone-14-pro-128gb", scrap: 42000, prices: [420000, 368000, 302000, 241000] },
      { name: "iPhone 14 Pro 256GB", storage: "256GB", slug: "iphone-14-pro-256gb", scrap: 47000, prices: [470000, 412000, 338000, 270000] },
      { name: "iPhone 14 Pro 512GB", storage: "512GB", slug: "iphone-14-pro-512gb", scrap: 53000, prices: [530000, 464000, 381000, 304000] },
      { name: "iPhone 14 Pro 1TB",   storage: "1TB",   slug: "iphone-14-pro-1tb",   scrap: 61000, prices: [610000, 534000, 438000, 350000] },
    ],
  },
  {
    name: "iPhone 14 Pro Max", slug: "iphone-14-pro-max", order: 10,
    variants: [
      { name: "iPhone 14 Pro Max 128GB", storage: "128GB", slug: "iphone-14-pro-max-128gb", scrap: 46000, prices: [460000, 403000, 331000, 264000] },
      { name: "iPhone 14 Pro Max 256GB", storage: "256GB", slug: "iphone-14-pro-max-256gb", scrap: 51000, prices: [510000, 447000, 367000, 293000] },
      { name: "iPhone 14 Pro Max 512GB", storage: "512GB", slug: "iphone-14-pro-max-512gb", scrap: 58000, prices: [580000, 508000, 417000, 333000] },
      { name: "iPhone 14 Pro Max 1TB",   storage: "1TB",   slug: "iphone-14-pro-max-1tb",   scrap: 67000, prices: [670000, 587000, 482000, 385000] },
    ],
  },
  {
    name: "iPhone 15", slug: "iphone-15", order: 11,
    variants: [
      { name: "iPhone 15 128GB", storage: "128GB", slug: "iphone-15-128gb", scrap: 47000, prices: [470000, 412000, 338000, 270000] },
      { name: "iPhone 15 256GB", storage: "256GB", slug: "iphone-15-256gb", scrap: 52000, prices: [520000, 456000, 374000, 299000] },
      { name: "iPhone 15 512GB", storage: "512GB", slug: "iphone-15-512gb", scrap: 59000, prices: [590000, 517000, 424000, 339000] },
    ],
  },
  {
    name: "iPhone 15 Plus", slug: "iphone-15-plus", order: 12,
    variants: [
      { name: "iPhone 15 Plus 128GB", storage: "128GB", slug: "iphone-15-plus-128gb", scrap: 51000, prices: [510000, 447000, 367000, 293000] },
      { name: "iPhone 15 Plus 256GB", storage: "256GB", slug: "iphone-15-plus-256gb", scrap: 57000, prices: [570000, 499000, 410000, 327000] },
      { name: "iPhone 15 Plus 512GB", storage: "512GB", slug: "iphone-15-plus-512gb", scrap: 65000, prices: [650000, 570000, 468000, 374000] },
    ],
  },
  {
    name: "iPhone 15 Pro", slug: "iphone-15-pro", order: 13,
    variants: [
      { name: "iPhone 15 Pro 128GB", storage: "128GB", slug: "iphone-15-pro-128gb", scrap: 63000, prices: [630000, 552000, 453000, 362000] },
      { name: "iPhone 15 Pro 256GB", storage: "256GB", slug: "iphone-15-pro-256gb", scrap: 70000, prices: [700000, 613000, 503000, 402000] },
      { name: "iPhone 15 Pro 512GB", storage: "512GB", slug: "iphone-15-pro-512gb", scrap: 79000, prices: [790000, 692000, 568000, 454000] },
      { name: "iPhone 15 Pro 1TB",   storage: "1TB",   slug: "iphone-15-pro-1tb",   scrap: 91000, prices: [910000, 797000, 654000, 523000] },
    ],
  },
  {
    name: "iPhone 15 Pro Max", slug: "iphone-15-pro-max", order: 14,
    variants: [
      { name: "iPhone 15 Pro Max 256GB", storage: "256GB", slug: "iphone-15-pro-max-256gb", scrap: 80000, prices: [800000,  701000,  575000,  460000]  },
      { name: "iPhone 15 Pro Max 512GB", storage: "512GB", slug: "iphone-15-pro-max-512gb", scrap: 90000, prices: [900000,  789000,  648000,  518000]  },
      { name: "iPhone 15 Pro Max 1TB",   storage: "1TB",   slug: "iphone-15-pro-max-1tb",   scrap: 104000, prices: [1040000, 911000,  748000,  598000] },
    ],
  },
  {
    name: "iPhone 16", slug: "iphone-16", order: 15,
    variants: [
      { name: "iPhone 16 128GB", storage: "128GB", slug: "iphone-16-128gb", scrap: 58000, prices: [580000, 509000, 418000, 334000] },
      { name: "iPhone 16 256GB", storage: "256GB", slug: "iphone-16-256gb", scrap: 65000, prices: [650000, 570000, 468000, 374000] },
      { name: "iPhone 16 512GB", storage: "512GB", slug: "iphone-16-512gb", scrap: 74000, prices: [740000, 649000, 533000, 426000] },
    ],
  },
  {
    name: "iPhone 16 Plus", slug: "iphone-16-plus", order: 16,
    variants: [
      { name: "iPhone 16 Plus 128GB", storage: "128GB", slug: "iphone-16-plus-128gb", scrap: 64000, prices: [640000, 561000, 461000, 369000] },
      { name: "iPhone 16 Plus 256GB", storage: "256GB", slug: "iphone-16-plus-256gb", scrap: 72000, prices: [720000, 631000, 518000, 414000] },
      { name: "iPhone 16 Plus 512GB", storage: "512GB", slug: "iphone-16-plus-512gb", scrap: 82000, prices: [820000, 719000, 590000, 472000] },
    ],
  },
  {
    name: "iPhone 16 Pro", slug: "iphone-16-pro", order: 17,
    variants: [
      { name: "iPhone 16 Pro 128GB", storage: "128GB", slug: "iphone-16-pro-128gb", scrap: 83000,  prices: [830000,  728000,  598000,  478000]  },
      { name: "iPhone 16 Pro 256GB", storage: "256GB", slug: "iphone-16-pro-256gb", scrap: 92000,  prices: [920000,  807000,  663000,  530000]  },
      { name: "iPhone 16 Pro 512GB", storage: "512GB", slug: "iphone-16-pro-512gb", scrap: 105000, prices: [1050000, 920000,  756000,  604000] },
      { name: "iPhone 16 Pro 1TB",   storage: "1TB",   slug: "iphone-16-pro-1tb",   scrap: 120000, prices: [1200000, 1052000, 864000,  690000] },
    ],
  },
  {
    name: "iPhone 16 Pro Max", slug: "iphone-16-pro-max", order: 18,
    variants: [
      { name: "iPhone 16 Pro Max 256GB", storage: "256GB", slug: "iphone-16-pro-max-256gb", scrap: 105000, prices: [1050000, 920000,  756000,  604000]  },
      { name: "iPhone 16 Pro Max 512GB", storage: "512GB", slug: "iphone-16-pro-max-512gb", scrap: 120000, prices: [1200000, 1052000, 864000,  690000]  },
      { name: "iPhone 16 Pro Max 1TB",   storage: "1TB",   slug: "iphone-16-pro-max-1tb",   scrap: 138000, prices: [1380000, 1210000, 994000,  794000] },
    ],
  },
];

const WATCH_DETAIL_KEYS = ["battery", "screen", "charging", "restriction", "opened"];
const IPAD_DETAIL_KEYS = ["battery", "screen", "cameras", "charging", "restriction", "opened"];
const AIRPODS_DETAIL_KEYS = ["audio-pair", "case", "charging", "authentic", "complete"];
const ACCESSORY_DETAIL_KEYS = ["charging", "ports", "authentic", "complete"];
const CONSOLE_DETAIL_KEYS = ["video", "ports", "overheat", "opened", "complete"];
const COLLECTIBLE_DETAIL_KEYS = [
  "box",
  "collectible-auth",
  "collectible-complete",
  "collectible-damage",
];

const OTHER_CATALOG = [
  {
    category: "Apple Watches",
    detailKeys: WATCH_DETAIL_KEYS,
    models: [
      { name: "Apple Watch Series 5", slug: "apple-watch-series-5", variants: [
        { name: "Series 5 GPS 40mm", slug: "series-5-gps-40mm", scrap: 10000, prices: [110000, 90000, 72000, 50000] },
        { name: "Series 5 GPS 44mm", slug: "series-5-gps-44mm", scrap: 12000, prices: [120000, 98000, 79000, 55000] },
      ] },
      { name: "Apple Watch Series 6", slug: "apple-watch-series-6", variants: [
        { name: "Series 6 GPS 40mm", slug: "series-6-gps-40mm", scrap: 12000, prices: [135000, 110000, 90000, 63000] },
        { name: "Series 6 GPS 44mm", slug: "series-6-gps-44mm", scrap: 14000, prices: [145000, 120000, 98000, 69000] },
      ] },
      { name: "Apple Watch Series 7", slug: "apple-watch-series-7", variants: [
        { name: "Series 7 GPS 41mm", slug: "series-7-gps-41mm", scrap: 16000, prices: [170000, 138000, 112000, 80000] },
        { name: "Series 7 GPS 45mm", slug: "series-7-gps-45mm", scrap: 18000, prices: [180000, 148000, 120000, 85000] },
      ] },
      { name: "Apple Watch SE 2", slug: "apple-watch-se-2", variants: [
        { name: "SE 2 GPS 40mm", slug: "se-2-gps-40mm", scrap: 16000, prices: [175000, 145000, 118000, 84000] },
        { name: "SE 2 GPS 44mm", slug: "se-2-gps-44mm", scrap: 18000, prices: [190000, 157000, 128000, 91000] },
      ] },
      { name: "Apple Watch Series 8", slug: "apple-watch-series-8", variants: [
        { name: "Series 8 GPS 41mm", slug: "series-8-gps-41mm", scrap: 20000, prices: [220000, 180000, 145000, 104000] },
        { name: "Series 8 GPS 45mm", slug: "series-8-gps-45mm", scrap: 22000, prices: [235000, 192000, 156000, 112000] },
      ] },
      { name: "Apple Watch Series 9", slug: "apple-watch-series-9", variants: [
        { name: "Series 9 GPS 41mm", slug: "series-9-gps-41mm", scrap: 24000, prices: [270000, 220000, 178000, 128000] },
        { name: "Series 9 GPS 45mm", slug: "series-9-gps-45mm", scrap: 27000, prices: [290000, 238000, 193000, 138000] },
      ] },
      { name: "Apple Watch Ultra", slug: "apple-watch-ultra", variants: [
        { name: "Ultra 1 GPS + Cellular 49mm", slug: "ultra-1-49mm", scrap: 40000, prices: [440000, 360000, 295000, 220000] },
        { name: "Ultra 2 GPS + Cellular 49mm", slug: "ultra-2-49mm", scrap: 52000, prices: [580000, 480000, 395000, 295000] },
      ] },
    ],
  },
  {
    category: "iPads",
    detailKeys: IPAD_DETAIL_KEYS,
    models: [
      { name: "iPad 8a geracao", slug: "ipad-8", variants: [
        { name: "iPad 8 Wi-Fi 32GB", storage: "32GB", slug: "ipad-8-wifi-32gb", scrap: 18000, prices: [185000, 150000, 122000, 88000] },
        { name: "iPad 8 Wi-Fi 128GB", storage: "128GB", slug: "ipad-8-wifi-128gb", scrap: 22000, prices: [230000, 188000, 153000, 110000] },
      ] },
      { name: "iPad 9a geracao", slug: "ipad-9", variants: [
        { name: "iPad 9 Wi-Fi 64GB", storage: "64GB", slug: "ipad-9-wifi-64gb", scrap: 24000, prices: [245000, 200000, 163000, 118000] },
        { name: "iPad 9 Wi-Fi 256GB", storage: "256GB", slug: "ipad-9-wifi-256gb", scrap: 32000, prices: [330000, 270000, 220000, 160000] },
      ] },
      { name: "iPad 10a geracao", slug: "ipad-10", variants: [
        { name: "iPad 10 Wi-Fi 64GB", storage: "64GB", slug: "ipad-10-wifi-64gb", scrap: 32000, prices: [350000, 285000, 232000, 168000] },
        { name: "iPad 10 Wi-Fi 256GB", storage: "256GB", slug: "ipad-10-wifi-256gb", scrap: 42000, prices: [460000, 375000, 305000, 222000] },
      ] },
      { name: "iPad Mini 6", slug: "ipad-mini-6", variants: [
        { name: "iPad Mini 6 Wi-Fi 64GB", storage: "64GB", slug: "ipad-mini-6-64gb", scrap: 34000, prices: [390000, 320000, 260000, 190000] },
        { name: "iPad Mini 6 Wi-Fi 256GB", storage: "256GB", slug: "ipad-mini-6-256gb", scrap: 44000, prices: [500000, 410000, 335000, 245000] },
      ] },
      { name: "iPad Air 4", slug: "ipad-air-4", variants: [
        { name: "iPad Air 4 Wi-Fi 64GB", storage: "64GB", slug: "ipad-air-4-64gb", scrap: 32000, prices: [370000, 300000, 245000, 178000] },
        { name: "iPad Air 4 Wi-Fi 256GB", storage: "256GB", slug: "ipad-air-4-256gb", scrap: 42000, prices: [480000, 392000, 320000, 232000] },
      ] },
      { name: "iPad Air 5 M1", slug: "ipad-air-5", variants: [
        { name: "iPad Air 5 Wi-Fi 64GB", storage: "64GB", slug: "ipad-air-5-64gb", scrap: 42000, prices: [480000, 390000, 318000, 232000] },
        { name: "iPad Air 5 Wi-Fi 256GB", storage: "256GB", slug: "ipad-air-5-256gb", scrap: 54000, prices: [610000, 500000, 408000, 298000] },
      ] },
      { name: "iPad Pro 11 M1", slug: "ipad-pro-11-m1", variants: [
        { name: "iPad Pro 11 M1 Wi-Fi 128GB", storage: "128GB", slug: "ipad-pro-11-m1-128gb", scrap: 50000, prices: [560000, 455000, 372000, 270000] },
        { name: "iPad Pro 11 M1 Wi-Fi 256GB", storage: "256GB", slug: "ipad-pro-11-m1-256gb", scrap: 58000, prices: [650000, 530000, 433000, 315000] },
      ] },
    ],
  },
  {
    category: "AirPods",
    detailKeys: AIRPODS_DETAIL_KEYS,
    models: [
      { name: "AirPods 2a geracao", slug: "airpods-2", variants: [
        { name: "AirPods 2 com estojo Lightning", slug: "airpods-2-lightning", scrap: 5000, prices: [75000, 56000, 40000, 24000] },
      ] },
      { name: "AirPods 3a geracao", slug: "airpods-3", variants: [
        { name: "AirPods 3 com estojo Lightning", slug: "airpods-3-lightning", scrap: 7000, prices: [110000, 83000, 62000, 37000] },
        { name: "AirPods 3 com estojo MagSafe", slug: "airpods-3-magsafe", scrap: 8000, prices: [125000, 94000, 70000, 42000] },
      ] },
      { name: "AirPods Pro", slug: "airpods-pro", variants: [
        { name: "AirPods Pro 1a geracao", slug: "airpods-pro-1", scrap: 7000, prices: [105000, 78000, 58000, 34000] },
        { name: "AirPods Pro 2 Lightning", slug: "airpods-pro-2-lightning", scrap: 10000, prices: [145000, 110000, 84000, 50000] },
        { name: "AirPods Pro 2 USB-C", slug: "airpods-pro-2-usbc", scrap: 12000, prices: [165000, 125000, 95000, 57000] },
      ] },
      { name: "AirPods Max", slug: "airpods-max", variants: [
        { name: "AirPods Max Lightning", slug: "airpods-max-lightning", scrap: 28000, prices: [360000, 285000, 230000, 165000] },
        { name: "AirPods Max USB-C", slug: "airpods-max-usbc", scrap: 35000, prices: [450000, 355000, 288000, 205000] },
      ] },
    ],
  },
  {
    category: "Acessorios e perifericos",
    detailKeys: ACCESSORY_DETAIL_KEYS,
    models: [
      { name: "Apple Pencil", slug: "apple-pencil", variants: [
        { name: "Apple Pencil 1a geracao", slug: "apple-pencil-1", scrap: 3000, prices: [48000, 35000, 25000, 14000] },
        { name: "Apple Pencil 2a geracao", slug: "apple-pencil-2", scrap: 5000, prices: [68000, 50000, 37000, 21000] },
        { name: "Apple Pencil Pro", slug: "apple-pencil-pro", scrap: 7000, prices: [88000, 65000, 49000, 28000] },
      ] },
      { name: "Teclados Apple", slug: "teclados-apple", variants: [
        { name: "Magic Keyboard para Mac", slug: "magic-keyboard-mac", scrap: 5000, prices: [65000, 48000, 35000, 20000] },
        { name: "Magic Keyboard para iPad 11", slug: "magic-keyboard-ipad-11", scrap: 12000, prices: [150000, 115000, 85000, 52000] },
        { name: "Magic Keyboard para iPad 12.9", slug: "magic-keyboard-ipad-129", scrap: 15000, prices: [180000, 138000, 102000, 62000] },
      ] },
      { name: "Mouses Apple", slug: "mouses-apple", variants: [
        { name: "Magic Mouse 2", slug: "magic-mouse-2", scrap: 3000, prices: [48000, 35000, 25000, 14000] },
      ] },
      { name: "Controles de videogame", slug: "controles-videogame", variants: [
        { name: "DualSense PS5", slug: "dualsense-ps5", scrap: 4000, prices: [48000, 35000, 25000, 14000] },
        { name: "Controle Xbox Series", slug: "controle-xbox-series", scrap: 3500, prices: [43000, 31000, 22000, 12500] },
        { name: "Par Joy-Con Nintendo Switch", slug: "joy-con-switch", scrap: 4500, prices: [52000, 38000, 27000, 15000] },
      ] },
    ],
  },
  {
    category: "Consoles",
    detailKeys: CONSOLE_DETAIL_KEYS,
    models: [
      { name: "PlayStation 4", slug: "playstation-4", variants: [
        { name: "PS4 Slim 1TB", storage: "1TB", slug: "ps4-slim-1tb", scrap: 18000, prices: [175000, 140000, 110000, 76000], detailKeys: [...CONSOLE_DETAIL_KEYS, "disc"] },
        { name: "PS4 Pro 1TB", storage: "1TB", slug: "ps4-pro-1tb", scrap: 24000, prices: [235000, 190000, 150000, 104000], detailKeys: [...CONSOLE_DETAIL_KEYS, "disc"] },
      ] },
      { name: "PlayStation 5", slug: "playstation-5", variants: [
        { name: "PS5 Digital", slug: "ps5-digital", scrap: 36000, prices: [350000, 285000, 232000, 170000] },
        { name: "PS5 com leitor", slug: "ps5-leitor", scrap: 42000, prices: [410000, 330000, 270000, 198000], detailKeys: [...CONSOLE_DETAIL_KEYS, "disc"] },
        { name: "PS5 Slim com leitor", slug: "ps5-slim-leitor", scrap: 46000, prices: [450000, 365000, 298000, 218000], detailKeys: [...CONSOLE_DETAIL_KEYS, "disc"] },
      ] },
      { name: "Xbox", slug: "xbox", variants: [
        { name: "Xbox One S 1TB", storage: "1TB", slug: "xbox-one-s-1tb", scrap: 18000, prices: [175000, 140000, 110000, 76000], detailKeys: [...CONSOLE_DETAIL_KEYS, "disc"] },
        { name: "Xbox Series S 512GB", storage: "512GB", slug: "xbox-series-s-512gb", scrap: 24000, prices: [245000, 198000, 160000, 116000] },
        { name: "Xbox Series X 1TB", storage: "1TB", slug: "xbox-series-x-1tb", scrap: 42000, prices: [440000, 355000, 290000, 212000], detailKeys: [...CONSOLE_DETAIL_KEYS, "disc"] },
      ] },
      { name: "Nintendo Switch", slug: "nintendo-switch", variants: [
        { name: "Nintendo Switch Lite", slug: "switch-lite", scrap: 12000, prices: [135000, 105000, 80000, 54000] },
        { name: "Nintendo Switch V2", slug: "switch-v2", scrap: 18000, prices: [210000, 168000, 132000, 92000] },
        { name: "Nintendo Switch OLED", storage: "64GB", slug: "switch-oled", scrap: 22000, prices: [250000, 200000, 160000, 114000] },
      ] },
    ],
  },
  {
    category: "Colecionaveis",
    detailKeys: COLLECTIBLE_DETAIL_KEYS,
    manualReview: true,
    models: [
      { name: "Funko Pop", slug: "funko-pop", variants: [
        { name: "Funko Pop comum", slug: "funko-pop-comum", scrap: 1000, prices: [15000, 10500, 7000, 3500] },
        { name: "Funko Pop exclusivo ou importado", slug: "funko-pop-exclusivo", scrap: 2500, prices: [38000, 26000, 17000, 8500] },
        { name: "Funko Pop Chase ou raro", slug: "funko-pop-raro", scrap: 5000, prices: [85000, 56000, 36000, 18000] },
      ] },
      { name: "Action figures e estatuas", slug: "action-figures", variants: [
        { name: "Figura basica ou articulada", slug: "figura-basica", scrap: 2000, prices: [32000, 22000, 14500, 7500] },
        { name: "Figura premium ou importada", slug: "figura-premium", scrap: 6000, prices: [95000, 65000, 43000, 23000] },
        { name: "Estatua limitada ou numerada", slug: "estatua-limitada", scrap: 12000, prices: [220000, 145000, 95000, 50000] },
      ] },
      { name: "Cards e TCG", slug: "cards-tcg", variants: [
        { name: "Carta graduada ou individual relevante", slug: "card-graduado", scrap: 1000, prices: [55000, 32000, 19000, 9000] },
        { name: "Produto selado", slug: "tcg-selado", scrap: 4000, prices: [120000, 82000, 54000, 28000] },
        { name: "Colecao ou lote", slug: "tcg-lote", scrap: 3000, prices: [90000, 58000, 36000, 18000] },
      ] },
      { name: "Games retro", slug: "games-retro", variants: [
        { name: "Jogo comum sem caixa", slug: "game-retro-solto", scrap: 1000, prices: [16000, 10000, 6500, 3000] },
        { name: "Jogo completo com caixa e manual", slug: "game-retro-completo", scrap: 2500, prices: [38000, 24000, 15000, 7500] },
        { name: "Jogo raro ou edicao especial", slug: "game-retro-raro", scrap: 6000, prices: [110000, 68000, 40000, 18000] },
      ] },
      { name: "Consoles retro", slug: "consoles-retro", variants: [
        { name: "Console 8 ou 16 bits", slug: "console-retro-16bit", scrap: 5000, prices: [75000, 48000, 30000, 16000] },
        { name: "Console 32 ou 64 bits", slug: "console-retro-64bit", scrap: 8000, prices: [130000, 82000, 52000, 27000] },
        { name: "Edicao especial ou console raro", slug: "console-retro-raro", scrap: 15000, prices: [280000, 170000, 100000, 50000] },
      ] },
    ],
  },
];

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  // Estados base (fixos)
  for (const s of CONDITION_STATES) {
    await prisma.conditionState.upsert({
      where: { key: s.key },
      update: { label: s.label, order: s.order },
      create: s,
    });
  }

  // Categorias
  const categoryBySlug: Record<string, string> = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const name = CATEGORIES[i];
    const slug = slugify(name);
    const cat = await prisma.category.upsert({
      where: { slug },
      update: { name, order: i },
      create: { name, slug, order: i },
    });
    categoryBySlug[slug] = cat.id;
  }

  // Perguntas eliminatorias
  for (const k of KNOCKOUT) {
    const existing = await prisma.knockoutQuestion.findFirst({
      where: { question: k.question },
    });
    if (existing) {
      await prisma.knockoutQuestion.update({ where: { id: existing.id }, data: k });
    } else {
      await prisma.knockoutQuestion.create({ data: k });
    }
  }

  // Estados detalhados (perguntas de desconto)
  const detailedIdByKey: Record<string, string> = {};
  for (const d of DETAILED) {
    const { key, ...data } = d;
    const existing = await prisma.detailedState.findFirst({
      where: { question: data.question },
    });
    const row = existing
      ? await prisma.detailedState.update({ where: { id: existing.id }, data })
      : await prisma.detailedState.create({ data });
    detailedIdByKey[key] = row.id;
  }

  const states = await prisma.conditionState.findMany();
  const stateOrder = ["NEW", "LIKE_NEW", "USED_LIGHT", "USED_HEAVY"];

  async function seedModels(
    categoryName: string,
    models: Array<{
      name: string;
      slug: string;
      order?: number;
      detailKeys?: string[];
      variants: Array<{
        name: string;
        slug: string;
        storage?: string;
        scrap: number;
        prices: number[];
        detailKeys?: string[];
      }>;
    }>,
    defaultDetailKeys: string[],
    manualReview = false,
  ) {
    const categoryId = categoryBySlug[slugify(categoryName)];

    for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
      const modelData = models[modelIndex];
      const model = await prisma.deviceModel.upsert({
        where: {
          categoryId_slug: { categoryId, slug: modelData.slug },
        },
        update: {
          name: modelData.name,
          order: modelData.order ?? modelIndex,
          active: true,
        },
        create: {
          categoryId,
          name: modelData.name,
          slug: modelData.slug,
          order: modelData.order ?? modelIndex,
        },
      });

      await Promise.all(modelData.variants.map(async (variantData) => {
        const variantId = `${model.id}-${variantData.slug}`;
        const specs = manualReview
          ? {
              manualReview: true,
              reviewMessage:
                "Estimativa inicial. A oferta final depende de fotos, autenticidade, raridade e conservacao.",
            }
          : undefined;
        const variant = await prisma.variant.upsert({
          where: { id: variantId },
          update: {
            name: variantData.name,
            storage: variantData.storage,
            scrapPrice: variantData.scrap,
            specs,
            active: true,
          },
          create: {
            id: variantId,
            modelId: model.id,
            name: variantData.name,
            storage: variantData.storage,
            slug: variantData.slug,
            scrapPrice: variantData.scrap,
            specs,
          },
        });

        const detailKeys =
          variantData.detailKeys ?? modelData.detailKeys ?? defaultDetailKeys;
        const detailedStateIds = detailKeys.map(
          (key) => detailedIdByKey[key],
        );
        const prices = states.map((state) => {
          const priceIndex = stateOrder.indexOf(state.key);
          return {
            variantId: variant.id,
            conditionStateId: state.id,
            price: priceIndex >= 0 ? variantData.prices[priceIndex] ?? 0 : 0,
          };
        });
        await prisma.$transaction([
          prisma.variantPrice.deleteMany({
            where: { variantId: variant.id },
          }),
          prisma.variantPrice.createMany({ data: prices }),
          prisma.variantDetailedState.deleteMany({
            where: { variantId: variant.id },
          }),
          prisma.variantDetailedState.createMany({
            data: detailedStateIds.map((detailedStateId) => ({
              variantId: variant.id,
              detailedStateId,
            })),
          }),
        ]);
      }));
    }
  }

  for (const catalog of OTHER_CATALOG) {
    await seedModels(
      catalog.category,
      catalog.models,
      catalog.detailKeys,
      catalog.manualReview ?? false,
    );
  }
  if (process.env.SEED_SKIP_IPHONES !== "true") {
    await seedModels("iPhones", IPHONE_MODELS, PHONE_DETAIL_KEYS);
  }

  // Configuracoes iniciais
  const settings: Record<string, unknown> = {
    whatsapp_phone: process.env.WHATSAPP_PHONE ?? "5599999999999",
    "home.headline": "Venda seus usados na hora",
    "scrap.defaultValue": 10000,
    notify_email: "",
    whatsapp_message_template:
      "Ola! Acabei de fazer a avaliacao no. {token} no site. Aparelho: {variant} - Estado: {condition}. Proposta: {value}. Ponto de coleta: {pickup}.",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: value as any },
      create: { key, value: value as any },
    });
  }

  let totalModels = IPHONE_MODELS.length;
  let totalVariants = IPHONE_MODELS.reduce(
    (sum, model) => sum + model.variants.length,
    0,
  );
  for (const catalog of OTHER_CATALOG) {
    totalModels += catalog.models.length;
    for (const model of catalog.models) {
      totalVariants += model.variants.length;
    }
  }
  console.log(`Seed concluido: ${totalModels} modelos, ${totalVariants} variantes, categorias, estados e settings.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
