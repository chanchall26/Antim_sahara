// Enables the Google sign-in provider via the Identity Toolkit admin API.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PROJECT_ID = "antim-sahara-apl";
const CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";

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

const token = await accessToken();
const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const base = `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/defaultSupportedIdpConfigs`;

// Try to create the Google IdP config (Firebase auto-provisions the OAuth client for google.com).
let res = await fetch(`${base}?idpId=google.com`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({ enabled: true }),
});
let j = await res.json();

if (res.status === 409 || (j.error && /already exists/i.test(j.error.message || ""))) {
  // Already exists → just enable it.
  res = await fetch(`${base}/google.com?updateMask=enabled`, {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({ enabled: true }),
  });
  j = await res.json();
}

console.log("status:", res.status);
if (res.ok && j.enabled) {
  console.log("✅ Google sign-in provider ENABLED.");
  console.log("   clientId:", j.clientId || "(auto-provisioned by Firebase)");
} else {
  console.log("⚠️", j.error?.message || JSON.stringify(j).slice(0, 200));
}
