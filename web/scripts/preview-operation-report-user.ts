/**
 * Generate an operation report PDF from a user's saved mission progress.
 * Usage: npx tsx scripts/preview-operation-report-user.ts [email]
 */
import { writeFile } from "fs/promises";
import path from "path";
import { buildOperationReportPdf } from "../lib/email/operationReportPdf";
import { getOperationReportData } from "../lib/finale/reportData";
import { prisma } from "../lib/db";

const emailArg = process.argv[2];

(async () => {
  const user = await prisma.user.findFirst({
    where: emailArg ? { email: emailArg } : undefined,
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true },
  });

  if (!user) {
    console.error(emailArg ? `No user found for ${emailArg}` : "No users in database.");
    process.exit(1);
  }

  const report = await getOperationReportData(user.id);
  const pdf = await buildOperationReportPdf(report);
  const safeEmail = user.email.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const out = path.join(process.cwd(), `operation-omni-results-${safeEmail}.pdf`);

  await writeFile(out, pdf);

  console.log("User:", user.email);
  console.log("Total score:", report.totalScore ?? "—");
  console.log(
    "Missions:",
    report.missions
      .map((m) => `${m.missionId}=${m.status}${m.score !== null ? ` (${m.score}%)` : ""}`)
      .join(", ")
  );
  console.log("Wrote", out);
})();
