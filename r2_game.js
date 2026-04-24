'use strict';
const CHARTS = {};
const GS = {
  locked: new Set(), activeNode: null, calNode: null,
  chipIdx: [], errors: 0,
  budget: 50000, budgetStart: 50000,
  decoyPenalties: 0, clickPenalties: 0, calPenalties: 0, hintPenalties: 0,
  hintsUsed: 0,
  brokerOpen: true, hackDone: false, hintCooldown: false, lastSender: null,
  slideIdx: 0, timerSec: 0, timerInt: null, zTop: 100, openWins: new Set(),
  currentStep: 0,
  detectionRisk: 0, gameOver: false, atlasMuted: false, hrAtlasStarted: false,
  hrAtlasT0: 0,
  detWarn50: false, detWarn80: false, allowAtlasOnce: false
};
const BUDGET_WARNED = { 30000: false, 15000: false, 5000: false };
const NODE_ORDER = ['it', 'finance', 'hr', 'vault'];
const NODES = {
  it: {
    label: 'IT INFRASTRUCTURE', iconId: null, nexusRecord: 'win-nexus-it',
    clue: "OMNI needed a server cluster running at impossible load. The IT Infrastructure NEXUS record has a process link field that shouldn't be there. Find it.",
    hint: "IT Infrastructure record → scroll every field row → look for a Process Links field. The value is masked but it's there.",
    lockMsg: "SVC-NULL-7B. A masked service process with no owner, no ticket, no documentation. That's OMNI's compute layer.",
    params: [
      { label: 'Which field contains the hidden process link?', opts: ['Dataset Name', 'Owner', 'Process Links', 'Status', 'Record Count'], ans: 2, err: 'Read every field in the IT record. One of them has a value that does not belong.' },
      { label: 'What is the process identifier?', opts: ['SVC-CORE-1A', 'SVC-INFRA-3C', 'SVC-NULL-7B', 'SVC-BACKUP-2D', 'SVC-AUDIT-5F'], ans: 2, err: 'The process ID is in the Process Links field.' },
      { label: 'What is the access status of this process?', opts: ['ACTIVE', 'SUSPENDED', 'ARCHIVED', 'MASKED', 'FLAGGED'], ans: 3, err: 'Look at the value next to the process ID in square brackets.' }
    ]
  },
  finance: {
    label: 'FINANCE', iconId: null, nexusRecord: 'win-nexus-finance',
    clue: "The $7.1M had to go somewhere. The Finance NEXUS record has a vendor registry. One vendor doesn't exist. Find it.",
    hint: "Finance record → Vendor Registry → hover each bar in the chart. One vendor ID has no verified name.",
    lockMsg: "Palladian Systems. A shell vendor with $7.1M routed through it and no verifiable corporate registration. That's where OMNI's funding went.",
    params: [
      { label: 'What is the anomalous vendor ID?', opts: ['VENDOR-ID-03', 'VENDOR-ID-07', 'VENDOR-ID-11', 'PALLADIAN-SYS-EXT', 'VENDOR-ID-14'], ans: 3, err: 'Find the vendor that has UNVERIFIED status.' },
      { label: 'What is the vendor status?', opts: ['ACTIVE', 'PENDING', 'SUSPENDED', 'UNVERIFIED', 'ARCHIVED'], ans: 3, err: 'The status is shown in square brackets next to the vendor ID.' },
      { label: 'How much was routed to this vendor in Q3?', opts: ['$2.1M', '$2.8M', '$4.2M', '$7.1M', '$7.8M'], ans: 3, err: 'Hover the vendor bar in the chart.' }
    ]
  },
  hr: {
    label: 'HUMAN RESOURCES', iconId: null, nexusRecord: 'win-nexus-hr',
    clue: "Those 2,940 engineering hours weren't just overtime. The HR NEXUS record has an export history. Click to expand it. One export went somewhere it was never supposed to go.",
    hint: "HR record → Export History → click to expand the 3 exports. Read the destination of the third one carefully.",
    lockMsg: "4,847 employee records. Exported to a classified destination on 30-Sep-2003. That's OMNI's training data. It was built on MegaCorp's own people.",
    params: [
      { label: 'How many exports occurred in Q3 2003?', opts: ['1', '2', '3', '4', '5'], ans: 2, err: 'Open the HR record and expand the Export History field.' },
      { label: 'What is the name of the anomalous export?', opts: ['HR_REPORT_Q2.pdf', 'HEADCOUNT_Q3.xlsx', 'dataset_feed_03_ENG', 'personnel_summary.csv', 'archive_Q3.zip'], ans: 2, err: 'Expand the export history. The third export has a different format.' },
      { label: 'How many employee records were in the export?', opts: ['312', '842', '2940', '4847', '18442'], ans: 3, err: 'The record count is shown in the third export row.' },
      { label: 'Who authorised the export?', opts: ['HR Director', 'IT Division', 'R. Marshall', 'M. Chen', '[REDACTED]'], ans: 2, err: 'The authorisation is not in the export history. Check the record owner field.', crossRef: true }
    ]
  },
  vault: {
    label: 'DATAVAULT', iconId: null, nexusRecord: 'win-nexus-vault',
    clue: "The encrypted file wasn't just sitting in the vault. It was being mirrored somewhere external. Find the mirror target in the DataVault NEXUS record.",
    hint: "DataVault record → Mirror Status is ACTIVE → there is a Mirror Target field. Read the destination address.",
    lockMsg: "palladian-node-ext-01. The same Palladian Systems from the Finance trail. OMNI's output layer was being mirrored to an external node in real time. The circle closes.",
    params: [
      { label: 'What is the mirror target address?', opts: ['megacorp-backup-01', 'vault-archive-ext', 'palladian-node-ext-01', 'sec7-mirror-node', 'omni-output-layer'], ans: 2, err: 'Find the Mirror Target field in the DataVault NEXUS record.' },
      { label: 'What is the mirror status?', opts: ['INACTIVE', 'PENDING', 'SUSPENDED', 'ACTIVE', 'ARCHIVED'], ans: 3, err: 'The Mirror Status field is in the DataVault record.' },
      { label: 'When was the vault status changed to RESTRICTED?', opts: ['14-Sep-2003', '21-Sep-2003', '28-Sep-2003', '30-Sep-2003', '01-Oct-2003'], ans: 2, err: 'The restriction date is shown next to the RESTRICTED status.' }
    ]
  }
};

const DECOY_MSGS = [
  "That field is standard metadata. Keep reading.",
  "Nothing anomalous there. Look more carefully.",
  "Wrong record. That's clean data.",
  "Read every field. The connection is in there."
];
const WRONG_CLICK_BUDGET_MSGS = [
  "That just cost us $750. Read the data.",
  "$750 gone. Wrong field. Try again.",
  "We can't afford sloppy reads. $750."
];

function updateClock() {
  const el = document.getElementById('clock');
  if (el) el.textContent = new Date().toTimeString().slice(0, 8);
}
updateClock();
setInterval(updateClock, 1000);

function goToPage(pageNum) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.getElementById('page' + pageNum).classList.add('active');
  window.scrollTo(0, 0);
}

function startBreachGame() {
  const intro = document.getElementById('intro-root');
  const gp = document.getElementById('gp-root');
  if (intro) intro.style.display = 'none';
  if (gp) {
    gp.style.display = 'block';
    document.documentElement.classList.add('gp-html-active');
    document.body.classList.add('gp-gameplay-active');
  }
  requestAnimationFrame(() => requestAnimationFrame(() => startGame()));
}

function startGame() {
  document.getElementById('game').style.display = 'flex';
  buildCharts();
  startTimer();
  runHackSequence();
}

function startTimer() {
  GS.timerInt = setInterval(() => {
    GS.timerSec++;
    const m = String(Math.floor(GS.timerSec / 60)).padStart(2, '0');
    const s = String(GS.timerSec % 60).padStart(2, '0');
    document.getElementById('timer').textContent = m + ':' + s;
  }, 1000);
}

function runHackSequence() {
  const ho = document.getElementById('hack-overlay');
  ho.classList.add('active');
  const delays = [300, 620, 960, 1280, 1600, 1930, 2260];
  ['ht1', 'ht2', 'ht3', 'ht4', 'ht5', 'ht6', 'ht7'].forEach((id, i) => {
    setTimeout(() => { const e = document.getElementById(id); if (e) e.classList.add('show'); }, delays[i]);
  });
  setTimeout(() => {
    ho.style.transition = 'opacity 0.7s ease';
    ho.style.opacity = '0';
    setTimeout(() => {
      ho.classList.remove('active');
      ho.style.opacity = '';
      ho.style.transition = '';
      revealDesktop();
    }, 720);
  }, 3350);
}

function revealDesktop() {
  GS.hackDone = true;
  document.getElementById('nexus-main').classList.add('has-win');
  initGuidedFlow();
  initResizableNexus();
  setTimeout(() => brokerSay("We're in NEXUS. Marshall's credentials. He's in a budget meeting — we have a window.", 'bm-d'), 700);
  setTimeout(() => brokerSay("OMNI was scrubbed from the registry but its connections weren't. Four records. Four fragments. Start with IT.", 'bm-d'), 2200);
  setTimeout(() => brokerSay("Atlas is watching. Don't give him a reason to walk.", 'bm-d'), 4200);
}

function initGuidedFlow() {
  GS.currentStep = 0;
  NODE_ORDER.forEach(nid => {
    document.getElementById('node-' + nid).className = 'node n-dimmed';
    document.getElementById('ns-' + nid).textContent = 'LOCKED';
  });
  document.getElementById('node-it').className = 'node n-start';
  document.getElementById('ns-it').textContent = 'START HERE →';
  document.getElementById('eb-step').textContent = 'FRAGMENT 1 OF 4';
  document.getElementById('frag-count').textContent = '0';
}

function addDetection(pct) {
  if (GS.gameOver) return;
  GS.detectionRisk = Math.min(100, GS.detectionRisk + pct);
  updateDetectionUI();
  if (GS.detectionRisk >= 50 && !GS.detWarn50) {
    GS.detWarn50 = true;
    setTimeout(() => brokerSay("Detection risk is climbing. Slow down and read before you click.", 'bm-err'), 400);
  }
  if (GS.detectionRisk >= 80 && !GS.detWarn80) {
    GS.detWarn80 = true;
    setTimeout(() => brokerSay("We are very close to being flagged. One more mistake and NEXUS locks the session.", 'bm-err'), 400);
  }
  if (GS.detectionRisk >= 100) triggerGameOver();
}

function updateDetectionUI() {
  const p = Math.round(GS.detectionRisk);
  const el = document.getElementById('detection-pct');
  const el2 = document.getElementById('detection-pct-2');
  const f = document.getElementById('det-bar-fill');
  const f2 = document.getElementById('det-bar-fill-2');
  if (el) el.textContent = p + '%';
  if (el2) el2.textContent = p + '%';
  if (f) {
    f.style.width = p + '%';
    f.classList.remove('amber', 'red');
    if (p >= 80) f.classList.add('red');
    else if (p >= 50) f.classList.add('amber');
  }
  if (f2) {
    f2.style.width = p + '%';
    f2.classList.remove('amber', 'red');
    if (p >= 80) f2.classList.add('red');
    else if (p >= 50) f2.classList.add('amber');
  }
}

function triggerGameOver() {
  if (GS.gameOver) return;
  GS.gameOver = true;
  clearInterval(GS.timerInt);
  document.getElementById('gameover-overlay').classList.add('show');
}

function nexusSelectRoot() {
  document.getElementById('nexus-main').textContent = 'Select a record from the navigation tree to view dataset metadata.';
}

function nexusOpenRecord(id) {
  if (!GS.hackDone || GS.gameOver) return;
  openWin('win-nexus-' + id);
  if (id === 'it') buildNxItChart();
  if (id === 'finance') buildNxFinChart();
  if (id === 'hr') buildNxHrChart();
  if (id === 'vault') buildVaultMiniHeat();
  setTimeout(() => {
    const map = { it: CHARTS.nxIt, finance: CHARTS.nxFin, hr: CHARTS.nxHr };
    const ch = map[id];
    if (ch && typeof ch.resize === 'function') ch.resize();
  }, 80);
}

function nexusOpenLogs() {
  if (!GS.hackDone || GS.gameOver) return;
  deductBudget(500, 'decoy');
  addDetection(3);
  brokerSay(DECOY_MSGS[Math.floor(Math.random() * DECOY_MSGS.length)], 'bm-err');
  openWin('win-nexus-logs');
}

function nexusRedacted() {
  if (!GS.hackDone || GS.gameOver) return;
  deductBudget(500, 'decoy');
  addDetection(3);
  brokerSay("That folder is locked. Don't touch it or we trip an alert.", 'bm-err');
}

function toggleHrExports() {
  const sub = document.getElementById('hr-export-sub');
  if (sub) sub.classList.toggle('open');
}

function nxClickAnom(nid) {
  if (!GS.hackDone || GS.gameOver) return;
  if (GS.activeNode !== nid) {
    GS.errors++;
    deductBudget(750, 'click');
    addDetection(8);
    brokerSay(DECOY_MSGS[Math.floor(Math.random() * DECOY_MSGS.length)], 'bm-err');
    setTimeout(() => brokerSay(WRONG_CLICK_BUDGET_MSGS[Math.floor(Math.random() * WRONG_CLICK_BUDGET_MSGS.length)], 'bm-err'), 600);
    return;
  }
  const cap = document.getElementById('cap-' + nid);
  if (cap) showAnomalyPanel(cap.id);
}

function nxHrExport3() {
  if (!GS.hackDone || GS.gameOver) return;
  if (GS.activeNode !== 'hr') {
    GS.errors++;
    deductBudget(750, 'click');
    addDetection(8);
    brokerSay("Wrong record. That's clean data.", 'bm-err');
    return;
  }
  const cap = document.getElementById('cap-hr');
  if (cap) showAnomalyPanel('cap-hr');
  if (!GS.hrAtlasStarted) {
    GS.hrAtlasStarted = true;
    GS.hrAtlasT0 = Date.now();
    setTimeout(() => atlasSay('Stop.'), 800);
    setTimeout(() => atlasSay("That's not infrastructure data. Those are people's records."), 2800);
    setTimeout(() => {
      atlasSay("Continue. But understand what you're looking at.");
      const atl = document.querySelector('[data-name="Atlas"]');
      if (atl) atl.classList.replace('offline', 'online');
      GS.atlasMuted = true;
    }, 5200);
    setTimeout(() => zexSay("He's right. 4,847 people. None of them consented to this."), 7000);
  }
}

function showAnomalyPanel(capId) {
  const cap = document.getElementById(capId);
  if (!cap) return;
  const win = cap.closest('.nx-win');
  if (!win) { cap.classList.add('show'); return; }
  cap._origParent = cap.parentElement;
  cap._origNext = cap.nextSibling;
  Object.assign(cap.style, { position: 'absolute', inset: '0', zIndex: '250', overflowY: 'auto' });
  win.appendChild(cap);
  cap.classList.add('show');
}

function hideCap(capId) {
  const cap = document.getElementById(capId);
  if (!cap) return;
  cap.classList.remove('show');
  if (cap._origParent) {
    if (cap._origNext) cap._origParent.insertBefore(cap, cap._origNext);
    else cap._origParent.appendChild(cap);
    Object.assign(cap.style, { position: '', inset: '', zIndex: '', overflowY: '' });
    cap._origParent = null;
  }
}

function buildCharts() {
  buildNxItChart();
  buildNxFinChart();
  buildNxHrChart();
  buildVaultMiniHeat();
}

function buildNxItChart() {
  const ctx = document.getElementById('chartNxIt');
  if (!ctx || CHARTS.nxIt) return;
  const sectors = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
  CHARTS.nxIt = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: sectors.map((s, i) => ({
        label: 'Sector ' + (i + 1),
        data: i === 6
          ? [20, 20, 20, 20, 20, 20, 21, 21, 118, 95, 40, 28]
          : Array(12).fill(20 + i * 0.35),
        borderColor: '#4a7fc1',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.2
      }))
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { title: { display: true, text: 'Load %' } } } }
  });
}

function buildNxFinChart() {
  const ctx = document.getElementById('chartNxFin');
  if (!ctx || CHARTS.nxFin) return;
  const labels = [];
  for (let i = 1; i <= 13; i++) labels.push('Vendor ' + i);
  labels[13] = 'ID 14';
  const data = [120, 80, 45, 200, 90, 150, 60, 400, 55, 300, 110, 95, 7100];
  CHARTS.nxFin = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{ label: '$K', data: data, backgroundColor: '#4a7fc1' }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => {
              const v = c.parsed.x;
              if (c.dataIndex === 13) return '$7.1M — [UNVERIFIED]';
              return '$' + v + 'K';
            }
          }
        }
      },
      scales: { x: { title: { display: true, text: 'Payment' } } }
    }
  });
}

function buildNxHrChart() {
  const ctx = document.getElementById('chartNxHr');
  if (!ctx || CHARTS.nxHr) return;
  CHARTS.nxHr = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'dept',
        data: [
          { x: 2, y: 12 }, { x: 3, y: 18 }, { x: 4.2, y: 24 }, { x: 1, y: 8 },
          { x: 4, y: 40 }, { x: 2.5, y: 15 }, { x: 6, y: 90 }, { x: 3.2, y: 22 },
          { x: 5.1, y: 890 }
        ],
        backgroundColor: '#4a7fc1',
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(c) {
              const y = c.parsed.y;
              if (y > 400) return 'ENG-CLASS · access ' + y;
              return 'dept · access ' + y;
            }
          }
        }
      },
      scales: {
        x: { title: { display: true, text: 'Record age (y)' } },
        y: { title: { display: true, text: 'Accesses Q3' } }
      }
    }
  });
}

function buildVaultMiniHeat() {
  const t = document.getElementById('vault-heat-mini');
  if (!t || t.dataset.done) return;
  t.dataset.done = '1';
  let h = '<tr><th>File</th>';
  for (let w = 1; w <= 13; w++) h += '<th>W' + w + '</th>';
  h += '</tr>';
  const row = [4, 3, 5, 4, 6, 3, 4, 5, 3, 4, 2, 3, 0];
  h += '<tr><td>CLASSIFIED_INITIATIVE.enc</td>';
  row.forEach(v => {
    const bg = v === 0 ? '#333' : v > 10 ? '#1a3a6a' : '#5a88c8';
    h += '<td style="background:' + bg + ';text-align:center">' + v + '</td>';
  });
  h += '</tr>';
  t.innerHTML = h;
}

function openWin(id) {
  const w = document.getElementById(id);
  if (!w) return;
  w.classList.add('visible');
  GS.openWins.add(id);
  bringFront(id);
}

function closeWin(id) {
  const w = document.getElementById(id);
  if (!w) return;
  w.classList.remove('visible');
  GS.openWins.delete(id);
}

function bringFront(id) {
  const w = document.getElementById(id);
  if (!w || !w.classList.contains('nx-win')) return;
  GS.zTop++;
  w.style.zIndex = GS.zTop;
}

function dragWin(e, id) {
  if (e.target.classList.contains('nx-btn')) return;
  bringFront(id);
  const win = document.getElementById(id);
  const panel = document.getElementById('desktop-panel');
  const pR = panel.getBoundingClientRect();
  const sx = e.clientX, sy = e.clientY;
  const wx0 = win.offsetLeft, wy0 = win.offsetTop;
  function onMove(e) {
    let nx = wx0 + (e.clientX - sx), ny = wy0 + (e.clientY - sy);
    nx = Math.max(0, Math.min(nx, pR.width - win.offsetWidth));
    ny = Math.max(0, Math.min(ny, pR.height - 28 - win.offsetHeight));
    win.style.left = nx + 'px';
    win.style.top = ny + 'px';
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  e.preventDefault();
}

function toggleMaximise(id) {
  const w = document.getElementById(id);
  if (!w) return;
  w.classList.toggle('xwin-max');
}

function initResizableNexus() {
  document.querySelectorAll('.nx-win').forEach(w => {
    if (w.dataset.r) return;
    w.dataset.r = '1';
    ['e', 's', 'se'].forEach(dir => {
      const h = document.createElement('div');
      h.className = 'xp-rh xp-rh-' + dir;
      h.addEventListener('mousedown', e => resizeNexus(e, w.id, dir));
      w.appendChild(h);
    });
  });
}

const WIN_MIN_W = 280, WIN_MIN_H = 160;
function resizeNexus(e, id, dir) {
  e.preventDefault();
  e.stopPropagation();
  const win = document.getElementById(id);
  const panel = document.getElementById('desktop-panel');
  const pR = panel.getBoundingClientRect();
  const TB = 28;
  const sx = e.clientX, sy = e.clientY;
  const startL = win.offsetLeft, startT = win.offsetTop, startW = win.offsetWidth, startH = win.offsetHeight;
  function onMove(e) {
    let l = startL, t = startT, w = startW, h = startH;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (dir.includes('e')) w = startW + dx;
    if (dir.includes('s')) h = startH + dy;
    w = Math.max(WIN_MIN_W, Math.min(w, pR.width - l));
    h = Math.max(WIN_MIN_H, Math.min(h, pR.height - TB - t));
    win.style.width = w + 'px';
    win.style.height = h + 'px';
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    Object.values(CHARTS).forEach(ch => { if (ch && ch.resize) ch.resize(); });
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

const MAP_COORDS = { it: [75, 55], finance: [225, 55], omni: [150, 150], hr: [75, 245], vault: [225, 245] };

function drawConnectionLine(nid) {
  const svg = document.getElementById('map-svg');
  if (!svg) return;
  const from = MAP_COORDS[nid], to = MAP_COORDS.omni;
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', from[0]);
  line.setAttribute('y1', from[1]);
  line.setAttribute('x2', to[0]);
  line.setAttribute('y2', to[1]);
  line.setAttribute('stroke', '#00c41c');
  line.setAttribute('stroke-width', '2');
  line.setAttribute('filter', 'url(#map-cable-glow)');
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  line.style.strokeDasharray = len;
  line.style.strokeDashoffset = len;
  svg.appendChild(line);
  requestAnimationFrame(() => {
    line.style.transition = 'stroke-dashoffset 0.6s ease';
    line.style.strokeDashoffset = '0';
  });
}

function nodeClick(nid) {
  if (GS.locked.has(nid) || GS.gameOver) return;
  if (GS.activeNode === nid) return;
  const stepNode = NODE_ORDER[GS.currentStep];
  if (nid !== stepNode) {
    brokerSay('Finish the active connection first.', 'bm-err');
    return;
  }
  if (GS.activeNode && GS.activeNode !== nid && !GS.locked.has(GS.activeNode)) {
    hlNode(GS.activeNode, 'n-dimmed');
    document.getElementById('ns-' + GS.activeNode).textContent = 'LOCKED';
  }
  GS.activeNode = nid;
  hlNode(nid, 'n-mission');
  document.getElementById('ns-' + nid).textContent = 'TRACING...';
  const short = NODES[nid].clue.length > 85 ? NODES[nid].clue.slice(0, 85) + '...' : NODES[nid].clue;
  document.getElementById('step-banner').textContent = NODES[nid].label + ' ACTIVE: ' + short;
  document.getElementById('eb-hint').textContent = 'TARGET: ' + NODES[nid].label;
  brokerSay(NODES[nid].clue, 'bm-ok');
  nexusOpenRecord(nid);
}

function hlNode(nid, cls) {
  document.getElementById('node-' + nid).className = 'node ' + cls;
}

function pulseOmniLines() {
  const svg = document.getElementById('map-svg');
  if (!svg) return;
  svg.querySelectorAll('line').forEach((ln, i) => {
    ln.style.transition = 'filter .4s ease, stroke-width .4s ease';
    ln.style.filter = 'drop-shadow(0 0 8px var(--green-stable))';
    ln.setAttribute('stroke-width', '3');
    setTimeout(() => {
      ln.style.filter = '';
      ln.setAttribute('stroke-width', '2');
    }, 600);
  });
}

function lockNode(nid) {
  GS.locked.add(nid);
  GS.activeNode = null;
  hlNode(nid, 'n-locked');
  document.getElementById('ns-' + nid).textContent = '✓ LOCKED';
  document.getElementById('ep-' + nid).classList.add('filled');
  drawConnectionLine(nid);
  brokerSay(NODES[nid].lockMsg, 'bm-win');
  const fc = document.getElementById('frag-count');
  if (fc) fc.textContent = String(GS.locked.size);
  GS.currentStep++;
  const afterDelay = nid === 'hr' && GS.hrAtlasStarted ? Math.max(0, 7500 - (Date.now() - GS.hrAtlasT0)) : 0;
  const after = {
    it: "SVC-NULL-7B. Masked process, no owner, running on Sector 7. That's the first fragment. Move to Finance.",
    finance: "Palladian Systems. Shell company. $7.1M routed through it with no trace. Second fragment. HR is next — this one is different.",
    hr: "The training data. That's what they built OMNI on. Their own employees. One more — DataVault.",
    vault: "Same destination. Palladian-node-ext-01. Finance, vault, all feeding the same external node. We have all four fragments. Forge the key."
  };
  setTimeout(() => brokerSay(after[nid], 'bm-d'), 900 + afterDelay);
  if (GS.locked.size === 4) {
    document.getElementById('node-omni').classList.add('active');
    document.getElementById('ns-omni').textContent = 'OMNI CORE — MAPPED';
    setTimeout(() => pulseOmniLines(), 2100);
    setTimeout(() => {
      const sb = document.getElementById('synth-btn');
      sb.classList.add('ready');
      sb.disabled = false;
      sb.innerHTML = '<i class="fas fa-key"></i> ⬡ FORGE MASTER KEY';
      document.getElementById('step-banner').textContent = 'All four fragments confirmed — Forge the master key';
      document.getElementById('eb-step').textContent = 'ALL 4 FRAGMENTS ✓';
    }, 2000);
  } else {
    const nextNode = NODE_ORDER[GS.currentStep];
    setTimeout(() => {
      document.getElementById('node-' + nextNode).className = 'node n-next';
      document.getElementById('ns-' + nextNode).textContent = 'YOUR TURN →';
      document.getElementById('eb-step').textContent = 'FRAGMENT ' + (GS.currentStep + 1) + ' OF 4';
    }, 600 + afterDelay);
    document.getElementById('step-banner').textContent = NODES[nid].label + ' confirmed ✓ — Open the next connection';
    document.getElementById('eb-hint').textContent = '';
  }
}

function openCal(nid) {
  GS.calNode = nid;
  const node = NODES[nid];
  GS.chipIdx = new Array(node.params.length).fill(null);
  document.getElementById('cp-node').textContent = 'VERIFY: ' + node.label;
  const container = document.getElementById('cp-params');
  container.innerHTML = '';
  container.className = node.params.length >= 4 ? 'cp-params cp-compact' : 'cp-params';
  node.params.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'cp-param';
    const chipsHTML = p.opts.map((opt, j) =>
      '<button type="button" class="cp-chip" id="cpc' + i + '_' + j + '" onclick="selectChip(' + i + ',' + j + ')">' + opt + '</button>'
    ).join('');
    div.innerHTML = '<div class="cp-plbl">' + p.label + '</div><div class="cp-chips">' + chipsHTML + '</div><div class="cp-err" id="cpe' + i + '"></div>';
    container.appendChild(div);
  });
  const tog = document.getElementById('cal-toggle');
  tog.style.display = 'flex';
  tog.textContent = '›';
  document.getElementById('cal-panel').classList.add('open');
}

function selectChip(paramIdx, chipIdx) {
  const p = NODES[GS.calNode].params[paramIdx];
  GS.chipIdx[paramIdx] = chipIdx;
  p.opts.forEach((_, j) => {
    const chip = document.getElementById('cpc' + paramIdx + '_' + j);
    if (!chip) return;
    chip.classList.remove('cp-sel', 'cp-correct', 'cp-wrong');
    if (j === chipIdx) chip.classList.add('cp-sel');
  });
  const ce = document.getElementById('cpe' + paramIdx);
  if (ce) ce.classList.remove('show');
}

function confirmCal() {
  const node = NODES[GS.calNode];
  let allOk = true;
  node.params.forEach((p, i) => {
    if (GS.chipIdx[i] !== p.ans) {
      allOk = false;
      const ce = document.getElementById('cpe' + i);
      if (ce) {
        ce.textContent = p.err;
        ce.classList.add('show');
      }
      if (GS.chipIdx[i] !== null) {
        const wChip = document.getElementById('cpc' + i + '_' + GS.chipIdx[i]);
        if (wChip) {
          wChip.classList.remove('cp-sel');
          wChip.classList.add('cp-wrong');
        }
      }
    } else {
      const okChip = document.getElementById('cpc' + i + '_' + p.ans);
      if (okChip) {
        okChip.classList.remove('cp-sel');
        okChip.classList.add('cp-correct');
      }
    }
  });
  const WRONG_CAL_MSGS = [
    "Incorrect. $1,000 gone. Re-read the source data.",
    "Wrong. That calibration cost $1,000.",
    "Not a match. $1,000 — check the file again."
  ];
  if (allOk) {
    setTimeout(() => {
      document.getElementById('cal-panel').classList.remove('open');
      document.getElementById('cal-toggle').style.display = 'none';
      lockNode(GS.calNode);
      GS.calNode = null;
    }, 380);
  } else {
    GS.errors++;
    deductBudget(1000, 'cal');
    addDetection(5);
    brokerSay("Calibration doesn't match the data. Try again.", 'bm-err');
    setTimeout(() => brokerSay(WRONG_CAL_MSGS[Math.floor(Math.random() * WRONG_CAL_MSGS.length)], 'bm-err'), 800);
  }
}

function toggleCalPanel() {
  const panel = document.getElementById('cal-panel');
  const toggle = document.getElementById('cal-toggle');
  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
    toggle.textContent = '‹';
  } else {
    panel.classList.add('open');
    toggle.textContent = '›';
  }
}

function brokerSay(msg, cls) {
  const wrap = document.getElementById('broker-body');
  if (!wrap) return;
  const type = cls || 'bm-d';
  const statusEl = document.getElementById('bk-status');
  if (statusEl) statusEl.innerHTML = '<span style="color:#00FF41;font-family:&quot;DM Sans&quot;,sans-serif;font-size:12px">Voss is typing...</span>';

  const twrap = document.createElement('div');
  twrap.className = 'bm-typing-wrap';
  twrap.innerHTML = '<div class="bm-typing"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>';
  wrap.appendChild(twrap);
  wrap.scrollTop = wrap.scrollHeight;

  setTimeout(() => {
    twrap.remove();
    if (statusEl) statusEl.innerHTML = '';

    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    GS.lastSender = 'Voss';

    const group = document.createElement('div');
    group.className = 'bm-group';
    const senderLabel = document.createElement('div');
    senderLabel.className = 'bm-sender';
    senderLabel.textContent = 'VOSS';
    const bubble = document.createElement('div');
    bubble.className = 'bm-bubble ' + type;
    bubble.innerHTML = msg.split('\n').join('<br>');
    const tsEl = document.createElement('div');
    tsEl.className = 'bm-ts';
    tsEl.textContent = ts;
    group.appendChild(senderLabel);
    group.appendChild(bubble);
    group.appendChild(tsEl);
    wrap.appendChild(group);
    wrap.scrollTop = wrap.scrollHeight;
  }, 700);
}

function zexSay(text) {
  const body = document.getElementById('broker-body');
  if (!body) return;

  const twrap = document.createElement('div');
  twrap.className = 'bm-typing-wrap';
  twrap.innerHTML = '<div class="bm-typing"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>';
  body.appendChild(twrap);
  body.scrollTop = body.scrollHeight;

  setTimeout(() => {
    twrap.remove();
    const now = new Date();
    const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    GS.lastSender = 'ZEX';

    const senderEl = document.createElement('div');
    senderEl.className = 'bm-sender';
    senderEl.style.color = 'var(--purple-light)';
    senderEl.textContent = 'ZEX';

    const group = document.createElement('div');
    group.className = 'bm-group';
    group.appendChild(senderEl);

    const bubble = document.createElement('div');
    bubble.className = 'bm-bubble bm-h';
    bubble.textContent = text;

    const tsEl = document.createElement('div');
    tsEl.className = 'bm-ts';
    tsEl.textContent = ts;

    group.appendChild(bubble);
    group.appendChild(tsEl);
    body.appendChild(group);
    body.scrollTop = body.scrollHeight;
  }, 575);
}

function atlasSay(text) {
  if (GS.atlasMuted && !GS.allowAtlasOnce) return;
  if (GS.allowAtlasOnce) GS.allowAtlasOnce = false;
  const body = document.getElementById('broker-body');
  if (!body) return;
  const statusEl = document.getElementById('bk-status');
  if (statusEl) {
    statusEl.innerHTML = '<span style="color:var(--orange);font-family:&quot;DM Sans&quot;,sans-serif;font-size:12px">Atlas is typing...</span>';
  }
  const twrap = document.createElement('div');
  twrap.className = 'bm-typing-wrap';
  twrap.innerHTML = '<div class="bm-typing"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div>';
  body.appendChild(twrap);
  body.scrollTop = body.scrollHeight;
  setTimeout(() => {
    twrap.remove();
    if (statusEl) statusEl.innerHTML = '';
    const senderEl = document.createElement('div');
    senderEl.className = 'bm-sender';
    senderEl.style.color = 'var(--orange)';
    senderEl.textContent = 'ATLAS';
    const group = document.createElement('div');
    group.className = 'bm-group';
    group.appendChild(senderEl);
    const bubble = document.createElement('div');
    bubble.className = 'bm-bubble bm-atlas';
    bubble.textContent = text;
    const tsEl = document.createElement('div');
    tsEl.className = 'bm-ts';
    tsEl.textContent = String(new Date().getHours()).padStart(2, '0') + ':' + String(new Date().getMinutes()).padStart(2, '0');
    group.appendChild(bubble);
    group.appendChild(tsEl);
    body.appendChild(group);
    body.scrollTop = body.scrollHeight;
    GS.lastSender = 'Atlas';
  }, 575);
}

function requestHint() {
  if (GS.hintCooldown || GS.gameOver) return;
  if (!GS.activeNode) {
    brokerSay('Select a target on the board first.', 'bm-err');
    return;
  }
  if (GS.locked.has(GS.activeNode)) {
    brokerSay("That one's already confirmed. Pick another target.", 'bm-d');
    return;
  }

  const crossRefNoHint = { hr: "That's not in the NEXUS record. Look at the record owner. You already have what you need." };
  if (GS.calNode && crossRefNoHint[GS.calNode]) {
    const node = NODES[GS.calNode];
    const crossRefIndices = node.params.map((p, i) => (p.crossRef ? i : -1)).filter(i => i >= 0);
    const stuckOnCrossRef = crossRefIndices.some(idx => {
      const solvedBefore = node.params.slice(0, idx).every((_, i) => GS.chipIdx[i] === node.params[i].ans);
      const unsolved = GS.chipIdx[idx] !== node.params[idx].ans;
      return solvedBefore && unsolved;
    });
    if (stuckOnCrossRef) {
      brokerSay(crossRefNoHint[GS.calNode], 'bm-d');
      return;
    }
  }
  GS.hintsUsed++;
  deductBudget(2500, 'hint');
  brokerSay("Pulling the intel. This costs us — use it.", 'bm-d');
  setTimeout(() => brokerSay(NODES[GS.activeNode].hint, 'bm-h'), 1600);
  GS.hintCooldown = true;
  const btn = document.getElementById('hint-btn');
  const cd = document.getElementById('hint-cd');
  btn.disabled = true;
  cd.classList.add('show');
  let rem = 30;
  cd.textContent = rem + 's';
  const interval = setInterval(() => {
    rem--;
    cd.textContent = rem + 's';
    if (rem <= 0) {
      clearInterval(interval);
      GS.hintCooldown = false;
      btn.disabled = false;
      cd.classList.remove('show');
    }
  }, 1000);
}

function deductBudget(amount, type) {
  GS.budget = Math.max(0, GS.budget - amount);
  if (type === 'decoy') GS.decoyPenalties += amount;
  else if (type === 'click') GS.clickPenalties += amount;
  else if (type === 'cal') GS.calPenalties += amount;
  else if (type === 'hint') GS.hintPenalties += amount;
  updateBudgetDisplay();
  showBudgetToast(amount);
  checkBudgetThresholds();
}

function updateBudgetDisplay() {
  const el = document.getElementById('budget');
  if (!el) return;
  const b = GS.budget;
  el.innerHTML = '<i class="fas fa-wallet"></i> $' + b.toLocaleString();
  el.classList.remove('budget-green', 'budget-amber', 'budget-red', 'budget-flash');
  void el.offsetWidth;
  if (b >= 30000) el.classList.add('budget-green');
  else if (b >= 15000) el.classList.add('budget-amber');
  else el.classList.add('budget-red');
  el.classList.add('budget-flash');
  setTimeout(() => el.classList.remove('budget-flash'), 400);
}

function showBudgetToast(amount) {
  const el = document.getElementById('budget');
  const rect = el ? el.getBoundingClientRect() : { top: 54, left: 400, width: 100 };
  const t = document.createElement('div');
  t.className = 'budget-toast';
  t.textContent = '−$' + amount.toLocaleString();
  t.style.top = rect.top + 4 + 'px';
  t.style.left = rect.left + rect.width / 2 - 30 + 'px';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1300);
}

function checkBudgetThresholds() {
  const b = GS.budget;
  const fmt = '$' + b.toLocaleString();
  if (b < 5000 && !BUDGET_WARNED[5000]) {
    BUDGET_WARNED[5000] = true;
    setTimeout(() => brokerSay(fmt + " left. That's nearly gone. Every wrong click from here costs us.", 'bm-err'), 1500);
  } else if (b < 15000 && !BUDGET_WARNED[15000]) {
    BUDGET_WARNED[15000] = true;
    setTimeout(() => brokerSay('Getting low. ' + fmt + ' remaining. Be deliberate.', 'bm-err'), 1500);
  } else if (b < 30000 && !BUDGET_WARNED[30000]) {
    BUDGET_WARNED[30000] = true;
    setTimeout(() => brokerSay(fmt + " left. We can't afford to be sloppy.", 'bm-err'), 1500);
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function startKeyForge() {
  if (GS.locked.size < 4 || GS.gameOver) return;
  const ov = document.getElementById('keyforge-overlay');
  const term = document.getElementById('keyforge-term');
  const box = document.getElementById('keyforge-box');
  ov.classList.add('show');
  term.textContent = '';
  box.style.display = 'none';
  box.innerHTML = '';
  const lines = [
    '> FRAGMENT 01: SVC-NULL-7B ............... [VERIFIED]',
    '> FRAGMENT 02: PALLADIAN-SYS-EXT ......... [VERIFIED]',
    '> FRAGMENT 03: dataset_feed_03_ENG ........ [VERIFIED]',
    '> FRAGMENT 04: palladian-node-ext-01 ...... [VERIFIED]'
  ];
  let i = 0;
  function addLine() {
    if (i < lines.length) {
      term.textContent += lines[i] + '\n';
      i++;
      setTimeout(addLine, 500);
    } else {
      setTimeout(() => {
        term.textContent += '\n> ASSEMBLING MASTER KEY ................. \n';
        const prog = document.createElement('div');
        prog.style.cssText = 'width:100%;max-width:420px;height:8px;background:rgba(0,255,65,.12);border:1px solid rgba(0,255,65,.35);margin:10px 0;border-radius:4px;overflow:hidden';
        const fill = document.createElement('div');
        fill.style.cssText = 'height:100%;width:0%;background:var(--green-matrix);transition:width 1.5s linear';
        prog.appendChild(fill);
        term.parentNode.insertBefore(prog, box);
        requestAnimationFrame(() => { fill.style.width = '100%'; });
        setTimeout(() => {
          prog.remove();
          term.textContent += '\n> KEY ASSEMBLY COMPLETE\n';
          box.style.display = 'block';
          box.style.border = '1px solid var(--green-matrix)';
          box.style.color = 'var(--green-matrix)';
          box.style.fontFamily = "'Share Tech Mono',monospace";
          box.style.fontSize = '12px';
          box.innerHTML = '╔══════════════════════════════════════╗<br>║  DECRYPTION INITIATED                ║<br>║  TARGET: PROJECT_OMNI_DATASET.enc    ║<br>║  SIZE: 847 GB                        ║<br>║                                      ║<br>║  OMNI — PRIMARY FUNCTION:            ║<br>║  PREDICTIVE WORKFORCE OPTIMISATION   ║<br>║                                      ║<br>║  TRAINING DATA: MegaCorp HR records  ║<br>║  EMPLOYEES: 4,847                    ║<br>║  CONSENT STATUS: [NOT REQUIRED]      ║<br>║                                      ║<br>║  DEPLOYMENT TARGET: Q1 2004          ║<br>║  WEEKS REMAINING: 12                 ║<br>╚══════════════════════════════════════╝';
          setTimeout(() => {
            zexSay("They built a machine to fire people. And trained it on the people it's going to fire.");
            GS.allowAtlasOnce = true;
            GS.atlasMuted = false;
            setTimeout(() => {
              atlasSay("Deployment in Q1 2004. That's twelve weeks.");
              GS.atlasMuted = true;
            }, 2000);
            setTimeout(() => brokerSay("Now we know what it does. Round 3 — we find out who's already on the list.", 'bm-d'), 4000);
            setTimeout(() => {
              ov.classList.remove('show');
              showDebrief(false);
            }, 7500);
          }, 600);
        }, 1500);
      }, 800);
    }
  }
  addLine();
}

const DEBRIEF_RW_HTML =
  'You mapped the data lineage of a hidden AI system by reading metadata, tracing vendor relationships, and following export records across four separate internal registries.' +
  '<br><br>In the real world this is <strong style="color:var(--purple-light)">Data Architecture and Lineage Analysis</strong> — understanding how data moves between systems, who owns it, where it goes, and what it connects to.' +
  '<br><br>OMNI was built on 4,847 people\'s records without their consent. It is scheduled to go live in twelve weeks.' +
  '<div class="db-quote" id="db-quote">"They built a machine to fire people. And trained it on the people it\'s going to fire." — Zex</div>';

function showDebrief(fromGameOver) {
  clearInterval(GS.timerInt);
  const m = String(Math.floor(GS.timerSec / 60)).padStart(2, '0');
  const s = String(GS.timerSec % 60).padStart(2, '0');
  const acc = GS.errors === 0 ? 100 : Math.round(4 / (4 + GS.errors) * 100);
  const b = GS.budget;
  const bFmt = n => '$' + n.toLocaleString();
  const budgetClass = b >= 30000 ? 'budget-green' : b >= 15000 ? 'budget-amber' : 'budget-red';
  const dr = Math.round(GS.detectionRisk);
  let rating;
  if (fromGameOver) rating = 'DETECTION LIMIT — session flagged';
  else if (b >= 45000) rating = 'CLEAN RUN — Voss is impressed';
  else if (b >= 35000) rating = 'SOLID WORK — minor exposure only';
  else if (b >= 20000) rating = 'SLOPPY — Atlas noticed';
  else if (b >= 10000) rating = 'EXPENSIVE — we nearly got flagged';
  else rating = 'DISASTER — Atlas left the channel';

  document.getElementById('db-metrics').innerHTML =
    '<div class="db-m"><div class="db-mv">' + m + ':' + s + '</div><div class="db-ml">TIME</div></div>' +
    '<div class="db-m"><div class="db-mv">' + acc + '%</div><div class="db-ml">ACCURACY</div></div>' +
    '<div class="db-m"><div class="db-mv">' + dr + '%</div><div class="db-ml">DETECTION RISK</div></div>' +
    '<div class="db-m"><div class="db-mv ' + budgetClass + '">' + bFmt(b) + '</div><div class="db-ml">BUDGET REMAINING</div></div>';

  const badge = document.getElementById('db-badge');
  if (fromGameOver) {
    if (badge) badge.textContent = 'MISSION 02 — ENDED';
    document.getElementById('db-head-title').textContent = 'SESSION LOST';
    document.getElementById('db-rw-body').innerHTML =
      'Detection risk reached 100% before the key could be forged. NEXUS flagged the session and dropped the mirror.<br><br>' + DEBRIEF_RW_HTML;
  } else {
    if (badge) badge.textContent = 'MISSION 02 — COMPLETE';
    document.getElementById('db-head-title').textContent = 'MASTER KEY FORGED';
    document.getElementById('db-rw-body').innerHTML = DEBRIEF_RW_HTML;
  }

  setTimeout(() => {
    const card = document.querySelector('.db-card');
    if (!card || card.querySelector('.db-budget')) return;
    const bd = document.createElement('div');
    bd.className = 'db-budget';
    bd.innerHTML =
      '<div class="db-budget-ttl">BUDGET BREAKDOWN</div>' +
      '<div class="db-budget-row"><span>Starting budget</span><span>' + bFmt(GS.budgetStart) + '</span></div>' +
      '<div class="db-budget-row"><span>Penalties</span><span style="color:var(--red)">−' + bFmt(GS.budgetStart - b) + '</span></div>' +
      '<div class="db-budget-row db-total"><span>Budget remaining</span><span class="' + budgetClass + '">' + bFmt(b) + '</span></div>' +
      '<div class="db-rating">' + rating + '</div>';
    const nextBtn = card.querySelector('.db-next');
    if (nextBtn) card.insertBefore(bd, nextBtn);
  }, 200);

  document.getElementById('debrief-overlay').style.display = 'flex';
  document.getElementById('gameover-overlay').classList.remove('show');
}

function nextRound() {
  alert('Mission 03 coming soon');
}

updateDetectionUI();
