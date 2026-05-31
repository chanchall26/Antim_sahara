// Headless end-to-end smoke test of the demo flow. Run: node scripts/smoke.mjs
// Requires the dev server running on http://localhost:3000.
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:3000";
const shots = "scripts/shots";
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console.error: ${m.text()}`);
});

async function step(name, fn) {
  process.stdout.write(`• ${name} … `);
  await fn();
  console.log("ok");
}

try {
  await step("landing renders", async () => {
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.getByText("Antim Sahara").first().waitFor();
    await page.screenshot({ path: `${shots}/01-landing.png`, fullPage: true });
  });

  await step("login → demo mode", async () => {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${shots}/02-login.png` });
    await page.getByRole("button", { name: /demo mode/i }).click();
    await page.waitForURL("**/dashboard");
  });

  await step("dismiss consent", async () => {
    await page.getByRole("button", { name: /I understand, continue/i }).click();
    await page.screenshot({ path: `${shots}/03-dashboard.png` });
  });

  await step("load demo case → roadmap", async () => {
    await page.getByRole("button", { name: /demo case/i }).first().click();
    await page.waitForURL("**/case/**");
    await page.getByText(/Ramesh Kumar Sharma/).first().waitFor();
    await page.getByText(/your next step/i).first().waitFor();
    await page.screenshot({ path: `${shots}/04-roadmap.png`, fullPage: true });
  });

  await step("open a bank task", async () => {
    await page.getByText(/Claim the bank account/i).first().click();
    await page.waitForURL("**/task/**");
    await page.getByText(/What to do|Why this matters/i).first().waitFor();
    await page.screenshot({ path: `${shots}/05-task.png`, fullPage: true });
  });

  await step("generate a document (PDF)", async () => {
    await page.getByRole("button", { name: /cover letter/i }).first().click();
    await page.getByText(/Your document is ready|Download PDF/i).first().waitFor({ timeout: 15000 });
    await page.screenshot({ path: `${shots}/06-generated.png`, fullPage: true });
  });

  await step("switch language to Hindi", async () => {
    await page.goto(`${BASE}/case`, { waitUntil: "domcontentloaded" }).catch(() => {});
    await page.goBack().catch(() => {});
  });

  console.log(`\n✅ Flow completed. ${errors.length ? "⚠️ console issues:" : "No console errors."}`);
  errors.slice(0, 12).forEach((e) => console.log("   -", e));
} catch (err) {
  console.log("\n❌ FAILED:", err.message);
  await page.screenshot({ path: `${shots}/zz-failure.png`, fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  await browser.close();
}
