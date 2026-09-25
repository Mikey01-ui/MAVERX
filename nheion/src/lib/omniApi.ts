const API_BASE = (import.meta.env.VITE_OMNI_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:3000";
const API_KEY = (import.meta.env.VITE_DASHBOARD_API_KEY as string | undefined) || "";

export type DashboardLocale = { code: string; label: string; enabled: boolean };

export type ApiInvite = {
  id: string;
  token: string;
  type: "individual" | "group" | string;
  label: string;
  meta: string;
  url: string;
  status: "Active" | "Used" | "Expired" | string;
  language: string;
  difficulty: string;
  company: string | null;
  playerName?: string | null;
  email?: string | null;
  seats?: number | null;
  cohort?: string | null;
  created: string;
  expires: string | null;
};

export type ApiPlayer = {
  id: string;
  email: string;
  name: string | null;
  company: string | null;
  difficulty: string;
  locale: string;
  preferredLocale: string;
  groupName: string | null;
  joinedAt: string;
  currentMission: string | null;
  checkpoint: string | null;
  completedMissions: number;
  lastScore: number | null;
  progress: Array<{
    missionId: string;
    status: string;
    checkpoint: string | null;
    score: number | null;
    updatedAt: string | null;
  }>;
};

export type OrgSettings = {
  notifyEmail: string | null;
  updatedAt: string;
};

async function dashboardFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (API_KEY) headers.set("X-Dashboard-Key", API_KEY);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data;
}

export async function fetchLocales(): Promise<DashboardLocale[]> {
  const data = await dashboardFetch("/api/locales");
  return (data as { locales?: DashboardLocale[] }).locales ?? [];
}

export async function fetchInvites(): Promise<ApiInvite[]> {
  const data = await dashboardFetch("/api/invites");
  return (data as { invites?: ApiInvite[] }).invites ?? [];
}

export async function createInviteApi(payload: {
  type: "individual" | "group";
  lang: string;
  difficulty: string;
  company: string;
  cohort?: string;
  seats?: number;
  email?: string;
  playerName?: string;
  expiresInDays?: number;
}) {
  return dashboardFetch("/api/invites", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{
    ok: true;
    invite: {
      id: string;
      token: string;
      url: string;
      locale: string;
      difficulty: string;
      company: string | null;
      seats: number | null;
      cohort: string | null;
      expiresAt: string | null;
    };
  }>;
}

export async function revokeInviteApi(idOrToken: string) {
  return dashboardFetch(`/api/invites/${encodeURIComponent(idOrToken)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "revoke" }),
  });
}

export async function fetchPlayers(): Promise<ApiPlayer[]> {
  const data = await dashboardFetch("/api/admin/players");
  return (data as { players?: ApiPlayer[] }).players ?? [];
}

export async function resetPlayerApi(id: string) {
  return dashboardFetch(`/api/admin/players/${encodeURIComponent(id)}/reset`, {
    method: "POST",
  }) as Promise<{ ok: boolean; email: string }>;
}

export async function fetchSettings(): Promise<OrgSettings> {
  const data = await dashboardFetch("/api/admin/settings");
  return (data as { settings: OrgSettings }).settings;
}

export async function patchSettings(notifyEmail: string | null) {
  return dashboardFetch("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify({ notifyEmail }),
  }) as Promise<{ ok: boolean; settings: OrgSettings }>;
}

export function gameRegisterBase() {
  return (import.meta.env.VITE_OMNI_GAME_URL as string | undefined)?.replace(/\/$/, "") || API_BASE;
}

export { API_BASE as GAME_API_BASE };
