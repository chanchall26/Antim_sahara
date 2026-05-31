import { chromium } from "playwright";
const BASE = process.env.BASE || "http://localhost:3000";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 420, height: 880 } });
const errs = [];
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: /demo mode/i }).click();
await p.waitForURL("**/dashboard");
await p.getByRole("button", { name: /I understand, continue/i }).click().catch(() => {});
await p.waitForTimeout(400);
// Open chat
await p.getByRole("button", { name: /saathi|chat|ask/i }).first().click().catch(async () => {
  await p.locator("button").filter({ hasText: /./ }).last().click();
});
await p.waitForTimeout(800);
const micVisible = await p.getByRole("button", { name: /tap and speak|speak/i }).count();
const voiceToggle = await p.getByRole("button", { name: /read answers aloud|spoken answers/i }).count();
console.log("mic button present:", micVisible > 0);
console.log("voice-output toggle present:", voiceToggle > 0);
// Send a text message
await p.getByPlaceholder(/.+/).first().fill("What should I do first?");
await p.keyboard.press("Enter");
await p.waitForTimeout(6000);
const replyCount = await p.locator("text=/register|certificate|sorry|step/i").count();
console.log("got a reply:", replyCount > 0);
await p.screenshot({ path: "scripts/shots/chat-voice.png", fullPage: true });
console.log(errs.length ? "ERRORS: " + errs.slice(0,3).join("; ") : "no page errors");
await b.close();
