"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { LoginContent } from "@/lib/content";
import { AboutModal } from "./AboutModal";
import { completeLogin } from "@/app/(auth)/login/actions";

export function LoginForm({ content }: { content: LoginContent }) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/intro";
  const needInvite = searchParams.get("needInvite") === "1";
  const credentialsError = searchParams.get("error") === "credentials";

  const [aboutOpen, setAboutOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <form
        action={completeLogin}
        className="omni-panel"
        onSubmit={() => setLoading(true)}
      >
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="login-heading">
          <span className="op-label">{content.opLabel}</span>
          <h1 className="omni-title">{content.title}</h1>
        </div>
        <hr className="omni-rule" />
        {needInvite && (
          <p className="error-text show" style={{ marginBottom: "0.75rem" }}>
            Registration requires a personal invite link from your administrator.
          </p>
        )}
        {credentialsError && (
          <p className="error-text show" style={{ marginBottom: "0.75rem" }}>
            Invalid operative ID or access code.
          </p>
        )}
        <p
          className="omni-intro"
          dangerouslySetInnerHTML={{ __html: content.intro }}
        />

        <div className="form-group">
          <label className="form-label" htmlFor="email">
            {content.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-input"
            placeholder={content.emailPlaceholder}
            autoComplete="email"
            required
          />
          <p className="helper-text">{content.emailHelper}</p>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            {content.passwordLabel}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="form-input"
            placeholder={content.passwordPlaceholder}
            autoComplete="current-password"
            required
            minLength={8}
          />
          <p className="error-text">{content.passwordError}</p>
        </div>

        <div className="actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {content.submitLogin}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setAboutOpen(true)}>
            {content.aboutButton}
          </button>
        </div>
      </form>

      <AboutModal content={content.about} open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
