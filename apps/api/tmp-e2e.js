const { createClient } = require("@supabase/supabase-js");
const url = "https://mkqukrnuutcmuenhewdh.supabase.co";
const pub = "sb_publishable_XLhioUj6pkbdfWBE6s5N5w_zY9PM1dr";

(async () => {
  const sb = createClient(url, pub, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({
    email: "paulo_lievore@hotmail.com",
    password: "lievore22",
  });
  if (error) {
    console.log("LOGIN_FAIL:", error.message);
    process.exit(1);
  }
  console.log("LOGIN_OK:", data.user.email);
  const token = data.session.access_token;

  const ok = await fetch("http://localhost:3333/api/admin/me", {
    headers: { Authorization: "Bearer " + token },
  });
  console.log("COM_TOKEN status", ok.status, "->", await ok.text());

  const no = await fetch("http://localhost:3333/api/admin/me");
  console.log("SEM_TOKEN status", no.status, "(esperado 401)");
})();
