/**
 * Render a template into a clean, branded A4 PDF using pdf-lib.
 * Returns base64 (for inline storage in demo mode) + the byte array.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { RenderedTemplate } from "./types";
import { DISCLAIMER_TEXT } from "@/lib/legal";

const A4 = { w: 595.28, h: 841.89 };
const MARGIN = 56;
const FONT_SIZE = 11;
const LINE_HEIGHT = 16;

// CP1252 punctuation that the standard (WinAnsi) fonts DO support beyond Latin-1.
const CP1252_EXTRA = new Set([
  "–", "—", "‘", "’", "“", "”", "…", "•", "™", "€", "‹", "›", "ƒ", "†", "‡",
]);

/**
 * Standard PDF fonts use WinAnsi (CP1252) and cannot encode ₹ or Indic scripts.
 * Replace ₹ with "Rs." and drop any other unencodable glyph so generation never throws.
 * (Vernacular PDFs can be enabled later by embedding a Noto TTF via @pdf-lib/fontkit.)
 */
function toWinAnsi(s: string): string {
  let out = "";
  for (const ch of s) {
    if (ch === "₹") {
      out += "Rs.";
      continue;
    }
    const code = ch.codePointAt(0) ?? 0;
    if (code <= 0xff || CP1252_EXTRA.has(ch)) out += ch;
    // else: drop unsupported glyph (keeps English text intact, avoids a hard crash)
  }
  return out;
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (text === "") return [""];
  const words = toWinAnsi(text).split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderTemplatePdf(
  doc: RenderedTemplate,
): Promise<{ base64: string; bytes: Uint8Array }> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const italic = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  let page = pdf.addPage([A4.w, A4.h]);
  let y = A4.h - MARGIN;
  const contentWidth = A4.w - MARGIN * 2;
  const ink = rgb(0.17, 0.16, 0.145);
  const muted = rgb(0.44, 0.4, 0.36);
  const accent = rgb(0.3, 0.32, 0.75);

  const newPageIfNeeded = (needed = LINE_HEIGHT) => {
    if (y - needed < MARGIN + 48) {
      page = pdf.addPage([A4.w, A4.h]);
      y = A4.h - MARGIN;
    }
  };

  const write = (
    text: string,
    opts: { font?: PDFFont; size?: number; color?: typeof ink; gap?: number } = {},
  ) => {
    const f = opts.font ?? font;
    const size = opts.size ?? FONT_SIZE;
    const lines = wrap(text, f, size, contentWidth);
    for (const ln of lines) {
      newPageIfNeeded();
      page.drawText(ln, { x: MARGIN, y, size, font: f, color: opts.color ?? ink });
      y -= LINE_HEIGHT;
    }
    if (opts.gap) y -= opts.gap;
  };

  // Header / brand
  page.drawText("ANTIM SAHARA", { x: MARGIN, y, size: 13, font: bold, color: accent });
  y -= 14;
  page.drawText("Compassionate guidance for life's hardest paperwork", {
    x: MARGIN,
    y,
    size: 8.5,
    font: italic,
    color: muted,
  });
  y -= 10;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4.w - MARGIN, y },
    thickness: 1,
    color: rgb(0.9, 0.88, 0.84),
  });
  y -= 26;

  // Title
  write(doc.title.toUpperCase(), { font: bold, size: 15, gap: 8 });

  if (doc.to) {
    for (const line of doc.to) write(line, { size: FONT_SIZE });
    y -= 8;
  }
  if (doc.subject) {
    write(`Subject: ${doc.subject}`, { font: bold });
    y -= 8;
  }

  for (const para of doc.body) write(para);

  if (doc.signature) {
    y -= 18;
    for (const line of doc.signature) write(line);
  }

  // Footer disclaimer on every page
  const pages = pdf.getPages();
  for (const p of pages) {
    p.drawLine({
      start: { x: MARGIN, y: MARGIN - 6 },
      end: { x: A4.w - MARGIN, y: MARGIN - 6 },
      thickness: 0.5,
      color: rgb(0.9, 0.88, 0.84),
    });
    const footLines = wrap(DISCLAIMER_TEXT, italic, 7.5, contentWidth);
    let fy = MARGIN - 16;
    for (const fl of footLines) {
      p.drawText(fl, { x: MARGIN, y: fy, size: 7.5, font: italic, color: muted });
      fy -= 9;
    }
  }

  const bytes = await pdf.save();
  const base64 = Buffer.from(bytes).toString("base64");
  return { base64, bytes };
}
