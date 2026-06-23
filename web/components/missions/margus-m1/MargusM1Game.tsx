"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioToggle } from "@/components/audio/AudioToggle";
import { useM1MissionAudio } from "@/lib/audio/useM1MissionAudio";
import {
  hydrateMargusM1Play,
  serializeMargusM1Play,
  type MargusM1PlaySnapshot,
} from "@/lib/game/margus-m1/session";
import { useGameSessionPersist } from "@/lib/game/sessionPersist";
import { createPortal } from "react-dom";
import { Bar } from "react-chartjs-2";
import {
  BudgetAllocChart,
  CapexChart,
  DiskChart,
  H1Chart,
  HCCostChart,
  HeadcountPolarChart,
  NetworkChart,
  PptBudgetChart,
  PptHeadcountChart,
  PptRevenueChart,
  SeptScatterChart,
  ServerLoadChart,
} from "./MargusM1Charts";
import {
  DECOY_DETECTION_MSGS,
  DECOY_MSGS,
  DESKTOP_ICONS,
  DET_INFO,
  FOLDERS,
  HACK_LINES,
  LEAD_ORDER,
  LEADS,
  STICKIES,
  WRONG_CLICK_DETECTION_MSGS,
  WRONG_VERIFY_MSGS,
  fileIconClass,
  pick,
  wrongDataPointMsg,
  type FolderKey,
  type LeadId,
} from "./gameData";
import "./styles.css";

type Sender = "VOSS" | "ZEX";
interface ChatMsg { id: number; sender: Sender; cls: string; html: string; ts: string }
interface Toast { id: number; text: string }
type LeadVisual = "n-dimmed" | "n-start" | "n-idle" | "n-mission" | "n-active" | "n-next" | "n-locked";

const PASSIVE_RATE = 100 / 1500;
const now2 = () => { const n = new Date(); return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`; };
// Taskbar clock — live 12-hour "5:40 PM" format (ports tickClock from the HTML).
const clock12 = () => { const n = new Date(); const h = n.getHours() % 12 || 12; return `${h}:${String(n.getMinutes()).padStart(2, "0")} ${n.getHours() >= 12 ? "PM" : "AM"}`; };

// Default window positions (top,left,width[,height]) ported from the HTML.
type WinRect = { top: number; left: number; width: number; height?: number };
const WIN_POS: Record<string, WinRect> = {
  "win-it": { top: 58, left: 88, width: 420 },
  "win-finance": { top: 75, left: 105, width: 420 },
  "win-hr": { top: 68, left: 96, width: 420 },
  "win-misc": { top: 72, left: 110, width: 420 },
  "win-server": { top: 44, left: 86, width: 560 },
  "win-budget": { top: 54, left: 98, width: 545 },
  "win-personnel": { top: 50, left: 94, width: 548 },
  "win-finance-ppt": { top: 30, left: 30, width: 780, height: 540 },
  "win-headcount": { top: 66, left: 108, width: 500 },
  "win-hr-auth": { top: 76, left: 110, width: 530 },
  "win-finance-audit": { top: 82, left: 120, width: 520 },
  "win-personal-notes": { top: 120, left: 160, width: 480 },
  "win-sys-metrics": { top: 60, left: 100, width: 560 },
  "win-opex": { top: 64, left: 104, width: 560 },
  "win-absence": { top: 70, left: 112, width: 540 },
};

// Per-window resize minimums (board report largest; chart/table windows mid; folders smallest default).
const WIN_MIN_DEFAULT = { w: 280, h: 180 };
const WIN_MIN: Record<string, { w: number; h: number }> = {
  "win-finance-ppt": { w: 740, h: 520 },
  "win-server": { w: 520, h: 400 },
  "win-budget": { w: 520, h: 400 },
  "win-personnel": { w: 520, h: 400 },
  "win-headcount": { w: 520, h: 400 },
  "win-hr-auth": { w: 520, h: 400 },
  "win-finance-audit": { w: 520, h: 400 },
  "win-sys-metrics": { w: 520, h: 400 },
  "win-opex": { w: 520, h: 400 },
  "win-absence": { w: 520, h: 400 },
};
const RESIZE_DIRS = ["n", "ne", "e", "se", "s", "sw", "w", "nw"] as const;
type ResizeDir = (typeof RESIZE_DIRS)[number];
const TASKBAR_H = 30;

export function MargusM1Game({
  onComplete,
  savedState,
}: {
  onComplete: (stats: GameStats) => void;
  savedState?: Record<string, unknown> | null;
}) {
  const playSaved = useMemo(() => hydrateMargusM1Play(savedState), [savedState]);
  // ── visible state ──
  const [det, setDet] = useState(playSaved?.det ?? 0);
  const [timerSec, setTimerSec] = useState(playSaved?.timerSec ?? 0);
  const [hackActive, setHackActive] = useState(playSaved?.hackActive ?? true);
  const [revealed, setRevealed] = useState(playSaved?.revealed ?? false);
  const [hackShown, setHackShown] = useState<Record<string, boolean>>(playSaved?.hackShown ?? {});
  const [activeLead, setActiveLead] = useState<LeadId | null>(playSaved?.activeLead ?? null);
  const [locked, setLocked] = useState<LeadId[]>(playSaved?.locked ?? []);
  const [currentStep, setCurrentStep] = useState(playSaved?.currentStep ?? 0);
  const [leadVisual, setLeadVisual] = useState<Record<LeadId, LeadVisual>>(
    (playSaved?.leadVisual as Record<LeadId, LeadVisual> | undefined) ?? {
      compute: "n-dimmed",
      funding: "n-dimmed",
      personnel: "n-dimmed",
    }
  );
  const [leadStatusTxt, setLeadStatusTxt] = useState<Record<LeadId, string>>(
    (playSaved?.leadStatusTxt as Record<LeadId, string> | undefined) ?? {
      compute: "LOCKED",
      funding: "LOCKED",
      personnel: "LOCKED",
    }
  );
  const [stepBanner, setStepBanner] = useState(playSaved?.stepBanner ?? "Select a lead on the board to begin investigation");
  const [ebStep, setEbStep] = useState(playSaved?.ebStep ?? "");
  const [ebHint, setEbHint] = useState(playSaved?.ebHint ?? "");
  const [openWins, setOpenWins] = useState<string[]>(playSaved?.openWins ?? []);
  const [zOrder, setZOrder] = useState<string[]>(playSaved?.zOrder ?? []);
  const [pos, setPos] = useState(playSaved?.pos ?? WIN_POS);
  const [activeTab, setActiveTab] = useState<Record<string, number>>(
    playSaved?.activeTab ?? {
      "win-server": 0,
      "win-budget": 0,
      "win-personnel": 0,
      "win-sys-metrics": 0,
      "win-opex": 0,
      "win-absence": 0,
    }
  );
  const [anomaly, setAnomaly] = useState<Record<string, boolean>>(playSaved?.anomaly ?? {});
  const [messages, setMessages] = useState<ChatMsg[]>((playSaved?.messages as ChatMsg[] | undefined) ?? []);
  const [typing, setTyping] = useState<Sender | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [verifyLead, setVerifyLead] = useState<LeadId | null>(playSaved?.verifyLead ?? null);
  const [verifyOpen, setVerifyOpen] = useState(playSaved?.verifyOpen ?? false);
  const [chipIdx, setChipIdx] = useState<(number | null)[]>(playSaved?.chipIdx ?? []);
  const [chipState, setChipState] = useState<Record<string, "sel" | "correct" | "wrong">>(playSaved?.chipState ?? {});
  const [paramErr, setParamErr] = useState<Record<number, string>>(playSaved?.paramErr ?? {});
  const [hintCd, setHintCd] = useState(playSaved?.hintCd ?? 0);
  const [pptSlide, setPptSlide] = useState(playSaved?.pptSlide ?? 0);
  const [pptZoomLvl, setPptZoomLvl] = useState(playSaved?.pptZoomLvl ?? 100);
  const [synthOn, setSynthOn] = useState(playSaved?.synthOn ?? false);
  const [synthDone, setSynthDone] = useState(playSaved?.synthDone ?? false);
  const [breachOn, setBreachOn] = useState(playSaved?.breachOn ?? false);
  const [breachAlert, setBreachAlert] = useState(playSaved?.breachAlert ?? "CONNECTION COMPROMISED");
  const [breachGlitch, setBreachGlitch] = useState(playSaved?.breachGlitch ?? "");
  const [breachRecon, setBreachRecon] = useState(playSaved?.breachRecon ?? "");
  const [gameOver, setGameOver] = useState(playSaved?.gameOver ?? false);
  const [glitching, setGlitching] = useState(playSaved?.glitching ?? false);
  const [dialog, setDialog] = useState<string | null>(playSaved?.dialog ?? null);
  const [synthBtnReady, setSynthBtnReady] = useState(playSaved?.synthBtnReady ?? false);
  const [synthBtnEnabled, setSynthBtnEnabled] = useState(playSaved?.synthBtnEnabled ?? false);

  // ── refs (logic bookkeeping) ──
  const gs = useRef({
    decoyDetection: 0, clickDetection: 0, verifyDetection: 0, hintDetection: 0, passiveDetection: 0,
    errors: 0, hintsUsed: 0, reconnected: false, hackDone: false,
    warned: { 30: false, 60: false, 80: false } as Record<number, boolean>,
    foldersOpened: new Set<string>(), personalNotesSeen: false, sysMetricsSeen: false,
    msgId: 0, toastId: 0, zTop: 100, gameOver: false, synthStarted: false,
  });
  const queueRef = useRef<{ sender: Sender; cls: string; html: string }[]>([]);
  const processingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ id: string; dir: ResizeDir; startX: number; startY: number; startL: number; startT: number; startW: number; startH: number } | null>(null);
  const restoreRects = useRef<Record<string, WinRect>>({});
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [maximized, setMaximized] = useState<string[]>(playSaved?.maximized ?? []);
  const synthSvgRef = useRef<SVGSVGElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!playSaved?.gs) return;
    const g = playSaved.gs;
    Object.assign(gs.current, {
      ...g,
      foldersOpened: new Set(g.foldersOpened),
      warned: { ...g.warned },
    });
  }, [playSaved]);

  const sessionSnapshot = useMemo(
    (): MargusM1PlaySnapshot => ({
      det,
      timerSec,
      hackActive,
      revealed,
      hackShown,
      activeLead,
      locked,
      currentStep,
      leadVisual,
      leadStatusTxt,
      stepBanner,
      ebStep,
      ebHint,
      openWins,
      zOrder,
      pos,
      activeTab,
      anomaly,
      messages,
      verifyLead,
      verifyOpen,
      chipIdx,
      chipState,
      paramErr,
      hintCd,
      pptSlide,
      pptZoomLvl,
      synthOn,
      synthDone,
      breachOn,
      breachAlert,
      breachGlitch,
      breachRecon,
      gameOver,
      glitching,
      dialog,
      synthBtnReady,
      synthBtnEnabled,
      maximized,
      gs: {
        decoyDetection: gs.current.decoyDetection,
        clickDetection: gs.current.clickDetection,
        verifyDetection: gs.current.verifyDetection,
        hintDetection: gs.current.hintDetection,
        passiveDetection: gs.current.passiveDetection,
        errors: gs.current.errors,
        hintsUsed: gs.current.hintsUsed,
        reconnected: gs.current.reconnected,
        hackDone: gs.current.hackDone,
        warned: { ...gs.current.warned },
        foldersOpened: [...gs.current.foldersOpened],
        personalNotesSeen: gs.current.personalNotesSeen,
        sysMetricsSeen: gs.current.sysMetricsSeen,
        msgId: gs.current.msgId,
        toastId: gs.current.toastId,
        zTop: gs.current.zTop,
        gameOver: gs.current.gameOver,
        synthStarted: gs.current.synthStarted,
      },
    }),
    [
      det,
      timerSec,
      hackActive,
      revealed,
      hackShown,
      activeLead,
      locked,
      currentStep,
      leadVisual,
      leadStatusTxt,
      stepBanner,
      ebStep,
      ebHint,
      openWins,
      zOrder,
      pos,
      activeTab,
      anomaly,
      messages,
      verifyLead,
      verifyOpen,
      chipIdx,
      chipState,
      paramErr,
      hintCd,
      pptSlide,
      pptZoomLvl,
      synthOn,
      synthDone,
      breachOn,
      breachAlert,
      breachGlitch,
      breachRecon,
      gameOver,
      glitching,
      dialog,
      synthBtnReady,
      synthBtnEnabled,
      maximized,
    ]
  );

  useGameSessionPersist({
    missionId: "m1",
    state: sessionSnapshot,
    serialize: serializeMargusM1Play,
    enabled: revealed && !synthDone && !gameOver,
  });

  // ─── AUDIO ─── (mirrors m3/m4: state-diff cue hook)
  const audioState = useMemo(
    () => ({
      detection: det,
      lockedCount: locked.length,
      errorCount: gs.current.errors,
      gameOver,
      active: revealed,
      success: synthOn,
    }),
    [det, locked.length, gameOver, revealed, synthOn]
  );
  useM1MissionAudio(audioState);

  // ─── CHAT QUEUE ───
  const processQueue = useCallback(() => {
    if (processingRef.current) return;
    const next = queueRef.current.shift();
    if (!next) return;
    processingRef.current = true;
    setTyping(next.sender);
    const delay = next.sender === "ZEX" ? 575 : 700;
    setTimeout(() => {
      setTyping(null);
      setMessages((m) => [...m, { id: gs.current.msgId++, sender: next.sender, cls: next.cls, html: next.html, ts: now2() }]);
      processingRef.current = false;
      setTimeout(processQueue, 60);
    }, delay);
  }, []);
  const say = useCallback((html: string, cls = "bm-d", sender: Sender = "VOSS") => {
    queueRef.current.push({ sender, cls, html: html.split("\n").join("<br>") });
    processQueue();
  }, [processQueue]);
  const voss = useCallback((m: string, cls = "bm-d") => say(m, cls, "VOSS"), [say]);
  const zex = useCallback((m: string) => say(m, "bm-h", "ZEX"), [say]);

  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [messages, typing]);

  // ─── DETECTION ───
  const showToast = useCallback((amount: number) => {
    const id = gs.current.toastId++;
    setToasts((t) => [...t, { id, text: "+" + amount.toFixed(0) + "% DETECTED" }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 1300);
  }, []);
  const addDet = useCallback((amount: number, type: "decoy" | "click" | "verify" | "hint" | "passive") => {
    if (gs.current.gameOver) return;
    if (type === "decoy") gs.current.decoyDetection += amount;
    else if (type === "click") gs.current.clickDetection += amount;
    else if (type === "verify") gs.current.verifyDetection += amount;
    else if (type === "hint") gs.current.hintDetection += amount;
    else if (type === "passive") gs.current.passiveDetection += amount;
    if (type !== "passive") showToast(amount);
    setDet((d) => Math.min(100, d + amount));
  }, [showToast]);

  // ─── TIMER ───
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimerSec((s) => s + 1);
      addDet(parseFloat(PASSIVE_RATE.toFixed(4)), "passive");
    }, 1000);
  }, [addDet]);

  // ─── HACK SEQUENCE + REVEAL (run once) ───
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const delays = [300, 620, 960, 1280, 1600, 1930, 2260];
    HACK_LINES.forEach((l, i) => timers.push(setTimeout(() => setHackShown((s) => ({ ...s, [l.id]: true })), delays[i])));
    timers.push(setTimeout(() => {
      setHackActive(false);
      gs.current.hackDone = true;
      setRevealed(true);
      startTimer();
      timers.push(setTimeout(() => voss(
        "We're in. Marshall's desktop, live mirror. He has no idea.\nThree leads on the board. Start with COMPUTE.",
      ), 700));
      timers.push(setTimeout(() => zex("I'll be on the channel. Not committing to anything until I see real evidence."), 2600));
      timers.push(setTimeout(() => {
        setLeadVisual((v) => ({ ...v, compute: "n-start" }));
        setLeadStatusTxt((t) => ({ ...t, compute: "START HERE →" }));
      }, 2000));
      setEbStep("LEAD 1 OF 3");
    }, 3350 + 720));
    return () => { timers.forEach(clearTimeout); if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── DETECTION THRESHOLDS + MAX ───
  useEffect(() => {
    if (gs.current.gameOver) return;
    if (det >= 100) { triggerMaxDetection(); return; }
    if (det >= 80 && !gs.current.warned[80]) { gs.current.warned[80] = true; setTimeout(() => voss("80%, they're almost on us. MegaCorp's sweep is closing in on this connection. One more slip and it's over.", "bm-err"), 800); }
    else if (det >= 60 && !gs.current.warned[60]) { gs.current.warned[60] = true; setTimeout(() => voss("Detection is past 60%. Their automated systems are picking up patterns in the feed. Stay precise, we can't afford noise at this level.", "bm-err"), 800); }
    else if (det >= 30 && !gs.current.warned[30]) { gs.current.warned[30] = true; setTimeout(() => voss("We're at 30% detection. MegaCorp's security is starting to notice something. Keep it clean from here.", "bm-err"), 800); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [det]);

  const triggerMaxDetection = useCallback(() => {
    if (gs.current.reconnected) {
      gs.current.gameOver = true;
      if (timerRef.current) clearInterval(timerRef.current);
      setGameOver(true);
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setGlitching(true); setBreachOn(true);
    const lines = [
      "ERR_SEC :: sweep_id=0x4F2A, anomalous packet signature detected",
      "ERR_NET :: mirror_relay layer 2, authentication mismatch",
      "ALERT   :: MegaCorp Security Operations, initiating trace protocol",
      "ERR_SYS :: proxy chain compromised, connection integrity CRITICAL",
    ];
    let acc = "";
    lines.forEach((ln, i) => setTimeout(() => { acc += (i > 0 ? "\n" : "") + ln; setBreachGlitch(acc); }, 200 + i * 500));
    setTimeout(() => setBreachRecon("[ VOSS ] THEY ARE ONTO US. SCRAMBLING NOW. HOLD ON."), 2800);
    setTimeout(() => setBreachRecon("[ VOSS ] re-routing through backup proxy... re-routing... re-routing..."), 4200);
    setTimeout(() => { setBreachRecon("[ VOSS ] CONNECTION RE-ESTABLISHED. We got lucky. Do not make me do that again."); setBreachAlert("FEED RESTORED"); }, 6000);
    setTimeout(() => {
      setGlitching(false); setBreachOn(false);
      setDet(0); gs.current.reconnected = true;
      gs.current.warned = { 30: false, 60: false, 80: false };
      setBreachAlert("CONNECTION COMPROMISED"); setBreachGlitch(""); setBreachRecon("");
      startTimer();
      setTimeout(() => voss("We are back in. That was pure luck and it will not happen again. If detection hits 100% a second time the connection is gone for good. Move carefully.", "bm-err"), 400);
    }, 7800);
  }, [startTimer, voss]);

  // ─── WINDOW MANAGEMENT ───
  const bringFront = useCallback((id: string) => { gs.current.zTop += 1; setZOrder((z) => [...z.filter((x) => x !== id), id]); }, []);
  const zIndexOf = (id: string) => 110 + Math.max(0, zOrder.indexOf(id));
  const openWin = useCallback((id: string) => {
    setOpenWins((w) => (w.includes(id) ? w : [...w, id]));
    bringFront(id);
    const folderMap: Record<string, LeadId> = { "win-it": "compute", "win-finance": "funding", "win-hr": "personnel" };
    if (folderMap[id] && !gs.current.foldersOpened.has(id)) {
      gs.current.foldersOpened.add(id);
      const lead = LEADS[folderMap[id]];
      if (activeLead === folderMap[id]) setTimeout(() => voss(lead.folderMsg), 800);
    }
  }, [activeLead, bringFront, voss]);
  const closeWin = useCallback((id: string) => {
    // Restore from maximised state before closing so reopening shows the saved rect.
    setMaximized((m) => {
      if (m.includes(id)) {
        const r = restoreRects.current[id];
        if (r) setPos((p) => ({ ...p, [id]: r }));
      }
      return m.filter((x) => x !== id);
    });
    setOpenWins((w) => w.filter((x) => x !== id));
  }, []);
  const toggleWin = useCallback((id: string) => setOpenWins((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])), []);

  const toggleMaximise = useCallback((id: string) => {
    setMaximized((m) => {
      if (m.includes(id)) {
        const r = restoreRects.current[id];
        if (r) setPos((p) => ({ ...p, [id]: r }));
        return m.filter((x) => x !== id);
      }
      // Save exact current rect (measure height if window is auto-sized).
      const el = document.getElementById(id);
      setPos((p) => {
        restoreRects.current[id] = { ...p[id], height: p[id].height ?? el?.offsetHeight };
        return p;
      });
      return [...m, id];
    });
    bringFront(id);
  }, [bringFront]);

  // drag + resize (shared listeners; self-release when mouse released outside browser)
  useEffect(() => {
    const release = () => { dragRef.current = null; resizeRef.current = null; };
    const move = (e: MouseEvent) => {
      if (e.buttons === 0) { release(); return; } // mouse released outside window — fixes "stuck drag"
      const pR = panelRef.current?.getBoundingClientRect();
      if (!pR) return;
      const d = dragRef.current;
      if (d) {
        const el = document.getElementById(d.id);
        const ww = el?.offsetWidth ?? 0, wh = el?.offsetHeight ?? 0;
        let nx = e.clientX - d.ox, ny = e.clientY - d.oy;
        nx = Math.max(0, Math.min(nx, pR.width - ww));
        ny = Math.max(0, Math.min(ny, pR.height - TASKBAR_H - wh));
        setPos((p) => ({ ...p, [d.id]: { ...p[d.id], top: ny, left: nx } }));
        return;
      }
      const r = resizeRef.current;
      if (r) {
        const dx = e.clientX - r.startX, dy = e.clientY - r.startY;
        let l = r.startL, t = r.startT, w = r.startW, h = r.startH;
        if (r.dir.includes("e")) w = r.startW + dx;
        if (r.dir.includes("s")) h = r.startH + dy;
        if (r.dir.includes("w")) { w = r.startW - dx; l = r.startL + dx; }
        if (r.dir.includes("n")) { h = r.startH - dy; t = r.startT + dy; }
        const min = WIN_MIN[r.id] ?? WIN_MIN_DEFAULT;
        if (w < min.w) { if (r.dir.includes("w")) l = r.startL + r.startW - min.w; w = min.w; }
        if (h < min.h) { if (r.dir.includes("n")) t = r.startT + r.startH - min.h; h = min.h; }
        // Max bounds (desktop minus taskbar), then clamp position.
        w = Math.min(w, pR.width - l);
        h = Math.min(h, pR.height - TASKBAR_H - t);
        l = Math.max(0, Math.min(l, pR.width - w));
        t = Math.max(0, Math.min(t, pR.height - TASKBAR_H - h));
        setPos((p) => ({ ...p, [r.id]: { top: t, left: l, width: w, height: h } }));
      }
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", release);
    window.addEventListener("blur", release);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", release); window.removeEventListener("blur", release); };
  }, []);
  const startDrag = (e: React.MouseEvent, id: string) => {
    if ((e.target as HTMLElement).classList.contains("xp-btn")) return;
    bringFront(id);
    if (maximized.includes(id)) return;
    const p = pos[id]; dragRef.current = { id, ox: e.clientX - p.left, oy: e.clientY - p.top };
    e.preventDefault();
  };
  const startResize = (e: React.MouseEvent, id: string, dir: ResizeDir) => {
    e.preventDefault(); e.stopPropagation();
    const pR = panelRef.current?.getBoundingClientRect();
    const el = document.getElementById(id);
    if (!pR || !el) return;
    if (maximized.includes(id)) {
      // Snapshot current on-screen rect, drop maximise, continue resizing from it.
      const r = el.getBoundingClientRect();
      const rect: WinRect = { top: r.top - pR.top, left: r.left - pR.left, width: r.width, height: r.height };
      setMaximized((m) => m.filter((x) => x !== id));
      setPos((p) => ({ ...p, [id]: rect }));
      resizeRef.current = { id, dir, startX: e.clientX, startY: e.clientY, startL: rect.left, startT: rect.top, startW: rect.width, startH: rect.height ?? el.offsetHeight };
    } else {
      resizeRef.current = { id, dir, startX: e.clientX, startY: e.clientY, startL: el.offsetLeft, startT: el.offsetTop, startW: el.offsetWidth, startH: el.offsetHeight };
    }
    bringFront(id);
  };

  // ─── DECOY / WRONG / RED-HERRING HANDLERS ───
  const handleDecoy = useCallback((msg?: string) => {
    gs.current.errors++; addDet(3, "decoy");
    voss(msg || pick(DECOY_MSGS), "bm-err");
    setTimeout(() => voss(pick(DECOY_DETECTION_MSGS), "bm-err"), 800);
  }, [addDet, voss]);
  const handleUnopenable = useCallback((filename: string, msg: string) => {
    gs.current.errors++; addDet(6, "decoy"); setDialog(filename);
    setTimeout(() => voss(msg, "bm-err"), 400);
  }, [addDet, voss]);
  const wrongClick = useCallback(() => {
    gs.current.errors++; addDet(8, "click");
    voss(wrongDataPointMsg(), "bm-err");
    setTimeout(() => voss(pick(WRONG_CLICK_DETECTION_MSGS), "bm-err"), 800);
  }, [addDet, voss]);
  const redHerring = useCallback((kind: "compute" | "funding" | "personnel") => {
    gs.current.errors++; addDet(6, "decoy");
    const msgs = {
      compute: ["That file has the right structure, but these are normal baseline metrics. The anomaly is elsewhere.", "Clean data here. No redacted codes, no unusual patterns. Look in a different report.", "That's a legit report, but the readings are normal across the board. The anomaly isn't hiding there."],
      funding: ["Those expense lines all have proper department codes and sign-offs. Nothing unallocated here, check the budget files.", "Clean ledger. Every cost centre has an owner and the amounts balance. That isn't the anomaly.", "That's standard expense data, all within authorised ranges. Keep looking in the budget allocation."],
      personnel: ["Those are absence logs. Sick days and leave records, not project hours. The overtime data is in a different file.", "Clean absence records. Nothing anomalous in those patterns. Check the September overtime file.", "Leave records, not project hours. No redacted codes in there. Keep looking."],
    } as const;
    voss(pick(msgs[kind] as unknown as string[]), "bm-err");
  }, [addDet, voss]);

  // ─── FILE OPEN ROUTER ───
  const SPECIAL: Record<string, () => void> = {
    openPersonalNotes: () => { openWin("win-personal-notes"); if (!gs.current.personalNotesSeen) { gs.current.personalNotesSeen = true; setTimeout(() => voss("He knew. He archived it himself. Marshall isn't just a bystander."), 1200); } },
    openSystemMetrics: () => { openWin("win-sys-metrics"); if (!gs.current.sysMetricsSeen) { gs.current.sysMetricsSeen = true; setTimeout(() => voss("That's system performance data. CPU, memory, network metrics."), 600); } },
    openOpexReport: () => openWin("win-opex"),
    openAbsenceLog: () => openWin("win-absence"),
    openFinancePpt: () => { openWin("win-finance-ppt"); setPptSlide(0); },
    openHeadcount: () => openWin("win-headcount"),
    openHrAuth: () => { openWin("win-hr-auth"); if (verifyLead === "personnel") setTimeout(() => voss("Authorisation trail, cross-check the name against overtime.", "bm-ok"), 1500); },
    openFinanceAudit: () => openWin("win-finance-audit"),
  };
  const onFileOpen = (f: FolderKey, idx: number) => {
    const file = FOLDERS[f][idx];
    if (file.unopenable) return handleUnopenable(file.nm, file.msg || "");
    if (file.fn) return SPECIAL[file.fn]?.();
    if (file.decoy) return handleDecoy(file.msg);
    if (file.win) openWin(file.win);
  };

  // ─── EVIDENCE BOARD ───
  const setLeadCls = (id: LeadId, cls: LeadVisual) => setLeadVisual((v) => ({ ...v, [id]: cls }));
  const leadClick = (nid: LeadId) => {
    if (locked.includes(nid) || activeLead === nid) return;
    const stepLead = LEAD_ORDER[currentStep];
    if (nid !== stepLead) { voss("Finish the active lead first.", "bm-err"); return; }
    if (activeLead && activeLead !== nid && !locked.includes(activeLead)) {
      setLeadCls(activeLead, "n-idle"); setLeadStatusTxt((t) => ({ ...t, [activeLead]: "CLICK TO INVESTIGATE" }));
    }
    setActiveLead(nid); setLeadCls(nid, "n-mission"); setLeadStatusTxt((t) => ({ ...t, [nid]: "INVESTIGATING..." }));
    setStepBanner(`${LEADS[nid].label} LEAD ACTIVE: ${LEADS[nid].seek}`);
    setEbHint(`TARGET: ${LEADS[nid].label}`);
    voss(LEADS[nid].clue, "bm-ok");
  };

  // anomaly found from a chart click
  const foundAnomaly = (lead: LeadId, capId: string, extraZex?: string) => {
    if (activeLead === lead) {
      if (leadVisual[lead] === "n-active") return;
      setLeadCls(lead, "n-active"); setLeadStatusTxt((t) => ({ ...t, [lead]: "ANOMALY FOUND" }));
      setAnomaly((a) => ({ ...a, [capId]: true }));
      if (extraZex) setTimeout(() => zex(extraZex), 1200);
    } else if (locked.includes(lead)) {
      voss("That's already confirmed. Move on to the next target.");
    } else {
      voss(`Good eye, but select ${LEADS[lead].label} on the board before you log evidence.`, "bm-err");
    }
  };

  // ─── VERIFY ───
  const openVerify = (nid: LeadId) => {
    setVerifyLead(nid); setChipIdx(new Array(LEADS[nid].params.length).fill(null));
    setChipState({}); setParamErr({}); setVerifyOpen(true);
  };
  const hideAnomalyAndVerify = (capId: string, lead: LeadId) => { setAnomaly((a) => ({ ...a, [capId]: false })); openVerify(lead); };
  const selectChip = (pi: number, ci: number) => {
    setChipIdx((arr) => { const n = [...arr]; n[pi] = ci; return n; });
    setChipState((s) => { const n = { ...s }; LEADS[verifyLead!].params[pi].opts.forEach((_, j) => delete n[`${pi}_${j}`]); n[`${pi}_${ci}`] = "sel"; return n; });
    setParamErr((e) => { const n = { ...e }; delete n[pi]; return n; });
  };
  const confirmVerify = () => {
    if (!verifyLead) return;
    const lead = LEADS[verifyLead]; let allOk = true;
    const newChipState: Record<string, "sel" | "correct" | "wrong"> = { ...chipState };
    const newErr: Record<number, string> = {};
    lead.params.forEach((p, i) => {
      if (chipIdx[i] !== p.ans) {
        allOk = false; newErr[i] = p.err;
        if (chipIdx[i] !== null) newChipState[`${i}_${chipIdx[i]}`] = "wrong";
      } else newChipState[`${i}_${p.ans}`] = "correct";
    });
    setChipState(newChipState); setParamErr(newErr);
    if (allOk) {
      setTimeout(() => { setVerifyOpen(false); lockLead(verifyLead); setVerifyLead(null); }, 380);
    } else {
      gs.current.errors++; addDet(10, "verify");
      voss("Verification doesn't match the data. Try again.", "bm-err");
      setTimeout(() => voss(pick(WRONG_VERIFY_MSGS), "bm-err"), 800);
    }
  };

  const lockLead = (nid: LeadId) => {
    const newLocked = [...locked, nid];
    setLocked(newLocked); setActiveLead(null);
    setLeadCls(nid, "n-locked"); setLeadStatusTxt((t) => ({ ...t, [nid]: "✓ LOCKED" }));
    voss(LEADS[nid].lockMsg, "bm-win");
    const step = currentStep + 1; setCurrentStep(step);
    if (newLocked.length === 3) {
      setTimeout(() => {
        setSynthBtnReady(true);
        setStepBanner("All leads confirmed. Hit CONFIRM INTEL to lock in the OMNI footprint");
        setEbStep("ALL 3 LEADS CONFIRMED ✓");
        setTimeout(() => voss("All three leads confirmed. You can lock the footprint now.", "bm-ok"), 400);
        setTimeout(() => zex("Three departments. Same pattern. That's not a coincidence."), 1800);
        setTimeout(() => zex("I'm in."), 4000);
        setTimeout(() => setSynthBtnEnabled(true), 4575);
      }, 4200);
    } else {
      const nextLead = LEAD_ORDER[step];
      setTimeout(() => {
        setLeadCls(nextLead, "n-next"); setLeadStatusTxt((t) => ({ ...t, [nextLead]: "YOUR TURN →" }));
        setEbStep(`LEAD ${step + 1} OF 3`);
        const prompts: Record<string, string> = { funding: "Funding is next. Select it on the board when you're ready.", personnel: "Last lead: Personnel. Select it on the board." };
        voss(prompts[nextLead] || `Next lead: ${LEADS[nextLead].label}`, "bm-ok");
      }, 800);
      setStepBanner(`${LEADS[nid].label} confirmed ✓. Select the next lead to continue`);
      setEbHint("");
    }
  };

  // ─── HINT ───
  const requestHint = () => {
    if (hintCd > 0) return;
    if (!activeLead) { voss("Select a target on the board first.", "bm-err"); return; }
    if (locked.includes(activeLead)) { voss("That one's already confirmed. Pick another target."); return; }
    gs.current.hintsUsed++; addDet(8, "hint");
    voss("Pulling the intel. This raises our exposure, use it carefully.");
    setTimeout(() => voss(LEADS[activeLead].hint, "bm-h"), 1600);
    setHintCd(30);
  };
  useEffect(() => {
    if (hintCd <= 0) return;
    const t = setTimeout(() => setHintCd((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [hintCd]);

  // ─── SYNTH ANIMATION → DEBRIEF ───
  const startSynth = () => {
    if (locked.length < 3 || gs.current.synthStarted) return;
    gs.current.synthStarted = true; setSynthOn(true);
  };
  useEffect(() => {
    if (!synthOn || !synthSvgRef.current) return;
    const svg = synthSvgRef.current;
    const outerR = 46, centerR = 72, cx = 350, cy = 250, ringR = 180;
    const npos = [{ lbl: "COMPUTE", ang: -90 }, { lbl: "FUNDING", ang: 150 }, { lbl: "PERSONNEL", ang: 30 }]
      .map((n) => ({ lbl: n.lbl, x: cx + ringR * Math.cos((n.ang * Math.PI) / 180), y: cy + ringR * Math.sin((n.ang * Math.PI) / 180) }));
    const NS = "http://www.w3.org/2000/svg";
    // filterUnits=userSpaceOnUse: percentage regions are relative to the element's
    // bbox, and the vertical COMPUTE line has a zero-width bbox — the filter region
    // collapses and the line doesn't render at all. Explicit region fixes it.
    svg.innerHTML = `<defs><filter id="sg" filterUnits="userSpaceOnUse" x="-100" y="-100" width="900" height="700"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
    npos.forEach((n, i) => {
      const dx = cx - n.x, dy = cy - n.y, dist = Math.hypot(dx, dy), ux = dx / dist, uy = dy / dist;
      // End 2px OUTSIDE the centre circle edge — the glow bridges the gap; ending
      // inside (old -3) made the lines visibly clip into the circle.
      const x1 = n.x + ux * outerR, y1 = n.y + uy * outerR, x2 = cx - ux * (centerR + 2), y2 = cy - uy * (centerR + 2);
      const lineLen = Math.hypot(x2 - x1, y2 - y1);
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", `${x1}`); line.setAttribute("y1", `${y1}`); line.setAttribute("x2", `${x2}`); line.setAttribute("y2", `${y2}`);
      line.setAttribute("stroke", "#00FF41"); line.setAttribute("stroke-width", "2"); line.setAttribute("filter", "url(#sg)");
      line.style.strokeDasharray = `${lineLen}`; line.style.strokeDashoffset = `${lineLen}`; line.id = "sl" + i; svg.appendChild(line);
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", `${n.x}`); c.setAttribute("cy", `${n.y}`); c.setAttribute("r", `${outerR}`);
      c.setAttribute("fill", "none"); c.setAttribute("stroke", "#00FF41"); c.setAttribute("stroke-width", "1.5"); c.setAttribute("filter", "url(#sg)"); svg.appendChild(c);
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", `${n.x}`); t.setAttribute("y", `${n.y + 5}`); t.setAttribute("text-anchor", "middle"); t.setAttribute("fill", "#00FF41");
      t.setAttribute("font-size", "11"); t.setAttribute("font-family", "Space Grotesk,sans-serif"); t.setAttribute("letter-spacing", "1"); t.textContent = n.lbl; svg.appendChild(t);
    });
    const oc = document.createElementNS(NS, "circle");
    oc.setAttribute("cx", `${cx}`); oc.setAttribute("cy", `${cy}`); oc.setAttribute("r", "0"); oc.setAttribute("fill", "rgba(0,255,65,.10)");
    oc.setAttribute("stroke", "#00FF41"); oc.setAttribute("stroke-width", "2.5"); oc.setAttribute("filter", "url(#sg)"); oc.id = "oc"; svg.appendChild(oc);
    const ot1 = document.createElementNS(NS, "text");
    ot1.setAttribute("x", `${cx}`); ot1.setAttribute("y", `${cy - 4}`); ot1.setAttribute("text-anchor", "middle"); ot1.setAttribute("fill", "#00FF41");
    ot1.setAttribute("font-size", "30"); ot1.setAttribute("font-family", "Space Grotesk,sans-serif"); ot1.setAttribute("font-weight", "700"); ot1.setAttribute("letter-spacing", "5"); ot1.setAttribute("opacity", "0"); ot1.textContent = "OMNI"; ot1.id = "ot1"; svg.appendChild(ot1);
    const ot2 = document.createElementNS(NS, "text");
    ot2.setAttribute("x", `${cx}`); ot2.setAttribute("y", `${cy + 22}`); ot2.setAttribute("text-anchor", "middle"); ot2.setAttribute("fill", "#8f44e8");
    ot2.setAttribute("font-size", "12"); ot2.setAttribute("font-family", "Space Grotesk,sans-serif"); ot2.setAttribute("letter-spacing", "4"); ot2.setAttribute("opacity", "0"); ot2.textContent = "CONFIRMED"; ot2.id = "ot2"; svg.appendChild(ot2);
    const timers: ReturnType<typeof setTimeout>[] = [];
    npos.forEach((_, i) => timers.push(setTimeout(() => { const ln = document.getElementById("sl" + i) as unknown as SVGLineElement; if (ln) { ln.style.transition = "stroke-dashoffset 0.55s ease"; ln.style.strokeDashoffset = "0"; } }, 420 + i * 380)));
    timers.push(setTimeout(() => {
      let r = 0; const step = () => { r = Math.min(r + 2, centerR); oc.setAttribute("r", `${r}`); if (r < centerR) requestAnimationFrame(step); }; requestAnimationFrame(step);
      timers.push(setTimeout(() => { ot1.style.transition = "opacity 0.6s"; ot1.setAttribute("opacity", "1"); ot2.style.transition = "opacity 0.6s"; ot2.setAttribute("opacity", "1"); }, 600));
    }, 420 + 4 * 380));
    timers.push(setTimeout(() => setSynthDone(true), 420 + 4 * 380 + 1200));
    timers.push(setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      onComplete({ timerSec, detection: Math.min(100, Math.round(det)), errors: gs.current.errors, hintsUsed: gs.current.hintsUsed, decoy: gs.current.decoyDetection, click: gs.current.clickDetection, verify: gs.current.verifyDetection, hint: gs.current.hintDetection, passive: gs.current.passiveDetection });
    }, 420 + 4 * 380 + 2000));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synthOn]);

  // ─── DERIVED ───
  const timer = `${String(Math.floor(timerSec / 60)).padStart(2, "0")}:${String(timerSec % 60).padStart(2, "0")}`;
  const dRound = Math.min(100, Math.round(det));
  const detState = det < 30 ? "DARK" : det < 60 ? "SCANNING" : det < 80 ? "ALERT" : "CRITICAL";
  const detWrapCls = det < 30 ? "det-green" : det < 60 ? "det-amber" : "det-red";
  const detBarCls = det < 30 ? "det-bar-green" : det < 60 ? "det-bar-amber" : "det-bar-red";
  const detIcon = det < 30 ? "fa-shield-alt" : det < 60 ? "fa-eye" : det < 80 ? "fa-exclamation-triangle" : "fa-skull";

  const winShared = (id: string) => ({
    visible: openWins.includes(id),
    cls: `xp-win visible${maximized.includes(id) ? " xwin-maximised" : ""}`,
    style: { top: pos[id].top, left: pos[id].left, width: pos[id].width, height: pos[id].height, zIndex: zIndexOf(id) },
  });
  // 8-direction resize handles + SE grip (ported from HTML makeResizable/resizeWin).
  const resizeHandles = (id: string) => (
    <>
      {RESIZE_DIRS.map((d) => <div key={d} className={`xp-rh xp-rh-${d}`} onMouseDown={(e) => startResize(e, id, d)} />)}
      <div className="xp-grip" />
    </>
  );
  const maxBtn = (id: string) => (
    <button className="xp-btn xp-max" onClick={() => toggleMaximise(id)}>{maximized.includes(id) ? "❐" : "□"}</button>
  );

  // tab helper — plain render function, NOT a nested component.
  // A nested component type is recreated each render, so bringFront's re-render
  // (triggered by mousedown on the window) remounted the buttons mid-click and
  // the click never fired.
  const tab = (win: string, idx: number, label: string) => (
    <button key={`${win}-tab-${idx}`} className={`xtab${activeTab[win] === idx ? " active" : ""}`} onClick={() => setActiveTab((t) => ({ ...t, [win]: idx }))}>{label}</button>
  );

  return (
    <div className="margus-m1-game-root">
      <div id="game" style={{ display: "flex" }}>
        {/* HEADER */}
        <div id="hdr">
          <div className="hdr-left"><i className="fas fa-terminal" /> MASTERMIND TERMINAL | OPERATION OMNI</div>
          <div className="hdr-center">MISSION 01 OF 05 / IDENTIFYING THE FOOTPRINT</div>
          <div className="hdr-right">
            <span id="det-display" className={detWrapCls}>
              <span id="det-icon"><i className={`fas ${detIcon}`} /></span>
              <span id="det-pct">{dRound}%</span>
              <span className="det-bar-wrap"><span id="det-bar" className={detBarCls} style={{ width: det + "%" }} /></span>
              <span id="det-label" style={{ fontSize: "clamp(10px,1vw,12px)", letterSpacing: 2, opacity: 0.7 }}>{detState}</span>
            </span>
            <span className="det-info-wrap" tabIndex={0}>
              <i className="fas fa-circle-info det-info-i" />
              <div className="det-info-pop" role="tooltip">
                <div className="dip-ttl" style={{ color: DET_INFO[detState].color }}>{detState}</div>
                <div className="dip-desc">{DET_INFO[detState].desc}</div>
                <div className="dip-cause">Detection rises when you open the wrong files, fail a verification, or lean on hints, and slowly over time on the mirror. At 100% the operation fails.</div>
              </div>
            </span>
            <span style={{ color: "var(--border)", margin: "0 6px" }}>|</span>
            <span id="timer">{timer}</span>
            <span className="live-dot" />
            <span style={{ letterSpacing: 1 }}>LIVE</span>
            <span style={{ color: "var(--border)", margin: "0 6px" }}>|</span>
            <AudioToggle compact />
          </div>
        </div>

        <div id="step-banner">{stepBanner}</div>

        <div id="main-row">
          {/* DESKTOP */}
          <div id="desktop-panel" ref={panelRef} className={glitching ? "glitching" : ""}>
            <div id="wallpaper" className={revealed ? "visible" : ""} />

            {DESKTOP_ICONS.map((ic) => (
              <div key={ic.id} className={`di${revealed ? " visible" : ""}${activeLead && LEADS[activeLead].iconId === ic.id ? " di-mission" : ""}${locked.some((l) => LEADS[l].iconId === ic.id) ? " di-locked" : ""}`}
                style={{ top: ic.top, left: ic.left }} onDoubleClick={() => ic.win && openWin(ic.win)}>
                <span className="di-icon">{ic.emoji ? ic.emoji : <i className="fas fa-folder" />}</span>
                <div className="di-label">{ic.label}</div>
              </div>
            ))}

            {STICKIES.map((s) => (
              <div key={s.id} className={`sticky ${s.cls}${revealed ? " visible" : ""}`} style={{ top: s.top, right: s.right }}>
                {s.header && <span className="sticky-hdr">{s.header}</span>}
                <ul className="sticky-list">{s.items.map((it, i) => <li key={i}>{it}</li>)}</ul>
              </div>
            ))}

            {/* FOLDER WINDOWS */}
            {(["it", "finance", "hr", "misc"] as FolderKey[]).map((fk) => {
              const id = `win-${fk}`; const ws = winShared(id); if (!ws.visible) return null;
              const titles: Record<FolderKey, string> = { it: "IT_Systems - C:\\Marshall\\IT_Systems\\", finance: "Finance - C:\\Marshall\\Finance\\", hr: "HR_Records - C:\\Marshall\\HR_Records\\", misc: "Misc - C:\\Marshall\\Misc\\" };
              const sized = pos[id].height != null || maximized.includes(id);
              return (
                <div key={id} id={id} className={ws.cls} style={ws.style} onMouseDown={() => bringFront(id)}>
                  <div className="xp-tb" onMouseDown={(e) => startDrag(e, id)}>
                    <div className="xp-title"><span className="xp-ti"><i className="fas fa-folder" /></span>{titles[fk]}</div>
                    <div className="xp-btns">{maxBtn(id)}<button className="xp-btn xp-cls" onClick={() => closeWin(id)}>✕</button></div>
                  </div>
                  <div className="xp-menu"><span className="xpm">File</span><span className="xpm">Edit</span><span className="xpm">View</span><span className="xpm">Help</span></div>
                  <div className="xp-body" style={sized ? undefined : { height: 220 }}>
                    <div className="folder-grid">
                      {FOLDERS[fk].map((f, i) => { const ic = fileIconClass(f.nm); return (
                        <div key={f.nm} className="fg-item" onDoubleClick={() => onFileOpen(fk, i)}>
                          <div className="fg-icon"><i className={`fas ${ic.fa} ${ic.cls}`} /></div>
                          <div className="fg-label">{f.nm}</div>
                        </div>
                      ); })}
                    </div>
                  </div>
                  <div className="xp-status"><span>{FOLDERS[fk].length} objects</span></div>
                  {resizeHandles(id)}
                </div>
              );
            })}

            {/* SERVER REPORT (compute) */}
            {renderWin("win-server", "fa-file-excel", "server_report.xls - Microsoft Excel", "IT Infrastructure Report · Oct 2003", (
              <>
                <div className="xp-tabs">{tab("win-server", 0, "Network Traffic")}{tab("win-server", 1, "Server Load")}{tab("win-server", 2, "Disk Usage")}</div>
                {activeTab["win-server"] === 0 && <div className="xtab-panel active"><div className="chart-wrap"><div className="chart-ttl">Network Throughput, FY 2003</div><div className="chart-sub">Monthly total GB · Core backbone</div><div className="chart-canvas-wrap"><NetworkChart /></div></div></div>}
                {activeTab["win-server"] === 1 && <div className="xtab-panel active"><div className="chart-wrap" style={{ position: "relative" }}><div className="chart-ttl">Sector Node Load Index, FY 2003</div><div className="chart-sub">Monthly avg load % · IT Infrastructure Report</div><div className="chart-canvas-wrap"><ServerLoadChart onAnomaly={() => foundAnomaly("compute", "cap", "Server load like that doesn't happen by accident. Infrastructure confirmed provisionally. Keep going.")} onWrong={wrongClick} /></div>{anomaly["cap"] && <AnomalyPanel title="ANOMALY CONFIRMED" onVerify={() => hideAnomalyAndVerify("cap", "compute")}>September hit 118%, dwarfing every other month including the elevated spikes in June (72%) and October (81%). Nearly 3× the yearly average load.<br /><br />Tooltip reads: &quot;Ticket: Archived, DO NOT REOPEN&quot;</AnomalyPanel>}</div></div>}
                {activeTab["win-server"] === 2 && <div className="xtab-panel active"><div className="chart-wrap"><div className="chart-ttl">Disk Usage by Node, Q3 2003</div><div className="chart-sub">Automated snapshot · 01-Oct-2003</div><div className="chart-canvas-wrap"><DiskChart /></div></div></div>}
              </>
            ), 296)}

            {/* BUDGET (funding) */}
            {renderWin("win-budget", "fa-file-excel", "budget_Q3.xls - Microsoft Excel", "Finance Portal · Restricted · 01-Oct-2003", (
              <>
                <div className="xp-tabs">{tab("win-budget", 0, "Headcount Costs")}{tab("win-budget", 1, "Capex")}{tab("win-budget", 2, "Budget Allocation")}</div>
                {activeTab["win-budget"] === 0 && <div className="xtab-panel active"><div className="chart-wrap"><div className="chart-ttl">Headcount Costs, Q3 2003</div><div className="chart-sub">HR &amp; Finance Joint Report · Restricted</div><div className="chart-canvas-wrap"><HCCostChart /></div></div></div>}
                {activeTab["win-budget"] === 1 && <div className="xtab-panel active"><div className="chart-wrap"><div className="chart-ttl">Capital Expenditure, Q3 2003</div><div className="chart-sub">Finance · Capex Tracker · Authorised Items Only</div><div className="chart-canvas-wrap"><CapexChart /></div></div></div>}
                {activeTab["win-budget"] === 2 && <div className="xtab-panel active"><div className="chart-wrap"><div className="chart-ttl">Q3 2003 Budget Allocation</div><div className="chart-sub">Finance Portal · Restricted</div><div style={{ position: "relative" }}><div className="chart-canvas-wrap" style={{ height: 240 }}><BudgetAllocChart onAnomaly={() => foundAnomaly("funding", "cap-funding", "Hidden budget lines are how you fund things that don't officially exist.")} onWrong={wrongClick} /></div>{anomaly["cap-funding"] && <AnomalyPanel title="ANOMALY CONFIRMED" onVerify={() => hideAnomalyAndVerify("cap-funding", "funding")}>$7.1M sits under R&amp;D, Unallocated with no department owner. That is a lot of money to go nowhere official.</AnomalyPanel>}</div></div></div>}
              </>
            ), 320)}

            {/* PERSONNEL (overtime) */}
            {renderWin("win-personnel", "fa-file-word", "staffing_hours_Sep.doc - Microsoft Word", "HR Analytics · RESTRICTED · All Divisions", (
              <>
                <div className="xp-tabs">{tab("win-personnel", 0, "Q1–Q2 Summary")}{tab("win-personnel", 1, "September Breakdown")}{tab("win-personnel", 2, "Policy Notes")}</div>
                {activeTab["win-personnel"] === 0 && <div className="xtab-panel active"><div className="chart-wrap"><div className="chart-ttl">Overtime Summary, H1 2003 (Jan–Jun)</div><div className="chart-sub">HR Analytics · All Divisions</div><div className="chart-canvas-wrap"><H1Chart /></div></div></div>}
                {activeTab["win-personnel"] === 1 && <div className="xtab-panel active"><div className="chart-wrap"><div className="chart-ttl">September 2003, Overtime by Division</div><div className="chart-sub">HR Analytics · RESTRICTED</div><div style={{ position: "relative" }}><div className="chart-canvas-wrap" style={{ height: 300 }}><SeptScatterChart onAnomaly={() => foundAnomaly("personnel", "cap-personnel")} onWrong={wrongClick} /></div>{anomaly["cap-personnel"] && <AnomalyPanel title="ANOMALY CONFIRMED" onVerify={() => hideAnomalyAndVerify("cap-personnel", "personnel")}>Engineering Classified logged 2,940 hours under a [REDACTED] project code. That is 7× the next highest division.</AnomalyPanel>}</div></div></div>}
                {activeTab["win-personnel"] === 2 && <div className="xtab-panel active"><div className="dt-note"><strong>OVERTIME AUTHORISATION POLICY, MEGACORP HR</strong><br /><br />1. Standard overtime (under 200h/month per division) requires line manager approval.<br />2. Overtime exceeding 200h/month must be escalated to VP level.<br />3. Any overtime associated with classified projects requires SVP or above sign-off.<br />4. All overtime must be logged within 5 business days.<br />5. Project codes must be listed on all authorisation requests.<br />6. Records are retained for 7 years.<br /><br /><em>Effective: January 2003. Last reviewed: July 2003.</em></div></div>}
              </>
            ), 320)}

            {/* HEADCOUNT (cross-ref) */}
            {renderWin("win-headcount", "fa-file-excel", "staffing_ot_metrics_Sep.xls - Microsoft Excel", "HR Records · Confidential · 10 divisions", (
              <div className="xp-body" style={{ height: 320, padding: "10px 12px", background: "#fff" }}>
                <div className="chart-ttl">Avg Overtime Hours per Employee, September 2003</div>
                <div className="chart-sub">HR Records · Staffing Metrics · All Divisions · hover segment for exact figure</div>
                <div style={{ height: 250 }}><HeadcountPolarChart /></div>
              </div>
            ), 320, true)}

            {/* HR AUTH (cross-ref) */}
            {renderWin("win-hr-auth", "fa-file-word", "auth_log_Sep.doc - Microsoft Word", "5 records · HR CONFIDENTIAL", (
              <div className="xp-body" style={{ height: 240, padding: "18px 22px", fontFamily: "Georgia,serif", fontSize: 12, color: "#1a1a1a", overflowY: "auto", background: "#fff" }}>
                <div style={{ textAlign: "center", borderBottom: "2px solid #222", paddingBottom: 10, marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: "bold" }}>MegaCorp HR, Overtime Authorisation Log · September 2003</div>
                  <div style={{ fontSize: 11, color: "#555", fontStyle: "italic", marginTop: 3 }}>Confidential · HR Director Use Only</div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Arial,sans-serif", fontSize: 11 }}>
                  <thead><tr style={{ background: "#e8e8e8" }}>{["Division", "Authorised By", "Auth Code", "Sign-off Date"].map((h) => <th key={h} style={{ padding: "6px 8px", border: "1px solid #bbb", textAlign: "left" }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[["Sales & Marketing", "J. Peterson", "AUTH-2003-MKT-09", "02-Sep-2003"], ["Engineering (Std)", "M. Chen", "AUTH-2003-ENG-09", "01-Sep-2003"], ["Engineering Classified", "R. Marshall", "[CLASSIFIED]", "30-Aug-2003"], ["Finance", "R. Simmons", "AUTH-2003-FIN-09", "03-Sep-2003"], ["Operations", "L. Torres", "AUTH-2003-OPS-09", "02-Sep-2003"]].map((r, i) => (
                      <tr key={i} style={{ background: i % 2 ? "#f9f9f9" : undefined }}>{r.map((c, j) => <td key={j} style={{ padding: "5px 8px", border: "1px solid #ddd" }}>{c}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ), 240, true)}

            {/* PERSONAL NOTES (easter egg) */}
            {renderWin("win-personal-notes", "fa-file-lines", "personal_notes.txt - Notepad", "personal_notes.txt · READ ONLY", (
              <div className="xp-body" style={{ background: "#fff", padding: "14px 16px", fontFamily: "'Courier New',monospace", fontSize: 13, color: "#111", lineHeight: 1.9, minHeight: 260, whiteSpace: "pre-wrap" }}>{`Sep 17\nIT flagged the load spike again. Third time this month.\nTold Hargreaves it was the quarterly backup sync running long. He filed it. Done.\nArchived the ticket myself this time. Faster that way.\n\nIf anyone pulls the logs they'll see 118% and ask questions.\nThey won't pull the logs.\n\nOMNI needs the headroom. Stanton was clear about that.\nWe're past the point where I get to ask what for.`}</div>
            ), 280, true)}

            {/* RED HERRING: system metrics */}
            {renderWin("win-sys-metrics", "fa-file-excel", "metrics_Q3.xls - Microsoft Excel", "System Performance Metrics · Q3 2003", (
              <div className="xp-body" style={{ height: 240, padding: "10px 12px", background: "#fff" }} onClick={() => redHerring("compute")}>
                <div className="chart-ttl">CPU Usage Average, Q3 2003</div>
                <div className="chart-sub">Monthly avg utilization %</div>
                <div style={{ height: 180 }}><RedBar data={[52, 48, 55, 51]} label="CPU %" max={100} /></div>
              </div>
            ), 240, true)}

            {/* RED HERRING: opex */}
            {renderWin("win-opex", "fa-file-excel", "expenditure_q3.xls - Microsoft Excel", "Operating Expenditure · Q3 2003", (
              <div className="xp-body" style={{ height: 240, padding: "10px 12px", background: "#fff" }} onClick={() => redHerring("funding")}>
                <div className="chart-ttl">Operating Expenditure by Department, Q3 2003</div>
                <div className="chart-sub">Finance · Approved claims only</div>
                <div style={{ height: 180 }}><RedBar data={[1.85, 2.40, 0.92, 1.15, 0.68, 0.44, 0.52]} labels={["Ops", "Eng", "IT", "Mktg", "Legal", "Fin", "HR"]} label="$M" /></div>
              </div>
            ), 240, true)}

            {/* RED HERRING: absence */}
            {renderWin("win-absence", "fa-file-excel", "absence_log_Q3.xls - Microsoft Excel", "HR · Absence Records · Q3 2003", (
              <div className="xp-body" style={{ height: 240, padding: "10px 12px", background: "#fff" }} onClick={() => redHerring("personnel")}>
                <div className="chart-ttl">Absence Days by Department, Q3 2003</div>
                <div className="chart-sub">HR · Sick leave &amp; annual leave</div>
                <div style={{ height: 180 }}><RedBar data={[142, 98, 45, 32, 67, 28, 83]} labels={["Eng", "Ops", "Fin", "HR", "IT", "Legal", "Mktg"]} label="Days" /></div>
              </div>
            ), 240, true)}

            {/* FINANCE AUDIT (cross-ref doc) */}
            {renderWin("win-finance-audit", "fa-file-word", "audit_draft.doc - Microsoft Word", "DRAFT, NOT SENT · CONFIDENTIAL", (
              <div className="xp-body" style={{ height: 280, padding: "18px 22px", fontFamily: "Georgia,serif", fontSize: 12, color: "#1a1a1a", overflowY: "auto", background: "#fff" }}>
                <div style={{ textAlign: "center", borderBottom: "2px solid #222", paddingBottom: 10, marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: "bold" }}>MegaCorp Finance, Draft Response to Auditor Query</div>
                  <div style={{ fontSize: 11, color: "#555", fontStyle: "italic", marginTop: 3 }}>Prepared by: R. Marshall · CONFIDENTIAL · Sep 2003</div>
                </div>
                <p style={{ margin: "0 0 10px" }}>Thank you for your correspondence dated 12 August 2003. We have reviewed the budget variance items flagged in your Q2 audit report and are satisfied that all material allocations are accounted for within standard reporting frameworks.</p>
                <p style={{ margin: "0 0 10px" }}>With respect to the R&amp;D line item, we wish to clarify that the allocation of $7.1M has been routed through Sub-Account 7 for administrative purposes. This account is managed directly by the Office of the SVP Strategy and is not subject to standard departmental reporting requirements.</p>
                <p style={{ margin: "0 0 14px" }}>We trust this clarifies the matter and request that no further escalation is required at this time.</p>
                <div style={{ marginTop: 16, fontSize: 11, color: "#333" }}>Signed: <strong>R. Marshall</strong> · SVP Strategy · MegaCorp</div>
              </div>
            ), 280, true)}

            {/* BOARD REPORT PPT */}
            {(() => { const id = "win-finance-ppt"; const ws = winShared(id); if (!ws.visible) return null; return (
              <div key={id} id={id} className={ws.cls} style={ws.style} onMouseDown={() => bringFront(id)}>
                <div className="xp-tb" onMouseDown={(e) => startDrag(e, id)} style={{ background: "#d4d0c8" }}>
                  <div className="xp-title" style={{ color: "#000" }}><span className="xp-ti"><i className="fas fa-file-powerpoint" /></span>board_report_Q3.ppt - Microsoft PowerPoint</div>
                  <div className="xp-btns">{maxBtn(id)}<button className="xp-btn xp-cls" onClick={() => closeWin(id)}>✕</button></div>
                </div>
                <PptViewer slide={pptSlide} setSlide={setPptSlide} zoom={pptZoomLvl} setZoom={setPptZoomLvl}
                  fundingActive={activeLead === "funding"} fundingLocked={locked.includes("funding")} fundingAnomalyShown={!!anomaly["cap-funding-ppt"]}
                  onFundingAnomaly={() => foundAnomaly("funding", "cap-funding-ppt", "Hidden budget lines are how you fund things that don't officially exist.")}
                  onVerifyFunding={() => hideAnomalyAndVerify("cap-funding-ppt", "funding")} />
                {resizeHandles(id)}
              </div>
            ); })()}

            {/* HACK OVERLAY */}
            {hackActive && (
              <div id="hack-overlay" className="active">
                {HACK_LINES.map((l) => (<span key={l.id} className={`ht ${l.cls || ""}${hackShown[l.id] ? " show" : ""}`} dangerouslySetInnerHTML={{ __html: l.html }} />))}
              </div>
            )}

            {/* VERIFY PANEL — stays mounted while a lead is under investigation
                (collapse via chevron, don't unmount: keeps chip selections). */}
            {verifyLead && (
              <div id="verify-panel" className={verifyOpen ? "open" : ""}>
                <button id="verify-toggle" className="show" onClick={() => setVerifyOpen((o) => !o)} title="Toggle panel">{verifyOpen ? "›" : "‹"}</button>
                <div className="cp-hdr">
                  <div className="cp-lead">VERIFY LEAD: {LEADS[verifyLead].label}</div>
                  <div className="cp-sub">Select the correct values from the evidence you found.</div>
                </div>
                <div className="cp-body">
                  <div className={`cp-params${LEADS[verifyLead].params.length >= 4 ? " cp-compact" : ""}`}>
                    {LEADS[verifyLead].params.map((p, i) => (
                      <div key={i} className="cp-param">
                        <div className="cp-plbl">{p.label}</div>
                        <div className="cp-chips">
                          {p.opts.map((opt, j) => { const st = chipState[`${i}_${j}`]; return (
                            <button key={j} className={`cp-chip${st === "sel" ? " cp-sel" : ""}${st === "correct" ? " cp-correct" : ""}${st === "wrong" ? " cp-wrong" : ""}`} onClick={() => selectChip(i, j)}>{opt}</button>
                          ); })}
                        </div>
                        <div className={`cp-err${paramErr[i] ? " show" : ""}`}>{paramErr[i] || ""}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="cp-foot"><button className="cp-ok" onClick={confirmVerify}>✓ CONFIRM LOCK</button></div>
              </div>
            )}

            {/* TASKBAR */}
            <div id="xp-taskbar" className={revealed ? "visible" : ""}>
              <button id="start-btn">⊞ Start</button>
              <div className="tb-div" />
              <button className={`tb-wb${openWins.includes("win-it") ? " tb-on" : ""}`} onClick={() => toggleWin("win-it")}><i className="fas fa-folder" /> IT_Systems</button>
              <button className={`tb-wb${openWins.includes("win-finance") ? " tb-on" : ""}`} onClick={() => toggleWin("win-finance")}><i className="fas fa-folder" /> Finance</button>
              <button className={`tb-wb${openWins.includes("win-hr") ? " tb-on" : ""}`} onClick={() => toggleWin("win-hr")}><i className="fas fa-folder" /> HR_Records</button>
              <div id="tb-clock">{clock12()}</div>
            </div>

            {/* UNOPENABLE DIALOG — centered on the XP desktop */}
            {dialog && (
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(0,0,0,0.95)", border: "1px solid #d31972", borderRadius: 4, padding: 20, minWidth: 300, textAlign: "center", zIndex: 600, fontFamily: "'Share Tech Mono',monospace", color: "#faf7f2" }}>
                <div style={{ fontSize: 11, color: "#d31972", letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>⚠ ERROR</div>
                <div style={{ fontSize: 13, marginBottom: 16 }}>{dialog}</div>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 16 }}>File contains no relevant data</div>
                <button onClick={() => setDialog(null)} style={{ padding: "6px 16px", background: "#d31972", border: "none", color: "#fff", fontFamily: "'Space Grotesk',sans-serif", fontSize: 11, borderRadius: 2, cursor: "pointer" }}>DISMISS</button>
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div id="right">
            <div id="eboard">
              <div className="eb-hdr"><span className="eb-htitle">EVIDENCE BOARD</span><span id="eb-hint">{ebHint}</span></div>
              <div id="eb-step">{ebStep}</div>
              <div className="eb-grid">
                {LEAD_ORDER.map((id) => (
                  <div key={id} className={`lead ${leadVisual[id]}`} onClick={() => leadClick(id)}>
                    <div className="lead-icon"><i className={`fas ${id === "compute" ? "fa-microchip" : id === "funding" ? "fa-sack-dollar" : "fa-users"}`} /></div>
                    <div className="lead-name">{LEADS[id].label}</div>
                    <div className="lead-status">{leadStatusTxt[id]}</div>
                  </div>
                ))}
              </div>
              <div className="eb-progress">{LEAD_ORDER.map((id) => <div key={id} className={`ep-seg${locked.includes(id) ? " filled" : ""}`} />)}</div>
              <button id="synth-btn" className={synthBtnReady ? "ready btn-sweep" : ""} style={{ "--sweep-ms": "4575ms" } as React.CSSProperties} disabled={!synthBtnEnabled} onClick={startSynth}><i className="fas fa-circle-nodes" /> <span>CONFIRM INTEL</span></button>
            </div>

            {/* MISSION CHANNEL */}
            <div id="voss-wrap">
              <div className="voss-hdr">
                <div className="bk-avatar"><i className="fas fa-user-secret" /></div>
                <div className="bk-info">
                  <div className="bk-name">Mission Channel</div>
                  <div className="bk-members">
                    <span className="bk-member online">Voss</span><span className="bk-sep">,</span>
                    <span className="bk-member online">Zex</span><span className="bk-sep">,</span>
                    <span className="bk-member offline">Atlas</span><span className="bk-sep">,</span>
                    <span className="bk-member offline">Nova</span><span className="bk-sep">,</span>
                    <span className="bk-member offline">Kade</span>
                  </div>
                </div>
                <div className="bk-icons"><i className="fas fa-magnifying-glass" /> &nbsp; <i className="fas fa-lock" /></div>
              </div>
              <div id="voss-body" ref={bodyRef}>
                <div className="bm-sep"><div className="bm-sep-pill">Today</div></div>
                {messages.map((m) => (
                  <div key={m.id} className="bm-group">
                    <div className={`bm-sender ${m.sender === "VOSS" ? "s-voss" : "s-zex"}`}>{m.sender}</div>
                    <div className={`bm-bubble ${m.cls}`} dangerouslySetInnerHTML={{ __html: m.html }} />
                    <div className="bm-ts">{m.ts}</div>
                  </div>
                ))}
                {typing && (<div className="bm-typing-wrap"><div className="bm-typing"><div className="tdot" /><div className="tdot" /><div className="tdot" /></div></div>)}
              </div>
              <div className="voss-footer">
                <div className="voss-input-bar">
                  <div className="hint-wrap">
                    <button id="hint-btn" disabled={hintCd > 0} onClick={requestHint}><i className="fas fa-lightbulb" /></button>
                    <div className="hint-tooltip">Request hint · +8% detection</div>
                    <div id="hint-cd" className={hintCd > 0 ? "show" : ""}>{hintCd > 0 ? hintCd + "s" : ""}</div>
                  </div>
                  <input id="voss-input" type="text" placeholder="Operation Channel, listen only" disabled />
                  <button className="mic-btn"><i className="fas fa-microphone" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TOASTS */}
      {toasts.map((t, i) => (<div key={t.id} className="det-toast" style={{ top: 48 + i * 4, right: 24 }}>{t.text}</div>))}

      {/* SYNTH OVERLAY — portal to <body>: a transformed ancestor in the mission
          shell re-anchors position:fixed, misaligning the end animation. */}
      {synthOn && createPortal(
        <div id="synth-overlay" style={{ display: "flex" }}>
          <svg id="synth-svg" viewBox="0 0 700 500" ref={synthSvgRef} />
          <div id="synth-done" className={synthDone ? "show" : ""}>✓ OMNI FOOTPRINT CONFIRMED</div>
        </div>,
        document.body
      )}

      {/* BREACH OVERLAY — portal, same fixed-position anchoring issue */}
      {breachOn && createPortal(
        <div id="det-breach" className="active">
          <div className="det-breach-alert show" id="db-alert">{breachAlert}</div>
          <div className="det-breach-glitch show" id="db-glitch">{breachGlitch}</div>
          <div className="det-breach-reconnect show" id="db-reconnect">{breachRecon}</div>
        </div>,
        document.body
      )}

      {/* GAME OVER — portal, same fixed-position anchoring issue */}
      {gameOver && createPortal(
        <div id="gameover-overlay" className="active">
          <div className="go-label">// Operation Terminated</div>
          <div className="go-title">CONNECTION SEVERED</div>
          <div className="go-sub">MegaCorp&apos;s security closed the feed. Voss is exposed.<br />There is no second window into Marshall&apos;s desktop.</div>
          <button className="go-restart" onClick={() => window.location.reload()}>RESTART OPERATION</button>
        </div>,
        document.body
      )}

    </div>
  );

  // ── window render helper (declared via hoisted function) ──
  function renderWin(id: string, faIcon: string, title: string, status: string, body: React.ReactNode, bodyHeight = 240, plainBody = false) {
    const ws = winShared(id); if (!ws.visible) return null;
    const sized = pos[id].height != null || maximized.includes(id); // explicit/maximised height → body flexes
    return (
      <div key={id} id={id} className={ws.cls} style={ws.style} onMouseDown={() => bringFront(id)}>
        <div className="xp-tb" onMouseDown={(e) => startDrag(e, id)}>
          <div className="xp-title"><span className="xp-ti"><i className={`fas ${faIcon}`} /></span>{title}</div>
          <div className="xp-btns">{maxBtn(id)}<button className="xp-btn xp-cls" onClick={() => closeWin(id)}>✕</button></div>
        </div>
        <div className="xp-menu"><span className="xpm">File</span><span className="xpm">Edit</span><span className="xpm">View</span><span className="xpm">Insert</span><span className="xpm">Format</span></div>
        {plainBody ? body : <div className="xp-body xb-tab" style={sized ? undefined : { height: bodyHeight }}>{body}</div>}
        <div className="xp-status"><span>{status}</span></div>
        {resizeHandles(id)}
      </div>
    );
  }
}

export interface GameStats { timerSec: number; detection: number; errors: number; hintsUsed: number; decoy: number; click: number; verify: number; hint: number; passive: number }

// ── small inline pieces ──
function AnomalyPanel({ title, children, onVerify }: { title: string; children: React.ReactNode; onVerify: () => void }) {
  return (
    <div className="chart-anom-panel show" style={{ position: "absolute", inset: 0, zIndex: 250, overflowY: "auto" }}>
      <div className="cap-ttl">{title}</div>
      <div className="cap-txt">{children}</div>
      <button className="cap-btn" onClick={onVerify}>VERIFY LEAD →</button>
    </div>
  );
}

function RedBar({ data, labels, label, max }: { data: number[]; labels?: string[]; label: string; max?: number }) {
  return (
    <Bar
      data={{ labels: labels || ["Jul", "Aug", "Sep", "Oct"], datasets: [{ label, data, backgroundColor: "#4a7fc1", borderRadius: 2 }] }}
      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: "rgba(0,0,0,.06)" } }, y: max ? { max, grid: { color: "rgba(0,0,0,.06)" } } : { grid: { color: "rgba(0,0,0,.06)" } } } }}
    />
  );
}

// ── PPT VIEWER ──
function PptViewer({ slide, setSlide, zoom, setZoom, fundingActive, fundingLocked, fundingAnomalyShown, onFundingAnomaly, onVerifyFunding }: {
  slide: number; setSlide: (n: number) => void; zoom: number; setZoom: (n: number) => void;
  fundingActive: boolean; fundingLocked: boolean; fundingAnomalyShown: boolean; onFundingAnomaly: () => void; onVerifyFunding: () => void;
}) {
  const thumbs = ["Title Slide", "Executive Summary", "Revenue by Unit", "Budget Allocation", "Workforce Summary", "Risk Register", "Q4 Outlook"];
  return (
    <>
      <div className="ppt-menu">{["File", "Edit", "View", "Insert", "Format", "Slide Show"].map((m) => <span key={m} className="xpm">{m}</span>)}</div>
      <div className="ppt-body">
        <div className="ppt-thumbs">
          {thumbs.map((t, i) => (
            <div key={i} className={`ppt-thumb${slide === i ? " active" : ""}`} onClick={() => setSlide(i)}>
              <div className="ppt-thumb-inner">{t}</div><div className="ppt-thumb-num">{i + 1}</div>
            </div>
          ))}
        </div>
        <div className="ppt-main">
          {/* HTML layout: absolute .ppt-slide-title + content in .ppt-slide-body (starts below
              title). ppt-slide-title-only sits on the .ppt-slide element itself (slide 1). */}
          <div className={`ppt-slide${slide === 0 ? " ppt-slide-title-only" : ""}`} style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
            {slide === 0 && (
              <div className="ppt-slide-body" style={{ textAlign: "center" }}>
                <div style={{ marginBottom: 20 }}><span style={{ fontSize: 40, color: "#1a4fc8" }}>⬡</span><span style={{ fontFamily: "Space Grotesk,Arial", fontSize: 20, fontWeight: 700, color: "#0a1f5c", letterSpacing: 8, marginLeft: 4 }}>MEGACORP</span></div>
                <div style={{ fontSize: 10, color: "#1a4fc8", letterSpacing: 4, marginBottom: 12 }}>BOARD CONFIDENTIAL · OCTOBER 2003</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#0a1f5c", marginBottom: 12 }}>Q3 2003 Financial Performance Review</div>
                <div style={{ fontSize: 13, color: "#4a6a8a" }}>Prepared by R. Marshall, SVP Strategy</div>
              </div>
            )}
            {slide === 1 && (
              <>
                <div className="ppt-slide-title">Executive Summary</div>
                <div className="ppt-slide-body">
                <div className="ppt-stat-row">
                  {[["$284.7M", "Q3 Total Revenue", "+12% vs Q2"], ["$198.2M", "Operating Costs", "Within budget"], ["$86.5M", "Net Operating Profit", "+8% vs forecast"]].map((b, i) => (
                    <div key={i} className="ppt-stat-block"><div className="ppt-stat-num">{b[0]}</div><div className="ppt-stat-lbl">{b[1]}</div><div className="ppt-stat-sub">{b[2]}</div></div>
                  ))}
                </div>
                <div style={{ marginTop: 14, fontSize: 11, color: "#2a3a4a", lineHeight: 1.7 }}>All core divisions performed at or above Q3 targets. Strategic R&amp;D investment programme progressing — full cost centre detail in Appendix B.</div>
                </div>
              </>
            )}
            {slide === 2 && (
              <>
                <div className="ppt-slide-title">Q3 Revenue by Business Unit</div>
                <div className="ppt-slide-body">
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ width: "42%", minWidth: 180, height: 200 }}><PptRevenueChart /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <table className="ppt-tbl" style={{ fontSize: 13 }}>
                      <tbody>
                        <tr><th>Business Unit</th><th>Q3 ($M)</th><th>% of Q3</th></tr>
                        <tr><td>Enterprise Solutions</td><td>119.6</td><td>42%</td></tr>
                        <tr><td>Consumer Products</td><td>79.7</td><td>28%</td></tr>
                        <tr><td style={{ background: "#fff8e8", fontWeight: 600, borderLeft: "3px solid #8a5a00" }}>Classified Stakeholders</td><td style={{ background: "#fff8e8" }}>51.2</td><td style={{ background: "#fff8e8", fontWeight: 600, color: "#8a5a00" }}>18%</td></tr>
                        <tr><td>Licensing &amp; IP</td><td>34.2</td><td>12%</td></tr>
                        <tr className="ppt-total-row"><td>TOTAL</td><td>284.7</td><td>100%</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                </div>
              </>
            )}
            {slide === 3 && (
              <>
                <div className="ppt-slide-title">Q3 Department Budget Allocation</div>
                <div className="ppt-slide-body" style={{ position: "relative" }}>
                <table className="ppt-tbl" style={{ fontSize: 11 }}>
                  <tbody>
                    <tr><th>Department</th><th>Alloc ($M)</th><th>Spent ($M)</th><th>Variance</th></tr>
                    <tr><td>Operations</td><td>4.2</td><td>4.0</td><td>−$0.2M</td></tr>
                    <tr><td>IT Infrastructure</td><td>2.8</td><td>2.6</td><td>−$0.2M</td></tr>
                    <tr><td onClick={() => { if (fundingActive && !fundingLocked) onFundingAnomaly(); }} style={{ cursor: "pointer" }}>R&amp;D (Unallocated)</td><td>7.1</td><td>7.1</td><td>$0.0M</td></tr>
                    <tr><td>Marketing</td><td>6.4</td><td>6.1</td><td>−$0.3M</td></tr>
                    <tr><td>Legal &amp; Compliance</td><td>2.1</td><td>1.9</td><td>−$0.2M</td></tr>
                  </tbody>
                </table>
                <div style={{ width: "100%", height: 140, marginTop: 10 }}><PptBudgetChart /></div>
                {fundingAnomalyShown && (
                  <AnomalyPanel title="ANOMALY CONFIRMED" onVerify={onVerifyFunding}>The board report flags R&amp;D at $7.1M with zero underspend and no department owner on record. That line has no official destination.</AnomalyPanel>
                )}
                </div>
              </>
            )}
            {slide === 4 && (
              <>
                <div className="ppt-slide-title">Q3 Workforce Summary</div>
                <div className="ppt-slide-body">
                <div className="ppt-stat-row" style={{ marginBottom: 12 }}>
                  {[["4,847", "Total Headcount"], ["312", "Active Contractors"], ["94%", "Retention Rate"], ["2,940h", "Overtime Logged"]].map((b, i) => (
                    <div key={i} className="ppt-stat-block"><div className="ppt-stat-num" style={{ fontSize: 22 }}>{b[0]}</div><div className="ppt-stat-lbl">{b[1]}</div></div>
                  ))}
                </div>
                <div style={{ width: "100%", height: 150 }}><PptHeadcountChart /></div>
                <div style={{ fontSize: 9, color: "#6a7a8a", fontStyle: "italic", marginTop: 6 }}>Engineering headcount includes classified project allocations.</div>
                </div>
              </>
            )}
            {slide === 5 && (
              <>
                <div className="ppt-slide-title">Q3 Risk Register, Active Items</div>
                <div className="ppt-slide-body">
                <table className="ppt-tbl" style={{ fontSize: 11 }}>
                  <tbody>
                    <tr><th>Risk Item</th><th>Likelihood</th><th>Impact</th><th>Owner</th></tr>
                    <tr><td>Regulatory compliance review</td><td>Medium</td><td>High</td><td>Legal Dept.</td></tr>
                    <tr><td>IT infrastructure capacity</td><td>Low</td><td>Medium</td><td>IT Division</td></tr>
                    <tr><td>R&amp;D programme delivery</td><td>Low</td><td>High</td><td>SVP Strategy</td></tr>
                    <tr><td>Data security &amp; access ctrl</td><td>Low</td><td>High</td><td>IT Division</td></tr>
                  </tbody>
                </table>
                </div>
              </>
            )}
            {slide === 6 && (
              <>
                <div className="ppt-slide-title">Q4 2003, Strategic Priorities &amp; Outlook</div>
                <div className="ppt-slide-body">
                <div style={{ background: "linear-gradient(90deg,#0a1f5c,#1a4fc8)", color: "#fff", padding: "12px 16px", borderRadius: 4, fontSize: 11, fontWeight: 700, marginBottom: 12 }}>Full-year revenue guidance maintained at $1.12B · No material risks to profit outlook</div>
                <div className="ppt-card-row">
                  {[["📈 Revenue & Growth", "Q4 forecast: $301M (+6% vs Q3)"], ["💼 Investment & Costs", "R&D programme: final delivery phase"], ["⚙ Operational Focus", "IT security review: Oct 31 deadline"]].map((c, i) => (
                    <div key={i} className="ppt-card"><div className="ppt-card-ttl">{c[0]}</div><div className="ppt-card-txt">{c[1]}</div></div>
                  ))}
                </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="ppt-footer">
        <button className="ppt-nav" onClick={() => slide > 0 && setSlide(slide - 1)}>◀</button>
        <button className="ppt-nav" onClick={() => slide < 6 && setSlide(slide + 1)}>▶</button>
        <span className="ppt-counter">Slide {slide + 1} of 7</span>
        <div className="ppt-zoom">
          <button className="ppt-zoom-btn" onClick={() => setZoom(Math.min(200, zoom + 25))}>+</button>
          <span style={{ fontSize: 10, color: "#666", minWidth: 30, textAlign: "center", display: "inline-block" }}>{zoom}%</span>
          <button className="ppt-zoom-btn" onClick={() => setZoom(Math.max(50, zoom - 25))}>−</button>
        </div>
      </div>
    </>
  );
}
