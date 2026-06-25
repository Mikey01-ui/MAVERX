import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendOperationReportEmail } from "@/lib/email/sendOperationReportEmail";
import { isSmtpConfigured } from "@/lib/email/smtp";

const patchSchema = z.object({
  optIn: z.boolean(),
  email: z.string().email().optional(),
});

function resolveReportEmail(user: { email: string; reportEmail: string | null }) {
  return user.reportEmail?.trim() || user.email;
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const before = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, reportEmail: true, emailReportOptIn: true },
    });

    if (!before) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailReportOptIn: parsed.data.optIn,
        ...(parsed.data.email !== undefined ? { reportEmail: parsed.data.email } : {}),
      },
      select: { email: true, reportEmail: true, emailReportOptIn: true },
    });

    const reportEmail = resolveReportEmail(user);
    let reportSent = false;
    let reportError: string | null = null;

    if (parsed.data.optIn) {
      if (!isSmtpConfigured()) {
        reportError = "Email delivery is not configured on this server.";
      } else {
        try {
          const sent = await sendOperationReportEmail(session.user.id, reportEmail);
          reportSent = true;
          if (sent.to !== reportEmail) {
            console.warn("operation report recipient mismatch", { expected: reportEmail, sent: sent.to });
          }
        } catch (err) {
          console.error("operation report email error", err);
          reportError = "We saved your preference but could not send the email. Try again later.";
        }
      }
    }

    return NextResponse.json({
      email: reportEmail,
      optIn: user.emailReportOptIn,
      reportSent,
      reportError,
    });
  } catch (err) {
    console.error("email-report patch error", err);
    return NextResponse.json({ error: "Failed to save preference." }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, reportEmail: true, emailReportOptIn: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    email: resolveReportEmail(user),
    optIn: user.emailReportOptIn,
  });
}
