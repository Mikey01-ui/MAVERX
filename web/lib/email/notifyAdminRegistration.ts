import { createSmtpTransporter, getSmtpConfig, isSmtpConfigured } from "@/lib/email/smtp";
import { getOrgSettings } from "@/lib/orgSettings";

export type RegisterNotifyPayload = {
  playerEmail: string;
  company: string | null;
  difficulty: string;
  locale: string;
  inviteType: string;
};

/** Notify the org Settings email that a player registered via invite. */
export async function notifyAdminOfRegistration(payload: RegisterNotifyPayload): Promise<{ sent: boolean; to?: string }> {
  if (!isSmtpConfigured()) {
    console.warn("register notify skipped — SMTP not configured");
    return { sent: false };
  }

  const settings = await getOrgSettings();
  const to = settings.notifyEmail?.trim();
  if (!to) {
    console.warn("register notify skipped — no notifyEmail in OrgSettings");
    return { sent: false };
  }

  const smtp = getSmtpConfig()!;
  const transporter = createSmtpTransporter(smtp);
  const dashboardHint = process.env.DASHBOARD_PUBLIC_URL?.replace(/\/$/, "") || "your OMNI dashboard";

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject: `Operation OMNI — ${payload.playerEmail} registered`,
    text: [
      "A new operative registered with an invite link.",
      "",
      `Email: ${payload.playerEmail}`,
      `Company: ${payload.company ?? "—"}`,
      `Difficulty: ${payload.difficulty}`,
      `Language: ${payload.locale}`,
      `Invite type: ${payload.inviteType}`,
      "",
      `Open Accounts in ${dashboardHint} to view progress.`,
      "",
      "— MaverX / Operation OMNI",
    ].join("\n"),
    html: [
      `<p>A new operative registered with an invite link.</p>`,
      `<ul>`,
      `<li><strong>Email:</strong> ${escapeHtml(payload.playerEmail)}</li>`,
      `<li><strong>Company:</strong> ${escapeHtml(payload.company ?? "—")}</li>`,
      `<li><strong>Difficulty:</strong> ${escapeHtml(payload.difficulty)}</li>`,
      `<li><strong>Language:</strong> ${escapeHtml(payload.locale)}</li>`,
      `<li><strong>Invite type:</strong> ${escapeHtml(payload.inviteType)}</li>`,
      `</ul>`,
      `<p>Open <strong>Accounts</strong> in ${escapeHtml(dashboardHint)} to view progress.</p>`,
      `<p>— MaverX / Operation OMNI</p>`,
    ].join(""),
  });

  return { sent: true, to };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
