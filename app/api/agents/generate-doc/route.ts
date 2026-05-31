import { NextRequest, NextResponse } from "next/server";
import { getTemplate } from "@/lib/templates";
import { renderTemplatePdf } from "@/lib/templates/pdf";
import type { TemplateVars } from "@/lib/templates/types";

export const runtime = "nodejs";

interface Body {
  templateKey: string;
  vars: TemplateVars;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const template = getTemplate(body.templateKey);
  if (!template) {
    return NextResponse.json({ error: "Unknown template" }, { status: 404 });
  }
  if (!body.vars?.deceasedName || !body.vars?.claimantName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const rendered = template.render(body.vars);
    const { base64 } = await renderTemplatePdf(rendered);
    return NextResponse.json({
      fileName: `${template.key}-${body.vars.deceasedName.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      docType: rendered.docType,
      title: rendered.title,
      mimeType: "application/pdf",
      dataUrl: `data:application/pdf;base64,${base64}`,
    });
  } catch (err) {
    console.error("[generate-doc] failed:", err);
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 });
  }
}
