// ══════════════════════════════════════════════════════════════════════
// MARGUS MISSION 1 — GAME DATA
// Ported faithfully from "Margus Mission 1 WIP.html" (newest version).
// 3 leads: COMPUTE · FUNDING · PERSONNEL
// ══════════════════════════════════════════════════════════════════════

export type LeadId = "compute" | "funding" | "personnel";

export interface VerifyParam {
  label: string;
  opts: string[];
  ans: number;
  err: string;
  crossRef?: boolean;
}

export interface Lead {
  label: string;
  icon: string;
  folder: string; // window id of the primary evidence file
  iconId: string; // desktop icon id
  seek: string;
  clue: string;
  folderMsg: string;
  lockMsg: string;
  hint: string;
  params: VerifyParam[];
}

export const LEAD_ORDER: LeadId[] = ["compute", "funding", "personnel"];

export const LEADS: Record<LeadId, Lead> = {
  compute: {
    label: "COMPUTE",
    icon: "⚡",
    folder: "win-server",
    iconId: "di-it",
    seek: "Look for unusual load patterns that don't match the normal baseline.",
    clue: "Something this scale doesn't run on air. OMNI needed serious compute resources, and that kind of drain doesn't vanish quietly. Open the IT Systems folder.",
    folderMsg:
      "That folder contains system diagnostics and infrastructure reports. Look for unusual load patterns, especially anything that doesn't match the normal baseline.",
    lockMsg:
      "September hit nearly 3× the yearly average, and it wasn't isolated. Something was running through that machine. Logged.",
    hint: "IT Systems → server_report.xls → Server Load tab. One month spikes clearly above the rest. Click that point and read the tooltip.",
    params: [
      {
        label: "WHICH MONTH HAD THE SPIKE?",
        opts: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        ans: 8,
        err: "Not that one, look at the chart, one month stands way above the rest",
      },
      {
        label: "WHAT DOES THE TICKET SAY?",
        opts: ['"Normal load"', '"Ticket: Archived, DO NOT REOPEN"', '"Scheduled maintenance"', '"Flagged for review"'],
        ans: 1,
        err: "Hover over the September bar, there's a tooltip with the exact ticket text",
      },
    ],
  },
  funding: {
    label: "FUNDING",
    icon: "◈",
    folder: "win-budget",
    iconId: "di-finance",
    seek: "Look for budget lines with no owner and amounts that don't add up.",
    clue: "An operation like OMNI has to be funded. That money has to appear somewhere in the books, even if it's buried. Open the Finance folder.",
    folderMsg: "The Finance folder has quarterly reports and budget breakdowns. You're looking for funding that's unallocated.",
    lockMsg: "$7.1 million with no owner and no department. That money went somewhere off the books. Logged.",
    hint: "Finance → budget_Q3.xls → Budget Allocation. Hover each bar for the owner. One line has no owner.\nQuestion 1 is in budget_Q3.xls. For questions 2–3: Finance → board_report_Q3.ppt → Workforce Summary slide and Revenue by Business Unit slide.",
    params: [
      {
        label: "WHICH COST CENTRE HAS NO OWNER?",
        opts: ["Operations", "IT Infrastructure", "R&D, Unallocated", "Marketing", "Legal & Compliance"],
        ans: 2,
        err: "Hover over each bar in the budget_Q3.xls chart, the tooltip shows the owner. one of them has no owner listed.",
      },
      {
        label: "ACCORDING TO THE WORKFORCE SUMMARY ON THE BOARD REPORT, WHICH DIVISION HAS THE HIGHEST HEADCOUNT?",
        opts: ["Operations", "Finance", "Sales & Marketing", "Engineering", "Legal"],
        ans: 3,
        err: "Check the board_report_Q3.ppt Workforce Summary slide. Look at the headcount bar chart to find which division has the longest bar.",
        crossRef: true,
      },
      {
        label: "WHAT PERCENTAGE OF Q3 REVENUE CAME FROM CLASSIFIED STAKEHOLDERS?",
        opts: ["12%", "18%", "28%", "42%", "51%"],
        ans: 1,
        err: "Check the board_report_Q3.ppt Revenue by Business Unit slide. Look at the doughnut chart for the classified stakeholders segment. If something isn't labeled directly as 'classified,' look for what doesn't fit the standard business unit pattern, that's your OMNI connection.",
        crossRef: true,
      },
    ],
  },
  personnel: {
    label: "PERSONNEL",
    icon: "◉",
    folder: "win-personnel",
    iconId: "di-hr",
    seek: "Look for redacted project codes and overtime hours that don't belong to any official project.",
    clue: "You don't build something like OMNI with a skeleton crew. Someone was putting serious hours into a project that wasn't meant to exist. The HR records are the place to look.",
    folderMsg:
      "The HR folder has staffing records and workforce reports. You're looking for a division that logged more hours than usual. For something like OMNI, they must have been working overtime.",
    lockMsg: "2,940 hours on a project that officially doesn't exist. Someone built something real. Logged.",
    hint: "HR → staffing_hours_Sep.doc → September Breakdown tab. One division is on a different scale. Hover dots for project codes.\nFor question 2: HR → staffing_ot_metrics_Sep.xls. For question 3: HR → auth_log_Sep.doc",
    params: [
      {
        label: "WHICH DIVISION LOGGED THE ANOMALOUS HOURS?",
        opts: ["Sales & Marketing", "Engineering (Std)", "Product Development", "Engineering Classified", "Operations"],
        ans: 3,
        err: "Hover over each dot on the scatter plot, the tooltip shows the project code. one of them is redacted.",
      },
      {
        label: "WHAT WAS THE AVERAGE OVERTIME HOURS PER EMPLOYEE IN ENGINEERING CLASSIFIED?",
        opts: ["8h", "13h", "18h", "23h", "47h"],
        ans: 3,
        err: "Open staffing_ot_metrics_Sep.xls in the HR folder, find the Engineering Classified staff count, then divide into the total overtime hours.",
        crossRef: true,
      },
      {
        label: "WHO AUTHORISED THE CLASSIFIED OVERTIME?",
        opts: ["M. Chen", "J. Peterson", "L. Torres", "R. Simmons", "R. Marshall"],
        ans: 4,
        err: "that information isn't in the overtime file. keep looking through the HR folder.",
        crossRef: true,
      },
    ],
  },
};

// ── FILE ICON HELPER ─────────────────────────────────────────────────
export function fileIconClass(filename: string): { fa: string; cls: string } {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, { fa: string; cls: string }> = {
    xls: { fa: "fa-file-excel", cls: "fi-xls" },
    xlsx: { fa: "fa-file-excel", cls: "fi-xls" },
    doc: { fa: "fa-file-word", cls: "fi-doc" },
    docx: { fa: "fa-file-word", cls: "fi-doc" },
    ppt: { fa: "fa-file-powerpoint", cls: "fi-ppt" },
    pptx: { fa: "fa-file-powerpoint", cls: "fi-ppt" },
    pdf: { fa: "fa-file-pdf", cls: "fi-pdf" },
    csv: { fa: "fa-file-csv", cls: "fi-csv" },
    txt: { fa: "fa-file-lines", cls: "fi-txt" },
    log: { fa: "fa-file-code", cls: "fi-log" },
    jpg: { fa: "fa-file-image", cls: "fi-img" },
    jpeg: { fa: "fa-file-image", cls: "fi-img" },
    png: { fa: "fa-file-image", cls: "fi-img" },
    zip: { fa: "fa-file-zipper", cls: "fi-zip" },
    tar: { fa: "fa-file-zipper", cls: "fi-zip" },
  };
  return map[ext] || { fa: "fa-file", cls: "fi-default" };
}

// ── FOLDER CONTENTS ──────────────────────────────────────────────────
export type FolderKey = "it" | "finance" | "hr" | "misc";

export interface FolderFile {
  nm: string;
  decoy?: boolean;
  redHerring?: boolean;
  unopenable?: boolean;
  msg?: string;
  win?: string; // window id to open
  fn?: string;  // special handler key
}

export const FOLDERS: Record<FolderKey, FolderFile[]> = {
  it: [
    { nm: "metrics_Q3.xls", redHerring: true, fn: "openSystemMetrics" },
    { nm: "backup_archive.tar", decoy: true, unopenable: true, msg: "That archive is useless, nothing in there touches what we're looking for. You just pinged the access log. Detection's up. Stay focused on the diagnostic reports." },
    { nm: "personal_notes.txt", fn: "openPersonalNotes" },
    { nm: "server_report.xls", win: "win-server" },
  ],
  finance: [
    { nm: "budget_Q3.xls", win: "win-budget" },
    { nm: "expenditure_q3.xls", redHerring: true, fn: "openOpexReport" },
    { nm: "board_report_Q3.ppt", fn: "openFinancePpt" },
    { nm: "travel.csv", decoy: true, unopenable: true, msg: "Travel claims. You just flagged an access log entry for nothing. Stay on the budget allocation files, that's where the money is buried." },
  ],
  hr: [
    { nm: "absence_log_Q3.xls", redHerring: true, fn: "openAbsenceLog" },
    { nm: "reviews_Q2.doc", decoy: true, unopenable: true, msg: "Performance reviews from Q2. Nothing in there connects to active projects. You just flagged an access entry for nothing." },
    { nm: "auth_log_Sep.doc", fn: "openHrAuth" },
    { nm: "staffing_ot_metrics_Sep.xls", fn: "openHeadcount" },
    { nm: "staffing_hours_Sep.doc", win: "win-personnel" },
  ],
  misc: [
    { nm: "golf_scores.xls", decoy: true, msg: "Dead end. Don't waste time on it." },
    { nm: "photo.jpg", decoy: true, msg: "Wrong file. Stay focused." },
    { nm: "books.txt", decoy: true, msg: "Nothing relevant. Keep searching." },
  ],
};

// ── DESKTOP ICONS ────────────────────────────────────────────────────
export interface DesktopIcon {
  id: string;
  label: string;
  top: number;
  left: number;
  win?: string;
  emoji?: string;
}

export const DESKTOP_ICONS: DesktopIcon[] = [
  { id: "di-it", label: "IT_Systems", top: 22, left: 14, win: "win-it" },
  { id: "di-finance", label: "Finance", top: 106, left: 14, win: "win-finance" },
  { id: "di-hr", label: "HR_Records", top: 190, left: 14, win: "win-hr" },
  { id: "di-misc", label: "Misc", top: 274, left: 14, win: "win-misc" },
  { id: "di-recycle", label: "Recycle Bin", top: 358, left: 14, emoji: "🗑️" },
];

// ── STICKY NOTES ─────────────────────────────────────────────────────
export interface Sticky {
  id: string;
  cls: string;
  top: number;
  right: number;
  header?: string;
  items: string[];
}

export const STICKIES: Sticky[] = [
  { id: "sty0", cls: "sticky-yellow", top: 22, right: 14, header: "THIS WEEK", items: ["SFO flight Fri 6am", "Jenkins call Wed", "Sub-Acct 7: do NOT escalate", "Dentist Thurs"] },
  { id: "sty1", cls: "sticky-pink", top: 220, right: 14, items: ["CFO verbal 09/14", "$47.2M, keep off tracker", "do not log"] },
  { id: "sty2", cls: "sticky-blue", top: 378, right: 14, items: ["voicemail, Stanton 09/28", "847TB out. Endpoint masked.", "Lab 7B standing down.", "Delete this note."] },
];

// ── HACK OVERLAY LINES ───────────────────────────────────────────────
export const HACK_LINES: { id: string; html: string; cls?: string }[] = [
  { id: "ht1", cls: "ht-g", html: "GHOST TERMINAL v3.1 - SECURE SHELL" },
  { id: "ht2", html: 'Tunnel: <span class="ht-a">192.168.44.71 [megacorp-internal]</span> &nbsp;·&nbsp; MAC spoof: <span class="ht-a">done</span>' },
  { id: "ht3", html: 'Credentials: <span class="ht-a">sysadmin@megacorp.internal</span> &nbsp;·&nbsp; 2FA bypass: <span class="ht-g">OK</span>' },
  { id: "ht4", html: 'Desktop stream: <span class="ht-g">MIRRORING LIVE - read-only</span>' },
  { id: "ht5", cls: "ht-o", html: "⚠  Any keystroke triggers host alert. Observe only." },
  { id: "ht6", html: 'Breach window: <span class="ht-r">30 minutes</span>' },
  { id: "ht7", html: '<span class="ht-cur"></span>' },
];

// ── DETECTION INFO (hover popover copy) ───────────────────────────────
export const DET_INFO: Record<string, { color: string; desc: string }> = {
  DARK: { color: "var(--ok)", desc: "You're running dark. MegaCorp hasn't picked up the mirror, stay on confirmed leads to keep it that way." },
  SCANNING: { color: "var(--warn)", desc: "Their security is starting to notice patterns in the feed. Nothing's locked onto you yet, but the noise is adding up." },
  ALERT: { color: "var(--danger)", desc: "Security is actively sweeping for you. Every wrong move now is costly, work only the leads you're sure of." },
  CRITICAL: { color: "var(--danger)", desc: "You're one slip from losing the feed. Stop guessing, lock only what the evidence proves." },
};

// ── DECOY / WRONG MESSAGE POOLS ──────────────────────────────────────
export const DECOY_MSGS = [
  "Nothing there. That file's clean.",
  "Wrong file. Stay focused.",
  "Dead end. Don't waste time on it.",
  "Nothing relevant. Keep searching.",
];
export const DECOY_DETECTION_MSGS = [
  "Wrong file. Detection meter just moved, be more careful.",
  "Nothing there. That interaction left a trace.",
  "Dead end, and now they're slightly closer to finding us.",
];
export const WRONG_CLICK_DETECTION_MSGS = [
  "Wrong data point. Detection just jumped, read the source again.",
  "Not the anomaly. That interaction flagged something.",
  "Incorrect, and that raised the detection risk. Look more carefully.",
];
export const WRONG_VERIFY_MSGS = [
  "Incorrect. Detection just climbed, re-read the source data.",
  "Wrong answer. That verification attempt raised the risk level.",
  "Not a match, and it cost us. Check the file again before you answer.",
];
export function wrongDataPointMsg() {
  const msgs = ["That value is in range. Find the outlier.", "Normal reading. Look for what doesn't belong."];
  return msgs[Math.floor(Math.random() * msgs.length)];
}
export function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── CHART DATASETS ───────────────────────────────────────────────────
export const SERVER_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const SERVER_NET = [152, 148, 161, 155, 143, 158, 167, 171, 164, 158, 145, 162];
export const SERVER_LOAD = [28, 31, 44, 26, 29, 72, 35, 33, 118, 81, 38, 27];
export const SERVER_ANOMALY_INDEX = 8; // September
export const SERVER_DISK = { labels: ["Node-A", "Node-B", "Node-C", "Node-D"], data: [56, 68, 58, 72] };

export const BUDGET_ALLOC = {
  labels: ["Operations", "IT Infrastructure", "R&D, Unallocated", "Marketing", "Legal & Compliance"],
  data: [4.2, 2.8, 7.1, 6.4, 2.1],
  owners: ["Ops Division", "IT Division", "[NO OWNER]", "Mktg Division", "Legal Dept."],
  anomalyIndex: 2,
};
export const BUDGET_HC = { labels: ["Operations", "IT Dept.", "Marketing", "Legal", "Admin"], data: [3.45, 2.62, 1.92, 1.77, 1.12] };
export const BUDGET_CX = { labels: ["Server Hardware", "Office Reno.", "SW Licences"], data: [1.4, 0.82, 0.58] };

export const PERSONNEL_DIV_LABELS = ["Sales & Mktg", "Engineering (Project Alpha)", "Engineering Classified", "Finance", "IT Operations", "Operations", "Legal & Compliance", "Product Development", "R&D (Std)", "Engineering (Std)"];
export const PERSONNEL_HOURS = [95, 1850, 2940, 62, 340, 185, 47, 670, 290, 520];
export const PERSONNEL_CODES = ["MKT-2003-09", "ENG-PA-2003-09", "[REDACTED]", "FIN-2003-09", "ITO-2003-09", "OPS-2003-09", "LEG-2003-09", "PRD-2003-09", "RND-2003-09", "ENG-2003-09"];
export const PERSONNEL_ANOMALY_INDEX = 2;
export const PERSONNEL_AXIS = ["", "S&M", "Eng PA", "Eng Class.", "Finance", "IT Ops", "Ops", "Legal", "Prod Dev", "R&D", "Eng (Std)"];

export const PERSONNEL_H1 = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  sets: [
    { label: "Sales & Mktg", data: [60, 65, 58, 72, 68, 67], color: "#4a7fc1" },
    { label: "Engineering", data: [200, 215, 208, 225, 220, 232], color: "#5a9cd6" },
    { label: "Finance", data: [28, 32, 30, 31, 29, 33], color: "#7ab3e0" },
    { label: "Operations", data: [80, 85, 78, 88, 82, 92], color: "#8ec6e8" },
  ],
};

export const HEADCOUNT_LABELS = ["Sales & Mktg", "Engineering (Std)", "Eng. Classified", "Finance", "IT Operations", "Operations", "Legal & Compliance", "Product Development", "R&D (Std)", "Eng. Project Alpha"];
export const HEADCOUNT_AVG = [0.2, 0.6, 23, 0.3, 1.6, 0.3, 0.5, 2.0, 1.3, 13.2];
export const HEADCOUNT_COLORS = [
  "rgba(74,127,193,.75)", "rgba(26,79,200,.75)", "rgba(106,58,154,.75)",
  "rgba(46,125,50,.75)", "rgba(10,159,216,.75)", "rgba(0,150,136,.75)",
  "rgba(138,90,0,.75)", "rgba(255,152,0,.75)", "rgba(67,160,71,.75)", "rgba(96,125,139,.75)",
];

// PPT charts
export const PPT_REVENUE = { labels: ["Enterprise", "Consumer", "Classified", "Licensing"], data: [119.6, 79.7, 51.2, 34.2], colors: ["#1a4fc8", "#0a9fd8", "#8a5a00", "#6a3a9a"] };
export const PPT_BUDGET = { labels: ["Operations", "IT Infra.", "R&D", "Marketing", "Legal"], data: [4.0, 2.6, 7.1, 6.1, 1.9] };
export const PPT_HEADCOUNT = { labels: ["Engineering", "Operations", "Sales & Mktg", "Finance", "Legal"], data: [2480, 920, 640, 410, 397] };

// ── DEBRIEF CONTENT ──────────────────────────────────────────────────
export const DEBRIEF = {
  eyebrow: "Mission 01 · Footprint Confirmed",
  title: "OMNI Footprint Confirmed · Debrief",
  tradecraft: [
    "Clean work. You moved through three systems while the sweep was running and you didn't blink. That doesn't happen by accident.",
    "What you just built is the <strong>Footprint Dossier</strong>. The evidence chain Zex needed to commit. Compute, funding, personnel, bound into one indictment. That's the artifact. That goes forward.",
    "The thing you actually did is <strong>Data Analysis</strong>. It's not a trick. It's three skills. You demonstrated all three.",
  ],
  pillars: [
    { tag: "skill one", title: "Read the surface.", text: "Dashboards are designed to look ordinary. The compute graph read routine until you noticed where it wasn't. You read what was there, not what they wanted you to see." },
    { tag: "skill two", title: "Pick the signal that means something.", text: "Any system this size has a thousand anomalies. Most are noise. You ignored the ones that didn't connect and locked the ones that did. That's judgment, not luck." },
    { tag: "skill three", title: "Tie one thread to another.", text: "One anomaly is a question. Three pointing at the same dead zone is an answer. The connection is the case." },
  ],
  cta: "CONTINUE TO MISSION 2, FORGING THE MASTER KEY →",
};

export function debriefRating(d: number): string {
  return d <= 5 ? "GHOST, completely undetected"
    : d <= 15 ? "CLEAN TRACE, barely a footprint"
    : d <= 35 ? "EXPOSED EDGE, they sensed something"
    : d <= 55 ? "PARTIAL EXPOSURE, the sweep got close"
    : d <= 75 ? "HIGH RISK, MegaCorp nearly closed the feed"
    : "COMPROMISED, the operation nearly collapsed";
}
