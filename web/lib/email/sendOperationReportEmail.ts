import { getOperationReportData } from "@/lib/finale/reportData";
import { buildOperationReportPdf } from "@/lib/email/operationReportPdf";
import { createSmtpTransporter, getSmtpConfig } from "@/lib/email/smtp";

export type SendOperationReportResult = {
  to: string;
  totalScore: number | null;
};

/** Send the operation PDF using saved mission progress. */
export async function sendOperationReportEmail(
  userId: string,
  toEmail?: string,
): Promise<SendOperationReportResult> {
  const smtp = getSmtpConfig();
  if (!smtp) {
    throw new Error("SMTP is not configured.");
  }

  const report = await getOperationReportData(userId);
  const recipient = toEmail?.trim() || report.email;
  const pdf = await buildOperationReportPdf({ ...report, email: recipient });
  const transporter = createSmtpTransporter(smtp);

  await transporter.sendMail({
    from: smtp.from,
    to: recipient,
    subject: "Operation OMNI — Your results brief",
    text: [
      "Operation complete.",
      "",
      `Your total operation score: ${report.totalScore !== null ? `${report.totalScore}%` : "—"}`,
      "",
      "Your full mission-by-mission breakdown is attached as a PDF.",
      "",
      "— MaverX / Operation OMNI",
    ].join("\n"),
    html: [
      `<p>Operation complete.</p>`,
      `<p><strong>Total operation score:</strong> ${report.totalScore !== null ? `${report.totalScore}%` : "—"}</p>`,
      `<p>Your full mission-by-mission breakdown is attached as a PDF.</p>`,
      `<p>— MaverX / Operation OMNI</p>`,
    ].join(""),
    attachments: [
      {
        filename: "operation-omni-results.pdf",
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });

  return { to: recipient, totalScore: report.totalScore };
}
