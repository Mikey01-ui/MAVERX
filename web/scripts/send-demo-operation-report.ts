import "dotenv/config";
import { buildOperationReportPdf } from "../lib/email/operationReportPdf";
import { buildSampleReportSections } from "../lib/finale/reportInsights";
import { calculateOperationTotalScore } from "../lib/finale/operationScores";
import { createSmtpTransporter, getSmtpConfig } from "../lib/email/smtp";

const to = process.argv[2] ?? "miltomy01@gmail.com";

const missions = [
  { missionId: "m1", label: "Mission 01", name: "Identifying the Footprint", score: 85, status: "completed" },
  { missionId: "m2", label: "Mission 02", name: "Forging the Master Key", score: 76, status: "completed" },
  { missionId: "m3", label: "Mission 03", name: "The Human Shield", score: 33, status: "completed" },
  { missionId: "m4", label: "Mission 04", name: "The Onboarding", score: 14, status: "completed" },
  { missionId: "m5", label: "Mission 05", name: "The Final Brief", score: 82, status: "completed" },
];

(async () => {
  const smtp = getSmtpConfig();
  if (!smtp) {
    console.error("SMTP is not configured. Set SMTP_* in web/.env");
    process.exit(1);
  }

  const report = {
    email: to,
    missions,
    totalScore: calculateOperationTotalScore(missions),
    sections: buildSampleReportSections(),
  };

  const pdf = await buildOperationReportPdf(report);
  const transporter = createSmtpTransporter(smtp);

  const info = await transporter.sendMail({
    from: smtp.from,
    to,
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

  console.log("Sent demo operation report to", to);
  console.log("Message ID:", info.messageId);
})().catch((err) => {
  console.error("Send failed:", err);
  process.exit(1);
});
