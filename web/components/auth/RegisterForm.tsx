"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import type { LoginContent } from "@/lib/content";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PreferredLocale = "en" | "nl";

export type InviteContext = {
  invite: string | null;
  group: string | null;
  lang: string | null;
  diff: string | null;
  co: string | null;
  cohort: string | null;
  seats: string | null;
  initialLocale: PreferredLocale;
};

export function RegisterForm({
  content,
  inviteContext,
}: {
  content: LoginContent;
  inviteContext?: InviteContext;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [preferredLocale, setPreferredLocale] = useState<PreferredLocale>(
    inviteContext?.initialLocale === "nl" ? "nl" : "en",
  );
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 8;
  const confirmValid = password === confirm && confirm.length > 0;
  const hasInvite = !!(inviteContext?.invite || inviteContext?.group);
  const lockedByGroup = !!inviteContext?.group;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!emailValid || !passwordValid || !confirmValid) return;

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        preferredLocale,
        invite: inviteContext?.invite ?? undefined,
        group: inviteContext?.group ?? undefined,
        lang: inviteContext?.lang ?? preferredLocale,
        diff: inviteContext?.diff ?? undefined,
        co: inviteContext?.co ?? undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "Registration failed.");
      return;
    }

    const signInResult = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);

    if (signInResult?.error) {
      setError("Profile created but sign-in failed. Try logging in.");
      return;
    }

    router.push("/intro");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="omni-panel">
      <div style={{ marginBottom: "1.5rem" }}>
        <span className="op-label">{content.opLabel}</span>
        <h1 className="omni-title" style={{ fontSize: "1.6rem" }}>
          {content.register.title}
        </h1>
        {hasInvite && (
          <p className="locale-choice-hint" style={{ marginTop: "0.65rem" }}>
            {inviteContext?.group
              ? `Joining cohort${inviteContext.cohort ? `: ${inviteContext.cohort}` : ""}${
                  inviteContext.co ? ` · ${inviteContext.co}` : ""
                }. Group language will apply to missions.`
              : "Registering with a personal invite link."}
          </p>
        )}
      </div>
      <hr className="omni-rule" />

      <div className="form-group">
        <label className="form-label" htmlFor="email">
          {content.emailLabel}
        </label>
        <input
          id="email"
          type="email"
          className={`form-input${touched && !emailValid && email ? " invalid" : ""}`}
          placeholder={content.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <p className={`error-text${touched && email && !emailValid ? " show" : ""}`}>
          {content.emailError}
        </p>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="password">
          {content.passwordLabel}
        </label>
        <input
          id="password"
          type="password"
          className="form-input"
          placeholder={content.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <p className={`error-text${touched && password && !passwordValid ? " show" : ""}`}>
          {content.passwordError}
        </p>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="confirm">
          {content.register.confirmLabel}
        </label>
        <input
          id="confirm"
          type="password"
          className="form-input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
        <p className={`error-text${touched && confirm && !confirmValid ? " show" : ""}`}>
          {content.register.confirmError}
        </p>
      </div>

      <div className="form-group">
        <span className="form-label" id="locale-label">
          {content.register.localeLabel}
        </span>
        <div className="locale-choice" role="radiogroup" aria-labelledby="locale-label">
          {(
            [
              { code: "en" as const, label: content.register.localeEn },
              { code: "nl" as const, label: content.register.localeNl },
            ] as const
          ).map((opt) => (
            <label
              key={opt.code}
              className={`locale-choice-option${preferredLocale === opt.code ? " is-selected" : ""}`}
            >
              <input
                type="radio"
                name="preferredLocale"
                value={opt.code}
                checked={preferredLocale === opt.code}
                disabled={lockedByGroup}
                onChange={() => setPreferredLocale(opt.code)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <p className="locale-choice-hint">
          {lockedByGroup
            ? `Language locked to ${(inviteContext?.lang ?? preferredLocale).toString()} by your group invite.`
            : content.register.localeHint}
        </p>
      </div>

      {error && <p className="error-text show">{error}</p>}

      <div className="actions">
        <button type="submit" className="btn-primary" disabled={loading}>
          {content.submitRegister}
        </button>
      </div>

      <Link href="/login" className="link-muted">
        {content.switchToLogin}
      </Link>
    </form>
  );
}
