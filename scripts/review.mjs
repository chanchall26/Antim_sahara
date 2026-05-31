import { chromium, devices } from "playwright";
const BASE = "http://localhost:3000";
const b = await chromium.launch();
const errs = [];

// ---- Desktop (dark default) ----
const d = await b.newContext({ viewport: { width: 1320, height: 900 } });
const p = await d.newPage();
p.on("pageerror", (e) => errs.push("desktop: " + e.message));
await p.goto(BASE, { waitUntil: "networkidle" });
await p.waitForTimeout(700);
await p.screenshot({ path: "scripts/shots/d1-landing.png", fullPage: true });
await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: /demo mode/i }).click();
await p.waitForURL("**/dashboard");
await p.getByRole("button", { name: /I understand, continue/i }).click().catch(() => {});
await p.waitForTimeout(400);
await p.getByRole("button", { name: /demo case/i }).first().click();
await p.waitForURL("**/case/**");
await p.waitForTimeout(900);
await p.screenshot({ path: "scripts/shots/d2-roadmap.png", fullPage: true });
await p.getByText(/Open this step|Claim the bank account/i).first().click();
await p.waitForURL("**/task/**");
await p.waitForTimeout(500);
await p.screenshot({ path: "scripts/shots/d3-task.png", fullPage: true });

// ---- Mobile (iPhone) ----
const m = await b.newContext({ ...devices["iPhone 13"] });
const mp = await m.newPage();
mp.on("pageerror", (e) => errs.push("mobile: " + e.message));
await mp.goto(BASE, { waitUntil: "networkidle" });
await mp.waitForTimeout(600);
await mp.screenshot({ path: "scripts/shots/m1-landing.png", fullPage: true });
await mp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await mp.getByRole("button", { name: /demo mode/i }).click();
await mp.waitForURL("**/dashboard");
await mp.getByRole("button", { name: /I understand, continue/i }).click().catch(() => {});
await mp.waitForTimeout(400);
await mp.screenshot({ path: "scripts/shots/m2-dashboard.png", fullPage: true });
await mp.getByRole("button", { name: /demo case/i }).first().click();
await mp.waitForURL("**/case/**");
await mp.waitForTimeout(800);
await mp.screenshot({ path: "scripts/shots/m3-roadmap.png", fullPage: true });

console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "✅ no page errors (desktop + mobile)");
await b.close();
