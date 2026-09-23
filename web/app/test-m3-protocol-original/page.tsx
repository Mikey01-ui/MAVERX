"use client";

import { ProtocolPhase } from "@/components/missions/phases/ProtocolPhase";
import type { MissionIntro } from "@/lib/content";

/** Local review only — frozen pre-fix "Nova trust" protocol copy. */
const ORIGINAL_PROTOCOL: MissionIntro["protocol"] = {
  eyebrow: "// Mission 03 — The Human Shield",
  title: "Mission Protocol",
  sectionLabel: "// How to Breach",
  steps: [
    {
      number: "01",
      title: "PUBLIC WALL",
      description:
        "Press-facing Proof Wall — only material that is <strong>already safe for open publication</strong> (aggregates, technical diagrams, policy admissions without unjustified PII).",
    },
    {
      number: "02",
      title: "OFFICIAL FILING",
      description:
        "Sensitive but <strong>accountable</strong> — for regulators, labour boards, or counsel under proper process. Not a dump for the front page.",
    },
    {
      number: "03",
      title: "NO RELEASE",
      description:
        "Stays in the vault. Health data, minors, raw customer PII — <strong>harm outweighs any headline</strong>, even if OMNI touched it.",
    },
  ],
  atlasNote:
    "Privacy and ethics are partly about <strong>minimum necessary disclosure</strong> — and <strong>who is entitled to see what</strong>.",
  detection: {
    title: "THE NOVA TRUST METER",
    tag: "ETHICS LOCK",
    paragraphs: [
      "Nova's trust starts <strong>high</strong>. Every sloppy route — treating the Public Wall like a dump, or leaking vault-only material — erodes it. If trust collapses, <strong>she will not sign off</strong> and the disclosure plan stalls.",
      "The meter runs from <em>100% (ALIGNED)</em> down toward <em>0% (RECKLESS)</em>. If it bottoms out, assume the operation channel goes cold. Move clean: <strong>audience first, harm second, headlines last.</strong>",
    ],
    pills: [
      { text: "Wrong channel / exposure · trust drops", variant: "high" },
      { text: "Mis-routed sensitive file · spike", variant: "mid" },
      { text: "Clean routing · stable", variant: "low" },
    ],
    hint: "<strong>Stuck?</strong> Click the lightbulb at the bottom-left of the Mission Channel to pull a channel hint from the crew.",
    hintPills: ["Hint requested · +8% detection", "Cooldown · 25s"],
  },
  breachLabel: "Begin Mission",
  breachReadyLabel: "// Ready to breach?",
};

export default function TestM3ProtocolOriginalPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--void, #0a0610)" }}>
      <ProtocolPhase protocol={ORIGINAL_PROTOCOL} onBreach={() => undefined} showAllSteps hideBreachButton />
    </div>
  );
}
