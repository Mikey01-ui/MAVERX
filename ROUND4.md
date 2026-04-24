# Round 4 — The Counterweight

**Operation OMNI · The Data Heist**  
**Skill focus:** Evidence quality for data investigations — **auditability**, **provenance/lineage**, **minimum necessary disclosure**, and building **redaction‑resistant findings**.

This document describes the **story**, **characters**, **gameplay loop**, **win/fail conditions**, and the **real‑world data skills** Round 4 teaches.

---

## 1. Where this sits in the arc

- **Round 2**: Who owns the data (stewardship, accountability chains).
- **Round 3**: Who should see which data (public vs official vs vault).
- **Round 4**: What happens when the target fights back and hides behind “process” — and how you build **proof that survives redaction and PR**.

Round 4 turns “we have receipts” into “we have a case.”

---

## 2. Story premise

### The counter-attack

The Proof Wall goes live. MegaCorp responds fast:

- They announce an “independent review.”
- They claim “employee privacy” prevents details.
- They imply the leak is reckless, not OMNI.
- They offer “cooperation” with regulators — while delaying, redacting, and denying.

This is the **Human Shield** weaponized: using privacy language to avoid accountability.

### Crew objective

Build an **Audit Packet** that an oversight body can’t shrug off:

- Show **intent** (they knew),
- show **action** (they ran it),
- show **authority** (someone approved / accepted risk).

Do it without betraying Nova’s boundary: **minimum necessary disclosure**.

---

## 3. Characters (Round 4 tone)

- **Nova**: “Privacy isn’t a shield for wrongdoing. But we don’t burn civilians to prove that point.”  
  She evaluates whether your packet is both **ethical** and **defensible**.
- **Voss**: Frames the work as investigation craft: *evidence standards, provenance, decision trails*.
- **Zex**: Wants speed, learns durability: “A headline fades. A signed risk acceptance doesn’t.”
- **Atlas** (optional): Translates systems into audit artifacts: how to prove a chain of events without leaking raw identities.

---

## 4. Gameplay overview (mechanic)

### 4.1 What the player actually does

You are given a larger pool of “artifacts” (12–16). Each artifact is **not** a full dataset dump — it’s a piece of evidence with metadata.

For each artifact, the player chooses one disposition:

- **INCLUDE (Full)** — goes into the Audit Packet as-is.
- **INCLUDE (Summary)** — only an aggregate / excerpt goes in (redaction-resistant).
- **EXCLUDE** — weak, irrelevant, or too harmful for this package.

The packet has a hard size limit (example: **8 slots**).

### 4.2 The three proof pillars (win condition)

To “win,” the final packet must satisfy all three pillars:

1. **Intent**: policy memo, strategy doc, scope approval language.
2. **Action**: execution logs, deployment records, job runs, writeback evidence.
3. **Authority**: approvals, sign-offs, change tickets, risk acceptance forms.

And it must also satisfy:

- **Ethics constraint**: no unjustified PII/minors/health in a public-facing way.
- **Auditability constraint**: each included artifact must have enough provenance (source + timestamp + owner/system) to stand up.

### 4.3 “Redaction attack” (the twist that teaches the skill)

Halfway through (or on submit), MegaCorp “responds” by forcing redactions:

- Some fields are blanked,
- some names removed,
- some values withheld “for privacy.”

Artifacts included as **Summary** are designed to remain valid under this attack (counts, rates, deltas, distributions, hash‑linked change history).

So the player learns: **build findings that still hold when details are removed**.

---

## 5. UI (fits Round 2/3 layout)

Re-use the same structure:

- **Left**: Artifact list (“EVIDENCE LOCKER”).
- **Center**: Inspector with fields like:
  - Source system
  - Owner/steward
  - Timestamp
  - PII risk badge
  - What this proves (Intent/Action/Authority)
  - “Redaction resilience” indicator (Low/Med/High)
- **Bottom**: buttons: **INCLUDE FULL / INCLUDE SUMMARY / EXCLUDE**
- **Right**: “AUDIT PACKET” slots + three pillar meters + Nova trust bar.
- **Chat**: MegaCorp PR lines + crew responses (Nova/Voss/Zex).

---

## 6. Evidence artifacts (examples)

These are designed to teach **real** investigation moves.

### Intent candidates

- **Board slide**: “Workforce optimization Q1 — target reduction numbers” (summary safe).
- **Legal memo excerpt**: lawful basis claim (“consent not required”) — low PII but high intent.

### Action candidates

- **ETL job run log**: shows nightly scoring job executed 12 times (summary strong).
- **Schema diff**: when `termination_risk_score` was added to operational systems (summary strong).

### Authority candidates

- **Change-control ticket** with approver chain (full or summary).
- **Risk acceptance form** signed by exec (full, but redact names if needed via summary).

### Traps (teach what not to use)

- **Raw employee list** (high harm; fails ethics).
- **Anecdote screenshot** (low auditability; fails proof standards).
- **Un-sourced “leaked email”** with no headers/timestamps (fails provenance).

---

## 7. Scoring / fail states

- **Budget**: wrong inclusions cost money (wasted time, legal exposure).
- **Nova trust**: drops when you include high-harm material or build a flimsy packet.
- **Hard fail**: any vault-grade PII shipped as “full” when it’s not justified.

### Success looks like

On submit, the packet passes:

- all three pillars,
- ethics constraints,
- and survives the redaction attack with a coherent narrative remaining.

Nova signs, not because it “hurts MegaCorp,” but because it is **accountability-grade evidence**.

---

## 8. Real-world translation (the taught skill)

Round 4 teaches that privacy and ethics are not the enemy of accountability. The real craft is:

- **Provenance/lineage**: knowing where evidence came from.
- **Auditability**: what decision-makers accept as proof.
- **Minimum necessary disclosure**: reveal what’s required, not what’s available.
- **Redaction-resistant reporting**: build summaries/aggregates that remain true when personal details are removed.

---

## 9. One-line pitch

**MegaCorp hides behind “privacy” to dodge blame — you build an audit packet that proves intent, action, and authority without burning the people OMNI targeted.**

