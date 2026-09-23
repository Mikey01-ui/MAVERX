"use client";

import { useEffect, useRef, useState } from "react";
import { AudioToggle } from "@/components/audio/AudioToggle";
import "./MissionGameHeader.css";

export type MissionGameHeaderInfo = {
  color: string;
  desc: string;
  cause: string;
};

export type MissionGameHeaderProps = {
  /** Center title, e.g. "MISSION 03 OF 05 / THE HUMAN SHIELD" */
  missionLine: string;
  detection: number;
  /** Band label shown beside the bar (DARK / SCANNING / …) */
  band: string;
  detClass: string;
  barClass: string;
  /** Font Awesome icon name without the `fas` prefix, e.g. `fa-shield-alt` */
  icon: string;
  timer: string;
  info?: MissionGameHeaderInfo;
  infoAriaLabel?: string;
  showMeter?: boolean;
  showAudio?: boolean;
};

function formatDet(detection: number) {
  return Math.round(detection);
}

/**
 * Shared in-game `#hdr` — gameplay + tutorials + Margus.
 * `#det-cluster` / `#mission-chrome` kept for tutorial spotlights.
 */
export function MissionGameHeader({
  missionLine,
  detection,
  band,
  detClass,
  barClass,
  icon,
  timer,
  info,
  infoAriaLabel = "Detection status info",
  showMeter = true,
  showAudio = true,
}: MissionGameHeaderProps) {
  const det = formatDet(detection);
  const prevDet = useRef(det);
  const [flash, setFlash] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [toast, setToast] = useState<number | null>(null);
  const meterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!showMeter) {
      prevDet.current = det;
      return;
    }
    if (det > prevDet.current) {
      const gained = det - prevDet.current;
      setToast(Math.max(1, gained));
      setFlash(true);
      setPulse(true);
      const flashT = window.setTimeout(() => setFlash(false), 400);
      const pulseT = window.setTimeout(() => setPulse(false), 2100);
      const toastT = window.setTimeout(() => setToast(null), 1300);
      prevDet.current = det;
      return () => {
        window.clearTimeout(flashT);
        window.clearTimeout(pulseT);
        window.clearTimeout(toastT);
      };
    }
    prevDet.current = det;
  }, [det, showMeter]);

  const meterBlock = showMeter ? (
    <span
      id="det-display"
      ref={meterRef}
      className={`${detClass}${flash ? " det-flash" : ""}${pulse ? " det-penalty-pulse" : ""}`}
    >
      <span id="det-icon">
        <i className={`fas ${icon}`} aria-hidden />
      </span>
      <span id="det-pct">{det}%</span>
      <span className="det-bar-wrap">
        <span id="det-bar" className={barClass} style={{ width: `${det}%` }} />
      </span>
      <span id="det-label">{band}</span>
    </span>
  ) : null;

  const infoBlock =
    showMeter && info ? (
      <span className="det-info-wrap" tabIndex={0} aria-label={infoAriaLabel}>
        <i className="fas fa-circle-info det-info-i" aria-hidden />
        <div className="det-info-pop" role="tooltip">
          <div className="dip-ttl" style={{ color: info.color }}>
            {band}
          </div>
          <div className="dip-desc">{info.desc}</div>
          <div className="dip-cause">{info.cause}</div>
        </div>
      </span>
    ) : null;

  return (
    <>
      <div id="hdr" className="mission-game-hdr">
        <div className="hdr-left">
          <i className="fas fa-terminal" aria-hidden /> MASTERMIND TERMINAL | OPERATION OMNI
        </div>
        <div className="hdr-center">{missionLine}</div>
        <div className="hdr-right">
          {showMeter ? (
            <span id="det-cluster">
              {meterBlock}
              {infoBlock}
            </span>
          ) : null}
          {showMeter && showAudio ? <span className="hdr-sep" aria-hidden>
            |
          </span> : null}
          {showAudio ? <AudioToggle compact /> : null}
          {showAudio || showMeter ? <span className="hdr-sep" aria-hidden>
            |
          </span> : null}
          <span id="mission-chrome">
            <span id="timer">{timer}</span>
            <span className="live-dot" />
            <span className="hdr-live">LIVE</span>
          </span>
        </div>
      </div>
      {showMeter && toast !== null && meterRef.current ? (
        <DetectionToast amount={toast} anchor={meterRef.current.getBoundingClientRect()} />
      ) : null}
    </>
  );
}

function DetectionToast({ amount, anchor }: { amount: number; anchor: DOMRect }) {
  return (
    <div
      className="det-toast"
      style={{
        top: anchor.top + 4,
        left: anchor.left + anchor.width / 2 - 50,
      }}
    >
      +{amount}% DETECTED
    </div>
  );
}
