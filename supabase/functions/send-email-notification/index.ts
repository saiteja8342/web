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
// PDF INVOICE GENERATOR HELPER (Pure in-memory, A4 studio format)
// =============================================================================
async function generateInvoicePdf(data: {
  orderCode: string;
  orderName: string;
  clientName: string;
  clientEmail: string;
  format: string;
  deadline: string;
  currency?: string;
  total: number;
  advance: number;
  balance: number;
}): Promise<string> {
  const curCode = (data.currency || "USD").toUpperCase();
  // In PDF Helvetica (WinAnsi), INR is formatted as "INR " or "Rs. " to prevent font glyph encoding errors
  const curPrefix = curCode === "INR" ? "INR " : curCode === "EUR" ? "EUR " : curCode === "GBP" ? "GBP " : "$";

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  // Dark studio top bar
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: rgb(0.05, 0.05, 0.08),
  });

  // Studio Brand Title
  page.drawText("MOTIONNODE EDITS", {
    x: 40,
    y: height - 50,
    size: 20,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("AI-POWERED VIDEO PRODUCTION STUDIO", {
    x: 40,
    y: height - 66,
    size: 8,
    font: fontRegular,
    color: rgb(0.75, 0.52, 0.99),
  });

  page.drawText("motionnodeedits.com", {
    x: 40,
    y: height - 80,
    size: 8,
    font: fontRegular,
    color: rgb(0.6, 0.6, 0.65),
  });

  // Right Header: INVOICE & RECEIPT
  page.drawText("INVOICE & RECEIPT", {
    x: width - 210,
    y: height - 48,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Invoice #: INV-${data.orderCode || "MNE"}`, {
    x: width - 210,
    y: height - 64,
    size: 9,
    font: fontRegular,
    color: rgb(0.85, 0.85, 0.9),
  });

  page.drawText(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, {
    x: width - 210,
    y: height - 78,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.65, 0.65, 0.7),
  });

  // Client Details & Billing Info
  let currentY = height - 140;

  page.drawText("BILLED TO:", {
    x: 40,
    y: currentY,
    size: 8,
    font: fontBold,
    color: rgb(0.5, 0.5, 0.55),
  });

  currentY -= 16;
  page.drawText(data.clientName || "Valued Client", {
    x: 40,
    y: currentY,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.15),
  });

  currentY -= 14;
  page.drawText(data.clientEmail || "—", {
    x: 40,
    y: currentY,
    size: 9,
    font: fontRegular,
    color: rgb(0.35, 0.35, 0.4),
  });

  // Status badge on the right
  page.drawRectangle({
    x: width - 210,
    y: currentY - 2,
    width: 170,
    height: 22,
    color: rgb(0.9, 0.98, 0.93),
    borderColor: rgb(0.3, 0.75, 0.45),
    borderWidth: 1,
  });
  page.drawText("ADVANCE PAYMENT CONFIRMED", {
    x: width - 200,
    y: currentY + 5,
    size: 7.5,
    font: fontBold,
    color: rgb(0.1, 0.55, 0.25),
  });

  // Table Header Background
  currentY -= 45;
  page.drawRectangle({
    x: 40,
    y: currentY,
    width: width - 80,
    height: 24,
    color: rgb(0.94, 0.94, 0.96),
  });

  page.drawText("DESCRIPTION / PROJECT", {
    x: 50,
    y: currentY + 7,
    size: 8,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.35),
  });

  page.drawText("FORMAT", {
    x: 260,
    y: currentY + 7,
    size: 8,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.35),
  });

  page.drawText("TARGET DELIVERY", {
    x: 370,
    y: currentY + 7,
    size: 8,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.35),
  });

  page.drawText("AGREED FEE", {
    x: width - 110,
    y: currentY + 7,
    size: 8,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.35),
  });

  // Table Row
  currentY -= 28;
  const safeName = data.orderName.length > 28 ? data.orderName.slice(0, 26) + "..." : data.orderName;
  page.drawText(safeName, {
    x: 50,
    y: currentY + 8,
    size: 9.5,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.15),
  });

  const safeFormat = data.format.length > 18 ? data.format.slice(0, 16) + "..." : data.format;
  page.drawText(safeFormat, {
    x: 260,
    y: currentY + 8,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.35),
  });

  page.drawText(data.deadline || "Per brief", {
    x: 370,
    y: currentY + 8,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.35),
  });

  page.drawText(`${curPrefix}${data.total.toFixed(2)}`, {
    x: width - 110,
    y: currentY + 8,
    size: 9.5,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.15),
  });

  // Divider line
  currentY -= 5;
  page.drawLine({
    start: { x: 40, y: currentY },
    end: { x: width - 40, y: currentY },
    thickness: 1,
    color: rgb(0.88, 0.88, 0.9),
  });

  // Financial Breakdown Box (Right Aligned)
  currentY -= 30;
  const boxX = width - 230;

  page.drawText("Total Project Agreement:", {
    x: boxX,
    y: currentY,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.45),
  });
  page.drawText(`${curPrefix}${data.total.toFixed(2)}`, {
    x: width - 70,
    y: currentY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.15),
  });

  currentY -= 18;
  page.drawText("Advance Payment Received:", {
    x: boxX,
    y: currentY,
    size: 9,
    font: fontBold,
    color: rgb(0.15, 0.6, 0.3),
  });
  page.drawText(`-${curPrefix}${data.advance.toFixed(2)}`, {
    x: width - 70,
    y: currentY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.15, 0.6, 0.3),
  });

  currentY -= 10;
  page.drawLine({
    start: { x: boxX, y: currentY },
    end: { x: width - 40, y: currentY },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.88),
  });

  currentY -= 18;
  page.drawText("Remaining Balance Due on Delivery:", {
    x: boxX - 45,
    y: currentY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.15),
  });
  page.drawText(`${curPrefix}${data.balance.toFixed(2)}`, {
    x: width - 70,
    y: currentY,
    size: 10.5,
    font: fontBold,
    color: rgb(0.85, 0.55, 0.05),
  });

  // Terms and conditions note
  currentY -= 65;
  page.drawRectangle({
    x: 40,
    y: currentY - 12,
    width: width - 80,
    height: 48,
    color: rgb(0.97, 0.97, 0.99),
    borderColor: rgb(0.9, 0.9, 0.93),
    borderWidth: 1,
  });

  page.drawText("PAYMENT TERMS & PRODUCTION AGREEMENT", {
    x: 52,
    y: currentY + 22,
    size: 7.5,
    font: fontBold,
    color: rgb(0.4, 0.4, 0.45),
  });

  page.drawText("1. Advance payment confirms your studio booking, resource reservation, and lead editor assignment.", {
    x: 52,
    y: currentY + 10,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.45, 0.45, 0.5),
  });

  page.drawText("2. The remaining balance will become payable upon master delivery and client approval of finished assets.", {
    x: 52,
    y: currentY - 2,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.45, 0.45, 0.5),
  });

  // Bottom Footer
  page.drawLine({
    start: { x: 40, y: 50 },
    end: { x: width - 40, y: 50 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.92),
  });

  page.drawText("MotionNodeEdits Studio • support@motionnodeedits.com • motionnodeedits.com", {
    x: 40,
    y: 35,
    size: 8,
    font: fontRegular,
    color: rgb(0.55, 0.55, 0.6),
  });

  page.drawText("Official Production Document", {
    x: width - 160,
    y: 35,
    size: 8,
    font: fontRegular,
    color: rgb(0.55, 0.55, 0.6),
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

    // Support Supabase Database Webhook payloads (orders table)
    if (body.table === "orders" || body.type === "INSERT" || body.type === "UPDATE") {
      const { type, record, old_record } = body;

      if (type === "INSERT") {
        action = "ORDER_CREATED_CLIENT";
        let clientEmail = "";
        let clientName = "";
        if (record.client_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", record.client_id)
            .single();
          if (profile) {
            clientEmail = profile.email;
            clientName = profile.full_name;
          }
        }

        let totalAmount = Number(record.amount) || 0;
        let advancePaid = Number(record.advance_amount) || 0;
        let currency = "USD";

        if (record.admin_notes) {
          const curMatch = record.admin_notes.match(/\[INVOICE_CURRENCY:([^\]]+)\]/);
          if (curMatch) {
            currency = decodeURIComponent(curMatch[1]) || "USD";
          }
          const totalMatch = record.admin_notes.match(/\[INVOICE_TOTAL:([^\]]+)\]/);
          if (totalMatch) {
            totalAmount = parseFloat(decodeURIComponent(totalMatch[1])) || totalAmount;
          }
          const advanceMatch = record.admin_notes.match(/\[INVOICE_ADVANCE:([^\]]+)\]/);
          if (advanceMatch) {
            advancePaid = parseFloat(decodeURIComponent(advanceMatch[1])) || advancePaid;
          }
        }

        payload = {
          clientEmail,
          clientName,
          orderName: record.order_name || "Video Project",
          orderCode: record.order_code || (record.id ? record.id.slice(0, 8).toUpperCase() : "MNE-PROJECT"),
          format: record.video_type || "Professional Video",
          deadline: record.client_deadline ? new Date(record.client_deadline).toLocaleDateString() : "As per project brief",
          currency,
          totalAmount,
          advancePaid,
        };
      } else if (type === "UPDATE") {
        // Trigger only when an editor is assigned or changed
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
              editorEmail = profile.email;
              editorName = profile.full_name;
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
        } else {
          // Status or other non-editor updates do not trigger this webhook
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
    // ACTION 1: ORDER CREATED -> CLIENT CONFIRMATION & ADVANCE INVOICE RECEIPT
    // =========================================================================
    if (action === "ORDER_CREATED_CLIENT") {
      const {
        clientEmail,
        clientName,
        orderName,
        orderCode,
        format,
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

      const curCode = (currency || "USD").toUpperCase();
      const curHtml = curCode === "INR" ? "₹" : curCode === "EUR" ? "€" : curCode === "GBP" ? "£" : "$";

      // Generate PDF Invoice Attachment
      let attachments: Array<{ filename: string; content: string }> = [];
      try {
        const invoicePdfBase64 = await generateInvoicePdf({
          orderCode: orderCode || "MNE-PROJECT",
          orderName: orderName || "Video Project",
          clientName: clientName || "Valued Client",
          clientEmail: clientEmail,
          format: format || "Professional Video",
          deadline: deadline || "As per project brief",
          currency: curCode,
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
        subject: `Project Confirmed: ${orderName || "Video Project"} (${orderCode || "MNE"})`,
        attachments: attachments.length > 0 ? attachments : undefined,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Project Confirmation - MotionNodeEdits</title>
</head>
<body style="margin: 0; padding: 30px 15px; background-color: #08080C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #12121A; border: 1px solid #232330; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
    
    <!-- Studio Header -->
    <tr>
      <td style="padding: 32px 36px 20px 36px; border-bottom: 1px solid #1E1E2A;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">
                MOTION<span style="color: #C084FC;">NODE</span> EDITS
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8E8EA0;">
                AI-Powered Video Production Studio
              </p>
            </td>
            <td style="text-align: right;">
              <span style="background: rgba(192, 132, 252, 0.12); border: 1px solid rgba(192, 132, 252, 0.28); color: #C084FC; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px;">
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
        <p style="font-size: 15px; line-height: 1.6; color: #E4E4E7; margin: 0 0 20px 0;">
          Hi <strong style="color: #FFFFFF;">${clientName || "Valued Client"}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #A1A1AA; margin: 0 0 24px 0;">
          Thank you for choosing MotionNodeEdits! Your video project has been verified and registered in our active production studio pipeline.
        </p>

        <!-- Project Overview Box -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #181824; border: 1px solid #282838; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 5px 0; font-size: 12px; color: #8E8EA0; text-transform: uppercase; letter-spacing: 0.5px;">Project Name:</td>
            <td style="padding: 5px 0; font-size: 14px; font-weight: 700; color: #FFFFFF; text-align: right;">${orderName}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-size: 12px; color: #8E8EA0; text-transform: uppercase; letter-spacing: 0.5px;">Order Tracking Code:</td>
            <td style="padding: 5px 0; font-size: 13px; font-family: monospace; font-weight: 700; color: #C084FC; text-align: right;">${orderCode || "MNE-PROJECT"}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-size: 12px; color: #8E8EA0; text-transform: uppercase; letter-spacing: 0.5px;">Format / Category:</td>
            <td style="padding: 5px 0; font-size: 13px; color: #FFFFFF; text-align: right;">${format || "Professional Video"}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-size: 12px; color: #8E8EA0; text-transform: uppercase; letter-spacing: 0.5px;">Target Delivery:</td>
            <td style="padding: 5px 0; font-size: 13px; color: #FFFFFF; text-align: right;">${deadline || "As per project brief"}</td>
          </tr>
        </table>

        <!-- Invoice & Advance Receipt Breakdown -->
        <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #FFFFFF;">
          Payment & Production Status
        </h3>
        ${
          total > 0
            ? `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #14141E; border: 1px solid #28283A; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #A1A1AA;">Total Project Agreement:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #FFFFFF; text-align: right;">${curHtml}${total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #4ADE80;">Advance Payment Received:</td>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 700; color: #4ADE80; text-align: right;">-${curHtml}${advance.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 8px 0 0 0; border-top: 1px solid #232332;"></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; font-weight: 800; color: #FFFFFF;">Remaining Balance Due on Delivery:</td>
            <td style="padding: 6px 0; font-size: 15px; font-weight: 800; color: #FACC15; text-align: right;">${curHtml}${balance.toFixed(2)}</td>
          </tr>
        </table>`
            : ""
        }

        <!-- Attached PDF Banner -->
        <div style="background: rgba(192, 132, 252, 0.08); border: 1px solid rgba(192, 132, 252, 0.25); border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #E4E4E7;">
            📎 <strong style="color: #C084FC;">Official PDF Invoice Attached:</strong> Your downloadable invoice (<span style="font-family: monospace; color: #FFFFFF;">Invoice_${orderCode || "MNE"}.pdf</span>) is attached to this email for your official records and accounting.
          </p>
        </div>

        <!-- CTA Button -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align: center; padding: 10px 0 20px 0;">
              <a href="https://motionnodeedits.com/dashboard/client" style="background: #FFFFFF; color: #000000; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 8px; display: inline-block; letter-spacing: 0.3px; box-shadow: 0 4px 18px rgba(255,255,255,0.15);">
                Access Client Portal
              </a>
            </td>
          </tr>
        </table>

        <p style="font-size: 12px; color: #71717A; text-align: center; margin: 10px 0 0 0;">
          You can track real-time editing status, review drafts, and chat with our team in your client dashboard.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 36px; background-color: #0D0D14; border-top: 1px solid #1A1A24; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #52525B;">
          © ${new Date().getFullYear()} MotionNodeEdits. All rights reserved.
        </p>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #52525B;">
          This is an automated notification. Please do not reply directly to this email. For assistance, reach out via your client portal.
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
    // ACTION 2: PROJECT ASSIGNED -> EDITOR PRODUCTION BRIEFING NOTIFICATION
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
        subject: `New Project Assigned: ${orderName || "Video"} (${orderCode || "MNE"})`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Production Assignment - MotionNodeEdits</title>
</head>
<body style="margin: 0; padding: 30px 15px; background-color: #08080C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #12121A; border: 1px solid #232330; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
    
    <!-- Studio Header -->
    <tr>
      <td style="padding: 32px 36px 20px 36px; border-bottom: 1px solid #1E1E2A;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">
                MOTION<span style="color: #C084FC;">NODE</span> EDITS
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8E8EA0;">
                Production Studio Roster
              </p>
            </td>
            <td style="text-align: right;">
              <span style="background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ADE80; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px;">
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
        <p style="font-size: 14px; line-height: 1.6; color: #A1A1AA; margin: 0 0 24px 0;">
          You have been designated as lead editor for <strong style="color: #FFFFFF;">${orderName}</strong>. Please review the production brief, download the raw footage, and adhere strictly to the internal timeline below.
        </p>

        <!-- Deadlines & Info -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #181824; border: 1px solid #282838; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 5px 0; font-size: 12px; color: #8E8EA0; text-transform: uppercase;">Order Code:</td>
            <td style="padding: 5px 0; font-size: 13px; font-family: monospace; font-weight: 700; color: #C084FC; text-align: right;">${orderCode || "MNE-PROJECT"}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-size: 12px; color: #F87171; text-transform: uppercase; font-weight: 700;">Internal Draft 1 Deadline:</td>
            <td style="padding: 5px 0; font-size: 14px; font-weight: 800; color: #EF4444; text-align: right;">${internalDeadline || "Urgent Delivery"}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-size: 12px; color: #8E8EA0; text-transform: uppercase;">Client Deadline:</td>
            <td style="padding: 5px 0; font-size: 13px; color: #FFFFFF; text-align: right;">${clientDeadline || "—"}</td>
          </tr>
        </table>

        <!-- Footage Link Banner -->
        ${
          driveLink
            ? `
        <div style="background: rgba(96, 165, 250, 0.08); border: 1px solid rgba(96, 165, 250, 0.25); border-radius: 10px; padding: 16px; margin-bottom: 24px;">
          <table width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td>
                <span style="font-size: 12px; font-weight: 700; color: #60A5FA; text-transform: uppercase;">Raw Footage & Media Assets</span>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #CBD5E1;">Access project footage on Google Drive / Dropbox</p>
              </td>
              <td style="text-align: right;">
                <a href="${driveLink}" target="_blank" style="background: #3B82F6; color: #FFFFFF; font-size: 12px; font-weight: 700; text-decoration: none; padding: 8px 16px; border-radius: 6px; display: inline-block;">
                  Open Drive ↗
                </a>
              </td>
            </tr>
          </table>
        </div>`
            : ""
        }

        <!-- Creative Brief / Requirements -->
        ${
          requirements || brief
            ? `
        <div style="background: #14141E; border: 1px solid #232332; border-radius: 10px; padding: 18px 20px; margin-bottom: 30px;">
          <h4 style="margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #C084FC;">
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
              <a href="https://motionnodeedits.com/dashboard/editor" style="background: #FFFFFF; color: #000000; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 34px; border-radius: 8px; display: inline-block; letter-spacing: 0.3px;">
                Open Editor Workspace
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 36px; background-color: #0D0D14; border-top: 1px solid #1A1A24; text-align: center;">
        <p style="margin: 0; font-size: 11px; color: #52525B;">
          MotionNodeEdits Studio Management System
        </p>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #52525B;">
          This is an automated notification. Please do not reply directly to this email.
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
