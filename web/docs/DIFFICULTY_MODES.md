# Operation OMNI — Difficulty Modes

**Product:** Operation OMNI (DataGame)  
**Document type:** Design & product specification  
**Status:** Easy + Hard profiles wired and four-lens tuned · Standard = shipped Medium baseline  
**Audience:** Product, pedagogy, engineering, client / company stakeholders  

---

## 1. Executive summary

Operation OMNI ships today as a **single difficulty experience**. After structured review from four stakeholder lenses (professional analyst, university student, game/learning design, classroom facilitator), that experience is classified as **Medium** (invite label: **Standard**).

We will **not** build three separate versions of the game. We will keep **one mission set and one narrative**, and introduce **Easy**, **Standard**, and **Hard** as **shared difficulty profiles** that only change pressure and forgiveness (detection rates, penalties, hints, sign-off thresholds, crew-win rules).

| Mode | Role |
|------|------|
| **Easy** | Softer pressure for mixed or introductory cohorts |
| **Standard** | Current shipped game (Medium) — default for classrooms |
| **Hard** | Higher pressure for strong cohorts, contests, or assessment stretch |

Invite links already collect Easy / Standard / Hard. **All three profiles dial live gameplay** via `User.difficulty` → `DifficultyProvider` → mission balances.

---

## 2. How difficulty was evaluated

Difficulty was assessed from four complementary perspectives so the label is not only “designer opinion”:

| Lens | Question asked |
|------|----------------|
| **Professional analyst / consultant** | Is this hard because of domain knowledge or because of operational pressure? |
| **University student (IT / Data / BA)** | Where would a first-time player get stuck or rage-quit? What feels fair? |
| **Game & learning designer** | What band fits a classroom product? Fork content or dial levers? |
| **Teacher / workshop facilitator** | Can a mixed room finish in a live session? What should the invite default be? |

**Consensus:** the current build is **Medium**. The facilitator lens notes **Medium–Hard** under time pressure in a mixed 60–90 minute block (full five-mission first run), which reinforces treating today’s build as Standard and adding Easy for real workshops—not labeling the current game Easy.

---

## 3. Why the current game is Medium

### 3.1 What “Medium” means here

- **Not Easy:** Mistakes permanently raise detection; several missions hard-fail at 100%; ethics and crew gates can deny a clean win even after “finishing” the board.
- **Not Hard:** Tutorials, retries, handler/ECHO feedback, and (on Mission 1) a free reconnect keep the loop learnable. Puzzles are recoverable; answers are not one-shot locks.

### 3.2 Evidence by mission

| Mission | Band | Why |
|---------|------|-----|
| **M1 — Footprint** | Easy–Medium | Desktop investigation with decoys; multi-step verify; **one free reconnect** at 100% detection |
| **M2 — Master Key** | Medium (spike) | Governance rulings; unverified-steward trap; high wrong-ruling detection cost; **no reconnect** |
| **M3 — Human Shield** | Medium–Hard peak | Route 10 files; vault→public is catastrophic; clean sign-off needs low detection and zero catastrophics |
| **M4 — Handoffs** | Medium | Eight sequential correct links; wrong drops tax detection; no heal |
| **M5 — Finale** | Medium–Hard close | Framing/viz judgment; **all four crew commits** required; limited retries |

### 3.3 Shared pressure systems (Standard today)

- **Detection meter** on most missions: rises on mistakes and (where enabled) passively over time; at **100%** the operation fails (M1 allows one reconnect).
- **Hints** exist but cost detection and sit on a short cooldown.
- **Wrong answers** are usually retryable, but the meter does not heal—sloppy play still fails.
- **Soft vs hard success:** e.g. M3 can advance after a poor ethics run while still recording a failed / denied sign-off quality—important for learning, easy to misread as “I won.”

### 3.4 What is *not* the main difficulty

For professionals who already know data/privacy concepts, difficulty is mostly **operational discipline** (meter, multi-step verifies, ethics ceilings, persuasion), not opaque domain trivia. For students, tutorials pull the *feel* down one notch, while judgment calls (M2 trap, M3 routing, M5 commits) keep it Medium.

---

## 4. Design principle: one game, three profiles

### 4.1 We will not duplicate the game

| Approach | Decision |
|----------|----------|
| Three full copies of missions / story / assets | **Rejected** — triples QA, localization (e.g. Dutch), and breaks shared classroom debriefs |
| One content set + difficulty **profiles** (numeric / rule dials) | **Accepted** |

Players in the same cohort can discuss the same files, leads, and ethics dilemmas. Only the **cost of mistakes** and **win thresholds** change.

### 4.2 How profiles attach to players

1. Dashboard invite selects **Easy / Standard / Hard** (already in admin UI).  
2. Value is stored on the invite / group / user (`User.difficulty`, group difficulty).  
3. At mission start, the game loads `getDifficultyProfile(difficulty)`.  
4. Mission engines read the profile instead of hardcoded constants.

**Standard profile ≡ current shipped constants.** Easy and Hard are documented deltas from that baseline.

---

## 5. Easy mode — what makes it easier

**Goal:** Same learning outcomes and story; lower rage-quit and detection-death rate for mixed or introductory rooms.

| Lever | Easy (planned) | Effect |
|-------|----------------|--------|
| Passive detection | ~0.5× Standard, or paused for the first minutes | Careful readers are not punished only for being slow |
| Wrong-answer / hint cost | ~0.5–0.6× Standard; cheaper or free early hints | Exploration is safer |
| Mission 1 fail | Keep reconnect; optionally more soft lives | Gentler onboarding |
| Mission 3 sign-off ceiling | Higher (e.g. ≤75–80% detection) | Clean ethics win more achievable after small mistakes |
| Mission 3 catastrophic | Lower spike and/or less permanent brick | One vault→public misclick is less campaign-ending |
| Mission 5 crew | Ship at **4/4** commits; **extra retries** (2 per crew) | Near-wins can still complete without lowering the buy-in bar |
| Clue explicitness | Slightly clearer named nudges where needed | Less “hunt the UI” friction |

**Easy does *not* mean:** removing missions, auto-solving puzzles, or skipping ethics/governance content.

---

## 6. Standard mode — current Medium (default)

**Goal:** Teachable pressure; honest “real run” for typical assessment and classroom use.

| Lever | Standard (current) |
|-------|-------------------|
| Passive detection | As shipped (~20–25 minutes idle budget on several missions) |
| Hint cost | +8% detection, ~25–30s cooldown |
| Wrong rulings / routes | As shipped (e.g. M2 wrong ruling steep; M3 vault→public very costly) |
| Mission 1 | One free reconnect at 100% |
| Missions 2–4 | Fail at 100%; no reconnect |
| Mission 3 clean sign-off | Detection ≤55% and zero catastrophic public vault dumps |
| Mission 5 | **4/4** crew commits; one retry per crew challenge |

**Invite / classroom default:** **Standard** (already the normalize default). Use **Hard** only for advanced / contest cohorts.

---

## 7. Hard mode — what makes it harder

**Goal:** Same puzzles; less forgiveness for strong electives, contests, or stretch assessment.

| Lever | Hard (live profile) | Effect |
|-------|---------------------|--------|
| Passive detection | ~1.4× Standard | Time pressure without heavily taxing careful readers |
| Wrong-answer / hint cost | ~1.45× / ~1.5×; longer hint cooldown | Mistakes bite harder |
| Reconnect | **None** (including M1) | First meter death ends the run |
| Mission 3 sign-off | ≤38% detection | Clean ethics win is tight |
| Mission 3 catastrophic | Penalty scale only (~61% vault→public) | Still severe; no double-multiply run-kill |
| Mission 5 | **4/4** commits; **1** crew retry | Stretch close without a pure one-shot finale |
| Soft progression | Same fail-forward product rules; cleaner wins are harder | Stretch assessment |

**Hard does *not* mean:** a different story, hidden solutions with no feedback, or removing tutorials on first exposure without a teacher override (returners may skip tutorials).

---

## 8. Comparison matrix (at a glance)

| Lever | Easy | Standard (current) | Hard |
|-------|------|--------------------|------|
| Content / story | Same | Same | Same |
| Detection start | 0% | 0% | 0% (optional slight head-start later) |
| Passive rate | Lower / delayed | Current | Higher |
| Mistake penalties | Lower | Current | Higher |
| Hint cost | Lower / free quota | +8% | Higher or capped count |
| M1 reconnect | Yes (+ optional extras) | Once | No |
| M3 sign-off max | Higher | ≤55% | Lower |
| M5 commits to ship | 4/4 (more retries) | 4/4 | 4/4 |
| M5 crew retries | More (2) | One | One |
| Classroom default | Intro / mixed support | **Yes** | Advanced only |

---

## 9. Implementation approach (engineering)

1. Add a central module (e.g. `difficulty` profiles) defining Easy / Standard / Hard numeric rules.  
2. Resolve profile from `User.difficulty` (fallback: group difficulty → `standard`).  
3. Replace hardcoded detection / hint / sign-off / commit constants in M1–M5 with profile fields.  
4. Persist difficulty on debriefs / reports so Easy vs Hard completions are distinguishable in analytics.  
5. Keep **one** puzzle and copy set; do not fork mission data files per mode in v1.

**Out of scope for v1 (optional later):** Different distractor counts per mode, fully different clue text packs, mid-campaign difficulty changes for the same user.

---

## 10. Classroom & client notes

- A **full first-time M1→M5** run in **60–90 minutes** is optimistic for mixed rooms; facilitators may run subsets, pairs, or shortened tutorials regardless of mode.  
- **Standard** remains the recommended invite default.  
- Shared content across modes preserves a common debrief language (“we all routed the same ten files”).
- Hard is for advanced / contest / stretch assessment invites — keep cohorts on one mode when possible.
- Analytics still need difficulty stamped on mission reports (open).

---

## 11. Document control

| Field | Value |
|-------|--------|
| Product | Operation OMNI / DataGame |
| Classification of current build | **Medium (Standard)** |
| Easy / Hard delivery model | **Profile dials, not three games** |
| Related product surface | Admin dashboard invite difficulty; `User.difficulty` / group difficulty in game backend |

---

*This specification reflects product and pedagogy consensus for communicating difficulty to stakeholders and for guiding the engineering implementation of Easy and Hard modes.*
