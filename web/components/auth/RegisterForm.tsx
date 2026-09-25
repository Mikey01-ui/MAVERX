"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LoginContent } from "@/lib/content";
import {
  buildRegisterHref,
  resolveRegisterStep,
  type RegisterStep,
} from "@/lib/register-steps";
import { completeRegistration } from "@/app/(auth)/register/actions";

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
  nameHint: string | null;
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
  initialName = "",
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
  /** From ?name= — carried across GET step forms / invite prefills. */
  initialName?: string;
  /** From ?regError= — server-action failure echoed back without JS. */
  initialRegError?: string | null;
}) {
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
  const [displayName, setDisplayName] = useState(
    () => initialName || initialPreview?.nameHint || "",
  );
  const [preferredLocale, setPreferredLocale] = useState<PreferredLocale>(() => {
    if (!initialPreview?.localeIsAny && initialPreview?.locale === "nl") return "nl";
    if (inviteContext?.lang === "nl") return "nl";
    if (inviteContext?.lang === "en") return "en";
    return inviteContext?.initialLocale === "nl" ? "nl" : "en";
  });
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
          if (data.invite?.nameHint && !displayName) setDisplayName(data.invite.nameHint);
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

  const steps = useMemo(() => {
    const list: RegisterStep[] = ["context"];
    if (preview?.localeIsAny) list.push("language");
    list.push("email", "password");
    return list;
  }, [preview?.localeIsAny]);

  const stepIndex = Math.max(0, steps.indexOf(step));

  function stepHref(
    target: RegisterStep,
    extras?: { email?: string; name?: string; lang?: string | null },
  ) {
    return buildRegisterHref(inviteContext, target, extras);
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
    name: displayName.trim() || undefined,
    lang: preferredLocale,
  });
  const backFromPasswordHref = stepHref("email", {
    email: email.trim() || undefined,
    name: displayName.trim() || undefined,
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
            {/* Plain anchor so Continue works even if React never hydrates / soft-nav fails. */}
            <a href={continueFromContextHref} className="btn-primary">
              Continue
            </a>
          </div>
        </div>
      )}

      {step === "language" && (
        <form method="get" action="/register" style={{ marginTop: "1.25rem" }}>
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
                  defaultChecked={preferredLocale === opt.code}
                  onChange={() => setPreferredLocale(opt.code)}
                />
                {opt.label}
              </label>
            ))}
          </div>
          <p className="locale-choice-hint">{content.register.localeHint}</p>
          <div className="actions" style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem" }}>
            <a href={backFromLanguageHref} className="btn-secondary">
              Back
            </a>
            <button type="submit" className="btn-primary">
              Continue
            </button>
          </div>
        </form>
      )}

      {step === "email" && (
        <form method="get" action="/register" style={{ marginTop: "1.25rem" }}>
          <InviteHiddenFields stepValue="password" includeLang />
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              {content.nameLabel}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              placeholder={content.namePlaceholder}
              defaultValue={displayName}
              autoComplete="name"
              autoFocus
              required
              minLength={2}
              maxLength={80}
            />
            <p className="error-text">{content.nameError}</p>
          </div>
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
              defaultValue={email}
              autoComplete="email"
              required
            />
            <p className="error-text">{content.emailError}</p>
          </div>
          <div className="actions" style={{ display: "flex", gap: "0.75rem" }}>
            <a href={backFromEmailHref} className="btn-secondary">
              Back
            </a>
            <button type="submit" className="btn-primary">
              Continue
            </button>
          </div>
        </form>
      )}

      {step === "password" && (
        <form action={completeRegistration} style={{ marginTop: "1.25rem" }}>
          <InviteHiddenFields stepValue="password" includeLang />
          <input type="hidden" name="email" value={email.trim().toLowerCase()} />
          <input type="hidden" name="name" value={displayName.trim()} />
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
              autoComplete="new-password"
              autoFocus
              required
              minLength={8}
            />
            <p className="error-text">{content.passwordError}</p>
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
              autoComplete="new-password"
              required
              minLength={8}
            />
            <p className="error-text">{content.register.confirmError}</p>
          </div>
          {error && <p className="error-text show">{error}</p>}
          <div className="actions" style={{ display: "flex", gap: "0.75rem" }}>
            <a href={backFromPasswordHref} className="btn-secondary">
              Back
            </a>
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
