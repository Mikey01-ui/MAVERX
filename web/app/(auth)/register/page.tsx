import { AmbientShell } from "@/components/layout/AmbientShell";
import { StatusBar } from "@/components/layout/StatusBar";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getLoginContent } from "@/lib/content";
import { isAnyLocale, localeFromDashboardLang, previewInvite } from "@/lib/invites";
import { parseRegisterStep, resolveRegisterStep } from "@/lib/register-steps";
import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const content = await getLoginContent();
  const sp = await searchParams;
  const pick = (key: string) => {
    const v = sp[key];
    return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  };

  const invite = pick("invite") ?? null;
  const group = pick("group") ?? null;
  if (!invite && !group) {
    redirect("/login?needInvite=1");
  }

  const token = (invite || group || "").trim();
  let initialPreview: Awaited<ReturnType<typeof previewInvite>> | null = null;
  let previewError: string | null = null;
  try {
    initialPreview = await previewInvite(token);
  } catch (err) {
    previewError = err instanceof Error ? err.message : "Invite link is invalid.";
  }

  const lang = pick("lang") ?? initialPreview?.locale ?? null;
  const playable =
    isAnyLocale(lang) ? "en" : localeFromDashboardLang(lang) === "nl" ? "nl" : "en";

  const inviteContext = {
    invite,
    group,
    lang,
    diff: pick("diff") ?? initialPreview?.difficulty ?? null,
    co: pick("co") ?? initialPreview?.company ?? null,
    cohort: pick("cohort") ?? initialPreview?.cohortLabel ?? null,
    seats: pick("seats") ?? null,
    initialLocale: playable as "en" | "nl",
  };

  const requestedStep = parseRegisterStep(pick("step"));
  const initialStep = resolveRegisterStep(
    requestedStep,
    !!initialPreview?.localeIsAny,
  );
  const initialEmail = pick("email")?.trim() ?? "";
  const initialName = pick("name")?.trim() ?? initialPreview?.nameHint?.trim() ?? "";
  const initialRegError = pick("regError")?.trim() || null;

  return (
    <AmbientShell theme="theme-v2">
      <StatusBar left={content.statusLeft} right={content.statusRight} />
      <main className="omni-page">
        <RegisterForm
          content={content}
          inviteContext={inviteContext}
          initialPreview={initialPreview}
          initialPreviewError={previewError}
          initialStep={initialStep}
          initialEmail={initialEmail}
          initialName={initialName}
          initialRegError={initialRegError}
        />
      </main>
    </AmbientShell>
  );
}
