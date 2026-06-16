"use client";

/** Shared chrome for the M2 intro pages (round2_v14 status bar + ambient layers). */
export function M2Ambient() {
  return (
    <>
      <div className="ambient-glow" />
      <div className="scanlines" />
      <div className="bg-grid" />
      <div className="corner corner--tl" />
      <div className="corner corner--tr" />
      <div className="corner corner--bl" />
      <div className="corner corner--br" />
    </>
  );
}

export function M2StatusBar() {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span>
          <span className="status-dot live" />
          LIVE SESSION
        </span>
        <span>OPERATION OMNI</span>
        <span>MISSION 02 / 05</span>
      </div>
      <div className="status-right">
        <span>MASTERMIND TERMINAL</span>
        <span>v2.1.0</span>
      </div>
    </div>
  );
}
