import { AmbientShell } from "@/components/layout/AmbientShell";
import { StatusBar } from "@/components/layout/StatusBar";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getLoginContent } from "@/lib/content";

export default async function RegisterPage() {
  const content = await getLoginContent();

  return (
    <AmbientShell theme="theme-v2">
      <StatusBar left={content.statusLeft} right={content.statusRight} />
      <main className="omni-page">
        <RegisterForm content={content} />
      </main>
    </AmbientShell>
  );
}
