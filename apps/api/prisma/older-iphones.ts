/**
 * iPhones anteriores ao iPhone 11 (Touch ID e primeiros Face ID).
 * Precos em centavos [NEW, LIKE_NEW, USED_LIGHT, USED_HEAVY] - valores de compra
 * (buyback), abaixo do mercado e escalonados logo abaixo do iPhone 11.
 *
 * Ordenacao: os modelos usam `order` NEGATIVO (-13..-1) para aparecerem ANTES
 * do iPhone 11 (order 0) na vitrine, sem precisar reordenar o catalogo atual.
 *
 * detailKeys:
 *  - TOUCHID_KEYS: modelos com Touch ID (sem pergunta de Face ID).
 *  - FACEID_KEYS : modelos com Face ID (iPhone X em diante).
 */

export const FACEID_KEYS = [
  "battery",
  "screen",
  "cameras",
  "face-id",
  "restriction",
  "unknown-part",
  "opened",
];

export const TOUCHID_KEYS = [
  "battery",
  "screen",
  "cameras",
  "restriction",
  "unknown-part",
  "opened",
];

type OlderVariant = {
  name: string;
  storage: string;
  slug: string;
  scrap: number;
  prices: [number, number, number, number];
};

type OlderModel = {
  name: string;
  slug: string;
  order: number;
  detailKeys: string[];
  variants: OlderVariant[];
};

export const OLDER_IPHONE_MODELS: OlderModel[] = [
  {
    name: "iPhone 6", slug: "iphone-6", order: -13, detailKeys: TOUCHID_KEYS,
    variants: [
      { name: "iPhone 6 16GB",  storage: "16GB",  slug: "iphone-6-16gb",  scrap: 5000, prices: [17000, 13500, 10000, 6800] },
      { name: "iPhone 6 64GB",  storage: "64GB",  slug: "iphone-6-64gb",  scrap: 5500, prices: [19500, 15500, 11500, 7800] },
      { name: "iPhone 6 128GB", storage: "128GB", slug: "iphone-6-128gb", scrap: 6000, prices: [21500, 17000, 12800, 8800] },
    ],
  },
  {
    name: "iPhone 6 Plus", slug: "iphone-6-plus", order: -12, detailKeys: TOUCHID_KEYS,
    variants: [
      { name: "iPhone 6 Plus 16GB",  storage: "16GB",  slug: "iphone-6-plus-16gb",  scrap: 6000, prices: [21000, 17000, 12800, 8800] },
      { name: "iPhone 6 Plus 64GB",  storage: "64GB",  slug: "iphone-6-plus-64gb",  scrap: 6500, prices: [24000, 19500, 14800, 10200] },
      { name: "iPhone 6 Plus 128GB", storage: "128GB", slug: "iphone-6-plus-128gb", scrap: 7000, prices: [26500, 21500, 16300, 11200] },
    ],
  },
  {
    name: "iPhone 6s", slug: "iphone-6s", order: -11, detailKeys: TOUCHID_KEYS,
    variants: [
      { name: "iPhone 6s 16GB",  storage: "16GB",  slug: "iphone-6s-16gb",  scrap: 6500, prices: [24000, 19500, 14800, 10500] },
      { name: "iPhone 6s 32GB",  storage: "32GB",  slug: "iphone-6s-32gb",  scrap: 6800, prices: [26000, 21200, 16000, 11400] },
      { name: "iPhone 6s 64GB",  storage: "64GB",  slug: "iphone-6s-64gb",  scrap: 7200, prices: [28500, 23200, 17600, 12500] },
      { name: "iPhone 6s 128GB", storage: "128GB", slug: "iphone-6s-128gb", scrap: 7800, prices: [31000, 25300, 19200, 13700] },
    ],
  },
  {
    name: "iPhone 6s Plus", slug: "iphone-6s-plus", order: -10, detailKeys: TOUCHID_KEYS,
    variants: [
      { name: "iPhone 6s Plus 16GB",  storage: "16GB",  slug: "iphone-6s-plus-16gb",  scrap: 8000, prices: [30000, 25000, 19000, 13500] },
      { name: "iPhone 6s Plus 32GB",  storage: "32GB",  slug: "iphone-6s-plus-32gb",  scrap: 8500, prices: [32500, 27000, 20600, 14600] },
      { name: "iPhone 6s Plus 64GB",  storage: "64GB",  slug: "iphone-6s-plus-64gb",  scrap: 9000, prices: [35500, 29500, 22500, 16000] },
      { name: "iPhone 6s Plus 128GB", storage: "128GB", slug: "iphone-6s-plus-128gb", scrap: 9500, prices: [38500, 32000, 24500, 17400] },
    ],
  },
  {
    name: "iPhone SE (2016)", slug: "iphone-se-2016", order: -9, detailKeys: TOUCHID_KEYS,
    variants: [
      { name: "iPhone SE (2016) 16GB",  storage: "16GB",  slug: "iphone-se-2016-16gb",  scrap: 6800, prices: [26000, 21500, 16500, 11500] },
      { name: "iPhone SE (2016) 32GB",  storage: "32GB",  slug: "iphone-se-2016-32gb",  scrap: 7200, prices: [28500, 23600, 18100, 12600] },
      { name: "iPhone SE (2016) 64GB",  storage: "64GB",  slug: "iphone-se-2016-64gb",  scrap: 7800, prices: [31000, 25700, 19700, 13700] },
      { name: "iPhone SE (2016) 128GB", storage: "128GB", slug: "iphone-se-2016-128gb", scrap: 8500, prices: [34000, 28200, 21600, 15000] },
    ],
  },
  {
    name: "iPhone 7", slug: "iphone-7", order: -8, detailKeys: TOUCHID_KEYS,
    variants: [
      { name: "iPhone 7 32GB",  storage: "32GB",  slug: "iphone-7-32gb",  scrap: 8500,  prices: [32000, 26500, 20500, 15000] },
      { name: "iPhone 7 128GB", storage: "128GB", slug: "iphone-7-128gb", scrap: 9200,  prices: [35500, 29400, 22800, 16600] },
      { name: "iPhone 7 256GB", storage: "256GB", slug: "iphone-7-256gb", scrap: 10000, prices: [39000, 32300, 25000, 18200] },
    ],
  },
  {
    name: "iPhone 7 Plus", slug: "iphone-7-plus", order: -7, detailKeys: TOUCHID_KEYS,
    variants: [
      { name: "iPhone 7 Plus 32GB",  storage: "32GB",  slug: "iphone-7-plus-32gb",  scrap: 11000, prices: [40000, 33500, 26500, 19500] },
      { name: "iPhone 7 Plus 128GB", storage: "128GB", slug: "iphone-7-plus-128gb", scrap: 11800, prices: [44500, 37200, 29500, 21700] },
      { name: "iPhone 7 Plus 256GB", storage: "256GB", slug: "iphone-7-plus-256gb", scrap: 12800, prices: [49000, 41000, 32500, 23900] },
    ],
  },
  {
    name: "iPhone 8", slug: "iphone-8", order: -6, detailKeys: TOUCHID_KEYS,
    variants: [
      { name: "iPhone 8 64GB",  storage: "64GB",  slug: "iphone-8-64gb",  scrap: 11500, prices: [43000, 36000, 29000, 21500] },
      { name: "iPhone 8 128GB", storage: "128GB", slug: "iphone-8-128gb", scrap: 12200, prices: [47000, 39400, 31700, 23500] },
      { name: "iPhone 8 256GB", storage: "256GB", slug: "iphone-8-256gb", scrap: 13200, prices: [51000, 42700, 34400, 25500] },
    ],
  },
  {
    name: "iPhone 8 Plus", slug: "iphone-8-plus", order: -5, detailKeys: TOUCHID_KEYS,
    variants: [
      { name: "iPhone 8 Plus 64GB",  storage: "64GB",  slug: "iphone-8-plus-64gb",  scrap: 14000, prices: [52000, 44000, 35500, 26500] },
      { name: "iPhone 8 Plus 128GB", storage: "128GB", slug: "iphone-8-plus-128gb", scrap: 14800, prices: [56500, 47800, 38600, 28800] },
      { name: "iPhone 8 Plus 256GB", storage: "256GB", slug: "iphone-8-plus-256gb", scrap: 15800, prices: [61000, 51600, 41700, 31100] },
    ],
  },
  {
    name: "iPhone X", slug: "iphone-x", order: -4, detailKeys: FACEID_KEYS,
    variants: [
      { name: "iPhone X 64GB",  storage: "64GB",  slug: "iphone-x-64gb",  scrap: 16000, prices: [60000, 51000, 41000, 31500] },
      { name: "iPhone X 256GB", storage: "256GB", slug: "iphone-x-256gb", scrap: 18000, prices: [67500, 57400, 46100, 35400] },
    ],
  },
  {
    name: "iPhone XR", slug: "iphone-xr", order: -3, detailKeys: FACEID_KEYS,
    variants: [
      { name: "iPhone XR 64GB",  storage: "64GB",  slug: "iphone-xr-64gb",  scrap: 17500, prices: [65000, 56000, 45500, 35000] },
      { name: "iPhone XR 128GB", storage: "128GB", slug: "iphone-xr-128gb", scrap: 18800, prices: [70500, 60800, 49400, 38000] },
      { name: "iPhone XR 256GB", storage: "256GB", slug: "iphone-xr-256gb", scrap: 20000, prices: [76000, 65500, 53200, 40900] },
    ],
  },
  {
    name: "iPhone XS", slug: "iphone-xs", order: -2, detailKeys: FACEID_KEYS,
    variants: [
      { name: "iPhone XS 64GB",  storage: "64GB",  slug: "iphone-xs-64gb",  scrap: 19500, prices: [72000, 62000, 50000, 38500] },
      { name: "iPhone XS 256GB", storage: "256GB", slug: "iphone-xs-256gb", scrap: 21500, prices: [80000, 68900, 55600, 42800] },
      { name: "iPhone XS 512GB", storage: "512GB", slug: "iphone-xs-512gb", scrap: 23500, prices: [88500, 76200, 61500, 47300] },
    ],
  },
  {
    name: "iPhone XS Max", slug: "iphone-xs-max", order: -1, detailKeys: FACEID_KEYS,
    variants: [
      { name: "iPhone XS Max 64GB",  storage: "64GB",  slug: "iphone-xs-max-64gb",  scrap: 22000, prices: [82000, 71000, 57500, 44500] },
      { name: "iPhone XS Max 256GB", storage: "256GB", slug: "iphone-xs-max-256gb", scrap: 24000, prices: [91000, 78800, 63800, 49400] },
      { name: "iPhone XS Max 512GB", storage: "512GB", slug: "iphone-xs-max-512gb", scrap: 26500, prices: [100000, 86600, 70100, 54300] },
    ],
  },
];
