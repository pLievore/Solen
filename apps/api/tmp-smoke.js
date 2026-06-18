const { createClient } = require("@supabase/supabase-js");
const URL = "https://mkqukrnuutcmuenhewdh.supabase.co";
const PUB = "sb_publishable_XLhioUj6pkbdfWBE6s5N5w_zY9PM1dr";
const API = "http://localhost:3333/api";

async function j(method, path, token, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

(async () => {
  const sb = createClient(URL, PUB, { auth: { persistSession: false } });
  const { data: s } = await sb.auth.signInWithPassword({
    email: "paulo_lievore@hotmail.com",
    password: "lievore22",
  });
  const token = s.session.access_token;

  // publico
  const pub = await j("GET", "/catalog/categories");
  console.log("PUBLIC /catalog/categories:", pub.status, "->", pub.data.length, "categorias");

  // guard sem token
  const noAuth = await j("GET", "/admin/categories");
  console.log("GUARD /admin/categories sem token:", noAuth.status, "(esperado 401)");

  // admin com token
  const cats = await j("GET", "/admin/categories", token);
  console.log("ADMIN /admin/categories:", cats.status, "->", cats.data.length, "categorias");

  const cs = await j("GET", "/admin/condition-states", token);
  console.log("ADMIN /admin/condition-states:", cs.status, "->", cs.data.map((x) => x.key).join(","));

  const ds = await j("GET", "/admin/detailed-states", token);
  console.log("ADMIN /admin/detailed-states:", ds.status, "->", ds.data.length, "perguntas");

  const ko = await j("GET", "/admin/knockout-questions", token);
  console.log("ADMIN /admin/knockout-questions:", ko.status, "->", ko.data.length, "knockout");

  // create + validacao + delete
  const bad = await j("POST", "/admin/categories", token, { name: "", slug: "INVALIDO!" });
  console.log("VALIDACAO POST invalido:", bad.status, "(esperado 400)");

  const created = await j("POST", "/admin/categories", token, {
    name: "Teste Smoke", slug: "teste-smoke", order: 99,
  });
  console.log("CREATE categoria:", created.status, "->", created.data.id ? "ok" : created.data);

  if (created.data.id) {
    const del = await j("DELETE", "/admin/categories/" + created.data.id, token);
    console.log("DELETE categoria:", del.status);
  }

  // versao do iphone 11 + precos
  const models = await j("GET", "/catalog/categories/iphones/models");
  console.log("PUBLIC iphones/models:", models.status, "->", models.data.map((m) => m.name).join(","));
  if (models.data[0]) {
    const variants = await j("GET", "/catalog/models/" + models.data[0].id + "/variants");
    console.log("PUBLIC variants:", variants.status, "->", variants.data.map((v) => v.name).join(","));
    if (variants.data[0]) {
      const prices = await j("GET", "/admin/variants/" + variants.data[0].id + "/prices", token);
      console.log("ADMIN prices da versao:", prices.status, "->",
        prices.data.map((p) => p.conditionState.key + "=" + p.price).join(","));
    }
  }
})().catch((e) => { console.error(e); process.exit(1); });
