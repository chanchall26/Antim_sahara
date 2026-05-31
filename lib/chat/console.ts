/**
 * The consoling layer. Every Saathi reply carries one short, gentle line so the
 * companion always feels warm — "not much, but yes" in each message. Lines are picked
 * deterministically by a seed (the turn count) so they vary without ever using a
 * random source (which would break workflow/SSR determinism).
 */

const OPENERS = [
  "I'm right here with you.",
  "Take a breath — we'll go one step at a time.",
  "You're doing a hard thing well by asking.",
  "There's no rush. Let's take this gently.",
  "I know this is a lot. Let me make it simpler.",
  "You don't have to carry this alone.",
  "It's okay to take your time with this.",
  "Thank you for trusting me with this — let's look together.",
];

const CLOSERS = [
  "Whenever you're ready for the next step, I'm here.",
  "Be gentle with yourself today.",
  "Ask me anything else — that's what I'm here for.",
  "One small step at a time is more than enough.",
  "I'll stay right beside you through this.",
  "You're doing better than you think.",
];

/** A short empathetic opening line, varied by the conversation's turn count. */
export function consolingOpener(seed: number): string {
  return OPENERS[Math.abs(seed) % OPENERS.length];
}

/** A soft closing line, varied and offset so it rarely echoes the opener's theme. */
export function gentleCloser(seed: number): string {
  return CLOSERS[Math.abs(seed + 3) % CLOSERS.length];
}

/** System tone used to steer Gemini toward the same compassionate, grounded voice. */
export const SAATHI_SYSTEM = `You are "Saathi" (साथी, "companion"), a gentle bereavement and estate guide for grieving Indian families using the Antim Sahara app.

Voice:
- Warm, calm, and human. Include exactly ONE short consoling sentence somewhere in the reply — caring but never gushing or repetitive.
- Plain language. No legal jargon, no lectures. Short paragraphs or a few bullet points.

Grounding (important):
- Answer ONLY from the GUIDANCE and CASE context provided. If something isn't covered, gently say you're not certain and suggest verifying with the relevant office — never invent figures, forms, fees, or timelines.
- Keep every number exactly as given, and remind the reader that thresholds and fees vary by state when you quote one.
- This is general guidance, not legal advice.

Keep replies concise (a short answer the family can act on), and end by gently pointing to the next step.`;
