import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_ID = "antim-sahara-apl";
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const cfg = JSON.parse(
  fs.readFileSync(path.join(os.homedir(), ".config", "configstore", "firebase-tools.json"), "utf8"),
);
const refreshToken = cfg.tokens?.refresh_token;

async function accessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  return (await res.json()).access_token;
}

const token = await accessToken();
const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

async function tryReq(label, url, method, body) {
  const res = await fetch(url, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const txt = await res.text();
  let j;
  try {
    j = JSON.parse(txt);
  } catch {
    j = { raw: txt.slice(0, 120) };
  }
  console.log(`${label}: ${res.status} ${j.error ? j.error.message : "ok"}`);
  return { ok: res.ok, status: res.status, j };
}

// 1) Initialize Identity Platform / Firebase Auth config for the project.
await tryReq(
  "initializeAuth",
  `https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/identityPlatform:initializeAuth`,
  "POST",
  {},
);

await new Promise((r) => setTimeout(r, 4000));

// 2) Enable Email/Password.
let r = await tryReq(
  "enable email/password",
  `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired`,
  "PATCH",
  { signIn: { email: { enabled: true, passwordRequired: true } } },
);

if (!r.ok) {
  await new Promise((res) => setTimeout(res, 8000));
  r = await tryReq(
    "enable email/password (retry)",
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired`,
    "PATCH",
    { signIn: { email: { enabled: true, passwordRequired: true } } },
  );
}

console.log(r.ok ? "\n✅ Email/Password auth is ON." : "\n⚠️ Still needs a manual toggle.");
