// Run AFTER enabling Email/Password in the Firebase console.
// 1) Adds the Vercel domains to Firebase authorized domains.
// 2) Verifies email/password signup works.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_ID = "antim-sahara-apl";
const API_KEY = "AIzaSyAxnU0CbRJ8sEAYIZ3K4TMGIgbwbcCrRNA";
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";
const EXTRA_DOMAINS = ["antim-sahara.vercel.app", "antim-sahara-apl.web.app"];

const cfg = JSON.parse(
  fs.readFileSync(path.join(os.homedir(), ".config", "configstore", "firebase-tools.json"), "utf8"),
);

async function accessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: cfg.tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  return (await res.json()).access_token;
}

// 1) Verify email/password works.
const rand = Math.floor(Math.random() * 1e6);
const signup = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `verify${rand}@antimsahara.test`, password: "Verify123456", returnSecureToken: true }),
  },
).then((r) => r.json());

if (!signup.idToken) {
  console.log(`❌ Email/Password not enabled yet (${signup.error?.message}).`);
  console.log("   Enable it: https://console.firebase.google.com/project/antim-sahara-apl/authentication/providers");
  process.exit(1);
}
console.log("✅ Email/Password sign-up works.");

// 2) Add Vercel domains to authorized domains.
const token = await accessToken();
const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const current = await fetch(
  `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`,
  { headers: H },
).then((r) => r.json());

const domains = new Set([...(current.authorizedDomains ?? []), ...EXTRA_DOMAINS]);
const patch = await fetch(
  `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config?updateMask=authorizedDomains`,
  { method: "PATCH", headers: H, body: JSON.stringify({ authorizedDomains: [...domains] }) },
).then((r) => r.json());

if (patch.authorizedDomains) {
  console.log("✅ Authorized domains:", patch.authorizedDomains.join(", "));
  console.log("\n🎉 Real login is fully functional — locally and at https://antim-sahara.vercel.app");
} else {
  console.log("⚠️ Could not update authorized domains:", patch.error?.message);
}
