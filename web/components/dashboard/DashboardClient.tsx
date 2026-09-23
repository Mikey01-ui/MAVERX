"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import type { LocaleInfo } from "@/lib/locale";
import type { GroupLocaleSettings } from "@/lib/group";

type Props = {
  initialGroup: GroupLocaleSettings | null;
  canManage: boolean;
  isAdmin: boolean;
  locales: LocaleInfo[];
  resolvedLocale: string;
  preferredLocale: string;
};

export function DashboardClient({
  initialGroup,
  canManage,
  isAdmin,
  locales: initialLocales,
  resolvedLocale,
  preferredLocale,
}: Props) {
  const [group, setGroup] = useState(initialGroup);
  const [locales, setLocales] = useState(initialLocales);
  const [locale, setLocale] = useState(initialGroup?.locale ?? preferredLocale);
  const [available, setAvailable] = useState<string[]>(
    initialGroup?.availableLocales ?? ["en", "nl"],
  );
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const availableOptions = useMemo(
    () => locales.filter((l) => available.includes(l.code)),
    [locales, available],
  );

  async function saveGroup(e: FormEvent) {
    e.preventDefault();
    if (!canManage || !group) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/group", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, availableLocales: available }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save.");
      return;
    }
    setGroup(data.group);
    setMessage(`Group language set to ${data.group.locale.toUpperCase()}. Missions will use this pack.`);
  }

  async function bootstrapDemo() {
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create demo group.");
      return;
    }
    setGroup({
      id: data.group.id,
      name: data.group.name,
      slug: data.group.slug,
      locale: data.group.locale,
      availableLocales: data.group.availableLocales,
      inviteCode: data.group.inviteCode,
      memberCount: 1,
    });
    setLocale(data.group.locale);
    setAvailable(data.group.availableLocales);
    setMessage("Demo cohort created — you are the owner.");
  }

  async function addLanguage(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/locales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: newCode, label: newLabel }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not add language.");
      return;
    }
    setLocales((prev) => {
      const next = prev.filter((l) => l.code !== data.locale.code);
      next.push({ code: data.locale.code, label: data.locale.label, enabled: true });
      return next.sort((a, b) => a.code.localeCompare(b.code));
    });
    setAvailable((prev) => (prev.includes(data.locale.code) ? prev : [...prev, data.locale.code]));
    setNewCode("");
    setNewLabel("");
    setMessage(`Added ${data.locale.label} (${data.locale.code}). Enable it for the group, then switch when the content pack exists.`);
  }

  function toggleAvailable(code: string) {
    setAvailable((prev) => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev;
        const next = prev.filter((c) => c !== code);
        if (!next.includes(locale)) setLocale(next[0]);
        return next;
      }
      return [...prev, code];
    });
  }

  return (
    <main className="omni-page">
      <div className="omni-panel" style={{ maxWidth: 560 }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <span className="op-label">Group dashboard</span>
          <h1 className="omni-title" style={{ fontSize: "1.45rem" }}>
            Language
          </h1>
          <p style={{ color: "var(--text-mute)", fontSize: "0.85rem", marginTop: "0.5rem", lineHeight: 1.5 }}>
            Group language drives the mission pack. Your personal preference (
            <strong>{preferredLocale.toUpperCase()}</strong>) is only used until you join a group.
            Resolved now: <strong>{(group?.locale ?? resolvedLocale).toUpperCase()}</strong>
            {group ? " (group)" : " (user)"}.
          </p>
        </div>
        <hr className="omni-rule" />

        {!group && isAdmin && (
          <div className="form-group">
            <p style={{ color: "var(--text-dim)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
              No group assigned yet. Bootstrap a demo cohort to manage language here — later this will sync from the main dashboard.
            </p>
            <button type="button" className="btn-primary" disabled={saving} onClick={bootstrapDemo}>
              Create demo cohort
            </button>
          </div>
        )}

        {!group && !isAdmin && (
          <p style={{ color: "var(--text-mute)", fontSize: "0.9rem" }}>
            You are not in a group yet. When your cohort invite is linked from the dashboard, the group language will apply automatically.
          </p>
        )}

        {group && (
          <form onSubmit={saveGroup}>
            <div className="form-group">
              <p className="form-label">Group</p>
              <p style={{ color: "var(--text)", fontSize: "0.95rem" }}>
                {group.name}{" "}
                <span style={{ color: "var(--text-mute)" }}>
                  · {group.memberCount} member{group.memberCount === 1 ? "" : "s"}
                  {group.inviteCode ? ` · code ${group.inviteCode}` : ""}
                </span>
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="group-locale">
                Active language
              </label>
              <select
                id="group-locale"
                className="form-input"
                value={locale}
                disabled={!canManage}
                onChange={(e) => setLocale(e.target.value)}
              >
                {availableOptions.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label} ({l.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <span className="form-label">Available for this group</span>
              <div className="locale-choice" style={{ flexWrap: "wrap" }}>
                {locales.map((l) => (
                  <label
                    key={l.code}
                    className={`locale-choice-option${available.includes(l.code) ? " is-selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={available.includes(l.code)}
                      disabled={!canManage}
                      onChange={() => toggleAvailable(l.code)}
                    />
                    {l.label}
                  </label>
                ))}
              </div>
            </div>

            {canManage && (
              <div className="actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save language"}
                </button>
              </div>
            )}
          </form>
        )}

        {isAdmin && (
          <>
            <hr className="omni-rule" style={{ marginTop: "1.5rem" }} />
            <form onSubmit={addLanguage}>
              <p className="form-label" style={{ marginBottom: "0.75rem" }}>
                Add language pack
              </p>
              <p className="locale-choice-hint" style={{ marginBottom: "0.75rem" }}>
                Registers a locale code for cohorts. Content (Dutch etc.) ships separately as packs.
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="new-code">
                  Code
                </label>
                <input
                  id="new-code"
                  className="form-input"
                  placeholder="de"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-label">
                  Label
                </label>
                <input
                  id="new-label"
                  className="form-input"
                  placeholder="Deutsch"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-secondary" disabled={saving || !newCode || !newLabel}>
                Add language
              </button>
            </form>
          </>
        )}

        {error && <p className="error-text show">{error}</p>}
        {message && (
          <p style={{ color: "var(--ok)", fontSize: "0.85rem", marginTop: "1rem" }}>{message}</p>
        )}

        <Link href="/hub" className="link-muted" style={{ display: "inline-block", marginTop: "1.25rem" }}>
          ← Back to hub
        </Link>
      </div>
    </main>
  );
}
