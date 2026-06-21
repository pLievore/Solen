const SITE_URL = "https://www.vendybrasil.com";
const APEX_URL = "https://vendybrasil.com";
const API_URL = "https://solen-api.onrender.com";

async function get(url, init = {}) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(60_000),
    ...init,
  });
  return response;
}

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

async function check(name, run) {
  const startedAt = performance.now();
  await run();
  const elapsed = Math.round(performance.now() - startedAt);
  console.log(`✓ ${name} (${elapsed} ms)`);
}

const checks = [
  check("API e banco", async () => {
    const response = await get(`${API_URL}/api/health`);
    ensure(response.ok, `health respondeu ${response.status}`);
    const body = await response.json();
    ensure(body.status === "ok" && body.db === "up", "banco não está saudável");
  }),
  check("configuração pública", async () => {
    const response = await get(`${API_URL}/api/config`);
    ensure(response.ok, `config respondeu ${response.status}`);
    const body = await response.json();
    ensure(
      typeof body.homeHeadline === "string" && body.homeHeadline.length > 0,
      "headline pública ausente",
    );
  }),
  check("site e headers de segurança", async () => {
    const response = await get(SITE_URL);
    ensure(response.ok, `site respondeu ${response.status}`);
    const html = await response.text();
    ensure(html.includes("Vendy"), "marca não encontrada na home");
    ensure(html.includes('id="categorias"'), "seção de categorias não encontrada");
    ensure(
      response.headers.has("content-security-policy"),
      "Content-Security-Policy ausente",
    );
    ensure(
      response.headers.get("x-frame-options") === "DENY",
      "X-Frame-Options inválido",
    );
    ensure(
      response.headers.get("x-content-type-options") === "nosniff",
      "X-Content-Type-Options inválido",
    );
  }),
  check("redirecionamento do domínio raiz", async () => {
    const response = await get(APEX_URL, { redirect: "manual" });
    ensure(response.status === 308, `domínio raiz respondeu ${response.status}`);
    ensure(
      response.headers.get("location") === `${SITE_URL}/`,
      "destino do redirecionamento está incorreto",
    );
  }),
  check("robots e sitemap", async () => {
    const [robotsResponse, sitemapResponse] = await Promise.all([
      get(`${SITE_URL}/robots.txt`),
      get(`${SITE_URL}/sitemap.xml`),
    ]);
    ensure(robotsResponse.ok, `robots respondeu ${robotsResponse.status}`);
    ensure(sitemapResponse.ok, `sitemap respondeu ${sitemapResponse.status}`);
    const [robots, sitemap] = await Promise.all([
      robotsResponse.text(),
      sitemapResponse.text(),
    ]);
    ensure(robots.includes("Disallow: /admin/"), "admin não bloqueado no robots");
    ensure(
      robots.includes(`${SITE_URL}/sitemap.xml`),
      "sitemap não declarado no robots",
    );
    ensure(sitemap.includes(`<loc>${SITE_URL}</loc>`), "home ausente no sitemap");
    ensure(sitemap.includes("/vender/iphones"), "categorias ausentes no sitemap");
  }),
  check("painel fora do índice", async () => {
    const response = await get(`${SITE_URL}/admin/login`);
    ensure(response.ok, `login admin respondeu ${response.status}`);
    const html = await response.text();
    ensure(html.includes("noindex"), "noindex ausente no painel");
  }),
];

const results = await Promise.allSettled(checks);
const failures = results.filter((result) => result.status === "rejected");

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(
      `✗ ${failure.reason instanceof Error ? failure.reason.message : failure.reason}`,
    );
  }
  process.exit(1);
}

console.log(`Produção saudável em ${new Date().toISOString()}.`);
