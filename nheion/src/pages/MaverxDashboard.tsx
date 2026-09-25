import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Settings,
  Users,
  UserPlus,
  Activity,
  ArrowUpRight,
  Play,
  Pause,
  Timer,
  Check,
  Zap,
  PenTool,
  Link2,
  Globe,
  KeyRound,
  Copy,
  Laptop,
  Building2,
  Plus,
  X,
} from "lucide-react";
import { CountUp } from "../components/CountUp";
import { PageMorph } from "../components/PageMorph";
import { StepMorph } from "../components/StepMorph";
import {
  createInviteApi,
  fetchInvites,
  fetchPlayers,
  fetchSettings,
  patchSettings,
  resetPlayerApi,
  revokeInviteApi,
  type ApiPlayer,
} from "../lib/omniApi";

type AccountRow = {
  id: string;
  name: string;
  email: string;
  mission: string;
  missionLabel: string;
  difficulty: string;
  online: boolean;
  session: string;
  lastActive: string;
  company: string;
  language: string;
  playTime: string;
  missionsCleared: number;
  inviteSource: string;
  joined: string;
  score: number;
  progress: ApiPlayer["progress"];
};

function mapPlayer(p: ApiPlayer): AccountRow {
  const emailName = p.email.split("@")[0] || p.email;
  const mission = (p.currentMission ?? "m1").toUpperCase();
  const current = p.progress.find((x) => x.missionId === (p.currentMission ?? "m1"));
  const diff = p.difficulty ? p.difficulty.charAt(0).toUpperCase() + p.difficulty.slice(1) : "Standard";
  const joined = new Date(p.joinedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return {
    id: p.id,
    name: p.name?.trim() || emailName,
    email: p.email,
    mission,
    missionLabel: current?.checkpoint ?? current?.status ?? "—",
    difficulty: diff,
    online: false,
    session: "—",
    lastActive: `Joined ${joined}`,
    company: p.company ?? "—",
    language: (p.locale || p.preferredLocale || "en").toUpperCase(),
    playTime: "—",
    missionsCleared: p.completedMissions,
    inviteSource: p.groupName ? `Group · ${p.groupName}` : "Individual invite",
    joined,
    score: p.lastScore ?? 0,
    progress: p.progress,
  };
}

interface OnlinePlayer {
  id: number;
  title: string;
  time: string;
  icon: React.ElementType;
  completed: boolean;
}

export function MaverxDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [navDirection, setNavDirection] = useState<1 | -1>(1);
  const prevTabRef = useRef("Dashboard");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [accountFilter, setAccountFilter] = useState<"All" | "Online" | "Offline">("All");
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Invite form draft state (empty until admin fills / API returns)
  const [language, setLanguage] = useState("English");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteApiError, setInviteApiError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState("Standard");
  const [company, setCompany] = useState("");
  const [seats, setSeats] = useState("24");
  const [cohort, setCohort] = useState("");
  const [inviteMode, setInviteMode] = useState<"individual" | "group">("individual");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePlayerName, setInvitePlayerName] = useState("");
  const [inviteFilter, setInviteFilter] = useState<"All" | "Active" | "Used" | "Expired">("All");
  const [expiresIn, setExpiresIn] = useState("7");
  const [inviteFlowOpen, setInviteFlowOpen] = useState(false);
  const [inviteFlowStep, setInviteFlowStep] = useState<"type" | "details" | "done">("type");
  const [inviteFlowDir, setInviteFlowDir] = useState<1 | -1>(1);
  const [generatedLinks, setGeneratedLinks] = useState<
    {
      id: string;
      type: "individual" | "group";
      label: string;
      meta: string;
      url: string;
      status: "Active" | "Used" | "Expired";
      language: string;
      difficulty: string;
      company: string;
      seats?: string;
      created: string;
      expires: string;
    }[]
  >([]);
  const [selectedInviteId, setSelectedInviteId] = useState("");
  const [invitesError, setInvitesError] = useState<string | null>(null);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [linkFlash, setLinkFlash] = useState<string | null>(null);
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState("");

  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeTab];
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1,
        });
      }
    };
    updateIndicator();
    const timer = setTimeout(updateIndicator, 60);
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab]);

  // Live-session pulse (kept as interactive gauge)
  const [timerRunning, setTimerRunning] = useState(true);
  const [seconds, setSeconds] = useState(155);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (timerRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const [players, setPlayers] = useState<OnlinePlayer[]>([]);

  const togglePlayer = (id: number) => {
    setPlayers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? accounts[0];
  const viewAccount: AccountRow =
    selectedAccount ??
    ({
      id: "",
      name: "No players yet",
      email: "Register via invite",
      mission: "—",
      missionLabel: "—",
      difficulty: "—",
      online: false,
      session: "—",
      lastActive: "—",
      company: "—",
      language: "—",
      playTime: "—",
      missionsCleared: 0,
      inviteSource: "—",
      joined: "—",
      score: 0,
      progress: [],
    } satisfies AccountRow);
  const filteredAccounts =
    accountFilter === "All"
      ? accounts
      : accounts.filter((a) => (accountFilter === "Online" ? a.online : !a.online));

  const reloadPlayers = () => {
    fetchPlayers()
      .then((rows) => {
        const mapped = rows.map(mapPlayer);
        setAccounts(mapped);
        setAccountsError(null);
        setSelectedAccountId((prev) =>
          mapped.some((a) => a.id === prev) ? prev : mapped[0]?.id ?? "",
        );
      })
      .catch((err) => {
        setAccountsError(err instanceof Error ? err.message : "Failed to load players");
      });
  };

  const navTabs = ["Dashboard", "Accounts", "Invites", "Stats"];

  const goToTab = (tab: string) => {
    if (tab === activeTab) return;
    const from = navTabs.indexOf(prevTabRef.current);
    const to = navTabs.indexOf(tab);
    setNavDirection(to >= from ? 1 : -1);
    prevTabRef.current = tab;
    setActiveTab(tab);
  };

  const ticks = Array.from({ length: 22 }, (_, i) => {
    const angle = 160 + (i * 190) / 21;
    return angle;
  });

  const flash = (msg: string) => {
    setLinkFlash(msg);
    setTimeout(() => setLinkFlash(null), 1800);
  };

  const selectedInvite = generatedLinks.find((l) => l.id === selectedInviteId) ?? generatedLinks[0];
  const filteredInvites =
    inviteFilter === "All" ? generatedLinks : generatedLinks.filter((l) => l.status === inviteFilter);

  const goInviteStep = (step: "type" | "details" | "done", dir: 1 | -1 = 1) => {
    setInviteFlowDir(dir);
    setInviteFlowStep(step);
  };

  const openInviteFlow = () => {
    setInviteFlowDir(1);
    setInviteFlowStep("type");
    setInviteEmail("");
    setInvitePlayerName("");
    setLastGeneratedUrl("");
    setInviteFlowOpen(true);
  };

  const closeInviteFlow = () => {
    setInviteFlowOpen(false);
    setInviteFlowDir(1);
    setInviteFlowStep("type");
  };

  useEffect(() => {
    let cancelled = false;
    setInvitesLoading(true);
    fetchInvites()
      .then((invites) => {
        if (cancelled) return;
        setInvitesError(null);
        setGeneratedLinks(
          invites.map((inv) => ({
            id: inv.id,
            type: inv.type === "group" ? ("group" as const) : ("individual" as const),
            label: inv.label,
            meta: inv.meta,
            url: inv.url,
            status: (inv.status === "Used" || inv.status === "Expired" || inv.status === "Active"
              ? inv.status
              : "Active") as "Active" | "Used" | "Expired",
            language: inv.language,
            difficulty: inv.difficulty,
            company: inv.company ?? "",
            seats: inv.seats != null ? String(inv.seats) : undefined,
            created: inv.created.slice(0, 10),
            expires: inv.expires?.slice(0, 10) ?? "—",
          })),
        );
        if (invites[0]) setSelectedInviteId(invites[0].id);
        else setSelectedInviteId("");
      })
      .catch((err) => {
        if (cancelled) return;
        setGeneratedLinks([]);
        setSelectedInviteId("");
        setInvitesError(err instanceof Error ? err.message : "Failed to load invites");
      })
      .finally(() => {
        if (!cancelled) setInvitesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    reloadPlayers();
  }, []);

  // Drive the live-session list from real accounts (no demo names).
  useEffect(() => {
    setPlayers(
      accounts.slice(0, 8).map((a, i) => ({
        id: i + 1,
        title: a.name,
        time: `${a.mission} · ${a.missionLabel}`,
        icon: a.missionsCleared >= 4 ? Link2 : a.missionsCleared >= 2 ? PenTool : Users,
        completed: a.missionsCleared > 0,
      })),
    );
  }, [accounts]);

  const openSettings = () => {
    setSettingsOpen(true);
    setSettingsError(null);
    fetchSettings()
      .then((s) => setNotifyEmail(s.notifyEmail ?? ""))
      .catch((err) => setSettingsError(err instanceof Error ? err.message : "Failed to load settings"));
  };

  const saveSettings = async () => {
    setSettingsBusy(true);
    setSettingsError(null);
    try {
      const trimmed = notifyEmail.trim();
      await patchSettings(trimmed ? trimmed : null);
      flash("Settings saved");
      setSettingsOpen(false);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSettingsBusy(false);
    }
  };

  const resetSelectedProgress = async () => {
    if (!selectedAccount) return;
    try {
      await resetPlayerApi(selectedAccount.id);
      flash(`Progress reset for ${selectedAccount.email}`);
      reloadPlayers();
    } catch (err) {
      flash(err instanceof Error ? err.message : "Reset failed");
    }
  };

  const generateInvite = async () => {
    setInviteBusy(true);
    setInviteApiError(null);
    try {
      const data = await createInviteApi({
        type: inviteMode,
        lang: language,
        difficulty,
        company,
        cohort: inviteMode === "group" ? cohort : undefined,
        seats: inviteMode === "group" ? Number(seats) || undefined : undefined,
        email: inviteMode === "individual" ? inviteEmail.trim() || undefined : undefined,
        playerName: inviteMode === "individual" ? invitePlayerName.trim() || undefined : undefined,
        expiresInDays: Number(expiresIn) || 7,
      });
      const inv = data.invite;
      const entry = {
        id: inv.id,
        type: inviteMode,
        label:
          inviteMode === "group"
            ? cohort || "Untitled cohort"
            : invitePlayerName.trim() || inviteEmail.trim() || `Guest · ${company}`,
        meta:
          inviteMode === "group"
            ? `${seats} seats · ${difficulty} · ${inv.locale}`
            : `${difficulty} · ${company} · ${inv.locale}`,
        url: inv.url,
        status: "Active" as const,
        language: inv.locale,
        difficulty: inv.difficulty,
        company: inv.company ?? company,
        seats: inviteMode === "group" ? seats : undefined,
        created: new Date().toISOString().slice(0, 10),
        expires: inv.expiresAt?.slice(0, 10) ?? `+${expiresIn}d`,
      };
      setGeneratedLinks((prev) => [entry, ...prev]);
      setSelectedInviteId(inv.id);
      setLastGeneratedUrl(inv.url);
      goInviteStep("done", 1);
      flash(inviteMode === "group" ? "Group invite ready" : "Personal invite ready");
    } catch (err) {
      setInviteApiError(err instanceof Error ? err.message : "Could not create invite");
      flash("Invite API failed — check game server + API key");
    } finally {
      setInviteBusy(false);
    }
  };

  const revokeInvite = async (id: string) => {
    try {
      await revokeInviteApi(id);
      setGeneratedLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "Expired" as const } : l)),
      );
      flash("Invite revoked");
    } catch {
      setGeneratedLinks((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status: "Expired" as const } : l)),
      );
      flash("Revoked locally (API unavailable)");
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash("Copied to clipboard");
    } catch {
      flash("Copy failed — select the link");
    }
  };

  const showInvites = activeTab === "Invites";
  const showAccounts = activeTab === "Accounts";
  const showStats = activeTab === "Stats";
  const showMainGrid = activeTab === "Dashboard";

  const totalPlayers = accounts.length;
  const onlinePlayersCount = accounts.filter((a) => a.online).length;
  const clearedCount = accounts.filter((a) => a.missionsCleared >= 5).length;
  const clearedPct = totalPlayers === 0 ? 0 : Math.round((100 * clearedCount) / totalPlayers);
  const inviteTotal = generatedLinks.length;
  const inviteUsed = generatedLinks.filter((l) => l.status === "Used").length;
  const inviteConversionPct =
    inviteTotal === 0 ? 0 : Math.round((100 * Math.min(totalPlayers, inviteTotal)) / inviteTotal);
  const progressAvgPct =
    totalPlayers === 0
      ? 0
      : Math.round(
          accounts.reduce((sum, a) => sum + (a.missionsCleared / 5) * 100, 0) / totalPlayers,
        );

  const MISSION_META: { id: string; label: string }[] = [
    { id: "m1", label: "Identifying the Footprint" },
    { id: "m2", label: "Forging the Master Key" },
    { id: "m3", label: "The Human Shield" },
    { id: "m4", label: "The Onboarding" },
    { id: "m5", label: "Finale · voting" },
  ];

  const missionFunnel = MISSION_META.map((m) => {
    const playersReached = accounts.filter((a) => {
      const row = a.progress.find((p) => p.missionId === m.id);
      return row != null && row.status !== "locked";
    }).length;
    return {
      id: m.id.toUpperCase(),
      label: m.label,
      players: playersReached,
      pct: totalPlayers === 0 ? 0 : Math.round((100 * playersReached) / totalPlayers),
    };
  });

  const biggestDrop = (() => {
    let worst: { from: string; to: string; delta: number } | null = null;
    for (let i = 0; i < missionFunnel.length - 1; i++) {
      const delta = missionFunnel[i].players - missionFunnel[i + 1].players;
      if (!worst || delta > worst.delta) {
        worst = {
          from: missionFunnel[i].id,
          to: missionFunnel[i + 1].id,
          delta,
        };
      }
    }
    return worst ?? { from: "M1", to: "M2", delta: 0 };
  })();

  const difficultyMix = (["Easy", "Standard", "Hard"] as const).map((label, i) => {
    const tones = ["bg-neutral-200", "bg-[#1c1e21]", "bg-[#f97316]"] as const;
    const count = accounts.filter((a) => a.difficulty === label).length;
    return {
      label,
      count,
      pct: totalPlayers === 0 ? 0 : Math.round((100 * count) / totalPlayers),
      tone: tones[i],
    };
  });

  const companyBreakdown = (() => {
    const map = new Map<string, { cleared: number; total: number }>();
    for (const a of accounts) {
      const name = a.company && a.company !== "—" ? a.company : "Unassigned";
      const cur = map.get(name) ?? { cleared: 0, total: 0 };
      cur.total += 1;
      if (a.missionsCleared >= 4) cur.cleared += 1;
      map.set(name, cur);
    }
    return [...map.entries()]
      .map(([name, v]) => ({
        name,
        cleared: v.cleared,
        total: v.total,
        pct: v.total ? Math.round((100 * v.cleared) / v.total) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  })();

  const calendarInvites = generatedLinks.slice(0, 2);
  const m1m2ClearPct =
    totalPlayers === 0
      ? 0
      : Math.round(
          (100 *
            accounts.filter((a) => {
              const m2 = a.progress.find((p) => p.missionId === "m2");
              return m2 != null && (m2.status === "completed" || a.missionsCleared >= 2);
            }).length) /
            totalPlayers,
        );

  return (
    <div className="min-h-screen w-full font-sans text-neutral-900 antialiased selection:bg-orange-300 selection:text-neutral-900 relative overflow-x-hidden bg-[#f7f4fb]">
      {/* ===================== ANIMATED AMBIENT MESH GRADIENTS ===================== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 28%, #f5e9ff 55%, #ede4ff 78%, #e9d5ff 100%)",
          }}
        />
        <div
          className="absolute -top-[18%] -left-[12%] w-[750px] h-[750px] rounded-full blur-[100px] opacity-70 animate-ambient-orange"
          style={{
            background: "radial-gradient(circle, #fb923c 0%, #fdba74 42%, rgba(253, 186, 116, 0.22) 68%, transparent 80%)",
          }}
        />
        <div
          className="absolute top-[2%] -left-[4%] w-[520px] h-[520px] rounded-full blur-[90px] opacity-55 animate-ambient-warm"
          style={{
            background: "radial-gradient(circle, #f97316 0%, #fed7aa 45%, rgba(254, 215, 170, 0) 75%)",
          }}
        />
        <div
          className="absolute top-[18%] -right-[14%] w-[820px] h-[820px] rounded-full blur-[110px] opacity-65 animate-ambient-purple"
          style={{
            background: "radial-gradient(circle, #a855f7 0%, #c084fc 40%, rgba(192, 132, 252, 0.28) 65%, transparent 75%)",
          }}
        />
        <div
          className="absolute -bottom-[10%] right-[2%] w-[700px] h-[700px] rounded-full blur-[95px] opacity-70 animate-ambient-accent-purple"
          style={{
            background: "radial-gradient(circle, #7c3aed 0%, #a78bfa 45%, rgba(167, 139, 250, 0.2) 70%, transparent 80%)",
          }}
        />
        <div
          className="absolute -bottom-[8%] left-[12%] w-[550px] h-[550px] rounded-full blur-[100px] opacity-45 animate-ambient-lavender"
          style={{
            background: "radial-gradient(circle, #e9d5ff 0%, rgba(233, 213, 255, 0) 70%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-3.5 py-4 sm:p-8 lg:p-10 flex flex-col gap-2">
        {linkFlash && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1c1e21] text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg">
            {linkFlash}
          </div>
        )}

        {/* ===================== TOP NAVIGATION BAR ===================== */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 sm:pb-5">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="border border-black/[0.12] rounded-full px-4 sm:px-5 py-1.5 text-[15px] sm:text-[17px] font-semibold tracking-tight text-[#1a1a1a] bg-white/50 backdrop-blur-xs shadow-xs">
              Maverx
            </div>
            <div className="sm:hidden flex items-center">
              <button
                type="button"
                onClick={openSettings}
                className="border border-black/[0.12] rounded-full px-3.5 py-1.5 text-[12px] font-normal text-neutral-800 flex items-center gap-1.5 bg-white/40 hover:bg-white/60 transition-colors shadow-xs cursor-pointer"
              >
                <Settings size={12} strokeWidth={1.5} className="text-neutral-700" />
                <span>Setting</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-hidden">
            <nav className="relative flex items-center bg-white/70 backdrop-blur-md border border-black/[0.08] shadow-xs rounded-full p-1 overflow-x-auto scrollbar-none flex-nowrap">
              <div
                className="absolute top-1 bottom-1 rounded-full bg-[#1c1e21] shadow-xs pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                  opacity: indicatorStyle.opacity,
                }}
              />
              {navTabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    ref={(el) => {
                      tabRefs.current[tab] = el;
                    }}
                    onClick={() => goToTab(tab)}
                    className={`relative z-10 text-[12px] sm:text-[13px] whitespace-nowrap transition-colors duration-200 cursor-pointer shrink-0 px-3.5 sm:px-4 py-1.5 rounded-full ${
                      isActive
                        ? "text-white font-medium"
                        : "text-[#555a63] hover:text-[#111] font-normal"
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </nav>

            <div className="hidden sm:flex items-center pl-1 shrink-0">
              <button
                type="button"
                onClick={openSettings}
                className="border border-black/[0.12] rounded-full px-4 py-1.5 text-[13px] font-normal text-neutral-800 flex items-center gap-1.5 bg-white/40 hover:bg-white/60 transition-colors shadow-xs cursor-pointer"
              >
                <Settings size={13} strokeWidth={1.5} className="text-neutral-700" />
                <span>Setting</span>
              </button>
            </div>
          </div>
        </header>

        <PageMorph pageKey={activeTab} direction={navDirection} className="flex flex-col gap-2">
        {/* ===================== GREETING & METRICS ===================== */}
        <section className="pt-1 sm:pt-2 pb-4 sm:pb-5" data-morph-item>
          <h1 className="text-[26px] sm:text-[34px] lg:text-[38px] font-normal tracking-tight text-[#161719] leading-tight mb-3 sm:mb-4">
            {showInvites
              ? "Invite links"
              : showAccounts
                ? "Player accounts"
                : showStats
                  ? "Playthrough stats"
                  : "Welcome in, Admin"}
          </h1>

          {showInvites ? (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <p className="text-[13px] text-[#666c77] max-w-md leading-relaxed">
                Browse active links, copy or revoke anytime. Tap + to invite a player or open a group cohort.
              </p>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-8 lg:gap-10">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 rounded-full border border-black/[0.12] bg-white/40 flex items-center justify-center text-black/70 shrink-0">
                      <Link2 size={11} strokeWidth={1.5} />
                    </div>
                    <CountUp
                      value={generatedLinks.length}
                      restartKey={activeTab}
                      className="text-[28px] sm:text-[34px] font-light tracking-tighter text-[#1a1a1a] leading-none"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#666c77] font-normal pl-6 sm:pl-7 mt-0.5">
                    Total
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 rounded-full border border-black/[0.12] bg-white/40 flex items-center justify-center text-black/70 shrink-0">
                      <Activity size={11} strokeWidth={1.5} />
                    </div>
                    <CountUp
                      value={generatedLinks.filter((l) => l.status === "Active").length}
                      restartKey={activeTab}
                      className="text-[28px] sm:text-[34px] font-light tracking-tighter text-[#1a1a1a] leading-none"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#666c77] font-normal pl-6 sm:pl-7 mt-0.5">
                    Open
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 rounded-full border border-black/[0.12] bg-white/40 flex items-center justify-center text-black/70 shrink-0">
                      <Users size={11} strokeWidth={1.5} />
                    </div>
                    <CountUp
                      value={generatedLinks.filter((l) => l.type === "group").length}
                      restartKey={activeTab}
                      className="text-[28px] sm:text-[34px] font-light tracking-tighter text-[#1a1a1a] leading-none"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#666c77] font-normal pl-6 sm:pl-7 mt-0.5">
                    Groups
                  </span>
                </div>
              </div>
            </div>
          ) : showAccounts ? (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <p className="text-[13px] text-[#666c77] max-w-md leading-relaxed">
                Browse every player, click one to inspect progress, session, and invite source.
              </p>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-8 lg:gap-10">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 rounded-full border border-black/[0.12] bg-white/40 flex items-center justify-center text-black/70 shrink-0">
                      <Users size={11} strokeWidth={1.5} />
                    </div>
                    <CountUp
                      value={accounts.length}
                      restartKey={activeTab}
                      className="text-[28px] sm:text-[34px] font-light tracking-tighter text-[#1a1a1a] leading-none"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#666c77] font-normal pl-6 sm:pl-7 mt-0.5">
                    Players
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 rounded-full border border-black/[0.12] bg-white/40 flex items-center justify-center text-black/70 shrink-0">
                      <Activity size={11} strokeWidth={1.5} />
                    </div>
                    <CountUp
                      value={accounts.filter((a) => a.online).length}
                      restartKey={activeTab}
                      className="text-[28px] sm:text-[34px] font-light tracking-tighter text-[#1a1a1a] leading-none"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#666c77] font-normal pl-6 sm:pl-7 mt-0.5">
                    Online
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 rounded-full border border-black/[0.12] bg-white/40 flex items-center justify-center text-black/70 shrink-0">
                      <Check size={11} strokeWidth={1.5} />
                    </div>
                    <CountUp
                      value={accounts.filter((a) => a.missionsCleared >= 4).length}
                      restartKey={activeTab}
                      className="text-[28px] sm:text-[34px] font-light tracking-tighter text-[#1a1a1a] leading-none"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#666c77] font-normal pl-6 sm:pl-7 mt-0.5">
                    Near end
                  </span>
                </div>
              </div>
            </div>
          ) : showStats ? (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <p className="text-[13px] text-[#666c77] max-w-md leading-relaxed">
                Completions, drop-off, and invite conversion across cohorts from live player data.
              </p>
              <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-8 lg:gap-10">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 rounded-full border border-black/[0.12] bg-white/40 flex items-center justify-center text-black/70 shrink-0">
                      <Check size={11} strokeWidth={1.5} />
                    </div>
                    <CountUp
                      value={clearedPct}
                      suffix="%"
                      restartKey={activeTab}
                      className="text-[28px] sm:text-[34px] font-light tracking-tighter text-[#1a1a1a] leading-none"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#666c77] font-normal pl-6 sm:pl-7 mt-0.5">
                    Cleared
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 rounded-full border border-black/[0.12] bg-white/40 flex items-center justify-center text-black/70 shrink-0">
                      <Timer size={11} strokeWidth={1.5} />
                    </div>
                    <CountUp
                      value={progressAvgPct}
                      suffix="%"
                      restartKey={activeTab}
                      className="text-[28px] sm:text-[34px] font-light tracking-tighter text-[#1a1a1a] leading-none"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#666c77] font-normal pl-6 sm:pl-7 mt-0.5">
                    Avg progress
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 rounded-full border border-black/[0.12] bg-white/40 flex items-center justify-center text-black/70 shrink-0">
                      <Link2 size={11} strokeWidth={1.5} />
                    </div>
                    <CountUp
                      value={inviteConversionPct}
                      suffix="%"
                      restartKey={activeTab}
                      className="text-[28px] sm:text-[34px] font-light tracking-tighter text-[#1a1a1a] leading-none"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#666c77] font-normal pl-6 sm:pl-7 mt-0.5">
                    Invite → play
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
              <div className="w-full lg:w-auto overflow-x-auto scrollbar-none pb-1">
                <div className="min-w-[340px] sm:min-w-0 flex flex-col">
                  <div className="flex items-center text-[11px] font-normal text-[#666] mb-1.5 pl-1">
                    <span className="w-14 sm:w-[62px] text-center shrink-0">Online</span>
                    <span className="w-14 sm:w-[62px] text-center ml-2 shrink-0">Done</span>
                    <span className="flex-1 sm:w-72 text-left pl-3 ml-2 min-w-[120px]">Invite use</span>
                    <span className="w-14 sm:w-[72px] text-center ml-2 shrink-0">Progress</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="bg-[#24272c] text-white text-[11px] sm:text-[12px] font-medium px-2.5 sm:px-4 py-1.5 rounded-full w-14 sm:w-[62px] text-center shadow-xs shrink-0">
                      <CountUp
                        value={totalPlayers === 0 ? 0 : Math.round((100 * onlinePlayersCount) / totalPlayers)}
                        suffix="%"
                        restartKey={activeTab}
                      />
                    </div>
                    <div className="bg-[#f97316] text-[#0a0a0a] text-[11px] sm:text-[12px] font-semibold px-2.5 sm:px-4 py-1.5 rounded-full w-14 sm:w-[62px] text-center shadow-xs shrink-0">
                      <CountUp value={clearedPct} suffix="%" restartKey={activeTab} />
                    </div>
                    <div
                      className="rounded-full px-3 sm:px-4 py-1.5 text-[11px] sm:text-[12px] font-medium text-[#1c1e21] flex-1 sm:w-72 min-w-[120px] flex items-center shadow-xs"
                      style={{
                        background: `repeating-linear-gradient(
                          -45deg,
                          rgba(255, 255, 255, 0.92),
                          rgba(255, 255, 255, 0.92) 3.5px,
                          rgba(253, 186, 116, 0.5) 3.5px,
                          rgba(253, 186, 116, 0.5) 7px
                        )`,
                        border: "1px solid rgba(255, 255, 255, 0.75)",
                      }}
                    >
                      <CountUp value={inviteConversionPct} suffix="%" restartKey={activeTab} />
                    </div>
                    <div className="border border-black/[0.18] bg-transparent text-[#1a1a1a] text-[11px] sm:text-[12px] font-medium px-2.5 sm:px-4 py-1.5 rounded-full w-14 sm:w-[72px] text-center shrink-0">
                      <CountUp value={progressAvgPct} suffix="%" restartKey={activeTab} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-8 lg:gap-12 pr-2 pt-1 sm:pt-0">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full border border-black/[0.12] bg-white/40 flex items-center justify-center text-black/70 shrink-0">
                      <Users size={11} strokeWidth={1.5} />
                    </div>
                    <CountUp
                      value={totalPlayers}
                      restartKey={activeTab}
                      className="text-[28px] sm:text-[38px] lg:text-[42px] font-light tracking-tighter text-[#1a1a1a] leading-none"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#666c77] font-normal pl-6 sm:pl-7.5 mt-0.5 sm:-mt-1">
                    Players
                  </span>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full border border-black/[0.12] bg-white/40 flex items-center justify-center text-black/70 shrink-0">
                      <Activity size={11} strokeWidth={1.5} />
                    </div>
                    <CountUp
                      value={onlinePlayersCount}
                      restartKey={activeTab}
                      className="text-[28px] sm:text-[38px] lg:text-[42px] font-light tracking-tighter text-[#1a1a1a] leading-none"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#666c77] font-normal pl-6 sm:pl-7.5 mt-0.5 sm:-mt-1">
                    Online
                  </span>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full border border-black/[0.12] bg-white/40 flex items-center justify-center text-black/70 shrink-0">
                      <UserPlus size={11} strokeWidth={1.5} />
                    </div>
                    <CountUp
                      value={inviteUsed}
                      restartKey={activeTab}
                      className="text-[28px] sm:text-[38px] lg:text-[42px] font-light tracking-tighter text-[#1a1a1a] leading-none"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#666c77] font-normal pl-6 sm:pl-7.5 mt-0.5 sm:-mt-1">
                    Used invites
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ===================== ACCOUNTS VIEW ===================== */}
        {showAccounts && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start mt-2">
            {/* Player list */}
            <div className="lg:col-span-7 bg-white/85 rounded-[26px] p-5 shadow-xs border border-white/80" data-morph-item>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-800">All players</h2>
                  <p className="text-[11px] text-[#666c77] mt-0.5">Click someone to inspect their run</p>
                </div>
                <span className="text-[11px] font-medium text-[#666c77] bg-neutral-100 rounded-full px-3 py-1">
                  {filteredAccounts.length}
                </span>
              </div>

              <div className="flex items-center gap-1 mb-4 overflow-x-auto scrollbar-none">
                {(["All", "Online", "Offline"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAccountFilter(f)}
                    className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                      accountFilter === f
                        ? "bg-[#1c1e21] text-white"
                        : "bg-neutral-100 text-[#666c77] hover:bg-neutral-200/80"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
                {accountsError && (
                  <p className="text-[12px] text-red-600 text-center py-4 px-3">{accountsError}</p>
                )}
                {filteredAccounts.length === 0 && !accountsError && (
                  <p className="text-[12px] text-[#888e99] text-center py-10">No players yet — register via an invite link</p>
                )}
                {filteredAccounts.map((account) => {
                  const active = account.id === selectedAccountId;
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`w-full text-left rounded-2xl px-3.5 py-3 border transition-colors cursor-pointer ${
                        active
                          ? "bg-[#1c1e21] border-[#1c1e21] text-white"
                          : "bg-white/70 border-black/[0.06] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${
                                account.online
                                  ? "bg-[#f97316] shadow-[0_0_0_3px_rgba(249,115,22,0.3)]"
                                  : active
                                    ? "bg-white/30"
                                    : "bg-neutral-300"
                              }`}
                            />
                            <p className={`text-xs font-semibold truncate ${active ? "text-white" : "text-[#1a1a1a]"}`}>
                              {account.name}
                            </p>
                          </div>
                          <p className={`text-[10px] mt-0.5 truncate ${active ? "text-white/60" : "text-[#888e99]"}`}>
                            {account.email} · {account.company}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-[11px] font-semibold ${active ? "text-[#f97316]" : "text-[#1a1a1a]"}`}>
                            {account.mission}
                          </p>
                          <p className={`text-[10px] ${active ? "text-white/55" : "text-[#888e99]"}`}>
                            {account.playTime}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected player detail + stats */}
            <div className="lg:col-span-5 flex flex-col gap-4" data-morph-item>
              {!selectedAccount ? (
                <div className="bg-white/85 rounded-[26px] p-8 shadow-xs border border-white/80 text-center">
                  <p className="text-[13px] text-[#888e99]">Select a player to inspect their run</p>
                </div>
              ) : (
              <>
              <div className="bg-white/85 rounded-[26px] p-5 shadow-xs border border-white/80">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          viewAccount.online
                            ? "bg-[#f97316] shadow-[0_0_0_3px_rgba(249,115,22,0.3)]"
                            : "bg-neutral-300"
                        }`}
                      />
                      <h3 className="text-[15px] font-semibold text-[#1a1a1a]">{viewAccount.name}</h3>
                    </div>
                    <p className="text-[11px] text-[#666c77] mt-1">{viewAccount.email}</p>
                    <p className="text-[10px] text-[#888e99] mt-0.5">
                      Joined {viewAccount.joined} · {viewAccount.inviteSource}
                    </p>
                  </div>
                  <span className="bg-[#f97316] text-[#0a0a0a] text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0">
                    {viewAccount.mission} · {viewAccount.difficulty}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-2xl bg-neutral-50 border border-black/[0.05] p-3">
                    <p className="text-[9px] text-[#888e99] font-semibold uppercase tracking-wide">Play time</p>
                    <p className="text-sm font-semibold text-[#1a1a1a] mt-1">{viewAccount.playTime}</p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 border border-black/[0.05] p-3">
                    <p className="text-[9px] text-[#888e99] font-semibold uppercase tracking-wide">Cleared</p>
                    <p className="text-sm font-semibold text-[#1a1a1a] mt-1">
                      <CountUp
                        value={viewAccount.missionsCleared}
                        restartKey={selectedAccountId}
                      />
                      /5
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 border border-black/[0.05] p-3">
                    <p className="text-[9px] text-[#888e99] font-semibold uppercase tracking-wide">Score</p>
                    <CountUp
                      value={viewAccount.score}
                      restartKey={selectedAccountId}
                      className="text-sm font-semibold text-[#1a1a1a] mt-1 block"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-[10px] text-[#888e99] font-semibold uppercase tracking-wide mb-2">Mission track</p>
                  <div className="flex items-center gap-1.5">
                    {["M1", "M2", "M3", "M4", "M5"].map((m) => {
                      const mid = m.toLowerCase();
                      const row = selectedAccount?.progress?.find((p) => p.missionId === mid);
                      const done = row?.status === "completed" || (selectedAccount?.missionsCleared ?? 0) >= Number(m.replace("M", ""));
                      const current = selectedAccount?.mission === m && row?.status !== "completed";
                      return (
                        <div
                          key={m}
                          className={`flex-1 rounded-xl h-9 flex items-center justify-center text-[11px] font-semibold ${
                            current
                              ? "bg-[#f97316] text-[#0a0a0a]"
                              : done
                                ? "bg-[#1c1e21] text-white"
                                : "bg-neutral-100 text-[#888e99] border border-black/[0.06]"
                          }`}
                        >
                          {m}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-2xl bg-neutral-50 border border-black/[0.05] p-3">
                    <p className="text-[10px] text-[#888e99] font-semibold uppercase tracking-wide">Session</p>
                    <p className="text-xs font-semibold text-[#1a1a1a] mt-1">{viewAccount.session}</p>
                    <p className="text-[10px] text-[#888e99] mt-0.5">{viewAccount.lastActive}</p>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 border border-black/[0.05] p-3">
                    <p className="text-[10px] text-[#888e99] font-semibold uppercase tracking-wide">Company</p>
                    <p className="text-xs font-semibold text-[#1a1a1a] mt-1">{viewAccount.company}</p>
                    <p className="text-[10px] text-[#888e99] mt-0.5">{viewAccount.language}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void resetSelectedProgress()}
                    disabled={!selectedAccount}
                    className="flex-1 bg-[#1c1e21] text-white text-[12px] font-semibold rounded-full py-2.5 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-black disabled:opacity-40"
                  >
                    <KeyRound size={13} />
                    Reset progress
                  </button>
                  <button
                    type="button"
                    onClick={() => reloadPlayers()}
                    className="flex-1 bg-white border border-black/[0.12] text-[12px] font-semibold rounded-full py-2.5 cursor-pointer hover:bg-neutral-50"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="bg-[#222428] text-white rounded-[26px] p-5 shadow-xl border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[14px] font-semibold">Player snapshot</span>
                  <Activity size={14} className="text-white/50" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-[9px] text-neutral-500 font-semibold uppercase tracking-wide">Status</p>
                    <p className="text-[12px] font-semibold mt-1">
                      {viewAccount.online ? "Live now" : "Offline"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-[9px] text-neutral-500 font-semibold uppercase tracking-wide">Progress</p>
                    <p className="text-[12px] font-semibold mt-1 text-[#f97316]">
                      {Math.round((viewAccount.missionsCleared / 5) * 100)}%
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-400 mt-3 leading-relaxed">
                  {viewAccount.missionLabel} on {viewAccount.mission} · {viewAccount.difficulty} ·{" "}
                  {viewAccount.company}
                </p>
              </div>
              </>
              )}
            </div>
          </div>
        )}

        {/* ===================== INVITES VIEW ===================== */}
        {showInvites && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start mt-2">
              {/* Invite list */}
              <div className="lg:col-span-7 bg-white/85 rounded-[26px] p-5 shadow-xs border border-white/80" data-morph-item>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-neutral-800">All invites</h2>
                    <p className="text-[11px] text-[#666c77] mt-0.5">Select one to copy or revoke</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-[#666c77] bg-neutral-100 rounded-full px-3 py-1">
                      {filteredInvites.length}
                    </span>
                    <button
                      type="button"
                      onClick={openInviteFlow}
                      className="w-9 h-9 rounded-full bg-[#1c1e21] text-white flex items-center justify-center shadow-xs cursor-pointer hover:bg-black"
                      aria-label="Create invite"
                    >
                      <Plus size={16} strokeWidth={2.25} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 mb-4 overflow-x-auto scrollbar-none">
                  {(["All", "Active", "Used", "Expired"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setInviteFilter(f)}
                      className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                        inviteFilter === f
                          ? "bg-[#1c1e21] text-white"
                          : "bg-neutral-100 text-[#666c77] hover:bg-neutral-200/80"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto overflow-x-hidden overscroll-contain pr-1 [scrollbar-gutter:stable]">
                  <StepMorph
                    stepKey={`invites-${inviteFilter}-${invitesLoading ? "loading" : invitesError ? "error" : filteredInvites.map((i) => i.id).join(",") || "empty"}`}
                    direction={1}
                    className="flex flex-col gap-2"
                    dataAttr="data-invite-list"
                  >
                  {invitesLoading && (
                    <p className="text-[12px] text-[#888e99] text-center py-10" data-step-item>
                      Loading invites…
                    </p>
                  )}
                  {invitesError && !invitesLoading && (
                    <p className="text-[12px] text-red-600 text-center py-10 px-3" data-step-item>
                      {invitesError}
                    </p>
                  )}
                  {!invitesLoading && !invitesError && filteredInvites.length === 0 && (
                    <div className="text-center py-12 px-4" data-step-item>
                      <p className="text-[13px] font-semibold text-[#1a1a1a]">No invites yet</p>
                      <p className="text-[12px] text-[#888e99] mt-1 mb-4">
                        Create a personal or group link to get started
                      </p>
                      <button
                        type="button"
                        onClick={openInviteFlow}
                        className="inline-flex items-center gap-1.5 bg-[#1c1e21] text-white text-[12px] font-semibold rounded-full px-4 py-2.5 cursor-pointer hover:bg-black"
                      >
                        <Plus size={14} />
                        New invite
                      </button>
                    </div>
                  )}
                  {filteredInvites.map((invite) => {
                    const active = invite.id === selectedInviteId;
                    return (
                      <button
                        key={invite.id}
                        type="button"
                        data-step-item
                        onClick={() => {
                          setSelectedInviteId(invite.id);
                          setLastGeneratedUrl(invite.url);
                        }}
                        className={`w-full text-left rounded-2xl px-3.5 py-3 border transition-colors cursor-pointer ${
                          active
                            ? "bg-[#1c1e21] border-[#1c1e21] text-white"
                            : "bg-white/70 border-black/[0.06] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                  invite.type === "group"
                                    ? active
                                      ? "bg-[#f97316] text-[#0a0a0a]"
                                      : "bg-orange-100 text-orange-700"
                                    : active
                                      ? "bg-white/15 text-white"
                                      : "bg-neutral-100 text-[#666c77]"
                                }`}
                              >
                                {invite.type}
                              </span>
                              <span
                                className={`text-[10px] font-semibold ${
                                  invite.status === "Active"
                                    ? active
                                      ? "text-[#f97316]"
                                      : "text-emerald-600"
                                    : active
                                      ? "text-white/45"
                                      : "text-[#888e99]"
                                }`}
                              >
                                {invite.status}
                              </span>
                            </div>
                            <p className={`text-xs font-semibold mt-1.5 truncate ${active ? "text-white" : "text-[#1a1a1a]"}`}>
                              {invite.label}
                            </p>
                            <p className={`text-[10px] mt-0.5 truncate ${active ? "text-white/55" : "text-[#888e99]"}`}>
                              {invite.meta}
                            </p>
                          </div>
                          {invite.type === "group" ? (
                            <Users size={14} className={active ? "text-white/50" : "text-neutral-400"} />
                          ) : (
                            <UserPlus size={14} className={active ? "text-white/50" : "text-neutral-400"} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                  </StepMorph>
                </div>
              </div>

              {/* Selected invite detail */}
              <div className="lg:col-span-5 flex flex-col gap-4" data-morph-item>
                {selectedInvite ? (
                  <>
                    <div className="bg-white/85 rounded-[26px] p-5 shadow-xs border border-white/80">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                                selectedInvite.type === "group"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-neutral-100 text-[#666c77]"
                              }`}
                            >
                              {selectedInvite.type}
                            </span>
                            <h3 className="text-[15px] font-semibold text-[#1a1a1a] truncate">
                              {selectedInvite.label}
                            </h3>
                          </div>
                          <p className="text-[11px] text-[#666c77] mt-1.5 break-all leading-relaxed">
                            {selectedInvite.url}
                          </p>
                          <p className="text-[10px] text-[#888e99] mt-2">
                            Created {selectedInvite.created} · expires {selectedInvite.expires}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                            selectedInvite.status === "Active"
                              ? "bg-[#f97316] text-[#0a0a0a]"
                              : "bg-neutral-100 text-[#888e99]"
                          }`}
                        >
                          {selectedInvite.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="rounded-2xl bg-neutral-50 border border-black/[0.05] p-3">
                          <p className="text-[10px] text-[#888e99] font-semibold uppercase tracking-wide">Language</p>
                          <p className="text-xs font-semibold text-[#1a1a1a] mt-1">{selectedInvite.language}</p>
                        </div>
                        <div className="rounded-2xl bg-neutral-50 border border-black/[0.05] p-3">
                          <p className="text-[10px] text-[#888e99] font-semibold uppercase tracking-wide">Difficulty</p>
                          <p className="text-xs font-semibold text-[#1a1a1a] mt-1">{selectedInvite.difficulty}</p>
                        </div>
                        <div className="rounded-2xl bg-neutral-50 border border-black/[0.05] p-3">
                          <p className="text-[10px] text-[#888e99] font-semibold uppercase tracking-wide">Company</p>
                          <p className="text-xs font-semibold text-[#1a1a1a] mt-1">{selectedInvite.company}</p>
                        </div>
                        <div className="rounded-2xl bg-neutral-50 border border-black/[0.05] p-3">
                          <p className="text-[10px] text-[#888e99] font-semibold uppercase tracking-wide">
                            {selectedInvite.type === "group" ? "Seats" : "Expires"}
                          </p>
                          <p className="text-xs font-semibold text-[#1a1a1a] mt-1">
                            {selectedInvite.type === "group"
                              ? selectedInvite.seats ?? "—"
                              : selectedInvite.expires}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => copyText(selectedInvite.url)}
                          className="flex-1 bg-[#1c1e21] text-white text-[12px] font-semibold rounded-full py-2.5 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-black"
                        >
                          <Copy size={13} />
                          Copy link
                        </button>
                        <button
                          type="button"
                          disabled={selectedInvite.status === "Expired"}
                          onClick={() => revokeInvite(selectedInvite.id)}
                          className="flex-1 bg-white border border-black/[0.12] text-[12px] font-semibold rounded-full py-2.5 cursor-pointer hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Revoke
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white/85 rounded-[26px] p-8 shadow-xs border border-white/80 text-center">
                    <p className="text-[13px] text-[#888e99]">Select an invite to see details</p>
                  </div>
                )}
              </div>
            </div>

            {/* Create invite flow modal — portaled to body so PageMorph transforms don't break fixed overlay */}
            {inviteFlowOpen &&
              createPortal(
              <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
                <button
                  type="button"
                  className="absolute inset-0 bg-[#1c1e21]/45 backdrop-blur-[2px] cursor-pointer"
                  aria-label="Close"
                  onClick={closeInviteFlow}
                />
                <div className="relative w-full sm:max-w-[480px] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-white/80 max-h-[92vh] overflow-x-hidden overflow-y-auto overscroll-contain">
                  <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-5 pt-5 pb-3 flex items-center justify-between border-b border-black/[0.04] z-10">
                    <div>
                      <p className="text-[10px] font-semibold text-[#888e99] uppercase tracking-wide">
                        {inviteFlowStep === "type"
                          ? "Step 1 of 2"
                          : inviteFlowStep === "details"
                            ? "Step 2 of 2"
                            : "Done"}
                      </p>
                      <h3 className="text-[15px] font-semibold text-[#1a1a1a] mt-0.5">
                        {inviteFlowStep === "type"
                          ? "Who are you inviting?"
                          : inviteFlowStep === "details"
                            ? inviteMode === "group"
                              ? "Group invite"
                              : "Personal invite"
                            : "Invite ready"}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={closeInviteFlow}
                      className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer hover:bg-neutral-200"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-5">
                    <StepMorph stepKey={inviteFlowStep} direction={inviteFlowDir} dataAttr="data-invite-flow">
                    {inviteFlowStep === "type" && (
                      <div className="flex flex-col gap-3">
                        <button
                          type="button"
                          data-step-item
                          onClick={() => {
                            setInviteMode("individual");
                            goInviteStep("details", 1);
                          }}
                          className="w-full text-left rounded-[22px] border border-black/[0.08] bg-neutral-50/80 hover:bg-white hover:border-black/15 p-4 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1c1e21] text-white flex items-center justify-center shrink-0">
                              <UserPlus size={16} />
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#1a1a1a]">Individual</p>
                              <p className="text-[11px] text-[#666c77] mt-0.5">
                                One player — email optional, set language & difficulty
                              </p>
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          data-step-item
                          onClick={() => {
                            setInviteMode("group");
                            goInviteStep("details", 1);
                          }}
                          className="w-full text-left rounded-[22px] border border-black/[0.08] bg-neutral-50/80 hover:bg-white hover:border-black/15 p-4 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#f97316] text-[#0a0a0a] flex items-center justify-center shrink-0">
                              <Users size={16} />
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-[#1a1a1a]">Group</p>
                              <p className="text-[11px] text-[#666c77] mt-0.5">
                                Shared cohort link with seat limit
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    )}

                    {inviteFlowStep === "details" && (
                      <div className="flex flex-col gap-3" data-step-item>
                        {inviteMode === "individual" ? (
                          <div className="flex flex-col gap-3">
                            <div>
                              <label className="text-[10px] font-semibold text-[#888e99] uppercase tracking-wide">
                                Player name (optional)
                              </label>
                              <input
                                value={invitePlayerName}
                                onChange={(e) => setInvitePlayerName(e.target.value)}
                                placeholder="Alex Rivera"
                                className="mt-1.5 w-full rounded-full border border-black/[0.1] bg-white px-4 py-2.5 text-[13px] outline-none focus:border-black/25"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888e99] uppercase tracking-wide">
                                Player email (optional)
                              </label>
                              <input
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="player@company.com"
                                className="mt-1.5 w-full rounded-full border border-black/[0.1] bg-white px-4 py-2.5 text-[13px] outline-none focus:border-black/25"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 sm:col-span-1">
                              <label className="text-[10px] font-semibold text-[#888e99] uppercase tracking-wide">
                                Cohort name
                              </label>
                              <input
                                value={cohort}
                                onChange={(e) => setCohort(e.target.value)}
                                className="mt-1.5 w-full rounded-full border border-black/[0.1] bg-white px-4 py-2.5 text-[13px] outline-none focus:border-black/25"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-[#888e99] uppercase tracking-wide">
                                Seats
                              </label>
                              <input
                                type="number"
                                min={1}
                                value={seats}
                                onChange={(e) => setSeats(e.target.value)}
                                className="mt-1.5 w-full rounded-full border border-black/[0.1] bg-white px-4 py-2.5 text-[13px] outline-none focus:border-black/25"
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-semibold text-[#888e99] uppercase tracking-wide flex items-center gap-1.5">
                              <Globe size={11} /> Language
                            </label>
                            <select
                              value={language}
                              onChange={(e) => setLanguage(e.target.value)}
                              className="mt-1.5 w-full rounded-full border border-black/[0.1] bg-white px-4 py-2.5 text-[13px] outline-none"
                            >
                              <option>English</option>
                              <option>Dutch</option>
                              <option>Anyone</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-[#888e99] uppercase tracking-wide">
                              Difficulty
                            </label>
                            <select
                              value={difficulty}
                              onChange={(e) => setDifficulty(e.target.value)}
                              className="mt-1.5 w-full rounded-full border border-black/[0.1] bg-white px-4 py-2.5 text-[13px] outline-none"
                            >
                              <option>Easy</option>
                              <option>Standard</option>
                              <option>Hard</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-[#888e99] uppercase tracking-wide flex items-center gap-1.5">
                              <Building2 size={11} /> Company
                            </label>
                            <input
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              className="mt-1.5 w-full rounded-full border border-black/[0.1] bg-white px-4 py-2.5 text-[13px] outline-none focus:border-black/25"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-[#888e99] uppercase tracking-wide">
                              Expires
                            </label>
                            <select
                              value={expiresIn}
                              onChange={(e) => setExpiresIn(e.target.value)}
                              className="mt-1.5 w-full rounded-full border border-black/[0.1] bg-white px-4 py-2.5 text-[13px] outline-none"
                            >
                              <option value="3">3 days</option>
                              <option value="7">7 days</option>
                              <option value="14">14 days</option>
                              <option value="30">30 days</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => goInviteStep("type", -1)}
                            className="flex-1 bg-neutral-100 text-[#1a1a1a] text-[12px] font-semibold rounded-full py-2.5 cursor-pointer hover:bg-neutral-200"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={() => void generateInvite()}
                            disabled={inviteBusy}
                            className={`flex-[1.4] text-[12px] font-semibold rounded-full py-2.5 cursor-pointer disabled:opacity-50 ${
                              inviteMode === "group"
                                ? "bg-[#f97316] text-[#0a0a0a] hover:brightness-95"
                                : "bg-[#1c1e21] text-white hover:bg-black"
                            }`}
                          >
                            {inviteBusy ? "Creating…" : "Generate link"}
                          </button>
                        </div>
                        {inviteApiError && (
                          <p className="text-[11px] text-red-600 mt-2">{inviteApiError}</p>
                        )}
                      </div>
                    )}

                    {inviteFlowStep === "done" && (
                      <div className="flex flex-col gap-4" data-step-item>
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                            <Check size={14} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-emerald-900">
                              {inviteMode === "group" ? "Group link created" : "Personal link created"}
                            </p>
                            <p className="text-[10px] text-emerald-700/80">Added to your invite list</p>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-neutral-50 border border-black/[0.06] p-3.5">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-[10px] font-semibold text-[#888e99] uppercase tracking-wide">
                              Invite link
                            </p>
                            <button
                              type="button"
                              onClick={() => copyText(lastGeneratedUrl)}
                              className="text-[11px] font-semibold text-[#1a1a1a] flex items-center gap-1 cursor-pointer hover:opacity-70"
                            >
                              <Copy size={12} /> Copy
                            </button>
                          </div>
                          <p className="text-[11px] text-[#666c77] break-all leading-relaxed">
                            {lastGeneratedUrl}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              goInviteStep("type", -1);
                              setInviteEmail("");
                              setInvitePlayerName("");
                              setLastGeneratedUrl("");
                            }}
                            className="flex-1 bg-neutral-100 text-[#1a1a1a] text-[12px] font-semibold rounded-full py-2.5 cursor-pointer hover:bg-neutral-200"
                          >
                            Create another
                          </button>
                          <button
                            type="button"
                            onClick={closeInviteFlow}
                            className="flex-[1.4] bg-[#1c1e21] text-white text-[12px] font-semibold rounded-full py-2.5 cursor-pointer hover:bg-black"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                    </StepMorph>
                  </div>
                </div>
              </div>,
              document.body,
              )}
          </>
        )}

        {/* ===================== STATS VIEW ===================== */}
        {showStats && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start mt-2">
            {/* Mission funnel */}
            <div className="lg:col-span-7 bg-white/85 rounded-[26px] p-5 sm:p-6 shadow-xs border border-white/80" data-morph-item>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-800">Mission funnel</h2>
                  <p className="text-[11px] text-[#666c77] mt-0.5">Reach rate from M1 through finale</p>
                </div>
                <span className="text-[11px] font-medium text-[#666c77] bg-neutral-100 rounded-full px-3 py-1">
                  Last 30 days
                </span>
              </div>

              <div className="flex flex-col gap-3.5">
                {missionFunnel.map((m) => (
                  <div key={m.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-bold text-[#1a1a1a] bg-neutral-100 rounded-full px-2 py-0.5 shrink-0">
                          {m.id}
                        </span>
                        <span className="text-[12px] font-medium text-[#1a1a1a] truncate">{m.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 pl-2">
                        <span className="text-[10px] text-[#888e99]">{m.players} players</span>
                        <CountUp
                          value={m.pct}
                          suffix="%"
                          restartKey={`${activeTab}-${m.id}`}
                          className="text-[12px] font-semibold text-[#1a1a1a] w-9 text-right inline-block"
                        />
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        data-morph-bar
                        className="h-full rounded-full bg-[#f97316]"
                        style={{ width: `${m.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
                {totalPlayers === 0 && (
                  <p className="text-[12px] text-[#888e99] text-center py-6">No players yet — funnel fills after register</p>
                )}
              </div>
            </div>

            {/* Side KPIs */}
            <div className="lg:col-span-5 flex flex-col gap-4" data-morph-item>
              <div className="bg-white/85 rounded-[26px] p-5 shadow-xs border border-white/80">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-neutral-800">Difficulty mix</span>
                  <Zap size={14} className="text-neutral-400" />
                </div>
                <div className="flex flex-col gap-2.5">
                  {difficultyMix.map((d) => (
                    <div key={d.label} className="flex items-center gap-3">
                      <span className="text-[11px] font-medium text-[#666c77] w-16 shrink-0">{d.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          data-morph-bar
                          className={`h-full rounded-full ${d.tone}`}
                          style={{ width: `${d.pct}%` }}
                        />
                      </div>
                      <CountUp
                        value={d.pct}
                        suffix="%"
                        restartKey={`${activeTab}-${d.label}`}
                        className="text-[11px] font-semibold text-[#1a1a1a] w-8 text-right inline-block"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#222428] text-white rounded-[26px] p-5 shadow-xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[14px] font-semibold">Invite conversion</span>
                  <Link2 size={14} className="text-white/50" />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-[9px] text-neutral-500 font-semibold uppercase tracking-wide">Sent</p>
                    <CountUp
                      value={inviteTotal}
                      restartKey={activeTab}
                      className="text-[18px] font-light mt-1 tracking-tight block"
                    />
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-[9px] text-neutral-500 font-semibold uppercase tracking-wide">Used</p>
                    <CountUp
                      value={inviteUsed}
                      restartKey={activeTab}
                      className="text-[18px] font-light mt-1 tracking-tight block"
                    />
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-[9px] text-neutral-500 font-semibold uppercase tracking-wide">Playing</p>
                    <CountUp
                      value={totalPlayers}
                      restartKey={activeTab}
                      className="text-[18px] font-light mt-1 tracking-tight text-[#f97316] block"
                    />
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    data-morph-bar
                    className="h-full rounded-full bg-[#f97316]"
                    style={{ width: `${inviteConversionPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-neutral-400 mt-2">
                  <CountUp value={inviteConversionPct} suffix="%" restartKey={activeTab} /> of invites reach a registered player
                </p>
              </div>
            </div>

            {/* Weekly play time */}
            <div
              className="lg:col-span-5 bg-white/85 rounded-[26px] p-5 shadow-xs border border-white/80 flex flex-col justify-between min-h-[240px]"
              data-morph-item
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-800">Play time</h2>
                  <p className="text-[11px] text-[#666c77] mt-0.5">Hours across the week</p>
                </div>
                <button
                  type="button"
                  onClick={() => flash("Stats export queued (UI only)")}
                  className="w-7 h-7 rounded-full border border-neutral-200/90 flex items-center justify-center text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <ArrowUpRight size={12} strokeWidth={2} />
                </button>
              </div>

              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-light tracking-tight text-neutral-900">
                  <CountUp value={0} decimals={1} suffix=" h" restartKey={activeTab} />
                </span>
                <span className="text-[11px] text-[#888e99]">no play-time telemetry yet</span>
              </div>

              <div className="grid grid-cols-7 gap-2 items-end pt-4 relative flex-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((label, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 relative">
                    <div className="w-full max-w-[28px] rounded-xl h-7 bg-neutral-100" />
                    <span className="text-[10px] text-[#888e99]">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Company breakdown */}
            <div className="lg:col-span-4 bg-white/85 rounded-[26px] p-5 shadow-xs border border-white/80" data-morph-item>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-800">By company</h2>
                  <p className="text-[11px] text-[#666c77] mt-0.5">Completion share</p>
                </div>
                <Building2 size={14} className="text-neutral-400" />
              </div>
              <div className="flex flex-col gap-2">
                {companyBreakdown.length === 0 && (
                  <p className="text-[12px] text-[#888e99] text-center py-8">No company data yet</p>
                )}
                {companyBreakdown.map((c) => (
                  <div
                    key={c.name}
                    className="rounded-2xl border border-black/[0.06] bg-white/70 px-3.5 py-3"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] font-semibold text-[#1a1a1a]">{c.name}</span>
                      <CountUp
                        value={c.pct}
                        suffix="%"
                        restartKey={`${activeTab}-${c.name}`}
                        className="text-[11px] font-semibold text-[#1a1a1a]"
                      />
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden mb-1">
                      <div data-morph-bar className="h-full rounded-full bg-[#f97316]" style={{ width: `${c.pct}%` }} />
                    </div>
                    <p className="text-[10px] text-[#888e99]">
                      {c.cleared} near end · {c.total} players
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Drop-off callout */}
            <div
              className="lg:col-span-3 bg-white/85 rounded-[26px] p-5 shadow-xs border border-white/80 flex flex-col justify-between min-h-[240px]"
              data-morph-item
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-neutral-800">Biggest drop</span>
                  <Activity size={14} className="text-neutral-400" />
                </div>
                <p className="text-[28px] font-light tracking-tight text-[#1a1a1a] leading-none">
                  {biggestDrop.from} → {biggestDrop.to}
                </p>
                <p className="text-[12px] text-[#666c77] mt-2 leading-relaxed">
                  {totalPlayers === 0
                    ? "Drop-off appears once players start progressing through missions."
                    : `${biggestDrop.delta} player${biggestDrop.delta === 1 ? "" : "s"} leave between these missions.`}
                </p>
              </div>
              <div className="rounded-2xl bg-neutral-50 border border-black/[0.05] px-3.5 py-3 mt-3">
                <p className="text-[10px] text-[#888e99] font-semibold uppercase tracking-wide">Delta</p>
                <p className="text-[20px] font-light text-[#1a1a1a] mt-0.5 tracking-tight">
                  −<CountUp value={biggestDrop.delta} restartKey={activeTab} /> pts
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===================== MAIN DASHBOARD GRID ===================== */}
        {showMainGrid && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-start mt-2">
          {/* LEFT: Featured player snapshot */}
          <div className="lg:col-span-3 flex flex-col gap-4" data-morph-item>
            <div className="rounded-[28px] overflow-hidden relative h-[218px] shadow-xs border border-white/80 bg-[#1c1028]">
              <img
                src="./assets/founder-avatar.png?v=2"
                alt="Selected player"
                className="w-full h-full object-cover object-[center_12%]"
              />
              <div
                className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to top, rgba(28, 16, 40, 0.95) 0%, rgba(28, 16, 40, 0.65) 45%, rgba(28, 16, 40, 0.25) 70%, transparent 100%)",
                }}
              />
              <div className="absolute top-3.5 left-3.5 z-10 bg-[#f97316] text-[#0a0a0a] text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                {viewAccount.mission} · {viewAccount.difficulty}
              </div>
              <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between z-10">
                <div>
                  <h3 className="text-white font-medium text-[15px] leading-tight drop-shadow-xs flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f97316] shadow-[0_0_0_3px_rgba(249,115,22,0.35)]" />
                    {viewAccount.name}
                  </h3>
                  <p className="text-white/80 text-[11px] font-normal mt-0.5">
                    {viewAccount.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-[26px] p-5 shadow-xs border border-white/80 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-neutral-800 truncate">{viewAccount.name}</span>
                <span
                  className={`text-[10px] font-semibold shrink-0 ${
                    viewAccount.online ? "text-[#f97316]" : "text-[#888e99]"
                  }`}
                >
                  {viewAccount.online ? "Live session" : "Offline"}
                </span>
              </div>
              <div className="rounded-2xl bg-neutral-50 border border-black/[0.05] px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <Laptop size={13} className="text-neutral-400 shrink-0" />
                  <p className="text-[12px] font-semibold text-[#1a1a1a] truncate">
                    {viewAccount.session === "—" ? "No active device" : viewAccount.session}
                  </p>
                </div>
                <p className="text-[10px] text-[#888e99] mt-1 pl-[21px]">
                  {viewAccount.lastActive}
                  {viewAccount.company ? ` · ${viewAccount.company}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAccountId(viewAccount.id);
                  goToTab("Accounts");
                }}
                className="w-full bg-[#1c1e21] text-white text-[12px] font-semibold rounded-full py-2.5 cursor-pointer hover:bg-black"
              >
                Manage session
              </button>
            </div>
          </div>

          {/* MIDDLE */}
          <div className="lg:col-span-6 flex flex-col gap-4" data-morph-item>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Play-time progress */}
              <div className="bg-white/85 rounded-[26px] p-5 shadow-xs border border-white/80 flex flex-col justify-between h-[218px]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-800">Progress</span>
                  <button className="w-6 h-6 rounded-full border border-neutral-200/90 flex items-center justify-center text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer">
                    <ArrowUpRight size={12} strokeWidth={2} />
                  </button>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-light tracking-tight text-neutral-900">
                    <CountUp value={progressAvgPct} suffix="%" restartKey={activeTab} />
                  </span>
                  <div className="text-[10px] leading-tight text-[#888e99] font-normal">
                    <p>Avg mission</p>
                    <p>progress</p>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 items-end pt-3 relative">
                  {MISSION_META.map((m, i) => {
                    const reached = missionFunnel[i]?.pct ?? 0;
                    const h =
                      reached >= 80
                        ? "h-14"
                        : reached >= 60
                          ? "h-11"
                          : reached >= 40
                            ? "h-9"
                            : reached >= 20
                              ? "h-7"
                              : "h-5";
                    return (
                      <div key={m.id} className="flex flex-col items-center gap-1.5 relative">
                        <div className="absolute inset-y-0 w-px border-l border-dashed border-black/[0.08] pointer-events-none -z-0" />
                        <div
                          className={`w-1.5 ${h} rounded-full z-10 ${
                            reached > 0 ? "bg-[#1c1e21]" : "bg-neutral-200"
                          }`}
                        />
                        <div
                          className={`w-1.5 h-1.5 rounded-full z-10 ${
                            reached > 0 ? "bg-[#1c1e21]" : "bg-neutral-300"
                          }`}
                        />
                        <span className="text-[10px] text-neutral-400 font-normal">{m.id.toUpperCase()}</span>
                      </div>
                    );
                  })}
                  {MISSION_META.length < 7 &&
                    Array.from({ length: 7 - MISSION_META.length }).map((_, i) => (
                      <div key={`pad-${i}`} className="flex flex-col items-center gap-1.5 relative opacity-0" aria-hidden>
                        <div className="w-1.5 h-5 rounded-full bg-neutral-200" />
                        <span className="text-[10px]">·</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Online live gauge (same visual as time tracker) */}
              <div className="bg-white/85 rounded-[26px] p-5 shadow-xs border border-white/80 flex flex-col justify-between h-[218px]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-800">Live session</span>
                  <button className="w-6 h-6 rounded-full border border-neutral-200/90 flex items-center justify-center text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer">
                    <ArrowUpRight size={12} strokeWidth={2} />
                  </button>
                </div>

                <div className="flex items-center justify-center my-0.5 relative">
                  <div className="relative w-[7.5rem] h-[7.5rem] flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {ticks.map((deg, i) => {
                        const rad = (deg * Math.PI) / 180;
                        const x1 = 50 + 44 * Math.cos(rad);
                        const y1 = 50 + 44 * Math.sin(rad);
                        const x2 = 50 + 39 * Math.cos(rad);
                        const y2 = 50 + 39 * Math.sin(rad);
                        return (
                          <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#cbd5e1"
                            strokeWidth="1.2"
                          />
                        );
                      })}
                      <circle
                        cx="50"
                        cy="50"
                        r="37"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="8.5"
                        strokeDasharray="232.5"
                        strokeDashoffset={232.5 * (1 - Math.min(1, Math.max(0, progressAvgPct / 100)))}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-[22%] flex flex-col items-center justify-center text-center overflow-hidden">
                      <span className="text-[18px] font-medium tracking-tight tabular-nums text-[#1a1a1a] leading-none whitespace-nowrap">
                        {formatTime(seconds)}
                      </span>
                      <span className="text-[9px] text-[#717680] font-normal mt-1 leading-none">
                        Uptime
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="border border-black/[0.1] bg-white rounded-full px-3.5 py-1.5 flex items-center gap-3 shadow-xs">
                    <button
                      onClick={() => setTimerRunning(true)}
                      className={`cursor-pointer transition-colors ${
                        timerRunning ? "text-neutral-400" : "text-[#1c1e21]"
                      }`}
                    >
                      <Play size={11} fill={timerRunning ? "none" : "currentColor"} />
                    </button>
                    <button
                      onClick={() => setTimerRunning(false)}
                      className={`cursor-pointer transition-colors ${
                        timerRunning ? "text-[#1c1e21]" : "text-neutral-400"
                      }`}
                    >
                      <Pause size={11} fill={timerRunning ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <button
                    onClick={() => flash("Refreshed live feed (UI only)")}
                    className="w-8 h-8 rounded-full bg-[#1d1f22] text-white flex items-center justify-center shadow-xs hover:bg-black transition-colors cursor-pointer"
                  >
                    <Timer size={13} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </div>

            {/* Invite batches calendar */}
            <div className="bg-white/80 backdrop-blur-sm rounded-[26px] p-4 sm:p-5 shadow-xs border border-white/80 flex flex-col justify-between min-h-[240px] sm:h-[230px] overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <button className="border border-neutral-300/80 rounded-full px-3 sm:px-3.5 py-1 text-[11px] font-medium text-neutral-700 bg-white/50 hover:bg-white/80 transition-colors shadow-xs cursor-pointer">
                  August
                </button>
                <span className="text-xs font-semibold text-neutral-800">
                  September 2026 · Invite batches
                </span>
                <button className="border border-neutral-300/80 rounded-full px-3 sm:px-3.5 py-1 text-[11px] font-medium text-neutral-700 bg-white/50 hover:bg-white/80 transition-colors shadow-xs cursor-pointer">
                  October
                </button>
              </div>

              <div className="w-full overflow-x-auto scrollbar-none">
                <div className="min-w-[320px] flex-1 relative flex flex-col justify-between pt-1">
                  <div className="grid grid-cols-6 text-center pl-8 sm:pl-12 pr-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
                      <div key={d}>
                        <span className="text-[10px] text-neutral-400 block">{d}</span>
                        <span className="text-xs font-medium text-neutral-800">{22 + i}</span>
                      </div>
                    ))}
                  </div>

                  <div className="relative flex-1 mt-1 flex flex-col justify-between py-1 min-h-[110px]">
                    <div className="absolute inset-0 pl-8 sm:pl-12 pr-2 grid grid-cols-6 pointer-events-none">
                      <div className="border-r border-dotted border-neutral-300/60" />
                      <div className="border-r border-dotted border-neutral-300/60" />
                      <div className="border-r border-dotted border-neutral-300/60" />
                      <div className="border-r border-dotted border-neutral-300/60" />
                      <div className="border-r border-dotted border-neutral-300/60" />
                      <div />
                    </div>

                    <div className="flex items-center text-[10px] text-neutral-400 h-6 pl-0.5">8:00 am</div>
                    <div className="flex items-center text-[10px] text-neutral-400 h-6 pl-0.5">9:00 am</div>
                    <div className="flex items-center text-[10px] text-neutral-400 h-6 pl-0.5">10:00 am</div>
                    <div className="flex items-center text-[10px] text-neutral-400 h-6 pl-0.5">11:00 am</div>

                    {calendarInvites.length === 0 ? (
                      <div className="absolute inset-x-8 sm:inset-x-12 top-1/2 -translate-y-1/2 text-center z-10">
                        <p className="text-[11px] text-neutral-500">No invite batches yet</p>
                      </div>
                    ) : (
                      calendarInvites.map((inv, idx) => (
                        <div
                          key={inv.id}
                          className={`absolute z-10 flex items-center justify-between gap-1.5 sm:gap-2.5 rounded-xl sm:rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-md border ${
                            idx === 0
                              ? "top-1 left-[24%] right-[38%] sm:right-[42%] bg-[#1e2023] text-white border-neutral-700/50"
                              : "top-[48%] left-[54%] sm:left-[58%] right-[4%] sm:right-[8%] bg-white text-neutral-900 border-neutral-200/90 shadow-sm"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-[10px] sm:text-[11px] font-semibold leading-tight truncate ${
                                idx === 0 ? "text-white" : "text-neutral-900"
                              }`}
                            >
                              {inv.type === "group" ? `Group — ${inv.label}` : inv.label}
                            </p>
                            <p
                              className={`text-[8.5px] sm:text-[9px] leading-tight mt-0.5 truncate ${
                                idx === 0 ? "text-neutral-400" : "text-neutral-500"
                              }`}
                            >
                              {[inv.company || null, inv.difficulty, inv.status].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Mission avg + online players */}
          <div className="lg:col-span-3 flex flex-col gap-4" data-morph-item>
            <div className="bg-white/80 rounded-[26px] p-5 shadow-xs border border-white/80 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-[#1a1a1a]">Missions</span>
                <CountUp
                  value={m1m2ClearPct}
                  suffix="%"
                  restartKey={activeTab}
                  className="text-[26px] font-light text-[#1a1a1a] tracking-tight"
                />
              </div>

              <div className="mt-2.5">
                <div className="flex items-center gap-1.5 text-[10px] font-normal text-[#666] mb-1.5">
                  <span className="flex-1 text-center">M1–M2</span>
                  <span className="w-14 text-center">M3</span>
                  <span className="w-7 text-center">M4+</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="bg-[#f97316] rounded-xl h-7 px-3 flex-1 flex items-center justify-center shadow-xs">
                    <span className="text-[11px] font-semibold text-[#0a0a0a]">Clear</span>
                  </div>
                  <div className="bg-[#1d1f22] rounded-xl h-7 w-14 shadow-xs flex items-center justify-center">
                    <span className="text-[9px] font-medium text-white/80">Live</span>
                  </div>
                  <div className="bg-[#d2d5dc] border border-black/[0.08] rounded-xl h-7 w-7" />
                </div>
              </div>
            </div>

            <div className="relative pt-2.5">
              <div className="absolute top-0 inset-x-5 h-5 bg-[#42464e] rounded-t-[20px] -z-0 opacity-90" />
              <div className="relative z-10 bg-[#222428] text-white rounded-[28px] p-5 shadow-xl border border-white/5 flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-white">Online players</span>
                  <span className="text-[22px] font-light text-neutral-200 tracking-tight">
                    {onlinePlayersCount}/{Math.max(totalPlayers, 1)}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {players.length === 0 && (
                    <p className="text-[11px] text-neutral-500 py-4 text-center">No players yet</p>
                  )}
                  {players.map((player) => {
                    const IconComponent = player.icon;
                    return (
                      <div
                        key={player.id}
                        onClick={() => togglePlayer(player.id)}
                        className="flex items-center justify-between py-1 px-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-300 group-hover:text-white transition-colors shrink-0">
                            <IconComponent size={14} strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white leading-tight">{player.title}</p>
                            <p className="text-[10px] text-neutral-400 leading-tight mt-0.5">{player.time}</p>
                          </div>
                        </div>
                        <div>
                          {player.completed ? (
                            <div className="w-4.5 h-4.5 rounded-full bg-[#f97316] flex items-center justify-center shadow-xs">
                              <Check size={10} strokeWidth={3} className="text-[#0a0a0a]" />
                            </div>
                          ) : (
                            <div className="w-4.5 h-4.5 rounded-full border border-[#383d46] bg-transparent group-hover:border-neutral-400 transition-colors" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
        </PageMorph>
      </div>

      {settingsOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <button
              type="button"
              className="absolute inset-0 bg-[#1c1e21]/45 backdrop-blur-[2px] cursor-pointer"
              aria-label="Close settings"
              onClick={() => setSettingsOpen(false)}
            />
            <div className="relative w-full sm:max-w-[420px] bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-white/80 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[15px] font-semibold text-[#1a1a1a]">Settings</h3>
                  <p className="text-[11px] text-[#666c77] mt-0.5">
                    Org-wide email when a player registers via invite
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center cursor-pointer"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>
              {settingsError && (
                <p className="text-[12px] text-red-600 mb-3">{settingsError}</p>
              )}
              <label className="text-[10px] font-semibold text-[#888e99] uppercase tracking-wide">
                Notify email
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder="admin@your-org.com"
                  className="mt-1.5 w-full rounded-full border border-black/[0.1] bg-white px-4 py-2.5 text-[13px] outline-none focus:border-black/25 normal-case tracking-normal font-normal text-[#1a1a1a]"
                />
              </label>
              <p className="text-[11px] text-[#888e99] mt-2 mb-4">
                Leave blank to disable. SMTP must be configured on the game server.
              </p>
              <button
                type="button"
                disabled={settingsBusy}
                onClick={() => void saveSettings()}
                className="w-full bg-[#1c1e21] text-white text-[13px] font-semibold rounded-full py-2.5 cursor-pointer hover:bg-black disabled:opacity-50"
              >
                {settingsBusy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
