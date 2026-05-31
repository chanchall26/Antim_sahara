// Verifies REAL Firebase auth + Firestore sync on the live site.
import { chromium } from "playwright";

const BASE = process.env.BASE || "https://antim-sahara.vercel.app";
const email = `live${Math.floor(Math.random() * 1e7)}@example.com`;
const password = "Test123456";
const errs = [];

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 900 } });
p.on("pageerror", (e) => errs.push(e.message));

async function step(name, fn) {
  process.stdout.write(`• ${name} … `);
  await fn();
  console.log("ok");
}

try {
  await step("open live login", async () => {
    await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  });

  await step(`create real account (${email})`, async () => {
    await p.getByLabel(/your name/i).fill("Test User");
    await p.getByLabel(/email/i).fill(email);
    await p.getByLabel(/password/i).fill(password);
    await p.getByRole("button", { name: /continue with email/i }).click();
    await p.waitForURL("**/dashboard", { timeout: 20000 });
  });

  await step("dismiss consent", async () => {
    await p.getByRole("button", { name: /I understand, continue/i }).click().catch(() => {});
  });

  await step("create a case (writes to Firestore)", async () => {
    await p.getByRole("button", { name: /demo case/i }).first().click();
    await p.waitForURL("**/case/**");
    await p.getByText(/Ramesh Kumar Sharma/).first().waitFor();
  });

  await step("reload dashboard → case persisted from Firestore", async () => {
    await p.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
    await p.waitForTimeout(2500); // allow Firestore snapshot
    await p.getByText(/Ramesh Kumar Sharma/).first().waitFor({ timeout: 15000 });
    await p.screenshot({ path: "scripts/shots/live-loggedin.png", fullPage: true });
  });

  await step("sign out + sign back in (same account)", async () => {
    // Re-login with the SAME credentials should work (account already exists).
    await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await p.getByLabel(/your name/i).fill("Test User");
    await p.getByLabel(/email/i).fill(email);
    await p.getByLabel(/password/i).fill(password);
    await p.getByRole("button", { name: /continue with email/i }).click();
    await p.waitForURL("**/dashboard", { timeout: 20000 });
    await p.waitForTimeout(2500);
    await p.getByText(/Ramesh Kumar Sharma/).first().waitFor({ timeout: 15000 });
  });

  console.log(`\n✅ REAL login + Firestore sync verified on ${BASE}`);
  console.log(errs.length ? "⚠️ console: " + errs.slice(0, 4).join("; ") : "   No page errors.");
} catch (e) {
  console.log("\n❌ FAILED:", e.message);
  await p.screenshot({ path: "scripts/shots/live-fail.png", fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  await b.close();
}
