"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line, PolarArea, Scatter } from "react-chartjs-2";
import {
  BUDGET_ALLOC,
  BUDGET_CX,
  BUDGET_HC,
  HEADCOUNT_AVG,
  HEADCOUNT_COLORS,
  HEADCOUNT_LABELS,
  PERSONNEL_AXIS,
  PERSONNEL_CODES,
  PERSONNEL_DIV_LABELS,
  PERSONNEL_H1,
  PERSONNEL_HOURS,
  PPT_BUDGET,
  PPT_HEADCOUNT,
  PPT_REVENUE,
  SERVER_DISK,
  SERVER_LOAD,
  SERVER_MONTHS,
  SERVER_NET,
} from "./gameData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
);

const GRID = "rgba(0,0,0,.06)";
const BLUE = "#4a7fc1";
const baseOpts = { responsive: true, maintainAspectRatio: false } as const;

/** Safari/WebKit often mounts Chart.js before the tab panel has layout height. */
function ChartBox({ children, className = "chart-canvas-wrap" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sync = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setReady(true);
        window.dispatchEvent(new Event("resize"));
      }
    };

    sync();
    const frame = requestAnimationFrame(sync);
    const timer = window.setTimeout(sync, 60);
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      ro.disconnect();
    };
  }, []);

  return <div className={className} ref={ref}>{ready ? children : null}</div>;
}

// ─── COMPUTE: Network throughput (line) ───────────────────────────────
export function NetworkChart() {
  return (
    <ChartBox>
      <Line
      data={{ labels: SERVER_MONTHS, datasets: [{ label: "GB", data: SERVER_NET, borderColor: BLUE, backgroundColor: "rgba(74,127,193,.12)", borderWidth: 2, pointRadius: 3, tension: 0.3, fill: true }] }}
      options={{ ...baseOpts, plugins: { legend: { display: false } }, scales: { x: { grid: { color: GRID } }, y: { grid: { color: GRID }, title: { display: true, text: "GB" } } } }}
    />
    </ChartBox>
  );
}

// ─── COMPUTE: Server load (line, Sep spike) ───────────────────────────
export function ServerLoadChart({ onAnomaly, onWrong }: { onAnomaly: () => void; onWrong: () => void }) {
  return (
    <ChartBox>
      <Line
      data={{ labels: SERVER_MONTHS, datasets: [{ label: "Load %", data: SERVER_LOAD, borderColor: BLUE, backgroundColor: "rgba(74,127,193,.12)", borderWidth: 2, tension: 0.3, pointRadius: 4, pointHoverRadius: 7, pointBackgroundColor: BLUE, fill: true }] }}
      options={{
        ...baseOpts,
        onHover: (e, els) => { const t = (e.native?.target as HTMLElement); if (t) t.style.cursor = els.length ? "pointer" : "default"; },
        onClick: (_e, els) => { if (!els.length) return; els[0].index === 8 ? onAnomaly() : onWrong(); },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => (ctx.dataIndex === 8 ? `${ctx.parsed.y}%, Ticket: Archived, DO NOT REOPEN` : `${ctx.parsed.y}%`) } },
        },
        scales: { x: { grid: { color: GRID } }, y: { grid: { color: GRID }, title: { display: true, text: "Load %" }, ticks: { callback: (v) => v + "%" } } },
      }}
    />
    </ChartBox>
  );
}

export function DiskChart() {
  return (
    <ChartBox>
      <Bar
      data={{ labels: SERVER_DISK.labels, datasets: [{ label: "Usage %", data: SERVER_DISK.data, backgroundColor: BLUE, borderRadius: 2 }] }}
      options={{ ...baseOpts, plugins: { legend: { display: false } }, scales: { x: { grid: { color: GRID } }, y: { max: 100, grid: { color: GRID }, ticks: { callback: (v) => v + "%" } } } }}
    />
    </ChartBox>
  );
}

// ─── FUNDING: Headcount costs / Capex / Budget allocation ─────────────
export function HCCostChart() {
  return (
    <ChartBox>
      <Bar
      data={{ labels: BUDGET_HC.labels, datasets: [{ label: "$M", data: BUDGET_HC.data, backgroundColor: BLUE, borderRadius: 2 }] }}
      options={{ ...baseOpts, plugins: { legend: { display: false } }, scales: { x: { grid: { color: GRID } }, y: { grid: { color: GRID }, title: { display: true, text: "$M" } } } }}
    />
    </ChartBox>
  );
}

export function CapexChart() {
  return (
    <ChartBox>
      <Bar
      data={{ labels: BUDGET_CX.labels, datasets: [{ label: "$M", data: BUDGET_CX.data, backgroundColor: BLUE, borderRadius: 2 }] }}
      options={{ ...baseOpts, plugins: { legend: { display: false } }, scales: { x: { grid: { color: GRID } }, y: { grid: { color: GRID }, title: { display: true, text: "$M" } } } }}
    />
    </ChartBox>
  );
}

export function BudgetAllocChart({ onAnomaly, onWrong }: { onAnomaly: () => void; onWrong: () => void }) {
  return (
    <ChartBox className="chart-canvas-wrap chart-canvas-wrap--short">
      <Bar
      data={{ labels: BUDGET_ALLOC.labels, datasets: [{ label: "$M", data: BUDGET_ALLOC.data, backgroundColor: BLUE, borderRadius: 2 }] }}
      options={{
        ...baseOpts,
        indexAxis: "y",
        onHover: (e, els) => { const t = (e.native?.target as HTMLElement); if (t) t.style.cursor = els.length ? "pointer" : "default"; },
        onClick: (_e, els) => { if (!els.length) return; els[0].index === BUDGET_ALLOC.anomalyIndex ? onAnomaly() : onWrong(); },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `$${ctx.parsed.x}M, ${BUDGET_ALLOC.owners[ctx.dataIndex]}` } },
        },
        scales: { x: { grid: { color: GRID }, title: { display: true, text: "$ Millions" } }, y: { grid: { color: GRID } } },
      }}
    />
    </ChartBox>
  );
}

// ─── PERSONNEL: H1 summary / September scatter ────────────────────────
export function H1Chart() {
  return (
    <ChartBox>
      <Line
      data={{ labels: PERSONNEL_H1.labels, datasets: PERSONNEL_H1.sets.map((s) => ({ label: s.label, data: s.data, borderColor: s.color, borderWidth: 1.5, pointRadius: 3, tension: 0.3, fill: false })) }}
      options={{ ...baseOpts, plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } }, scales: { x: { grid: { color: GRID } }, y: { grid: { color: GRID }, title: { display: true, text: "Hours" } } } }}
    />
    </ChartBox>
  );
}

export function SeptScatterChart({ onAnomaly, onWrong }: { onAnomaly: () => void; onWrong: () => void }) {
  const points = PERSONNEL_HOURS.map((h, i) => ({ x: i + 1, y: h, div: PERSONNEL_DIV_LABELS[i], code: PERSONNEL_CODES[i] }));
  return (
    <ChartBox className="chart-canvas-wrap chart-canvas-wrap--tall">
      <Scatter
      data={{ datasets: [{ label: "Overtime Hours", data: points as never, backgroundColor: BLUE, pointRadius: 8, pointHoverRadius: 11 }] }}
      options={{
        ...baseOpts,
        onHover: (e, els) => { const t = (e.native?.target as HTMLElement); if (t) t.style.cursor = els.length ? "pointer" : "default"; },
        onClick: (_e, els) => { if (!els.length) return; els[0].index === 2 ? onAnomaly() : onWrong(); },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => { const p = ctx.raw as { y: number; div: string; code: string }; return [`Division: ${p.div}`, `Overtime: ${p.y}h`, `Code: ${p.code}`]; } } },
        },
        scales: {
          x: { min: 0.5, max: 10.5, grid: { color: GRID }, ticks: { stepSize: 1, callback: (v) => PERSONNEL_AXIS[v as number] || "" } },
          y: { grid: { color: GRID }, title: { display: true, text: "Overtime Hours" } },
        },
      }}
    />
    </ChartBox>
  );
}

// ─── HEADCOUNT polar (cross-ref) ──────────────────────────────────────
export function HeadcountPolarChart() {
  const cbrt = HEADCOUNT_AVG.map((v) => Math.cbrt(v));
  return (
    <ChartBox>
      <PolarArea
      data={{ labels: HEADCOUNT_LABELS, datasets: [{ data: cbrt, backgroundColor: HEADCOUNT_COLORS, borderWidth: 1, borderColor: "rgba(255,255,255,.5)" }] }}
      options={{
        ...baseOpts,
        plugins: {
          legend: { position: "right", labels: { font: { size: 9 }, color: "#2a3a4a", boxWidth: 12, padding: 6 } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${HEADCOUNT_AVG[ctx.dataIndex]}h avg` } },
        },
        scales: { r: { ticks: { display: false }, grid: { color: "rgba(0,0,0,.07)" } } },
      }}
    />
    </ChartBox>
  );
}

// ─── PPT charts (board report) ────────────────────────────────────────
export function PptRevenueChart() {
  return (
    <ChartBox>
      <Doughnut
      data={{ labels: PPT_REVENUE.labels, datasets: [{ data: PPT_REVENUE.data, backgroundColor: PPT_REVENUE.colors, borderWidth: 1, borderColor: "#fff" }] }}
      options={{ ...baseOpts, cutout: "62%", plugins: { legend: { display: false } } }}
    />
    </ChartBox>
  );
}

export function PptBudgetChart() {
  return (
    <ChartBox>
      <Bar
      data={{ labels: PPT_BUDGET.labels, datasets: [{ label: "$M", data: PPT_BUDGET.data, backgroundColor: BLUE, borderRadius: 2 }] }}
      options={{ ...baseOpts, plugins: { legend: { display: false } }, scales: { x: { grid: { color: GRID }, ticks: { font: { size: 8 } } }, y: { grid: { color: GRID } } } }}
    />
    </ChartBox>
  );
}

export function PptHeadcountChart() {
  return (
    <ChartBox>
      <Bar
      data={{ labels: PPT_HEADCOUNT.labels, datasets: [{ label: "Headcount", data: PPT_HEADCOUNT.data, backgroundColor: BLUE, borderRadius: 2 }] }}
      options={{ ...baseOpts, plugins: { legend: { display: false } }, scales: { x: { grid: { color: GRID }, ticks: { font: { size: 7 } } }, y: { grid: { color: GRID } } } }}
    />
    </ChartBox>
  );
}
