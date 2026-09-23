"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { VideoIntroContent } from "@/lib/content";
import { MissionChrome } from "@/components/missions/MissionChrome";

type VideoIntroClientProps = {
  content: VideoIntroContent;
};

function formatClock(now: Date) {
  return now.toLocaleTimeString("en-GB", { hour12: false });
}

export function VideoIntroClient({ content }: VideoIntroClientProps) {
  const [clock, setClock] = useState("--:--:--");
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    const tick = () => setClock(formatClock(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
          <details className="vi-brief-details">
            <summary className="vi-brief-btn">{content.readIntroButton}</summary>
            <div className="vi-brief-fallback">
              <p className="vi-brief-fallback-eyebrow">{content.modal.eyebrow}</p>
              <h2 className="vi-brief-fallback-title">{content.modal.title}</h2>
              {content.modal.paragraphs.map((p, i) => (
                <p key={i} className="vi-brief-fallback-p">
                  {p}
                </p>
              ))}
              <p className="vi-brief-fallback-footer">{content.modal.footer}</p>
            </div>
          </details>
        </div>

        <div className="vi-start-section">
          <div className="vi-start-label">{content.startLabel}</div>
          {/* Real <a> navigation — works when React never hydrates */}
          <Link
            href="/mission/m1"
            className="vi-btn-start btn-sweep"
            style={
              {
                "--sweep-ms": "3000ms",
                textDecoration: "none",
                display: "inline-flex",
                justifyContent: "center",
              } as React.CSSProperties
            }
          >
            <div className="vi-btn-start-inner">
              <span>{content.startButton}</span>
              <span>→</span>
            </div>
          </Link>
        </div>
      </main>
    </MissionChrome>
  );
}
