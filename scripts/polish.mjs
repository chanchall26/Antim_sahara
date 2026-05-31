import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));

await p.goto(BASE, { waitUntil: "networkidle" });
await p.waitForTimeout(700);
await p.screenshot({ path: "scripts/shots/p1-landing.png", fullPage: true });

await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await p.screenshot({ path: "scripts/shots/p2-login.png" });
await p.getByRole("button", { name: /demo mode/i }).click();
await p.waitForURL("**/dashboard");
await p.getByRole("button", { name: /I understand, continue/i }).click().catch(() => {});
await p.waitForTimeout(400);
await p.screenshot({ path: "scripts/shots/p3-dashboard.png", fullPage: true });

await p.getByRole("button", { name: /demo case/i }).first().click();
await p.waitForURL("**/case/**");
await p.waitForTimeout(900);
await p.screenshot({ path: "scripts/shots/p4-roadmap.png", fullPage: true });

await p.getByText(/Claim the bank account/i).first().click();
await p.waitForURL("**/task/**");
await p.waitForTimeout(600);
await p.screenshot({ path: "scripts/shots/p5-task.png", fullPage: true });

console.log("polish screenshots saved.", errs.length ? "ERRORS: " + errs.join("; ") : "no page errors");
await b.close();
