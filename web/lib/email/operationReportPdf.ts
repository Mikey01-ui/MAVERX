import { readFile } from "fs/promises";
import path from "path";
import PDFDocument from "pdfkit";
import type { OperationReportData } from "@/lib/finale/reportData";
import type { MissionReportSection } from "@/lib/finale/reportInsights";

type PDFDocumentType = InstanceType<typeof PDFDocument>;

const C = {
  bg: "#140c1c",
  panel: "#221829",
  ink: "#1c1424",
  purple: "#5400ad",
  purpleLight: "#8f44e8",
  orange: "#f79421",
  green: "#00c41c",
  pink: "#d31972",
  text: "#f4f0f8",
  muted: "#9a8fad",
};

const MARGIN = 44;
const PAGE_H = 842;
const CONTENT_BOTTOM = PAGE_H - 52;

type PdfCtx = {
  doc: PDFDocumentType;
  y: number;
  watermark: Buffer;
};

function scoreColor(score: number | null): string {
  if (score === null) return C.muted;
  if (score >= 80) return C.green;
  if (score >= 60) return C.orange;
  return C.pink;
}

function paintPageBackground(doc: PDFDocumentType, watermark: Buffer) {
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.bg);
  drawWatermark(doc, watermark);
}

function drawWatermark(doc: PDFDocumentType, watermark: Buffer) {
  const w = doc.page.width;
  const h = doc.page.height;
  const wmW = 460;
  const wmH = 82;

  doc.save();
  doc.opacity(0.045);
  doc.translate(w / 2, h / 2);
  doc.rotate(-32);
  doc.image(watermark, -wmW / 2, -wmH / 2, { fit: [wmW, wmH] });
  doc.restore();
  doc.opacity(1);
}

function newPage(ctx: PdfCtx) {
  ctx.doc.addPage({ size: "A4", margin: 0 });
  paintPageBackground(ctx.doc, ctx.watermark);
  ctx.y = MARGIN;
}

function ensureSpace(ctx: PdfCtx, needed: number) {
  if (ctx.y + needed > CONTENT_BOTTOM) newPage(ctx);
}

function drawSectionLabel(ctx: PdfCtx, label: string) {
  ensureSpace(ctx, 28);
  ctx.doc
    .fillColor(C.green)
    .font("Helvetica")
    .fontSize(8)
    .text(label, MARGIN, ctx.y, { lineBreak: false });
  ctx.y += 14;
}

function drawParagraph(ctx: PdfCtx, text: string, opts?: { size?: number; color?: string; gap?: number }) {
  const size = opts?.size ?? 9.5;
  const color = opts?.color ?? C.text;
  const gap = opts?.gap ?? 8;
  ensureSpace(ctx, 40);
  ctx.doc.fillColor(color).font("Helvetica").fontSize(size);
  ctx.doc.text(text, MARGIN, ctx.y, {
    width: ctx.doc.page.width - MARGIN * 2,
    lineGap: 3,
  });
  ctx.y = ctx.doc.y + gap;
}

function drawBullets(ctx: PdfCtx, items: string[], accent: string) {
  if (items.length === 0) return;
  const width = ctx.doc.page.width - MARGIN * 2 - 14;

  for (const item of items) {
    ensureSpace(ctx, 48);
    ctx.doc.fillColor(accent).font("Helvetica-Bold").fontSize(9).text("▸", MARGIN, ctx.y, { lineBreak: false });
    ctx.doc.fillColor(C.text).font("Helvetica").fontSize(8.5);
    ctx.doc.text(item, MARGIN + 14, ctx.y, { width, lineGap: 2.5 });
    ctx.y = ctx.doc.y + 8;
  }
  ctx.y += 4;
}

function drawMissionBlock(ctx: PdfCtx, section: MissionReportSection) {
  ensureSpace(ctx, 120);

  ctx.doc.rect(MARGIN, ctx.y, ctx.doc.page.width - MARGIN * 2, 3).fill(C.orange);
  ctx.y += 12;

  ctx.doc.fillColor(C.purpleLight).font("Helvetica").fontSize(8).text(section.label.toUpperCase(), MARGIN, ctx.y);
  const scoreText = section.score !== null ? `${section.score}%` : "—";
  ctx.doc
    .fillColor(scoreColor(section.score))
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(scoreText, ctx.doc.page.width - MARGIN - 60, ctx.y - 4, { width: 60, align: "right" });

  ctx.y += 16;
  ctx.doc.fillColor(C.text).font("Helvetica-Bold").fontSize(14).text(section.name, MARGIN, ctx.y);
  ctx.y += 22;

  drawSectionLabel(ctx, "// WHAT THIS MISSION TEACHES");
  drawParagraph(ctx, section.teaches);

  drawSectionLabel(ctx, "// SKILLS YOU PRACTICED");
  drawBullets(ctx, section.skills, C.purpleLight);

  if (section.strengths.length > 0) {
    drawSectionLabel(ctx, "// WHAT YOU DID WELL");
    drawBullets(ctx, section.strengths, C.green);
  }

  if (section.mistakes.length > 0) {
    drawSectionLabel(ctx, "// WRONG CHOICES & WHY");
    drawBullets(ctx, section.mistakes, C.pink);
  }

  if (section.improvements.length > 0) {
    drawSectionLabel(ctx, "// WHERE TO IMPROVE NEXT TIME");
    drawBullets(ctx, section.improvements, C.orange);
  }

  drawSectionLabel(ctx, "// IN YOUR WORKPLACE");
  drawParagraph(
    ctx,
    "Where this shows up in a normal job, with the game logic translated into everyday decisions.",
    { size: 8.5, color: C.muted, gap: 6 }
  );
  drawBullets(ctx, section.workplace, C.green);

  ctx.y += 10;
  ctx.doc.rect(MARGIN, ctx.y, ctx.doc.page.width - MARGIN * 2, 1).fill(C.purpleLight);
  ctx.y += 18;
}

function drawCover(ctx: PdfCtx, logo: Buffer, data: OperationReportData) {
  const { doc } = ctx;
  const w = doc.page.width;

  doc.rect(0, 0, w, 130).fill(C.panel);
  doc.image(logo, MARGIN, 37, { fit: [320, 52] });

  doc
    .fillColor(C.green)
    .font("Helvetica")
    .fontSize(8)
    .text("OPERATION OMNI · CONFIDENTIAL RESULTS BRIEF", MARGIN, 98);

  ctx.y = 160;
  doc.fillColor(C.purpleLight).font("Helvetica").fontSize(9).text("// OPERATION COMPLETE", MARGIN, ctx.y);
  ctx.y += 22;

  doc.fillColor(C.text).font("Helvetica-Bold").fontSize(26).text("Your detailed operation breakdown", MARGIN, ctx.y);
  ctx.y += 40;

  doc.fillColor(C.muted).font("Helvetica").fontSize(10).text(`Operative: ${data.email}`, MARGIN, ctx.y);
  ctx.y += 16;
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, MARGIN, ctx.y);
  ctx.y += 36;

  const boxW = w - MARGIN * 2;
  doc.rect(MARGIN, ctx.y, boxW, 88).fill(C.ink);
  doc.rect(MARGIN, ctx.y, 4, 88).fill(C.orange);

  doc.fillColor(C.purpleLight).font("Helvetica").fontSize(8).text("TOTAL OPERATION SCORE", MARGIN + 16, ctx.y + 14);
  doc
    .fillColor(scoreColor(data.totalScore))
    .font("Helvetica-Bold")
    .fontSize(36)
    .text(data.totalScore !== null ? `${data.totalScore}%` : "—", MARGIN + 16, ctx.y + 30);
  doc
    .fillColor(C.muted)
    .font("Helvetica")
    .fontSize(9)
    .text("Average across completed missions · full per-mission analysis inside", MARGIN + 16, ctx.y + 72, { width: boxW - 32 });

  ctx.y += 110;

  drawParagraph(
    ctx,
    "This is not just a score sheet. It explains what you actually practised in each mission, where your decisions held up, where they slipped, and what the same judgement looks like in a real team.",
    { color: C.muted, gap: 16 }
  );

  drawSectionLabel(ctx, "// MISSION SCORES AT A GLANCE");
  const colW = (w - MARGIN * 2) / 5;
  let x = MARGIN;
  for (const s of data.sections) {
    doc.rect(x, ctx.y, colW - 4, 52).fill(C.panel);
    doc.fillColor(C.purpleLight).font("Helvetica").fontSize(6.5).text(s.label.replace("Mission ", "M"), x + 6, ctx.y + 8, { width: colW - 12 });
    doc
      .fillColor(scoreColor(s.score))
      .font("Helvetica-Bold")
      .fontSize(14)
      .text(s.score !== null ? `${s.score}%` : "—", x + 6, ctx.y + 24, { width: colW - 12 });
    x += colW;
  }
  ctx.y += 68;

  drawParagraph(
    ctx,
    "Use the mission pages as a short debrief: what the mission was testing, what your choices showed, and how that same skill helps when work gets messy.",
    { size: 9, color: C.muted }
  );
}

export async function buildOperationReportPdf(data: OperationReportData): Promise<Buffer> {
  const logoPath = path.join(process.cwd(), "public/media/maverx-logo.png");
  const watermarkPath = path.join(process.cwd(), "public/media/maverx-logo-watermark.png");
  const [logo, watermark] = await Promise.all([readFile(logoPath), readFile(watermarkPath)]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: false });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.addPage({ size: "A4", margin: 0 });
    const ctx: PdfCtx = { doc, y: MARGIN, watermark };
    paintPageBackground(doc, watermark);

    drawCover(ctx, logo, data);

    newPage(ctx);
    drawSectionLabel(ctx, "// MISSION-BY-MISSION BREAKDOWN");

    for (const section of data.sections) {
      if (section.status !== "completed") {
        ensureSpace(ctx, 60);
        drawParagraph(ctx, `${section.label} — ${section.name}: Not completed.`, { color: C.muted });
        continue;
      }
      if (ctx.y > CONTENT_BOTTOM - 200) newPage(ctx);
      drawMissionBlock(ctx, section);
    }

    ensureSpace(ctx, 40);
    doc
      .fillColor(C.muted)
      .font("Helvetica")
      .fontSize(8)
      .text("MaverX · Operation OMNI · The Data Heist · Confidential operative summary", MARGIN, ctx.y, {
        width: doc.page.width - MARGIN * 2,
        align: "center",
      });

    doc.end();
  });
}

export type { OperationReportData };
