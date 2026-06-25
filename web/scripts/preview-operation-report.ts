import { buildOperationReportPdf } from "../lib/email/operationReportPdf";
import { buildSampleReportSections } from "../lib/finale/reportInsights";
import { calculateOperationTotalScore } from "../lib/finale/operationScores";
import { writeFile } from "fs/promises";
import path from "path";

const missions = [
  { missionId: "m1", label: "Mission 01", name: "Identifying the Footprint", score: 85, status: "completed" },
  { missionId: "m2", label: "Mission 02", name: "Forging the Master Key", score: 76, status: "completed" },
  { missionId: "m3", label: "Mission 03", name: "The Human Shield", score: 33, status: "completed" },
  { missionId: "m4", label: "Mission 04", name: "The Onboarding", score: 14, status: "completed" },
  { missionId: "m5", label: "Mission 05", name: "The Final Brief", score: 82, status: "completed" },
];

(async () => {
  const report = {
    email: "operative@example.com",
    missions,
    totalScore: calculateOperationTotalScore(missions),
    sections: buildSampleReportSections(),
  };

  const pdf = await buildOperationReportPdf(report);
  const out = path.join(process.cwd(), "operation-omni-results-sample.pdf");
  const pub = path.join(process.cwd(), "public/samples/operation-omni-results-sample.pdf");
  await writeFile(out, pdf);
  await writeFile(pub, pdf);
  console.log("Wrote", out);
  console.log("Wrote", pub);
})();
