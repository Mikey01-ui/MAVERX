import { AmbientShell } from "@/components/layout/AmbientShell";
import { StatusBar } from "@/components/layout/StatusBar";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getLoginContent } from "@/lib/content";
import { localeFromDashboardLang } from "@/lib/invites";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const content = await getLoginContent();
  const sp = await searchParams;
  const pick = (key: string) => {
    const v = sp[key];
    return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
  };

  const inviteContext = {
    invite: pick("invite") ?? null,
    group: pick("group") ?? null,
    lang: pick("lang") ?? null,
    diff: pick("diff") ?? null,
    co: pick("co") ?? null,
    cohort: pick("cohort") ?? null,
    seats: pick("seats") ?? null,
    initialLocale: (localeFromDashboardLang(pick("lang")) === "nl" ? "nl" : "en") as "en" | "nl",
  };

  return (
    <AmbientShell theme="theme-v2">
      <StatusBar left={content.statusLeft} right={content.statusRight} />
      <main className="omni-page">
        <RegisterForm content={content} inviteContext={inviteContext} />
      </main>
    </AmbientShell>
  );
}
