import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
// Pre-seed locale + demo user so we land on a Hindi roadmap fast.
await p.goto(BASE);
await p.evaluate(() => localStorage.setItem("antim.locale", "hi"));
await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: /डेमो|demo/i }).click();
await p.waitForURL("**/dashboard");
await p.getByRole("button", { name: /समझ|understand/i }).click().catch(() => {});
await p.screenshot({ path: "scripts/shots/07-hindi-dashboard.png", fullPage: true });
await p.getByRole("button", { name: /डेमो|demo case/i }).first().click();
await p.waitForURL("**/case/**");
await p.waitForTimeout(800);
await p.screenshot({ path: "scripts/shots/08-hindi-roadmap.png", fullPage: true });
console.log("hindi screenshots saved");
await b.close();
