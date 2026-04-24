# -*- coding: utf-8 -*-
"""Append gameplay HTML + script to round2.html (Mission 2 NEXUS)."""
import os
path = os.path.join(os.path.dirname(__file__), "round2.html")

GAME_HTML = r'''
<div id="gp-root" style="display:none">
<div id="game" style="display:flex;flex-direction:column">
  <div id="hdr">
    <div class="hdr-left"><i class="fas fa-terminal"></i> MASTERMIND TERMINAL | OPERATION OMNI</div>
    <div class="hdr-center">MISSION 02 OF 05 / FORGING THE MASTER KEY</div>
    <div class="hdr-right">
      <div class="hdr-det"><span>DETECTION</span><div class="det-bar-wrap"><div class="det-bar-fill" id="det-bar-fill"></div></div><span id="detection-pct">0%</span></div>
      <span style="color:var(--border)">|</span>
      <span id="budget" class="budget-green"><i class="fas fa-wallet"></i> $50,000</span>
      <span style="color:var(--border)">|</span>
      <span id="timer">00:00</span>
      <span class="live-dot"></span><span style="letter-spacing:1px">LIVE</span>
    </div>
  </div>
  <div id="step-banner">Select a connection node on the map to begin tracing the data architecture.</div>
  <div id="main-row">
    <div id="desktop-panel">
      <div class="nexus-app">
        <div class="nexus-topbar">
          <span class="nexus-tb-left">NEXUS — Data Architecture Registry v2.1</span>
          <span class="nexus-tb-center">MegaCorp Internal Systems · Restricted Access</span>
          <span class="nexus-tb-user">r.marshall@megacorp.com</span>
        </div>
        <div class="nexus-body">
          <div class="nexus-sidebar" id="nexus-sidebar">
            <div class="nx-tree-item" onclick="nexusSelectRoot()"><span>📁</span> NEXUS Root</div>
            <div class="nx-tree-sub">
              <div class="nx-tree-item" data-rec="it" onclick="nexusOpenRecord('it')"><span>📁</span> IT Infrastructure</div>
              <div class="nx-tree-item" data-rec="finance" onclick="nexusOpenRecord('finance')"><span>📁</span> Finance</div>
              <div class="nx-tree-item" data-rec="hr" onclick="nexusOpenRecord('hr')"><span>📁</span> Human Resources</div>
              <div class="nx-tree-item" data-rec="vault" onclick="nexusOpenRecord('vault')"><span>📁</span> DataVault</div>
              <div class="nx-tree-item dim" onclick="nexusRedacted()"><span>📁</span> [REDACTED]</div>
              <div class="nx-tree-item" data-rec="logs" onclick="nexusOpenLogs()"><span>📁</span> System Logs</div>
            </div>
          </div>
          <div class="nexus-main" id="nexus-main">Select a record from the navigation tree to view dataset metadata.</div>
        </div>
        <div id="nexus-taskbar">NEXUS · Session mirrored · Read-only</div>
      </div>

      <!-- NEXUS record windows -->
      <div class="nx-win" id="win-nexus-it" style="top:48px;left:200px;width:min(560px,48vw);height:min(420px,55vh)" onmousedown="bringFront('win-nexus-it')">
        <div class="nx-win-tb" onmousedown="dragWin(event,'win-nexus-it')"><span class="nx-win-title">RECORD · IT_INFRA_REGISTRY_2003</span><div class="nx-win-btns">
          <button class="nx-btn" onclick="closeWin('win-nexus-it')">_</button><button class="nx-btn" onclick="toggleMaximise('win-nexus-it')">□</button><button class="nx-btn" onclick="closeWin('win-nexus-it')">✕</button></div></div>
        <div class="nx-win-body">
          <div class="nx-fields">
            <div class="nx-dataset-hdr">DATASET RECORD</div>
            <div class="nx-row"><div class="nx-lbl">Dataset Name</div><div class="nx-val">IT_INFRA_REGISTRY_2003</div></div>
            <div class="nx-row"><div class="nx-lbl">Owner</div><div class="nx-val">IT Division</div></div>
            <div class="nx-row"><div class="nx-lbl">Classification</div><div class="nx-val">RESTRICTED</div></div>
            <div class="nx-row"><div class="nx-lbl">Created</div><div class="nx-val">14-Jan-2003</div></div>
            <div class="nx-row"><div class="nx-lbl">Last Modified</div><div class="nx-val">30-Sep-2003</div></div>
            <div class="nx-row"><div class="nx-lbl">Process Links</div><div class="nx-val clickable" id="nx-it-anom" onclick="nxClickAnom('it')">SVC-NULL-7B [MASKED]</div></div>
            <div class="nx-row"><div class="nx-lbl">Record Count</div><div class="nx-val">18,442</div></div>
            <div class="nx-row"><div class="nx-lbl">Size</div><div class="nx-val">2.4 GB</div></div>
            <div class="nx-row"><div class="nx-lbl">Status</div><div class="nx-val">ACTIVE</div></div>
          </div>
          <div class="nx-viz"><div class="chart-ttl" style="color:#8ab0c0;font-size:11px">Cluster Load Index — All Sectors</div>
            <div class="chart-canvas-wrap"><canvas id="chartNxIt"></canvas></div></div>
        </div>
        <div class="chart-anom-panel" id="cap-it"><div class="cap-ttl">METADATA ANOMALY</div><div class="cap-txt">Masked process link with no ticket trail. Sector 7 load diverges in September.</div>
          <button class="cap-btn" onclick="hideCap('cap-it');openCal('it')">VERIFY FRAGMENT →</button></div>
      </div>

      <div class="nx-win" id="win-nexus-finance" style="top:56px;left:220px;width:min(560px,48vw);height:min(440px,56vh)" onmousedown="bringFront('win-nexus-finance')">
        <div class="nx-win-tb" onmousedown="dragWin(event,'win-nexus-finance')"><span class="nx-win-title">RECORD · FINANCE_LEDGER_Q3_2003</span><div class="nx-win-btns">
          <button class="nx-btn" onclick="closeWin('win-nexus-finance')">_</button><button class="nx-btn" onclick="toggleMaximise('win-nexus-finance')">□</button><button class="nx-btn" onclick="closeWin('win-nexus-finance')">✕</button></div></div>
        <div class="nx-win-body">
          <div class="nx-fields">
            <div class="nx-dataset-hdr">DATASET RECORD</div>
            <div class="nx-row"><div class="nx-lbl">Dataset Name</div><div class="nx-val">FINANCE_LEDGER_Q3_2003</div></div>
            <div class="nx-row"><div class="nx-lbl">Owner</div><div class="nx-val">Finance Division</div></div>
            <div class="nx-row"><div class="nx-lbl">Classification</div><div class="nx-val">CONFIDENTIAL</div></div>
            <div class="nx-row"><div class="nx-lbl">Created</div><div class="nx-val">01-Jul-2003</div></div>
            <div class="nx-row"><div class="nx-lbl">Last Modified</div><div class="nx-val">28-Sep-2003</div></div>
            <div class="nx-row"><div class="nx-lbl">Record Count</div><div class="nx-val">4,201</div></div>
            <div class="nx-row"><div class="nx-lbl">Size</div><div class="nx-val">0.8 GB</div></div>
            <div class="nx-row"><div class="nx-lbl">Vendor Registry</div><div class="nx-val">14 active vendors</div></div>
            <div class="nx-row"><div class="nx-lbl">Vendor ID 14</div><div class="nx-val clickable" id="nx-fin-anom" onclick="nxClickAnom('finance')">PALLADIAN-SYS-EXT [UNVERIFIED]</div></div>
            <div class="nx-row"><div class="nx-lbl">Status</div><div class="nx-val">ACTIVE</div></div>
          </div>
          <div class="nx-viz"><div class="chart-ttl" style="color:#8ab0c0;font-size:11px">Vendor Payments Q3 2003</div>
            <div class="chart-canvas-wrap"><canvas id="chartNxFin"></canvas></div></div>
        </div>
        <div class="chart-anom-panel" id="cap-finance"><div class="cap-ttl">METADATA ANOMALY</div><div class="cap-txt">$7.1M to an unverified vendor shell.</div>
          <button class="cap-btn" onclick="hideCap('cap-finance');openCal('finance')">VERIFY FRAGMENT →</button></div>
      </div>

      <div class="nx-win" id="win-nexus-hr" style="top:64px;left:180px;width:min(580px,50vw);height:min(460px,58vh)" onmousedown="bringFront('win-nexus-hr')">
        <div class="nx-win-tb" onmousedown="dragWin(event,'win-nexus-hr')"><span class="nx-win-title">RECORD · HR_PERSONNEL_REGISTRY_2003</span><div class="nx-win-btns">
          <button class="nx-btn" onclick="closeWin('win-nexus-hr')">_</button><button class="nx-btn" onclick="toggleMaximise('win-nexus-hr')">□</button><button class="nx-btn" onclick="closeWin('win-nexus-hr')">✕</button></div></div>
        <div class="nx-win-body">
          <div class="nx-fields">
            <div class="nx-dataset-hdr">DATASET RECORD</div>
            <div class="nx-row"><div class="nx-lbl">Dataset Name</div><div class="nx-val">HR_PERSONNEL_REGISTRY_2003</div></div>
            <div class="nx-row"><div class="nx-lbl">Owner</div><div class="nx-val" id="nx-hr-owner">R. Marshall</div></div>
            <div class="nx-row"><div class="nx-lbl">Classification</div><div class="nx-val">CONFIDENTIAL</div></div>
            <div class="nx-row"><div class="nx-lbl">Created</div><div class="nx-val">03-Feb-2003</div></div>
            <div class="nx-row"><div class="nx-lbl">Last Modified</div><div class="nx-val">30-Sep-2003</div></div>
            <div class="nx-row"><div class="nx-lbl">Record Count</div><div class="nx-val">4,847</div></div>
            <div class="nx-row"><div class="nx-lbl">Size</div><div class="nx-val">1.2 GB</div></div>
            <div class="nx-row"><div class="nx-lbl">Status</div><div class="nx-val">ACTIVE</div></div>
            <div class="nx-row"><div class="nx-lbl">Export History</div><div class="nx-val"><span class="clickable" onclick="toggleHrExports()">3 exports Q3 2003</span>
              <div class="nx-export-sub" id="hr-export-sub">
                <div class="nx-exp-row">Export 1 · HR_REPORT_Q2.pdf · Internal · 14-Jul-2003</div>
                <div class="nx-exp-row">Export 2 · HEADCOUNT_Q3.xlsx · Internal · 01-Sep-2003</div>
                <div class="nx-exp-row" id="nx-hr-ex3" onclick="nxHrExport3()">Export 3 · dataset_feed_03_ENG · [REDACTED] · 30-Sep-2003 · 4,847 records · Dest: [CLASSIFIED]</div>
              </div>
            </div></div>
          </div>
          <div class="nx-viz"><div class="chart-ttl" style="color:#8ab0c0;font-size:11px">HR Record Access vs Record Age</div>
            <div class="chart-canvas-wrap"><canvas id="chartNxHr"></canvas></div></div>
        </div>
        <div class="chart-anom-panel" id="cap-hr"><div class="cap-ttl">METADATA ANOMALY</div><div class="cap-txt">Classified export of full personnel feed.</div>
          <button class="cap-btn" onclick="hideCap('cap-hr');openCal('hr')">VERIFY FRAGMENT →</button></div>
      </div>

      <div class="nx-win" id="win-nexus-vault" style="top:52px;left:210px;width:min(580px,50vw);height:min(440px,56vh)" onmousedown="bringFront('win-nexus-vault')">
        <div class="nx-win-tb" onmousedown="dragWin(event,'win-nexus-vault')"><span class="nx-win-title">RECORD · VAULT_PARTITION_C_2003</span><div class="nx-win-btns">
          <button class="nx-btn" onclick="closeWin('win-nexus-vault')">_</button><button class="nx-btn" onclick="toggleMaximise('win-nexus-vault')">□</button><button class="nx-btn" onclick="closeWin('win-nexus-vault')">✕</button></div></div>
        <div class="nx-win-body">
          <div class="nx-fields">
            <div class="nx-dataset-hdr">DATASET RECORD</div>
            <div class="nx-row"><div class="nx-lbl">Dataset Name</div><div class="nx-val">VAULT_PARTITION_C_2003</div></div>
            <div class="nx-row"><div class="nx-lbl">Owner</div><div class="nx-val">IT Security</div></div>
            <div class="nx-row"><div class="nx-lbl">Classification</div><div class="nx-val">TOP SECRET</div></div>
            <div class="nx-row"><div class="nx-lbl">Created</div><div class="nx-val">01-Jul-2003</div></div>
            <div class="nx-row"><div class="nx-lbl">Last Modified</div><div class="nx-val">30-Sep-2003</div></div>
            <div class="nx-row"><div class="nx-lbl">Record Count</div><div class="nx-val">12</div></div>
            <div class="nx-row"><div class="nx-lbl">Size</div><div class="nx-val">849.4 GB</div></div>
            <div class="nx-row"><div class="nx-lbl">Mirror Status</div><div class="nx-val">ACTIVE</div></div>
            <div class="nx-row"><div class="nx-lbl">Mirror Target</div><div class="nx-val clickable" id="nx-vault-anom" onclick="nxClickAnom('vault')">palladian-node-ext-01 [EXTERNAL]</div></div>
            <div class="nx-row"><div class="nx-lbl">Status</div><div class="nx-val">RESTRICTED (as of 28-Sep-2003)</div></div>
          </div>
          <div class="nx-viz"><div class="chart-ttl" style="color:#8ab0c0;font-size:11px">Access Pattern Reference — Q3 2003</div>
            <div class="heatmap-wrap" style="max-height:180px;overflow:auto"><table class="heatmap-tbl" id="vault-heat-mini"></table></div></div>
        </div>
        <div class="chart-anom-panel" id="cap-vault"><div class="cap-ttl">METADATA ANOMALY</div><div class="cap-txt">External mirror node matches Finance trail.</div>
          <button class="cap-btn" onclick="hideCap('cap-vault');openCal('vault')">VERIFY FRAGMENT →</button></div>
      </div>

      <div class="nx-win" id="win-nexus-logs" style="top:120px;left:260px;width:420px;height:280px" onmousedown="bringFront('win-nexus-logs')">
        <div class="nx-win-tb" onmousedown="dragWin(event,'win-nexus-logs')"><span class="nx-win-title">System Logs</span><div class="nx-win-btns">
          <button class="nx-btn" onclick="closeWin('win-nexus-logs')">_</button><button class="nx-btn" onclick="closeWin('win-nexus-logs')">✕</button></div></div>
        <div class="nx-win-body" style="flex-direction:column;padding:12px;font-size:10px;color:#8ab0c0;font-family:Courier New,monospace">
          [2003-09-29 02:14] Backup job OK<br>[2003-09-29 03:00] NEXUS index refresh<br>[2003-09-30 11:22] User r.marshall session start<br>
        </div>
      </div>

      <div id="hack-overlay">
        <span class="ht ht-g" id="ht1">NEXUS TUNNEL — SECURE VIEW</span>
        <span class="ht" id="ht2">Endpoint: <span class="ht-a">nexus.megacorp.internal</span></span>
        <span class="ht" id="ht3">Auth: <span class="ht-a">r.marshall@megacorp.com</span> · <span class="ht-g">OK</span></span>
        <span class="ht" id="ht4">Registry mirror: <span class="ht-g">READ-ONLY</span></span>
        <span class="ht ht-o" id="ht5">⚠  Session logged. Move carefully.</span>
        <span class="ht" id="ht6">Window: <span class="ht-r">12 minutes</span></span>
        <span class="ht" id="ht7"><span class="ht-cur"></span></span>
      </div>

      <div id="cal-panel">
        <button id="cal-toggle" onclick="toggleCalPanel()">›</button>
        <div class="cp-hdr"><div class="cp-node" id="cp-node">VERIFY FRAGMENT</div><div style="font-size:11px;color:var(--text);opacity:.85">Select values from the evidence.</div></div>
        <div class="cp-body"><div class="cp-params" id="cp-params"></div></div>
        <div class="cp-foot"><button class="cp-ok" onclick="confirmCal()">✓ CONFIRM LOCK</button></div>
      </div>
    </div>

    <div id="right">
      <div id="eboard">
        <div class="eb-hdr"><div><div class="eb-htitle">CONNECTION MAP | NEXUS ARCHITECTURE</div><div class="map-sub">OMNI DATA LINEAGE RECONSTRUCTION</div></div><span id="eb-hint"></span></div>
        <div class="det-label-row"><span>DETECTION RISK</span><span id="detection-pct-2">0%</span></div>
        <div class="det-bar-wrap" style="width:100%;margin-bottom:8px"><div class="det-bar-fill" id="det-bar-fill-2"></div></div>
        <div class="map-wrap">
          <svg id="map-svg" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet"></svg>
          <div class="map-grid">
            <div class="map-cell" style="grid-column:1;grid-row:1"><div class="node n-dimmed" id="node-it" onclick="nodeClick('it')"><div class="node-icon"><i class="fas fa-server"></i></div><div class="node-name">IT INFRASTRUCTURE</div><div class="node-status" id="ns-it">LOCKED</div><div style="font-size:8px;opacity:.7;margin-top:2px">SVC-NULL-7B</div></div></div>
            <div class="map-cell" style="grid-column:3;grid-row:1"><div class="node n-dimmed" id="node-finance" onclick="nodeClick('finance')"><div class="node-icon"><i class="fas fa-sack-dollar"></i></div><div class="node-name">FINANCE</div><div class="node-status" id="ns-finance">LOCKED</div><div style="font-size:8px;opacity:.7;margin-top:2px">PALLADIAN-SYS-EXT</div></div></div>
            <div class="map-cell" style="grid-column:2;grid-row:2"><div class="node node-core" id="node-omni"><div class="node-icon">⬡</div><div class="node-name">OMNI CORE</div><div class="node-status" id="ns-omni">PROJECT_OMNI_DATASET.enc</div></div></div>
            <div class="map-cell" style="grid-column:1;grid-row:3"><div class="node n-dimmed" id="node-hr" onclick="nodeClick('hr')"><div class="node-icon"><i class="fas fa-users"></i></div><div class="node-name">HUMAN RESOURCES</div><div class="node-status" id="ns-hr">LOCKED</div><div style="font-size:8px;opacity:.7;margin-top:2px">dataset_feed_03_ENG</div></div></div>
            <div class="map-cell" style="grid-column:3;grid-row:3"><div class="node n-dimmed" id="node-vault" onclick="nodeClick('vault')"><div class="node-icon"><i class="fas fa-fingerprint"></i></div><div class="node-name">DATAVAULT</div><div class="node-status" id="ns-vault">LOCKED</div><div style="font-size:8px;opacity:.7;margin-top:2px">palladian-node-ext-01</div></div></div>
          </div>
        </div>
        <div id="eb-step">FRAGMENT 1 OF 4</div>
        <div class="key-frag-lbl" id="key-frag-lbl">KEY FRAGMENTS: <span id="frag-count">0</span> / 4</div>
        <div class="eb-progress"><div class="ep-seg" id="ep-it"></div><div class="ep-seg" id="ep-finance"></div><div class="ep-seg" id="ep-hr"></div><div class="ep-seg" id="ep-vault"></div></div>
        <button id="synth-btn" disabled onclick="startKeyForge()"><i class="fas fa-key"></i> ⬡ FORGE MASTER KEY — LOCK ALL 4 FIRST</button>
      </div>
      <div id="broker-wrap">
        <div class="broker-hdr">
          <div class="bk-avatar"><i class="fas fa-shield-halved"></i></div>
          <div class="bk-info">
            <div class="bk-name">Operation Channel</div>
            <div class="bk-members" id="bk-members">
              <span class="bk-member online" data-name="Voss">Voss</span><span class="bk-sep">,</span>
              <span class="bk-member online" data-name="Zex">Zex</span><span class="bk-sep">,</span>
              <span class="bk-member offline" data-name="Atlas">Atlas</span><span class="bk-sep">,</span>
              <span class="bk-member offline" data-name="Nova">Nova</span><span class="bk-sep">,</span>
              <span class="bk-member offline" data-name="Kade">Kade</span>
            </div>
          </div>
          <div class="bk-icons"><i class="fas fa-magnifying-glass"></i> &nbsp; <i class="fas fa-lock"></i></div>
          <div id="bk-status" hidden></div>
        </div>
        <div id="broker-body"><div class="bm-sep"><div class="bm-sep-pill">Today</div></div></div>
        <div class="broker-footer">
          <div class="broker-input-bar">
            <div class="hint-wrap">
              <button id="hint-btn" onclick="requestHint()"><i class="fas fa-lightbulb"></i></button>
              <div class="hint-tooltip">Request hint · costs $2,500</div>
              <div id="hint-cd"></div>
            </div>
            <input id="broker-input" type="text" placeholder="Operation Channel — listen only" disabled>
            <button class="mic-btn"><i class="fas fa-microphone"></i></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div id="keyforge-overlay"><pre id="keyforge-term"></pre><div id="keyforge-box"></div></div>

<div id="gameover-overlay">
  <div class="go-card">
    <div class="db-badge" style="color:var(--pink)">DETECTION LIMIT</div>
    <div class="db-head">NEXUS FLAGGED THE SESSION. MIRROR DROPPED.</div>
    <p style="color:var(--grey-text);line-height:1.6;margin:12px 0">Detection risk reached 100%. The operation is blown for this window.</p>
    <button class="db-next" onclick="document.getElementById('gameover-overlay').classList.remove('show');showDebrief(true)">DEBRIEF →</button>
  </div>
</div>

<div id="debrief-overlay" style="display:none">
  <div class="db-card">
    <div class="db-badge">MISSION 02 — COMPLETE</div>
    <div class="db-head" id="db-head-title">MASTER KEY FORGED</div>
    <div class="db-metrics" id="db-metrics"></div>
    <div class="db-rw-ttl">REAL-WORLD TRANSLATION</div>
    <div class="db-rw-txt" id="db-rw-body">
      You mapped the data lineage of a hidden AI system by reading metadata, tracing vendor relationships, and following export records across four separate internal registries.
      <br><br>
      In the real world this is <strong style="color:var(--purple-light)">Data Architecture and Lineage Analysis</strong> — understanding how data moves between systems, who owns it, where it goes, and what it connects to.
      <br><br>
      OMNI was built on 4,847 people's records without their consent. It is scheduled to go live in twelve weeks.
      <div class="db-quote" id="db-quote">"They built a machine to fire people. And trained it on the people it's going to fire." — Zex</div>
    </div>
    <button class="db-next" onclick="nextRound()">CONTINUE TO MISSION 03 — FINDING THE NAMES →</button>
  </div>
</div>

<svg id="cable-svg"><defs><filter id="cable-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs></svg>
<div id="toast"></div>
</div>

<script>
'''

with open(path, "a", encoding="utf-8") as f:
    f.write(GAME_HTML)

print("Appended GAME_HTML to", path)
