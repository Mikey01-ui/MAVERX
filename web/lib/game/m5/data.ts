import type { CrewId, FrameKey } from "@/lib/game/m5/types";

export const M5_CREW_COUNT = 4;
export const M5_REQUIRED_COMMITS = 4;

export const HACK_LINES = [
  { text: "MASTERMIND TERMINAL v5.0.0 — OPERATION OMNI", className: "ht-g" },
  { text: "Loading mission dossier from prior operations...", className: "ht-a" },
  { text: "[OK] Op 1 evidence — OMNI Footprint: VERIFIED", className: "ht-g" },
  { text: "[OK] Op 2 evidence — Ownership Map: CLEAN", className: "ht-g" },
  { text: "[OK] Op 3 evidence — Payload Cleared: VERIFIED", className: "ht-g" },
  { text: "[OK] Op 4 evidence — Flow Map: CLEAN", className: "ht-g" },
  { text: "[NOTICE] All four crew members present in secure channel", className: "ht-o" },
  { text: "⚡ VOSS: You've got the room. Don't waste it.", className: "ht-a" },
];

export const INTRO_CHAT = [
  { delay: 1200, sender: "Echo", text: "Four cards. Let's pick framing and visualisation before anyone else sees this. Work through each card — I'll give you one line of feedback per choice.", tone: "bm-h" as const },
];

export const EVIDENCE_CARDS = [
  { id: 1, op: "OP 1 — INFRASTRUCTURE", title: "OMNI Footprint Confirmed", finding: "Compute nodes, funding flows, personnel access, and operational scope verified across four system leads. ZEX objection answered." },
  { id: 2, op: "OP 2 — GOVERNANCE", title: "Ownership Map Clean", finding: "Four dataset ownership disputes resolved using Data Steward field and lineage evidence. ATLAS objection answered." },
  { id: 3, op: "OP 3 — ETHICS", title: "Payload Cleared", finding: "Ethical triage complete. PII exposure minimised. APPROVE / ANONYMISE / DROP decisions documented. NOVA objection answered." },
  { id: 4, op: "OP 4 — DATA FLOWS", title: "Flow Mapped", finding: "Data pipeline dependencies mapped. Bottlenecks identified and documented. Clean operational path confirmed. KADE objection answered." },
];

export const FRAME_OPTIONS: { key: FrameKey; label: string; icon: string }[] = [
  { key: "risk", label: "RISK", icon: "fa-triangle-exclamation" },
  { key: "opportunity", label: "OPPORTUNITY", icon: "fa-arrow-trend-up" },
  { key: "neutral", label: "NEUTRAL", icon: "fa-minus" },
];

/** Per-card button order from legacy Mission 5.html */
export const CARD_FRAME_ORDER: Record<number, FrameKey[]> = {
  1: ["risk", "opportunity", "neutral"],
  2: ["risk", "opportunity", "neutral"],
  3: ["risk", "neutral", "opportunity"],
  4: ["neutral", "opportunity", "risk"],
};

export const FRAME_GLOSS =
  "How you position the evidence for the audience. Risk-focused highlights threats and gaps. Opportunity-focused highlights reasons to proceed. Neutral presents facts only — rarely the strongest choice when someone has a specific objection to address.";

export const VIZ_GLOSS =
  "The format used to show the evidence. Must match the type of data — a node map proves connectivity, a traffic light grid shows decisions, a matrix shows ownership. Wrong format makes the room do extra work.";

export function frameOptionsForCard(cardId: number) {
  const byKey = Object.fromEntries(FRAME_OPTIONS.map((opt) => [opt.key, opt])) as Record<FrameKey, (typeof FRAME_OPTIONS)[number]>;
  return CARD_FRAME_ORDER[cardId].map((key) => byKey[key]);
}

export const VIZ_OPTIONS: Record<number, { key: string; label: string; icon: string }[]> = {
  1: [
    { key: "bar", label: "BAR CHART", icon: "fa-chart-column" },
    { key: "table", label: "TABLE", icon: "fa-table" },
    { key: "node", label: "NODE MAP", icon: "fa-circle-nodes" },
  ],
  2: [
    { key: "lineage", label: "LINEAGE", icon: "fa-diagram-project" },
    { key: "matrix", label: "MATRIX", icon: "fa-table-cells" },
    { key: "pie", label: "PIE CHART", icon: "fa-chart-pie" },
  ],
  3: [
    { key: "heat", label: "HEATMAP", icon: "fa-fire" },
    { key: "traffic", label: "TRAFFIC GRID", icon: "fa-traffic-light" },
    { key: "pii", label: "PII LIST", icon: "fa-list" },
  ],
  4: [
    { key: "gantt", label: "GANTT", icon: "fa-bars-staggered" },
    { key: "flow", label: "PROCESS FLOW", icon: "fa-arrow-right-arrow-left" },
    { key: "sourcetable", label: "SOURCE TABLE", icon: "fa-table" },
  ],
};

export const ECHO_FRAME: Record<number, { correct: FrameKey; msgs: Record<FrameKey, string> }> = {
  1: { correct: "opportunity", msgs: { opportunity: "ZEX wants proof it's real, not a risk briefing. That framing lands.", risk: "ZEX doesn't care about exposure — he cares about existence. Reconsider.", neutral: "Neutral doesn't answer his objection. He needs a reason to commit." } },
  2: { correct: "risk", msgs: { risk: "ATLAS needs the governance map to be clean before he touches the routing. That framing confirms it.", opportunity: "Framing a governance card as opportunity reads like you're hiding the disputes. ATLAS will notice.", neutral: "Neutral leaves ATLAS with nothing to evaluate. He won't commit on nothing." } },
  3: { correct: "risk", msgs: { risk: "NOVA walked away from two operations. She needs to see the risk was taken seriously, not erased.", opportunity: "Opportunity framing on an ethics card tells NOVA you treated it as a speed bump. She will not commit.", neutral: "NOVA doesn't read neutral as safe. She reads it as avoidance." } },
  4: { correct: "opportunity", msgs: { opportunity: "KADE runs logistics. Opportunity framing tells him there is a clean path. That is exactly what he needs.", risk: "Risk framing on a flow card tells KADE the pipeline is broken. That is the opposite of the finding.", neutral: "KADE needs to know it's clear to go. Neutral doesn't tell him that." } },
};

export const ECHO_VIZ: Record<number, { correct: string; msgs: Record<string, string> }> = {
  1: { correct: "node", msgs: { node: "A node map shows the skeleton. He can't argue with a skeleton.", bar: "Numbers without topology won't convince him the system is real.", table: "A table looks like a spreadsheet. ZEX needs to see the structure." } },
  2: { correct: "matrix", msgs: { matrix: "The matrix makes ownership legible in two seconds. That's what you need.", lineage: "A lineage diagram shows flow, not ownership. He'll ask who controls it.", pie: "A pie chart implies volume equals ownership. It doesn't." } },
  3: { correct: "traffic", msgs: { traffic: "Traffic lights. Even someone who has never seen a dataset understands that grid in three seconds.", pii: "A list of removed fields is a technical artefact, not a story. NOVA needs to see the decision.", heat: "A heatmap adds complexity the finding doesn't require. Keep it readable." } },
  4: { correct: "flow", msgs: { flow: "A process flow is the only thing KADE will accept as proof you understand how data moves.", gantt: "A Gantt implies scheduling, not mapping. He'll think you missed the point.", sourcetable: "A table removes the visual clarity of flow. KADE thinks in pipelines." } },
};

export const CREW_QUESTIONS: Record<CrewId, { text: string; opts: string[]; ans: number; commit: string; sceptical: string }> = {
  zex: { text: '"You confirmed the four leads — compute, funding, personnel, scope. But what does the node map actually let me conclude, and what does it NOT?"', opts: ["That all four components are connected as one system — but not that any of them is currently switched on.", "That the entire system is live and running at this moment, so the exploit can be built against confirmed real-time activity right now.", "That the four leads each exist on their own, while telling us nothing about whether they connect to one another at all."], ans: 0, commit: "ZEX: Right — connectivity confirmed, live status unknown. Honest read. I'll write the exploit.", sceptical: "ZEX: You're claiming more than the map shows, or less. A node map proves links, not live status. Look again." },
  atlas: { text: '"The ownership matrix looks clean. When a dataset crosses a department boundary in the lineage, who governs it?"', opts: ["The department that ends up using it most often downstream automatically takes over governance of the dataset from then on.", "Whichever department originally created the data simply keeps full ownership of it wherever it later happens to travel.", "The department with verified, formal accountability under policy — not the creator, not the heaviest user."], ans: 2, commit: "ATLAS: That's the answer. I'll route through the map.", sceptical: "ATLAS: That's one of the most common governance errors there is. Think about Op 2 again." },
  nova: { text: '"You cleared the payload. When is anonymisation NOT enough, and a dataset has to be dropped entirely?"', opts: ["When the purpose or basis of collection is itself harmful — consent, targeting, intent — not just whether names show.", "When the dataset happens to contain more identifying fields than a set numerical threshold is judged to allow for safe processing.", "Never, really — anonymisation is always enough once the obvious identifying fields have all been stripped from the records."], ans: 0, commit: "NOVA: That's the right answer. I'm in.", sceptical: "NOVA: Anonymisation isn't a universal fix. You learned that in Op 3. Think it through again." },
  kade: { text: '"The flow diagram looks clean. What does a bottleneck in a data pipeline actually mean for an operation like this?"', opts: ["A step where several dependencies converge — if it fails, everything downstream stalls.", "A step that simply runs slower than the others, delaying the overall process without ever actually breaking the pipeline itself.", "A point where too many separate sources feed in and the data quality quietly degrades over time."], ans: 0, commit: "KADE: Correct. That's the one thing I needed to hear. I'm in.", sceptical: "KADE: That's a timing or quality issue, not a dependency chain. There's a difference. Think again." },
};

export const CREW_ORDER: CrewId[] = ["zex", "atlas", "nova", "kade"];

export const CREW_META: Record<CrewId, { name: string; domain: string; color: string; initial: string; avatarBg: string }> = {
  zex: { name: "ZEX", domain: "INFRASTRUCTURE · DATA ANALYSIS", color: "var(--orange)", initial: "Z", avatarBg: "rgba(247,148,33,.12)" },
  atlas: { name: "ATLAS", domain: "GOVERNANCE · DATA OWNERSHIP", color: "var(--green-stable)", initial: "A", avatarBg: "rgba(0,196,28,.08)" },
  nova: { name: "NOVA", domain: "ETHICS · PRIVACY", color: "var(--pink)", initial: "N", avatarBg: "rgba(211,25,114,.10)" },
  kade: { name: "KADE", domain: "PROCESS · DATA FLOWS", color: "var(--purple-light)", initial: "K", avatarBg: "rgba(143,68,232,.10)" },
};

export const DEBRIEF = {
  eyebrow: "// Mission 05 — Debrief",
  title: "The Final Brief — Operation Complete",
  cta: "RETURN TO HUB →",
};
