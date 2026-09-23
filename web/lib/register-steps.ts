export type RegisterStep = "context" | "language" | "email" | "password";

const VALID_STEPS = new Set<RegisterStep>(["context", "language", "email", "password"]);

export function parseRegisterStep(raw: string | null | undefined): RegisterStep | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  return VALID_STEPS.has(s as RegisterStep) ? (s as RegisterStep) : null;
}

export type RegisterInviteQuery = {
  invite?: string | null;
  group?: string | null;
  lang?: string | null;
  diff?: string | null;
  co?: string | null;
  cohort?: string | null;
  seats?: string | null;
};

/** Build /register?... preserving invite context + step (progressive enhancement). */
export function buildRegisterHref(
  ctx: RegisterInviteQuery | undefined,
  step: RegisterStep,
  extras?: { email?: string; lang?: string | null },
): string {
  const params = new URLSearchParams();
  if (ctx?.invite) params.set("invite", ctx.invite);
  if (ctx?.group) params.set("group", ctx.group);
  const lang = extras?.lang ?? ctx?.lang;
  if (lang) params.set("lang", lang);
  if (ctx?.diff) params.set("diff", ctx.diff);
  if (ctx?.co) params.set("co", ctx.co);
  if (ctx?.cohort) params.set("cohort", ctx.cohort);
  if (ctx?.seats) params.set("seats", ctx.seats);
  if (extras?.email) params.set("email", extras.email);
  params.set("step", step);
  return `/register?${params.toString()}`;
}

export function resolveRegisterStep(
  requested: RegisterStep | null | undefined,
  localeIsAny: boolean,
): RegisterStep {
  const steps: RegisterStep[] = ["context"];
  if (localeIsAny) steps.push("language");
  steps.push("email", "password");
  if (requested && steps.includes(requested)) return requested;
  return "context";
}
