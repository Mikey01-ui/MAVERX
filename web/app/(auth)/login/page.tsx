import { Suspense } from "react";
import { AmbientShell } from "@/components/layout/AmbientShell";
import { StatusBar } from "@/components/layout/StatusBar";
import { LoginForm } from "@/components/auth/LoginForm";
import { getLoginContent } from "@/lib/content";

export default async function LoginPage() {
  const content = await getLoginContent();

  return (
    <AmbientShell theme="theme-v2">
      <StatusBar left={content.statusLeft} right={content.statusRight} />
      <main className="omni-page">
        <Suspense fallback={<div className="omni-panel">Loading…</div>}>
          <LoginForm content={content} />
        </Suspense>
      </main>
    </AmbientShell>
  );
}
