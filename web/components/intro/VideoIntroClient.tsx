"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { VideoIntroContent } from "@/lib/content";
import { MissionChrome } from "@/components/missions/MissionChrome";
import { IntroBriefModal } from "@/components/intro/IntroBriefModal";

type VideoIntroClientProps = {
  content: VideoIntroContent;
};

function formatClock(now: Date) {
  return now.toLocaleTimeString("en-GB", { hour12: false });
}

export function VideoIntroClient({ content }: VideoIntroClientProps) {
  const router = useRouter();
  const [clock, setClock] = useState("--:--:--");
  const [modalOpen, setModalOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Time-gated charge on the start button (matches M1 brief/confirm sweep)
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 3000);
    return () => clearTimeout(t);
  }, []);

  async function handleStartMission() {
    setStarting(true);
    try {
      await fetch("/api/progress", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: "m1",
          status: "in_progress",
          checkpoint: "brief",
        }),
      });
      router.push("/mission/m1");
      router.refresh();
    } finally {
      setStarting(false);
    }
  }

  const hasVideo = Boolean(content.video.src);

  return (
    <MissionChrome
      theme="theme-v2"
      statusLeft={[content.statusLeft[0], clock, ...content.statusLeft.slice(1)]}
      statusRight={content.statusRight}
    >
      <main className="vi-page">
        <div className="vi-eyebrow">{content.eyebrow}</div>
        <h1 className="vi-title">{content.title}</h1>

        <div className="vi-video-wrapper">
          <div className="vi-video-label">
            <span>{content.video.filename}</span>
            <span>{content.video.aspectLabel}</span>
          </div>
          <div className="vi-video-box">
            <div className="vi-video-noise" />
            <div className="vi-video-scan" />
            {hasVideo ? (
              <video
                className="vi-video-element"
                controls
                playsInline
                preload="metadata"
                poster={content.video.poster ?? undefined}
                onPlay={() => setVideoPlaying(true)}
              >
                <source src={content.video.src!} />
              </video>
            ) : (
              <>
                {!videoPlaying && (
                  <div className="vi-play-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
                <div className="vi-placeholder-text">{content.video.placeholderText}</div>
              </>
            )}
          </div>
        </div>

        <div className="vi-action-strip">
          <button type="button" className="vi-brief-btn" onClick={() => setModalOpen(true)}>
            {content.readIntroButton}
          </button>
        </div>

        <div className="vi-start-section">
          <div className="vi-start-label">{content.startLabel}</div>
          <button
            type="button"
            className={`vi-btn-start btn-sweep ${!armed ? "is-locked" : ""}`}
            style={{ "--sweep-ms": "3000ms" } as React.CSSProperties}
            onClick={handleStartMission}
            disabled={starting || !armed}
          >
            <div className="vi-btn-start-inner">
              <span>{content.startButton}</span>
              <span>→</span>
            </div>
          </button>
        </div>
      </main>

      <IntroBriefModal
        modal={content.modal}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </MissionChrome>
  );
}
