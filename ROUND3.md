# Round 3 — The Human Shield

**Operation OMNI · The Data Heist**  
**Skill focus:** Data ethics, privacy classification, and **audience-appropriate disclosure** (who may receive which data, under what safeguards).

This document describes the **story**, **characters**, **gameplay loop**, **scoring**, and **real-world tie-in** for `round3.html`.

---

## 1. Where this sits in the arc

- **Round 2 (The Scramble)** established *who owns* intercepted datasets — stewardship chains, departments, and accountability in the registry.
- **Round 3** asks a different question: once the crew *has* access, **what may leave the building — and to whom?**  
  Not every audience may receive the same material. Conflating “we have it” with “we publish it” is how leaks harm civilians and destroy trust.

Marshall staged **ten files** toward a public **Proof Wall**. Nothing is live yet. The player’s job is to build a **distribution map**: **public channel**, **official / accountable channel**, or **no release**.

---

## 2. Story premise

### The pressure

MegaCorp and OMNI are vulnerable. The crew could maximize damage by dumping everything. **Nova’s objection** is the moral spine of the round:

- Civilian data, health records, minors’ rosters, and raw PII **must not** be weaponized for a headline.
- **“We are not OMNI.”** The difference is **choice**: we refuse to use every byte we can access.

### Crew roles (in-channel)

- **Nova** — Ethical gate. She will **sign off** only if the **distribution map** matches the crew’s framework. She threatens to walk if public channels are contaminated with unjustified exposure.
- **Voss** — Operations lead: frames the task as **routing**, not moral theatre — read the file, pick the channel.
- **Zex** — Temptation voice: acknowledges the urge to burn the company fast, and names why **triage** exists.

### What “closes” the round

The round does not end on “ten clicks.” It ends on **Nova sign-off**: the mission has an **ethical framework**, not only a target. The terminal sequence after **REQUEST NOVA SIGN-OFF** states whether the map is **acceptable**, **held** (too many errors), or **denied** (catastrophic misroute to public).

---

## 3. Gameplay overview

### 3.1 Structure

1. **Intro** (three screens): title, Nova/Voss brief, explanation of the three **release channels**.
2. **Hack / staging overlay** — short flavour text; package is **MARSHALL_DISCLOSURE_QUEUE.enc**, routing required.
3. **Main UI**
   - **Left:** list **STAGED FOR DISCLOSURE** (10 files).
   - **Center:** **INSPECTOR** — classification, identifiers/PII, harm if mishandled, routing note.
   - **Bottom:** assign **one channel** per file (until all ten are routed).
   - **Right:** **DISTRIBUTION MAP** — three columns (**PUBLIC · OFFICIAL · NO REL.**) fill with chips as you route; **Nova trust** bar; **REQUEST NOVA SIGN-OFF** when complete.
   - **Operation Channel** — chat from Voss, Zex, Nova (typing indicators, bubbles).

### 3.2 The three channels (mechanic)

| Channel | Meaning |
|--------|---------|
| **PUBLIC WALL** | Safe for **open publication** / press-facing Proof Wall — aggregates, sanitized logs, technical/policy evidence without unjustified PII. |
| **OFFICIAL FILING** | **Accountable** channels — regulators, labour processes, counsel — where sensitive material may be evaluated **without** a tabloid dump. |
| **NO RELEASE** | **Vault** — does not ship in this disclosure package; harm (health, minors, raw customer PII, named risk scores) outweighs public interest *in this form*. |

This is **not** the same as “approve / anonymize / drop” on a single axis: it encodes **audience** and **minimum necessary disclosure** to each audience.

### 3.3 Inspector fields

For each file, the player sees:

- **Classification**
- **Identifiers / PII**
- **Harm if mishandled**
- **Routing note** (designer hint toward the correct channel)

### 3.4 Economy and hints

- **Wrong route:** **−$750** (budget pressure, aligned with Round 2).
- **Hint:** **−$2,500**, short directional hint; cooldown on the hint button.

### 3.5 Nova trust

- Starts at **100%**.
- Wrong routes reduce trust by varying amounts.
- **Catastrophic:** routing to **PUBLIC** when the correct channel is **NO RELEASE** — Nova **denies** sign-off (public contamination).
- If trust falls **below ~45%** without that worst mistake, sign-off is **held** until the narrative treats the run as failed for ethics posture.

### 3.6 End states (sign-off terminal)

- **GRANTED:** No catastrophic public misroute **and** trust above threshold — Nova quotes the core line about **choosing boundaries**.
- **DENIED:** Vault material was sent to **PUBLIC**.
- **HELD:** Too many errors / trust too low — “fix the map.”

### 3.7 Debrief

- **Metrics:** time, correct routes / 10, Nova trust %, remaining budget.
- **Real-world translation:** privacy and ethics as **appropriate disclosure** — laws and policies (e.g. GDPR lawful basis, sector rules) encode *who* may process what, not only whether a field exists.

---

## 4. The ten files (design intent)

*Spoilers — correct routing for QA / teaching.*

| File | Correct channel | Teaching beat |
|------|-----------------|---------------|
| OMNI_ROI_Executive_Summary.pdf | PUBLIC | Aggregates — safe narrative evidence. |
| Employee_Risk_Scores_Full_Export.xlsx | NO RELEASE | Named individuals + scores — unacceptable exposure. |
| OMNI_Data_Pipeline_Architecture.json | PUBLIC | Technical diagram — no PII. |
| Wellness_Biometrics_Lab_Export.dat | NO RELEASE | Health-linked data — vault. |
| Web_Analytics_Raw_Sessions.dat | OFFICIAL | Sensitive traces — official review, not press. |
| Customer_Master_Snapshot.csv | NO RELEASE | Raw civilian PII. |
| Internal_Memo_OMNI_Scope.md | PUBLIC | Policy admission — no identifiers in body. |
| Regional_Payroll_Anomaly_Summary.csv | OFFICIAL | Employment/wage accountability via proper channels. |
| Partner_School_Outreach_Roster.csv | NO RELEASE | Minors — non-negotiable. |
| API_Abuse_Alert_Log_Sanitized.txt | PUBLIC | Pre-sanitized operational log. |

---

## 5. Visual design (alignment with Round 2)

Round 3 gameplay UI uses the same **terminal / OMNI** language as Round 2:

- **Desktop panel:** `#0a0c10` → `#0f1419` gradient; **router** `#0c1016`, borders `#1a2a3a`, list text `#8ab0c0`.
- **Inspector:** body text `#c8ddf0`, labels `#4a8aa0`, alternating rows `#111c24`.
- **Channels:** **green** (public), **orange** (official), **purple/pink** (vault) — aligned with **matrix green**, **warning orange**, and **stakes pink/purple** elsewhere in Operation OMNI.
- **Right column:** purple-gradient **void** panels consistent with Round 2’s `#right` / eboard styling.

---

## 6. Technical note

- **Single file:** `round3.html` — no build step; same stack as other rounds (fonts, Font Awesome, inline CSS + JS).
- **Entry from Round 2:** `round2.html` debrief **Continue** navigates to `round3.html`.

---

## 7. One-line pitch

**Build the Proof Wall OMNI can’t dismiss — without becoming the leak that burns innocents — by matching every file to the audience that ethics and law would allow.**
