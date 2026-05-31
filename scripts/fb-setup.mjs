// Enables required Google APIs + configures Email/Password auth using the Firebase CLI's
// own stored credentials (already authorized by the user). No manual console steps.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_ID = "antim-sahara-apl";
const PROJECT_NUMBER = "286068758595";

// Public OAuth client of the Firebase CLI (embedded in firebase-tools).
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

const cfgPath = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const refreshToken = cfg.tokens?.refresh_token;
if (!refreshToken) {
  console.error("No refresh token found — run `firebase login` first.");
  process.exit(1);
}

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
  const j = await res.json();
  if (!j.access_token) throw new Error("token mint failed: " + JSON.stringify(j));
  return j.access_token;
}

async function enableApi(token, api) {
  const res = await fetch(
    `https://serviceusage.googleapis.com/v1/projects/${PROJECT_NUMBER}/services/${api}:enable`,
    { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}" },
  );
  const j = await res.json().catch(() => ({}));
  console.log(`  enable ${api}: ${res.status} ${j.error ? j.error.message : "ok"}`);
  return res.ok;
}

async function configureEmailAuth(token) {
  // Identity Platform: enable Email/Password sign-in.
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ signIn: { email: { enabled: true, passwordRequired: true } } }),
  });
  const j = await res.json().catch(() => ({}));
  console.log(`  email/password auth: ${res.status} ${j.error ? j.error.message : "enabled"}`);
  return res.ok;
}

const token = await accessToken();
console.log("• Access token minted.");
console.log("• Enabling APIs…");
await enableApi(token, "firestore.googleapis.com");
await enableApi(token, "identitytoolkit.googleapis.com");
await enableApi(token, "firebaserules.googleapis.com");

// Auth config sometimes needs a few seconds after enabling the API.
console.log("• Waiting 8s for API propagation…");
await new Promise((r) => setTimeout(r, 8000));

console.log("• Configuring Email/Password auth…");
let ok = await configureEmailAuth(token);
if (!ok) {
  console.log("  retry in 10s…");
  await new Promise((r) => setTimeout(r, 10000));
  ok = await configureEmailAuth(token);
}
console.log(ok ? "\n✅ APIs enabled + Email/Password auth configured." : "\n⚠️ Auth config needs a manual toggle in the console.");
