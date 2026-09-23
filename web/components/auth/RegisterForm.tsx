"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { LoginContent } from "@/lib/content";
import {
  buildRegisterHref,
  resolveRegisterStep,
  type RegisterStep,
} from "@/lib/register-steps";
import { completeRegistration } from "@/app/(auth)/register/actions";

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
  expiresAt?: string | null;
};

export type { RegisterStep };
export { buildRegisterHref, parseRegisterStep, resolveRegisterStep } from "@/lib/register-steps";

export function RegisterForm({
  content,
  inviteContext,
  initialPreview = null,
  initialPreviewError = null,
  initialStep = null,
  initialEmail = "",
  initialRegError = null,
}: {
  content: LoginContent;
  inviteContext?: InviteContext;
  /** Server-validated invite — preferred so the wizard never hangs on client fetch. */
  initialPreview?: InvitePreview | null;
  initialPreviewError?: string | null;
  /** From ?step= — server-rendered so Continue works without client hydration. */
  initialStep?: RegisterStep | null;
  /** From ?email= — carried across GET step forms. */
  initialEmail?: string;
  /** From ?regError= — server-action failure echoed back without JS. */
  initialRegError?: string | null;
}) {
  const router = useRouter();
  const token = (inviteContext?.invite || inviteContext?.group || "").trim();

  const [preview, setPreview] = useState<InvitePreview | null>(initialPreview);
  const [previewError, setPreviewError] = useState<string | null>(
    initialPreviewError ??
      (!token ? "Registration requires a valid invite link from your administrator." : null),
  );
  // Only show validating spinner when the server did not already resolve the invite.
  const [previewLoading, setPreviewLoading] = useState(
    !!token && !initialPreview && !initialPreviewError,
  );

  const localeIsAny = !!preview?.localeIsAny;
  const [step, setStep] = useState<RegisterStep>(() =>
    resolveRegisterStep(initialStep, !!initialPreview?.localeIsAny),
  );
  const [email, setEmail] = useState(
    () => initialEmail || initialPreview?.emailHint || "",
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [preferredLocale, setPreferredLocale] = useState<PreferredLocale>(() => {
    if (!initialPreview?.localeIsAny && initialPreview?.locale === "nl") return "nl";
    if (inviteContext?.lang === "nl") return "nl";
    if (inviteContext?.lang === "en") return "en";
    return inviteContext?.initialLocale === "nl" ? "nl" : "en";
  });
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(initialRegError);

  // Keep client step in sync when the server re-renders with a new ?step=.
  useEffect(() => {
    setStep(resolveRegisterStep(initialStep, localeIsAny));
  }, [initialStep, localeIsAny]);

  useEffect(() => {
    // Server already resolved invite — nothing to fetch.
    if (initialPreview || initialPreviewError) {
      setPreviewLoading(false);
      return;
    }
    if (!token) {
      setPreviewLoading(false);
      setPreviewError("Registration requires a valid invite link from your administrator.");
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    (async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch(
          `/api/invites/preview?${inviteContext?.group ? "group" : "invite"}=${encodeURIComponent(token)}`,
          { signal: controller.signal },
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setPreviewError(data.error ?? "Invite link is invalid.");
          setPreview(null);
        } else {
          setPreview(data.invite as InvitePreview);
          setPreviewError(null);
          if (data.invite?.emailHint && !email) setEmail(data.invite.emailHint);
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
      clearTimeout(timeout);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- email seed only on first resolve
  }, [token, inviteContext?.group, initialPreview, initialPreviewError]);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 8;
  const confirmValid = password === confirm && confirm.length > 0;

  const steps = useMemo(() => {
    const list: RegisterStep[] = ["context"];
    if (preview?.localeIsAny) list.push("language");
    list.push("email", "password");
    return list;
  }, [preview?.localeIsAny]);

  const stepIndex = Math.max(0, steps.indexOf(step));

  function stepHref(target: RegisterStep, extras?: { email?: string; lang?: string | null }) {
    return buildRegisterHref(inviteContext, target, extras);
  }

  function goNext() {
    setError(null);
    setTouched(false);
    const next = steps[stepIndex + 1];
    if (next) {
      setStep(next);
      router.push(stepHref(next, { email: email.trim() || undefined, lang: preferredLocale }));
    }
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

  const nextAfterContext: RegisterStep = preview.localeIsAny ? "language" : "email";
  const backFromEmail: RegisterStep = preview.localeIsAny ? "language" : "context";
  const continueFromContextHref = stepHref(nextAfterContext, { lang: preferredLocale });
  const backFromLanguageHref = stepHref("context");
  const backFromEmailHref = stepHref(backFromEmail, {
    email: email.trim() || undefined,
    lang: preferredLocale,
  });
  const backFromPasswordHref = stepHref("email", {
    email: email.trim() || undefined,
    lang: preferredLocale,
  });

  /** Hidden fields so GET forms keep invite context without JS. */
  function InviteHiddenFields({
    stepValue,
    includeLang,
  }: {
    stepValue: RegisterStep;
    includeLang?: boolean;
  }) {
    return (
      <>
        {/* Always send invite=token so group links satisfy the register server action. */}
        <input type="hidden" name="invite" value={token} />
        {inviteContext?.group ? <input type="hidden" name="group" value={inviteContext.group} /> : null}
        {includeLang ? (
          <input type="hidden" name="lang" value={preferredLocale} />
        ) : inviteContext?.lang ? (
          <input type="hidden" name="lang" value={inviteContext.lang} />
        ) : null}
        {inviteContext?.diff ? <input type="hidden" name="diff" value={inviteContext.diff} /> : null}
        {inviteContext?.co ? <input type="hidden" name="co" value={inviteContext.co} /> : null}
        {inviteContext?.cohort ? (
          <input type="hidden" name="cohort" value={inviteContext.cohort} />
        ) : null}
        {inviteContext?.seats ? <input type="hidden" name="seats" value={inviteContext.seats} /> : null}
        <input type="hidden" name="step" value={stepValue} />
      </>
    );
  }

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
            You&apos;re registering with a{" "}
            {preview.type === "group" ? "group" : "personal"} invite
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
            {/* Plain Link/href so Continue works even if React never hydrates. */}
            <Link href={continueFromContextHref} className="btn-primary">
              Continue
            </Link>
          </div>
        </div>
      )}

      {step === "language" && (
        <form
          method="get"
          action="/register"
          style={{ marginTop: "1.25rem" }}
          onSubmit={(e) => {
            // Prefer client navigation when hydrated; GET still works without JS.
            e.preventDefault();
            goNext();
          }}
        >
          {/* lang comes from radios below — do not emit a hidden lang. */}
          {inviteContext?.invite ? <input type="hidden" name="invite" value={inviteContext.invite} /> : null}
          {inviteContext?.group ? <input type="hidden" name="group" value={inviteContext.group} /> : null}
          {inviteContext?.diff ? <input type="hidden" name="diff" value={inviteContext.diff} /> : null}
          {inviteContext?.co ? <input type="hidden" name="co" value={inviteContext.co} /> : null}
          {inviteContext?.cohort ? (
            <input type="hidden" name="cohort" value={inviteContext.cohort} />
          ) : null}
          {inviteContext?.seats ? <input type="hidden" name="seats" value={inviteContext.seats} /> : null}
          <input type="hidden" name="step" value="email" />
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
                  name="lang"
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
            <Link href={backFromLanguageHref} className="btn-secondary">
              Back
            </Link>
            <button type="submit" className="btn-primary">
              Continue
            </button>
          </div>
        </form>
      )}

      {step === "email" && (
        <form
          method="get"
          action="/register"
          style={{ marginTop: "1.25rem" }}
          onSubmit={(e) => {
            setTouched(true);
            if (!emailValid) {
              e.preventDefault();
              return;
            }
            // Prefer client nav when hydrated; GET works without JS.
            e.preventDefault();
            goNext();
          }}
        >
          <InviteHiddenFields stepValue="password" includeLang />
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              {content.emailLabel}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form-input${touched && !emailValid && email ? " invalid" : ""}`}
              placeholder={content.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
            />
            <p className={`error-text${touched && email && !emailValid ? " show" : ""}`}>
              {content.emailError}
            </p>
          </div>
          <div className="actions" style={{ display: "flex", gap: "0.75rem" }}>
            <Link href={backFromEmailHref} className="btn-secondary">
              Back
            </Link>
            <button type="submit" className="btn-primary">
              Continue
            </button>
          </div>
        </form>
      )}

      {step === "password" && (
        <form action={completeRegistration} style={{ marginTop: "1.25rem" }}>
          <InviteHiddenFields stepValue="password" includeLang />
          <input type="hidden" name="email" value={email.trim()} />
          <input type="hidden" name="preferredLocale" value={preferredLocale} />
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              required
              minLength={8}
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
              name="confirm"
              type="password"
              className="form-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
            <p className={`error-text${touched && confirm && !confirmValid ? " show" : ""}`}>
              {content.register.confirmError}
            </p>
          </div>
          {error && <p className="error-text show">{error}</p>}
          <div className="actions" style={{ display: "flex", gap: "0.75rem" }}>
            <Link href={backFromPasswordHref} className="btn-secondary">
              Back
            </Link>
            <button type="submit" className="btn-primary">
              {content.submitRegister}
            </button>
          </div>
        </form>
      )}

      <Link href="/login" className="link-muted" style={{ marginTop: "1.25rem", display: "inline-block" }}>
        {content.switchToLogin}
      </Link>
    </div>
  );
}
