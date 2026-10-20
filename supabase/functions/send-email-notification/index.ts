import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib";
import { Buffer } from "node:buffer";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "MotionNodeEdits <noreply@mail.motionnodeedits.com>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const resend = new Resend(RESEND_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// =============================================================================
// VECTOR ICON & GLYPH HELPERS (100% Native PDF Vector Drawing, Zero Font Errors)
// =============================================================================

function formatDDMMYYYY(d?: Date | string): string {
  const date = d ? new Date(d) : new Date();
  if (isNaN(date.getTime())) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${now.getFullYear()}`;
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

/**
 * Draws the Indian Rupee symbol (₹) using native PDF vector strokes.
 * Standard Helvetica (WinAnsi) does not encode ₹ (0x20B9), so drawing
 * it as vector geometry guarantees zero crashes and crisp rendering.
 */
function drawRupeeGlyph(page: any, x: number, y: number, size: number, color = rgb(1, 1, 1)) {
  const s = size / 10;
  const th = Math.max(0.9, s * 1.05);

  // Top horizontal bar
  page.drawLine({
    start: { x: x, y: y + 8.8 * s },
    end: { x: x + 7.5 * s, y: y + 8.8 * s },
    thickness: th,
    color,
  });

  // Second horizontal bar
  page.drawLine({
    start: { x: x, y: y + 6.2 * s },
    end: { x: x + 6.8 * s, y: y + 6.2 * s },
    thickness: th,
    color,
  });

  // Vertical stem of the curve
  page.drawLine({
    start: { x: x + 1.2 * s, y: y + 3.8 * s },
    end: { x: x + 1.2 * s, y: y + 8.8 * s },
    thickness: th,
    color,
  });

  // Arc loop approximation (3 segments)
  page.drawLine({
    start: { x: x + 1.2 * s, y: y + 8.8 * s },
    end: { x: x + 4.6 * s, y: y + 7.8 * s },
    thickness: th,
    color,
  });
  page.drawLine({
    start: { x: x + 4.6 * s, y: y + 7.8 * s },
    end: { x: x + 4.6 * s, y: y + 5.0 * s },
    thickness: th,
    color,
  });
  page.drawLine({
    start: { x: x + 4.6 * s, y: y + 5.0 * s },
    end: { x: x + 1.2 * s, y: y + 3.8 * s },
    thickness: th,
    color,
  });

  // Slanted leg
  page.drawLine({
    start: { x: x + 2.2 * s, y: y + 3.8 * s },
    end: { x: x + 7.2 * s, y: y },
    thickness: th,
    color,
  });
}

/**
 * Draws an amount string with currency symbol.
 * If currency is INR, draws the native Rupee glyph followed by the amount.
 */
function drawAmountWithCurrency(
  page: any,
  font: any,
  amountStr: string,
  x: number,
  y: number,
  size: number = 11,
  currency: string = "INR",
  color = rgb(1, 1, 1)
) {
  const isRupee = (currency || "INR").toUpperCase() === "INR";
  const numText = amountStr.replace(/^[₹$€£]\s*/, "");

  if (isRupee) {
    const glyphW = 7.5 * (size / 10);
    const spaceW = 4;
    drawRupeeGlyph(page, x, y, size, color);
    page.drawText(numText, {
      x: x + glyphW + spaceW,
      y: y,
      size: size,
      font: font,
      color: color,
    });
  } else {
    const sym =
      currency.toUpperCase() === "EUR" ? "EUR " :
        currency.toUpperCase() === "GBP" ? "£" : "$";
    page.drawText(`${sym} ${numText}`, {
      x: x,
      y: y,
      size: size,
      font: font,
      color: color,
    });
  }
}

/**
 * Word wraps text into lines fitting within maxWidth.
 */
function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const w = font.widthOfTextAtSize(candidate, size);
    if (w <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Vector Footer Icons
 */
function drawGlobeIcon(page: any, cx: number, cy: number, r: number, color: any) {
  page.drawCircle({
    x: cx,
    y: cy,
    size: r,
    borderColor: color,
    borderWidth: 0.8,
  });
  page.drawLine({
    start: { x: cx - r + 0.6, y: cy },
    end: { x: cx + r - 0.6, y: cy },
    thickness: 0.6,
    color,
  });
  page.drawLine({
    start: { x: cx - r * 0.7, y: cy + r * 0.4 },
    end: { x: cx + r * 0.7, y: cy + r * 0.4 },
    thickness: 0.5,
    color,
  });
  page.drawLine({
    start: { x: cx - r * 0.7, y: cy - r * 0.4 },
    end: { x: cx + r * 0.7, y: cy - r * 0.4 },
    thickness: 0.5,
    color,
  });
  page.drawLine({
    start: { x: cx, y: cy - r + 0.6 },
    end: { x: cx, y: cy + r - 0.6 },
    thickness: 0.6,
    color,
  });
}

function drawEnvelopeIcon(page: any, x: number, y: number, w: number, h: number, color: any) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderColor: color,
    borderWidth: 0.8,
  });
  page.drawLine({
    start: { x: x + 0.5, y: y + h - 0.5 },
    end: { x: x + w / 2, y: y + h * 0.35 },
    thickness: 0.7,
    color,
  });
  page.drawLine({
    start: { x: x + w / 2, y: y + h * 0.35 },
    end: { x: x + w - 0.5, y: y + h - 0.5 },
    thickness: 0.7,
    color,
  });
}

function drawPhoneIcon(page: any, cx: number, cy: number, r: number, color: any) {
  page.drawCircle({
    x: cx,
    y: cy,
    size: r,
    borderColor: color,
    borderWidth: 0.8,
  });
  const s = r * 0.38;
  page.drawLine({
    start: { x: cx - s, y: cy + s },
    end: { x: cx - s * 0.2, y: cy + s * 1.2 },
    thickness: 1.1,
    color,
  });
  page.drawLine({
    start: { x: cx - s, y: cy + s },
    end: { x: cx - s * 1.2, y: cy - s * 0.2 },
    thickness: 1.1,
    color,
  });
  page.drawLine({
    start: { x: cx - s * 1.2, y: cy - s * 0.2 },
    end: { x: cx + s * 0.2, y: cy - s * 1.2 },
    thickness: 1.1,
    color,
  });
  page.drawLine({
    start: { x: cx + s * 0.2, y: cy - s * 1.2 },
    end: { x: cx + s * 1.1, y: cy - s * 0.4 },
    thickness: 1.1,
    color,
  });
}

function drawMetallicLogoFallback(page: any, x: number, y: number, w: number, h: number) {
  const silver = rgb(0.85, 0.85, 0.88);
  const darkSilver = rgb(0.45, 0.45, 0.48);
  const white = rgb(1, 1, 1);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const scale = h / 50;

  // Left chevron / vertical bar of M
  page.drawLine({
    start: { x: cx - 35 * scale, y: cy - 14 * scale },
    end: { x: cx - 35 * scale, y: cy + 14 * scale },
    thickness: 3 * scale,
    color: white,
  });
  page.drawLine({
    start: { x: cx - 35 * scale, y: cy + 14 * scale },
    end: { x: cx - 18 * scale, y: cy - 6 * scale },
    thickness: 2.5 * scale,
    color: silver,
  });
  page.drawLine({
    start: { x: cx - 18 * scale, y: cy - 6 * scale },
    end: { x: cx - 2 * scale, y: cy + 14 * scale },
    thickness: 2.5 * scale,
    color: darkSilver,
  });

  // E three horizontal chrome bars
  page.drawLine({
    start: { x: cx + 8 * scale, y: cy + 12 * scale },
    end: { x: cx + 34 * scale, y: cy + 12 * scale },
    thickness: 2.5 * scale,
    color: white,
  });
  page.drawLine({
    start: { x: cx + 8 * scale, y: cy },
    end: { x: cx + 30 * scale, y: cy },
    thickness: 2.5 * scale,
    color: silver,
  });
  page.drawLine({
    start: { x: cx + 8 * scale, y: cy - 12 * scale },
    end: { x: cx + 34 * scale, y: cy - 12 * scale },
    thickness: 2.5 * scale,
    color: white,
  });
}

// =============================================================================
// PDF INVOICE GENERATOR (Matches Exact User Provided Templates)
// Template 1: Order Creation / Advance Payment Invoice
// Template 2: Final Payment / Completion Invoice
// =============================================================================

export interface InvoicePdfData {
  invoiceType?: "advance" | "final";
  orderCode: string;
  orderName: string;
  clientName: string;
  clientLocation?: string;
  clientEmail: string;
  format?: string;
  duration?: string;
  deadline?: string;
  currency?: string;
  unitPrice?: number;
  total: number;
  advance: number;
  balance: number;
  dateStr?: string;
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<string> {
  const isFinal = data.invoiceType === "final";
  const curCode = (data.currency || "INR").toUpperCase();

  const pdfDoc = await PDFDocument.create();
  // Standard A4 portrait: 595.28 x 841.89 points
  const page = pdfDoc.addPage([595.28, 841.89]);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  // 1. Solid Pitch Black Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: height,
    color: rgb(0, 0, 0),
  });

  // 2. Center Top Brand Header & Chrome ME Logo
  const LOGO_STORAGE_URL = "https://yipfxibyzqsxqhhiwotk.supabase.co/storage/v1/object/public/email-assets/logo.png/mne%20transpirent.png";
  let embeddedLogo: any = null;
  try {
    let logoRes = await fetch(LOGO_STORAGE_URL);
    if (!logoRes.ok) {
      logoRes = await fetch("https://motionnodeedits.com/image/logo.png");
    }
    if (logoRes.ok) {
      const logoBytes = await logoRes.arrayBuffer();
      embeddedLogo = await pdfDoc.embedPng(logoBytes);
    }
  } catch (_) { }

  const logoW = 126;
  const logoH = 64;
  const logoX = (width - logoW) / 2;
  const logoY = height - 105;

  if (embeddedLogo) {
    page.drawImage(embeddedLogo, {
      x: logoX,
      y: logoY,
      width: logoW,
      height: logoH,
    });
  } else {
    drawMetallicLogoFallback(page, logoX, logoY, logoW, logoH);
  }

  // Spaced out subtitle: M O T I O N N O D E E D I T S
  const brandSubText = "M O T I O N N O D E E D I T S";
  const brandSubW = fontBold.widthOfTextAtSize(brandSubText, 8.5);
  page.drawText(brandSubText, {
    x: (width - brandSubW) / 2,
    y: logoY - 14,
    size: 8.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // 3. TO (Client Info) & DATE
  const headerContentY = logoY - 58;

  // Left: TO
  page.drawText("TO", {
    x: 50,
    y: headerContentY,
    size: 12.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const clientNameStr = data.clientName ? `${data.clientName},` : "Valued Client,";
  page.drawText(clientNameStr, {
    x: 50,
    y: headerContentY - 18,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const locationText = data.clientLocation || "vijayawada, AP";
  page.drawText(locationText, {
    x: 50,
    y: headerContentY - 33,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Right: DATE or invoice DATE
  const dateLabel = isFinal ? "invoice  DATE" : "DATE";
  const dateLabelW = fontBold.widthOfTextAtSize(dateLabel, 12);
  page.drawText(dateLabel, {
    x: width - 50 - dateLabelW,
    y: headerContentY,
    size: 12,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const formattedDate = data.dateStr || formatDDMMYYYY(new Date());
  const dateValueW = fontBold.widthOfTextAtSize(formattedDate, 12);
  page.drawText(formattedDate, {
    x: width - 50 - dateValueW,
    y: headerContentY - 18,
    size: 12,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // 4. Table Header Bar (Dark Charcoal Box #141414)
  const tableMargin = 50;
  const tableW = width - 2 * tableMargin;
  let currentY = headerContentY - 72;

  page.drawRectangle({
    x: tableMargin,
    y: currentY - 8,
    width: tableW,
    height: 36,
    color: rgb(0.08, 0.08, 0.08),
  });

  const colItemX = tableMargin + 20;
  const colPriceX = 310;
  const colQtyX = 380;
  const colTotalX = 450;

  page.drawText("ITEM NAME", {
    x: colItemX,
    y: currentY + 6,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("PRICE", {
    x: colPriceX,
    y: currentY + 6,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("QTY", {
    x: colQtyX,
    y: currentY + 6,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("TOTAL", {
    x: colTotalX,
    y: currentY + 6,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Table Row Content
  currentY -= 40;
  const rawItemTitle = data.orderName || "AI video ( AD )";
  const displayTitle = rawItemTitle.length > 28 ? rawItemTitle.slice(0, 26) + "..." : rawItemTitle;
  page.drawText(displayTitle, {
    x: colItemX,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const unitPrice = data.unitPrice || data.total;
  drawAmountWithCurrency(page, fontBold, unitPrice.toString(), colPriceX, currentY, 11, curCode);

  const durationText = data.duration || "1 min";
  page.drawText(durationText, {
    x: colQtyX,
    y: currentY,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const rowTotalFormatted = isFinal ? data.total.toFixed(2) : data.total.toString();
  drawAmountWithCurrency(page, fontBold, rowTotalFormatted, colTotalX, currentY, 11, curCode);

  // 5. Financial Breakdown
  if (!isFinal) {
    // ── TEMPLATE 1: ADVANCE INVOICE BREAKDOWN ──────────────────
    currentY -= 36;
    page.drawText("SUB TOTAL", {
      x: 305,
      y: currentY,
      size: 10.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    drawAmountWithCurrency(page, fontBold, data.total.toFixed(2), 445, currentY, 10.5, curCode);

    currentY -= 26;
    page.drawText("ADVANCE PAID", {
      x: 305,
      y: currentY,
      size: 10.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    drawAmountWithCurrency(page, fontBold, data.advance.toFixed(2), 445, currentY, 10.5, curCode);

    // Dark highlight banner box for TOTAL (Balance remaining due)
    currentY -= 34;
    page.drawRectangle({
      x: tableMargin,
      y: currentY - 8,
      width: tableW,
      height: 34,
      color: rgb(0.08, 0.08, 0.08),
    });

    page.drawText("TOTAL", {
      x: 305,
      y: currentY + 4,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    const balanceRemaining = Math.max(0, data.total - data.advance);
    drawAmountWithCurrency(page, fontBold, balanceRemaining.toFixed(2), 445, currentY + 4, 11, curCode);

    currentY -= 20;
  } else {
    // ── TEMPLATE 2: FINAL INVOICE BREAKDOWN ────────────────────
    currentY -= 40;

    // Dark highlight banner box for TOTAL
    page.drawRectangle({
      x: tableMargin,
      y: currentY - 8,
      width: tableW,
      height: 36,
      color: rgb(0.08, 0.08, 0.08),
    });

    page.drawText("TOTAL", {
      x: 305,
      y: currentY + 5,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    drawAmountWithCurrency(page, fontBold, data.total.toFixed(2), 445, currentY + 5, 11, curCode);

    currentY -= 32;
    page.drawText("PAID", {
      x: 305,
      y: currentY,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    drawAmountWithCurrency(page, fontBold, data.total.toFixed(2), 445, currentY, 11, curCode);

    currentY -= 20;
  }

  // 6. Terms & Conditions
  currentY -= 38;

  const tcTitle = "Terms & Conditions";
  const tcTitleW = fontBold.widthOfTextAtSize(tcTitle, 11.5);
  page.drawText(tcTitle, {
    x: (width - tcTitleW) / 2,
    y: currentY,
    size: 11.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  currentY -= 22;

  if (!isFinal) {
    // ── TEMPLATE 1: 7 NUMBERED CLAUSES ────────────────────────
    const advanceTerms = [
      {
        num: "1. Advance Payment",
        text: "An advance payment has been received to confirm the project. Production will commence accordingly.",
      },
      {
        num: "2. Pricing",
        text: `The rate is ₹${unitPrice || "1,500"} per minute of final video duration. All pricing quoted during the agreement phase is an estimateand subject to revision based on the final project scope and duration.`,
        hasRupee: true,
      },
      {
        num: "3. Final Billing",
        text: "The total amount due will be calculated based on the actual duration of the delivered video:\nA shorter final duration will result in a lower total.\nA longer final duration will result in a higher total.",
      },
      {
        num: "4. Delivery Timeline",
        text: "The expected delivery date is within 2 days of project commencement. Please note that this timeline may be extended if revision requests are made, as each round of revisions may require additional production time.",
      },
      {
        num: "5. Revisions",
        text: "Up to 2 rounds of revisions are included at no additional cost. Further revision requests beyond this limit may be billed separately.",
      },
      {
        num: "6. Scope Changes",
        text: "Any additions or modifications outside the originally agreed scope — including new requirements, extra elements, or significant changes in direction — may incur additional charges. These will be communicated and agreed upon before proceeding.",
      },
      {
        num: "7. Final Payment",
        text: "The remaining balance, calculated based on the final video duration and any applicable scope additions, is due upon project completion and delivery.",
      },
    ];

    const termFontSize = 7.3;
    const termLeading = 9.2;
    const termColor = rgb(0.9, 0.9, 0.9);

    for (const item of advanceTerms) {
      page.drawText(item.num, {
        x: tableMargin + 8,
        y: currentY,
        size: termFontSize,
        font: fontRegular,
        color: termColor,
      });
      currentY -= termLeading;

      const lines = item.text.split("\n");
      for (const line of lines) {
        if (item.hasRupee && line.includes("₹")) {
          const parts = line.split("₹");
          const part1 = parts[0];
          const part2 = parts[1];
          page.drawText(part1, {
            x: tableMargin + 8,
            y: currentY,
            size: termFontSize,
            font: fontRegular,
            color: termColor,
          });
          const w1 = fontRegular.widthOfTextAtSize(part1, termFontSize);
          const rupeeX = tableMargin + 8 + w1;
          drawRupeeGlyph(page, rupeeX, currentY - 0.5, termFontSize, termColor);
          const glyphW = 6.5 * (termFontSize / 10);
          page.drawText(part2, {
            x: rupeeX + glyphW,
            y: currentY,
            size: termFontSize,
            font: fontRegular,
            color: termColor,
          });
          currentY -= termLeading;
        } else {
          const wrapped = wrapText(line, fontRegular, termFontSize, tableW - 16);
          for (const wline of wrapped) {
            page.drawText(wline, {
              x: tableMargin + 8,
              y: currentY,
              size: termFontSize,
              font: fontRegular,
              color: termColor,
            });
            currentY -= termLeading;
          }
        }
      }
      currentY -= 2;
    }
  } else {
    // ── TEMPLATE 2: 10 BULLETED CLAUSES ───────────────────────
    const finalBullets = [
      "Full and final payment has been received.",
      "No outstanding balance remains on this invoice.",
      "All payments are non-refundable.",
      "Additional revisions or requirements are charged separately.",
      "Final files are delivered after payment confirmation.",
      "Payment confirms acceptance of the agreed project scope.",
      "Final files are shared via Google Drive or WhatsApp.",
      "Download links expire within 15 days from the delivery date.",
      "The client is responsible for downloading files before expiry.",
      "MotionNodeEdits is not responsible for files after link expiry.",
    ];

    const bulletFontSize = 9.2;
    const bulletLeading = 18;
    const bulletColor = rgb(0.92, 0.92, 0.92);

    for (const b of finalBullets) {
      page.drawCircle({
        x: tableMargin + 12,
        y: currentY + 3,
        size: 1.8,
        color: bulletColor,
      });

      page.drawText(b, {
        x: tableMargin + 24,
        y: currentY,
        size: bulletFontSize,
        font: fontRegular,
        color: bulletColor,
      });

      currentY -= bulletLeading;
    }
  }

  // 7. Bottom Dark Footer Bar
  const footerH = 34;
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: footerH,
    color: rgb(0.08, 0.08, 0.09),
  });

  const footerY = 12;
  const footerFont = fontRegular;
  const footerColor = rgb(0.92, 0.92, 0.92);

  drawGlobeIcon(page, 45, footerY + 3, 5, footerColor);
  page.drawText("www.motionnodeedits.com", {
    x: 58,
    y: footerY,
    size: 8.5,
    font: footerFont,
    color: footerColor,
  });

  drawEnvelopeIcon(page, 225, footerY + 1, 10, 7, footerColor);
  page.drawText("hello@motionnodeedits.com", {
    x: 242,
    y: footerY,
    size: 8.5,
    font: footerFont,
    color: footerColor,
  });

  drawPhoneIcon(page, 415, footerY + 3, 5.5, footerColor);
  page.drawText("+91 8985351756", {
    x: 428,
    y: footerY,
    size: 8.5,
    font: footerFont,
    color: footerColor,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes).toString("base64");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY environment variable.");
    }

    const body = await req.json();

    let action = body.action;
    let payload = body.payload;

    // =========================================================================
    // Support Supabase Database Webhook payloads (orders table)
    // =========================================================================
    if (body.table === "orders" || body.type === "INSERT" || body.type === "UPDATE") {
      const { type, record, old_record } = body;

      if (type === "INSERT") {
        action = "ORDER_CREATED_CLIENT";
        let clientEmail = "";
        let clientName = "";
        let clientLocation = "";

        if (record.client_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name, location, city, address")
            .eq("id", record.client_id)
            .single();
          if (profile) {
            clientEmail = profile.email || "";
            clientName = profile.full_name || "";
            clientLocation = profile.location || profile.city || profile.address || "";
          }
        }

        let totalAmount = Number(record.amount) || 0;
        let advancePaid = Number(record.advance_amount) || 0;
        let currency = "INR";
        let location = clientLocation;
        let duration = "1 min";

        if (record.admin_notes) {
          const curMatch = record.admin_notes.match(/\[INVOICE_CURRENCY:([^\]]+)\]/);
          if (curMatch) currency = decodeURIComponent(curMatch[1]) || currency;
          const totalMatch = record.admin_notes.match(/\[INVOICE_TOTAL:([^\]]+)\]/);
          if (totalMatch) totalAmount = parseFloat(decodeURIComponent(totalMatch[1])) || totalAmount;
          const advanceMatch = record.admin_notes.match(/\[INVOICE_ADVANCE:([^\]]+)\]/);
          if (advanceMatch) advancePaid = parseFloat(decodeURIComponent(advanceMatch[1])) || advancePaid;
          const locMatch = record.admin_notes.match(/\[INVOICE_LOCATION:([^\]]+)\]/);
          if (locMatch) location = decodeURIComponent(locMatch[1]) || location;
          const durMatch = record.admin_notes.match(/\[INVOICE_DURATION:([^\]]+)\]/);
          if (durMatch) duration = decodeURIComponent(durMatch[1]) || duration;
        }

        payload = {
          clientEmail,
          clientName,
          clientLocation: location,
          orderName: record.order_name || "AI video ( AD )",
          orderCode: record.order_code || (record.id ? record.id.slice(0, 8).toUpperCase() : "MNE-PROJECT"),
          format: record.video_type || "AI video ( AD )",
          duration,
          deadline: record.client_deadline ? new Date(record.client_deadline).toLocaleDateString() : "As per project brief",
          currency,
          totalAmount,
          advancePaid,
          invoiceType: "advance",
        };
      } else if (type === "UPDATE") {
        // Trigger 1: Lead Editor Assigned
        if (record.editor_id && record.editor_id !== old_record?.editor_id) {
          action = "PROJECT_ASSIGNED_EDITOR";
          let editorEmail = "";
          let editorName = "";
          if (record.editor_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", record.editor_id)
              .single();
            if (profile) {
              editorEmail = profile.email || "";
              editorName = profile.full_name || "";
            }
          }

          payload = {
            editorEmail,
            editorName,
            orderName: record.order_name || "Video Project",
            orderCode: record.order_code || (record.id ? record.id.slice(0, 8).toUpperCase() : "MNE-PROJECT"),
            internalDeadline: record.editor_deadline ? new Date(record.editor_deadline).toLocaleDateString() : "Urgent Delivery",
            clientDeadline: record.client_deadline ? new Date(record.client_deadline).toLocaleDateString() : "—",
            driveLink: record.drive_link || record.dropbox_link || "",
            requirements: record.admin_notes || "",
            brief: record.brief || "",
          };
        }
        // Trigger 2: Order Delivered or Final Payment Completed
        else if (
          (record.status === "delivered" && old_record?.status !== "delivered") ||
          (record.status === "completed" && old_record?.status !== "completed")
        ) {
          action = "ORDER_DELIVERED_CLIENT";
          let clientEmail = "";
          let clientName = "";
          let clientLocation = "";

          if (record.client_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, full_name, location, city, address")
              .eq("id", record.client_id)
              .single();
            if (profile) {
              clientEmail = profile.email || "";
              clientName = profile.full_name || "";
              clientLocation = profile.location || profile.city || profile.address || "";
            }
          }

          let totalAmount = Number(record.amount) || 0;
          let currency = "INR";
          let location = clientLocation;
          let duration = "1 min";

          if (record.admin_notes) {
            const curMatch = record.admin_notes.match(/\[INVOICE_CURRENCY:([^\]]+)\]/);
            if (curMatch) currency = decodeURIComponent(curMatch[1]) || currency;
            const totalMatch = record.admin_notes.match(/\[INVOICE_TOTAL:([^\]]+)\]/);
            if (totalMatch) totalAmount = parseFloat(decodeURIComponent(totalMatch[1])) || totalAmount;
            const locMatch = record.admin_notes.match(/\[INVOICE_LOCATION:([^\]]+)\]/);
            if (locMatch) location = decodeURIComponent(locMatch[1]) || location;
            const durMatch = record.admin_notes.match(/\[INVOICE_DURATION:([^\]]+)\]/);
            if (durMatch) duration = decodeURIComponent(durMatch[1]) || duration;
          }

          payload = {
            clientEmail,
            clientName,
            clientLocation: location,
            orderName: record.order_name || "AI video ( AD )",
            orderCode: record.order_code || (record.id ? record.id.slice(0, 8).toUpperCase() : "MNE-PROJECT"),
            format: record.video_type || "AI video ( AD )",
            duration,
            driveLink: record.drive_link || record.dropbox_link || "",
            currency,
            totalAmount,
            advancePaid: totalAmount, // fully paid
            invoiceType: "final",
          };
        } else {
          return new Response(JSON.stringify({ message: "No email required for this update event." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      }
    }

    if (!action || !payload) {
      return new Response(JSON.stringify({ error: "Missing action or payload." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    let emailResult;

    // =========================================================================
    // ACTION 1: ORDER CREATED -> CLIENT CONFIRMATION & ADVANCE INVOICE (Template 1)
    // =========================================================================
    if (action === "ORDER_CREATED_CLIENT") {
      const {
        clientEmail,
        clientName,
        clientLocation,
        orderName,
        orderCode,
        format,
        duration,
        deadline,
        currency,
        totalAmount,
        advancePaid,
      } = payload;

      if (!clientEmail) {
        throw new Error("clientEmail is required for ORDER_CREATED_CLIENT.");
      }

      const total = Number(totalAmount) || 0;
      const advance = Number(advancePaid) || 0;
      const balance = Math.max(0, total - advance);

      const curCode = (currency || "INR").toUpperCase();
      const curHtml = curCode === "INR" ? "₹" : curCode === "EUR" ? "€" : curCode === "GBP" ? "£" : "$";

      // Generate Advance PDF Invoice Attachment (Template 1)
      let attachments: Array<{ filename: string; content: string }> = [];
      try {
        const invoicePdfBase64 = await generateInvoicePdf({
          invoiceType: "advance",
          orderCode: orderCode || "MNE-PROJECT",
          orderName: orderName || "AI video ( AD )",
          clientName: clientName || "Valued Client",
          clientLocation: clientLocation || "vijayawada, AP",
          clientEmail: clientEmail,
          format: format || "AI video ( AD )",
          duration: duration || "1 min",
          deadline: deadline || "As per project brief",
          currency: curCode,
          unitPrice: total,
          total,
          advance,
          balance,
        });

        attachments.push({
          filename: `Invoice_${orderCode || "MNE"}.pdf`,
          content: invoicePdfBase64,
        });
      } catch (pdfErr) {
        console.error("PDF generation note:", pdfErr);
      }

      emailResult = await resend.emails.send({
        from: SENDER_EMAIL,
        to: [clientEmail],
        subject: `Project Confirmation (${orderCode || "MNE"})`,
        attachments: attachments.length > 0 ? attachments : undefined,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Project Confirmation - MotionNodeEdits</title>
</head>
<body style="margin: 0; padding: 32px 15px; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Plus Jakarta Sans', sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #0C0C10; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.85);">
    
    <!-- Studio Header with Transparent Logo -->
    <tr>
      <td style="padding: 28px 36px 20px 36px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="vertical-align: middle;">
              <img src="https://yipfxibyzqsxqhhiwotk.supabase.co/storage/v1/object/public/email-assets/logo.png/mne%20transpirent.png" alt="MotionNodeEdits" height="42" style="display: block; border: 0; outline: none; margin: 0 0 10px 0;" />
              <h1 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.3px; color: #FFFFFF;">
                MOTIONNODE EDITS
              </h1>
              <p style="margin: 3px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #8E8F94;">
                AI-Powered Video Production Studio
              </p>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.18); color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px; letter-spacing: 0.8px;">
                CONFIRMED
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Message Body -->
    <tr>
      <td style="padding: 32px 36px;">
        <p style="font-size: 15px; line-height: 1.6; color: #E4E4E7; margin: 0 0 16px 0;">
          Hi <strong style="color: #FFFFFF;">${clientName || "Valued Client"}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #8E8F94; margin: 0 0 24px 0;">
          Thank you for choosing MotionNodeEdits! Your video project has been verified and registered in our active production studio pipeline.
        </p>

        <!-- Project Overview Box (No project name row) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #101016; border: 1px solid #1C1C26; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #8E8F94; text-transform: uppercase; letter-spacing: 0.5px;">Order Tracking Code:</td>
            <td style="padding: 6px 0; font-size: 13px; font-family: monospace; font-weight: 700; color: #FFFFFF; text-align: right;">${orderCode || "MNE-PROJECT"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #8E8F94; text-transform: uppercase; letter-spacing: 0.5px;">Format / Category:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #FFFFFF; text-align: right;">${format || "Professional Video"} (${duration || "1 min"})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #8E8F94; text-transform: uppercase; letter-spacing: 0.5px;">Target Delivery:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #FFFFFF; text-align: right;">${deadline || "As per project brief"}</td>
          </tr>
        </table>

        <!-- Invoice & Advance Receipt Breakdown -->
        <h3 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #8E8F94;">
          Payment & Production Status
        </h3>
        ${total > 0
            ? `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #101016; border: 1px solid #1C1C26; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #8E8F94;">Total Project Agreement:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #FFFFFF; text-align: right;">${curHtml} ${total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #4ADE80;">Advance Payment Received:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #4ADE80; text-align: right;">-${curHtml} ${advance.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px 0 0 0; border-top: 1px solid #1C1C26;"></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 800; color: #FFFFFF;">Remaining Balance on Delivery:</td>
            <td style="padding: 6px 0; font-size: 15px; font-weight: 800; color: #FACC15; text-align: right;">${curHtml} ${balance.toFixed(2)}</td>
          </tr>
        </table>`
            : ""
          }

        <!-- Attached PDF Banner -->
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #E4E4E7;">
            📎 <strong style="color: #FFFFFF;">Official PDF Invoice Attached:</strong> Your downloadable invoice (<span style="font-family: monospace; color: #FFFFFF;">Invoice_${orderCode || "MNE"}.pdf</span>) is attached to this email for your official records and accounting.
          </p>
        </div>

        <!-- CTA Button -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center; padding: 10px 0 6px 0;">
              <a href="https://motionnodeedits.com/dashboard/client" style="background: #FFFFFF; color: #000000; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 8px; display: inline-block; letter-spacing: 0.3px; box-shadow: 0 4px 18px rgba(255,255,255,0.12);">
                Track Video Progress
              </a>
            </td>
          </tr>
        </table>

        <!-- Track video editing progress text -->
        <p style="font-size: 12px; color: #8E8F94; text-align: center; margin: 8px 0 0 0; font-weight: 500;">
          Track your video editing progress
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 26px 36px; background-color: #08080C; border-top: 1px solid #181822; text-align: center;">
        
        <!-- Social Links (Instagram, YouTube, Website) -->
        <div style="margin: 0 0 16px 0; text-align: center;">
          <a href="https://www.instagram.com/motionnodeedits/" target="_blank" style="display: inline-block; margin: 0 6px; padding: 6px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #E6E6E6; font-size: 11px; font-weight: 600; text-decoration: none;">
            Instagram ↗
          </a>
          <a href="https://www.youtube.com/@motionnodeedits" target="_blank" style="display: inline-block; margin: 0 6px; padding: 6px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #E6E6E6; font-size: 11px; font-weight: 600; text-decoration: none;">
            YouTube ↗
          </a>
          <a href="https://motionnodeedits.com" target="_blank" style="display: inline-block; margin: 0 6px; padding: 6px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #E6E6E6; font-size: 11px; font-weight: 600; text-decoration: none;">
            Website ↗
          </a>
        </div>

        <p style="margin: 0; font-size: 11px; color: #52525B;">
          © ${new Date().getFullYear()} MotionNodeEdits. All rights reserved.
        </p>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #71717A; line-height: 1.5;">
          This is an automated notification. For assistance, reach out via email to <a href="mailto:hello@motionnodeedits.com" style="color: #FFFFFF; text-decoration: underline;">hello@motionnodeedits.com</a>.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });
    }

    // =========================================================================
    // ACTION 2: ORDER DELIVERED / FINAL PAYMENT -> FINAL INVOICE (Template 2)
    // =========================================================================
    else if (action === "ORDER_DELIVERED_CLIENT" || action === "FINAL_INVOICE_CLIENT") {
      const {
        clientEmail,
        clientName,
        clientLocation,
        orderName,
        orderCode,
        format,
        duration,
        driveLink,
        currency,
        totalAmount,
      } = payload;

      if (!clientEmail) {
        throw new Error("clientEmail is required for ORDER_DELIVERED_CLIENT.");
      }

      const total = Number(totalAmount) || 0;
      const curCode = (currency || "INR").toUpperCase();
      const curHtml = curCode === "INR" ? "₹" : curCode === "EUR" ? "€" : curCode === "GBP" ? "£" : "$";

      // Generate Final PDF Invoice Attachment (Template 2)
      let attachments: Array<{ filename: string; content: string }> = [];
      try {
        const finalInvoicePdfBase64 = await generateInvoicePdf({
          invoiceType: "final",
          orderCode: orderCode || "MNE-PROJECT",
          orderName: orderName || "AI video ( AD )",
          clientName: clientName || "Valued Client",
          clientLocation: clientLocation || "vijayawada, AP",
          clientEmail: clientEmail,
          format: format || "AI video ( AD )",
          duration: duration || "1 min",
          deadline: "Completed",
          currency: curCode,
          unitPrice: total,
          total,
          advance: total,
          balance: 0,
        });

        attachments.push({
          filename: `Final_Invoice_${orderCode || "MNE"}.pdf`,
          content: finalInvoicePdfBase64,
        });
      } catch (pdfErr) {
        console.error("Final PDF generation note:", pdfErr);
      }

      emailResult = await resend.emails.send({
        from: SENDER_EMAIL,
        to: [clientEmail],
        subject: `Project Delivery & Final Invoice (${orderCode || "MNE"})`,
        attachments: attachments.length > 0 ? attachments : undefined,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Project Delivery & Final Invoice - MotionNodeEdits</title>
</head>
<body style="margin: 0; padding: 32px 15px; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Plus Jakarta Sans', sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #0C0C10; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.85);">
    
    <!-- Studio Header with Transparent Logo -->
    <tr>
      <td style="padding: 28px 36px 20px 36px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="vertical-align: middle;">
              <img src="https://yipfxibyzqsxqhhiwotk.supabase.co/storage/v1/object/public/email-assets/logo.png/mne%20transpirent.png" alt="MotionNodeEdits" height="42" style="display: block; border: 0; outline: none; margin: 0 0 10px 0;" />
              <h1 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.3px; color: #FFFFFF;">
                MOTIONNODE EDITS
              </h1>
              <p style="margin: 3px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #8E8F94;">
                Final Project Delivery & Official Receipt
              </p>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ADE80; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px; letter-spacing: 0.8px;">
                DELIVERED & PAID
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Message Body -->
    <tr>
      <td style="padding: 32px 36px;">
        <p style="font-size: 15px; line-height: 1.6; color: #E4E4E7; margin: 0 0 16px 0;">
          Hi <strong style="color: #FFFFFF;">${clientName || "Valued Client"}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #8E8F94; margin: 0 0 24px 0;">
          Congratulations! Your video project has been completed, reviewed, and finalized by the MotionNodeEdits studio team. Full and final payment has been confirmed.
        </p>

        <!-- Project Overview Box (No project name row) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #101016; border: 1px solid #1C1C26; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #8E8F94; text-transform: uppercase; letter-spacing: 0.5px;">Order Tracking Code:</td>
            <td style="padding: 6px 0; font-size: 13px; font-family: monospace; font-weight: 700; color: #4ADE80; text-align: right;">${orderCode || "MNE-PROJECT"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #8E8F94; text-transform: uppercase; letter-spacing: 0.5px;">Format / Duration:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #FFFFFF; text-align: right;">${format || "Video"} (${duration || "1 min"})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #8E8F94; text-transform: uppercase; letter-spacing: 0.5px;">Payment Status:</td>
            <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #4ADE80; text-align: right;">Paid in Full (Zero Balance)</td>
          </tr>
        </table>

        <!-- Paid in Full Summary -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #101016; border: 1px solid #1C1C26; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #8E8F94;">Total Project Agreement:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #FFFFFF; text-align: right;">${curHtml} ${total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #4ADE80;">Paid in Full:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #4ADE80; text-align: right;">${curHtml} ${total.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px 0 0 0; border-top: 1px solid #1C1C26;"></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 800; color: #FFFFFF;">Remaining Balance:</td>
            <td style="padding: 6px 0; font-size: 15px; font-weight: 800; color: #4ADE80; text-align: right;">${curHtml} 0.00</td>
          </tr>
        </table>

        <!-- Deliverables Access Box -->
        ${driveLink
            ? `
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 18px; margin-bottom: 24px;">
          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <span style="font-size: 12px; font-weight: 700; color: #FFFFFF; text-transform: uppercase;">Finished Deliverables</span>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #E4E4E7;">Your master video assets are ready for download.</p>
                <p style="margin: 6px 0 0 0; font-size: 11px; color: #FCD34D;">⚠️ Note: Download links expire within 15 days from delivery date. Please back up your assets promptly.</p>
              </td>
              <td style="text-align: right;">
                <a href="${driveLink}" target="_blank" style="background: #FFFFFF; color: #000000; font-size: 12px; font-weight: 800; text-decoration: none; padding: 10px 18px; border-radius: 6px; display: inline-block;">
                  Download Files ↗
                </a>
              </td>
            </tr>
          </table>
        </div>`
            : ""
          }

        <!-- Attached PDF Banner -->
        <div style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #E4E4E7;">
            📎 <strong style="color: #4ADE80;">Official Paid Invoice Attached:</strong> Your downloadable paid invoice (<span style="font-family: monospace; color: #FFFFFF;">Final_Invoice_${orderCode || "MNE"}.pdf</span>) is attached to this email confirming zero outstanding balance.
          </p>
        </div>

        <!-- CTA Button -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center; padding: 10px 0 6px 0;">
              <a href="https://motionnodeedits.com/dashboard/client" style="background: #FFFFFF; color: #000000; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 8px; display: inline-block; letter-spacing: 0.3px;">
                Open Client Dashboard
              </a>
            </td>
          </tr>
        </table>

        <!-- Track video editing progress text -->
        <p style="font-size: 12px; color: #8E8F94; text-align: center; margin: 8px 0 0 0; font-weight: 500;">
          Track your video editing progress
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 26px 36px; background-color: #08080C; border-top: 1px solid #181822; text-align: center;">
        
        <!-- Social Links (Instagram, YouTube, Website) -->
        <div style="margin: 0 0 16px 0; text-align: center;">
          <a href="https://www.instagram.com/motionnodeedits/" target="_blank" style="display: inline-block; margin: 0 6px; padding: 6px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #E6E6E6; font-size: 11px; font-weight: 600; text-decoration: none;">
            Instagram ↗
          </a>
          <a href="https://www.youtube.com/@motionnodeedits" target="_blank" style="display: inline-block; margin: 0 6px; padding: 6px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #E6E6E6; font-size: 11px; font-weight: 600; text-decoration: none;">
            YouTube ↗
          </a>
          <a href="https://motionnodeedits.com" target="_blank" style="display: inline-block; margin: 0 6px; padding: 6px 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #E6E6E6; font-size: 11px; font-weight: 600; text-decoration: none;">
            Website ↗
          </a>
        </div>

        <p style="margin: 0; font-size: 11px; color: #52525B;">
          © ${new Date().getFullYear()} MotionNodeEdits. All rights reserved.
        </p>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #71717A; line-height: 1.5;">
          This is an automated notification. For assistance, reach out via email to <a href="mailto:hello@motionnodeedits.com" style="color: #FFFFFF; text-decoration: underline;">hello@motionnodeedits.com</a>.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });
    }

    // =========================================================================
    // ACTION 3: PROJECT ASSIGNED -> EDITOR PRODUCTION BRIEFING NOTIFICATION
    // =========================================================================
    else if (action === "PROJECT_ASSIGNED_EDITOR") {
      const {
        editorEmail,
        editorName,
        orderName,
        orderCode,
        internalDeadline,
        clientDeadline,
        driveLink,
        requirements,
        brief,
      } = payload;

      if (!editorEmail) {
        throw new Error("editorEmail is required for PROJECT_ASSIGNED_EDITOR.");
      }

      emailResult = await resend.emails.send({
        from: SENDER_EMAIL,
        to: [editorEmail],
        subject: `New Project Assigned: ${orderName || "Video"}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Production Assignment - MotionNodeEdits</title>
</head>
<body style="margin: 0; padding: 32px 15px; background-color: #050507; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Plus Jakarta Sans', sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #0C0C10; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.85);">
    
    <!-- Studio Header with Transparent Logo -->
    <tr>
      <td style="padding: 28px 36px 20px 36px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="vertical-align: middle;">
              <img src="https://yipfxibyzqsxqhhiwotk.supabase.co/storage/v1/object/public/email-assets/logo.png/mne%20transpirent.png" alt="MotionNodeEdits" height="42" style="display: block; border: 0; outline: none; margin: 0 0 10px 0;" />
              <h1 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.3px; color: #FFFFFF;">
                MOTIONNODE EDITS
              </h1>
              <p style="margin: 3px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #8E8F94;">
                Production Studio Roster
              </p>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ADE80; font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 20px; letter-spacing: 0.8px;">
                ASSIGNED
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px 36px;">
        <p style="font-size: 15px; line-height: 1.6; color: #E4E4E7; margin: 0 0 16px 0;">
          Hi <strong style="color: #FFFFFF;">${editorName || "Editor"}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #8E8F94; margin: 0 0 24px 0;">
          You have been designated as lead editor for <strong style="color: #FFFFFF;">${orderName}</strong>. Please review the production brief, download the raw footage, and adhere strictly to the internal timeline below.
        </p>

        <!-- Deadlines & Info (Order Code removed as requested) -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #101016; border: 1px solid #1C1C26; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #F87171; text-transform: uppercase; font-weight: 700;">Internal Draft 1 Deadline:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 800; color: #EF4444; text-align: right;">${internalDeadline || "Urgent Delivery"}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #8E8F94; text-transform: uppercase;">Client Delivery Deadline:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #FFFFFF; text-align: right;">${clientDeadline || "—"}</td>
          </tr>
        </table>

        <!-- Footage Link Banner -->
        ${driveLink
            ? `
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 18px; margin-bottom: 24px;">
          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <span style="font-size: 12px; font-weight: 700; color: #FFFFFF; text-transform: uppercase;">Raw Footage & Media Assets</span>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #CBD5E1;">Access project footage on Google Drive / Dropbox</p>
              </td>
              <td style="text-align: right;">
                <a href="${driveLink}" target="_blank" style="background: #FFFFFF; color: #000000; font-size: 12px; font-weight: 800; text-decoration: none; padding: 10px 18px; border-radius: 6px; display: inline-block;">
                  Open Drive ↗
                </a>
              </td>
            </tr>
          </table>
        </div>`
            : ""
          }

        <!-- Creative Brief / Requirements -->
        ${requirements || brief
            ? `
        <div style="background: #101016; border: 1px solid #1C1C26; border-radius: 12px; padding: 18px 20px; margin-bottom: 30px;">
          <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #FFFFFF;">
            Director & Editor Briefing Notes:
          </h4>
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #E4E4E7; white-space: pre-wrap;">
            ${requirements || brief}
          </p>
        </div>`
            : ""
          }

        <!-- CTA Button -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center; padding: 10px 0 20px 0;">
              <a href="https://motionnodeedits.com/dashboard/editor" style="background: #FFFFFF; color: #000000; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 8px; display: inline-block; letter-spacing: 0.3px; box-shadow: 0 4px 18px rgba(255,255,255,0.12);">
                Open Editor Workspace
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 36px; background-color: #08080C; border-top: 1px solid #181822; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #52525B;">
          © ${new Date().getFullYear()} MotionNodeEdits Studio Management System
        </p>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #71717A; line-height: 1.5;">
          This is an automated notification. For assistance, reach out via email to <a href="mailto:hello@motionnodeedits.com" style="color: #FFFFFF; text-decoration: underline;">hello@motionnodeedits.com</a>.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      });
    } else {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ success: true, data: emailResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
