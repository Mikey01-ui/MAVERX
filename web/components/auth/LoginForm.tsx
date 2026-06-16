"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import type { LoginContent } from "@/lib/content";
import { AboutModal } from "./AboutModal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({ content }: { content: LoginContent }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 8;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!emailValid || !passwordValid) return;

    setLoading(true);
    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setError("Invalid operative ID or access code.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="omni-panel">
        <div className="login-heading">
          <span className="op-label">{content.opLabel}</span>
          <h1 className="omni-title">{content.title}</h1>
        </div>
        <hr className="omni-rule" />
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
            type="email"
            className={`form-input${touched && !emailValid && email ? " invalid" : ""}${touched && emailValid ? " valid" : ""}`}
            placeholder={content.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            autoComplete="email"
          />
          {touched && email && !emailValid ? (
            <p className="error-text show">{content.emailError}</p>
          ) : (
            <p className="helper-text">{content.emailHelper}</p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            {content.passwordLabel}
          </label>
          <input
            id="password"
            type="password"
            className={`form-input${touched && !passwordValid && password ? " invalid" : ""}`}
            placeholder={content.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <p className={`error-text${touched && password && !passwordValid ? " show" : ""}`}>
            {content.passwordError}
          </p>
        </div>

        {error && <p className="error-text show">{error}</p>}

        <div className="actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {content.submitLogin}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setAboutOpen(true)}>
            {content.aboutButton}
          </button>
        </div>

        <Link href="/register" className="link-muted">
          {content.switchToRegister}
        </Link>
      </form>

      <AboutModal content={content.about} open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
