"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import type { LoginContent } from "@/lib/content";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm({ content }: { content: LoginContent }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= 8;
  const confirmValid = password === confirm && confirm.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!emailValid || !passwordValid || !confirmValid) return;

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
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
