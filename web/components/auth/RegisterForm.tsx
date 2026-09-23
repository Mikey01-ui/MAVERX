"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

type InvitePreview = {
  token: string;
  type: string;
  locale: string;
  localeIsAny: boolean;
  difficulty: string;
  company: string | null;
  cohortLabel: string | null;
  emailHint: string | null;
};

type Step = "context" | "language" | "email" | "password";

export function RegisterForm({
  content,
  inviteContext,
}: {
  content: LoginContent;
  inviteContext?: InviteContext;
}) {
  const router = useRouter();
  const token = (inviteContext?.invite || inviteContext?.group || "").trim();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(!!token);

  const [step, setStep] = useState<Step>("context");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [preferredLocale, setPreferredLocale] = useState<PreferredLocale>(
    inviteContext?.initialLocale === "nl" ? "nl" : "en",
  );
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setPreviewLoading(false);
      setPreviewError("Registration requires a valid invite link from your administrator.");
      return;
    }
    let cancelled = false;
    (async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch(
          `/api/invites/preview?${inviteContext?.group ? "group" : "invite"}=${encodeURIComponent(token)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setPreviewError(data.error ?? "Invite link is invalid.");
          setPreview(null);
        } else {
          setPreview(data.invite as InvitePreview);
          setPreviewError(null);
          if (data.invite?.emailHint) setEmail(data.invite.emailHint);
          if (!data.invite?.localeIsAny && data.invite?.locale === "nl") {
            setPreferredLocale("nl");
          }
        }
      } catch {
        if (!cancelled) setPreviewError("Could not validate invite link.");
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, inviteContext?.group]);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 8;
  const confirmValid = password === confirm && confirm.length > 0;

  const steps = useMemo(() => {
    const list: Step[] = ["context"];
    if (preview?.localeIsAny) list.push("language");
    list.push("email", "password");
    return list;
  }, [preview?.localeIsAny]);

  const stepIndex = Math.max(0, steps.indexOf(step));

  function goNext() {
    setError(null);
    setTouched(false);
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    setError(null);
    setTouched(false);
    const prev = steps[stepIndex - 1];
    if (prev) setStep(prev);
  }

  async function handleSubmit() {
    setTouched(true);
    setError(null);
    if (!emailValid || !passwordValid || !confirmValid || !token) return;

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        preferredLocale,
        invite: inviteContext?.invite || token,
        group: inviteContext?.group ?? undefined,
        lang: preview?.localeIsAny ? preferredLocale : preview?.locale ?? preferredLocale,
        diff: preview?.difficulty ?? inviteContext?.diff ?? undefined,
        co: preview?.company ?? inviteContext?.co ?? undefined,
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

  if (previewLoading) {
    return (
      <div className="omni-panel">
        <span className="op-label">{content.opLabel}</span>
        <h1 className="omni-title" style={{ fontSize: "1.6rem" }}>
          {content.register.title}
        </h1>
        <p className="locale-choice-hint" style={{ marginTop: "1rem" }}>
          Validating invite…
        </p>
      </div>
    );
  }

  if (previewError || !preview) {
    return (
      <div className="omni-panel">
        <span className="op-label">{content.opLabel}</span>
        <h1 className="omni-title" style={{ fontSize: "1.6rem" }}>
          {content.register.title}
        </h1>
        <hr className="omni-rule" />
        <p className="error-text show" style={{ marginTop: "1rem" }}>
          {previewError ?? "Invite required."}
        </p>
        <p className="locale-choice-hint" style={{ marginTop: "0.75rem" }}>
          Ask your administrator for a personal invite link. Returning operatives can sign in.
        </p>
        <Link href="/login" className="link-muted" style={{ marginTop: "1.25rem", display: "inline-block" }}>
          {content.switchToLogin}
        </Link>
      </div>
    );
  }

  const difficultyLabel =
    preview.difficulty.charAt(0).toUpperCase() + preview.difficulty.slice(1);

  return (
    <div className="omni-panel">
      <div style={{ marginBottom: "1.25rem" }}>
        <span className="op-label">{content.opLabel}</span>
        <h1 className="omni-title" style={{ fontSize: "1.6rem" }}>
          {content.register.title}
        </h1>
        <p className="locale-choice-hint" style={{ marginTop: "0.65rem" }}>
          Step {stepIndex + 1} of {steps.length}
        </p>
      </div>
      <hr className="omni-rule" />

      {step === "context" && (
        <div style={{ marginTop: "1.25rem" }}>
          <p className="locale-choice-hint">
            You&apos;re registering with a personal invite
            {preview.company ? ` for ${preview.company}` : ""}.
          </p>
          <ul className="locale-choice-hint" style={{ marginTop: "1rem", paddingLeft: "1.1rem" }}>
            <li>
              Difficulty: <strong>{difficultyLabel}</strong>
            </li>
            <li>
              Language:{" "}
              <strong>
                {preview.localeIsAny
                  ? "You choose next"
                  : preview.locale === "nl"
                    ? "Nederlands"
                    : preview.locale.toUpperCase()}
              </strong>
            </li>
            {preview.cohortLabel && (
              <li>
                Cohort: <strong>{preview.cohortLabel}</strong>
              </li>
            )}
          </ul>
          <div className="actions" style={{ marginTop: "1.5rem" }}>
            <button type="button" className="btn-primary" onClick={goNext}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "language" && (
        <div style={{ marginTop: "1.25rem" }}>
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
                  onChange={() => setPreferredLocale(opt.code)}
                />
                {opt.label}
              </label>
            ))}
          </div>
          <p className="locale-choice-hint">{content.register.localeHint}</p>
          <div className="actions" style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <button type="button" className="btn-secondary" onClick={goBack}>
              Back
            </button>
            <button type="button" className="btn-primary" onClick={goNext}>
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "email" && (
        <div style={{ marginTop: "1.25rem" }}>
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
              autoFocus
            />
            <p className={`error-text${touched && email && !emailValid ? " show" : ""}`}>
              {content.emailError}
            </p>
          </div>
          <div className="actions" style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" className="btn-secondary" onClick={goBack}>
              Back
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setTouched(true);
                if (emailValid) goNext();
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === "password" && (
        <div style={{ marginTop: "1.25rem" }}>
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
              autoFocus
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
          {error && <p className="error-text show">{error}</p>}
          <div className="actions" style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" className="btn-secondary" onClick={goBack} disabled={loading}>
              Back
            </button>
            <button type="button" className="btn-primary" disabled={loading} onClick={() => void handleSubmit()}>
              {content.submitRegister}
            </button>
          </div>
        </div>
      )}

      <Link href="/login" className="link-muted" style={{ marginTop: "1.25rem", display: "inline-block" }}>
        {content.switchToLogin}
      </Link>
    </div>
  );
}
