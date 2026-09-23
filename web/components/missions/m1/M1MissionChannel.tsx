"use client";

import { useEffect, useRef } from "react";
import { CHANNEL_ROSTER } from "@/lib/game/m1/data";
import type { ChatMessage } from "@/lib/game/m1/types";
import { chatFromClass } from "@/lib/game/chatFromClass";

type Props = {
  messages: ChatMessage[];
  typing: boolean;
  hintCooldown: boolean;
  activeLead: boolean;
  onHint: () => void;
};

export function M1MissionChannel({ messages, typing, hintCooldown, activeLead, onHint }: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  return (
    <div id="voss-wrap">
      <div className="voss-hdr">
        <div className="bk-avatar" id="bk-group-avatar">
          <i className="fas fa-user-secret" aria-hidden />
        </div>
        <div className="bk-info">
          <div className="bk-name">Mission Channel</div>
          <div className="bk-members" id="bk-members">
            {CHANNEL_ROSTER.map((m, i) => (
              <span key={m.name}>
                <span className={`bk-member ${m.online ? "online" : "offline"}`} data-name={m.name}>
                  {m.name}
                </span>
                {i < CHANNEL_ROSTER.length - 1 && <span className="bk-sep">,</span>}
              </span>
            ))}
          </div>
        </div>
        <div className="bk-icons" aria-hidden>
          <i className="fas fa-magnifying-glass" /> &nbsp; <i className="fas fa-lock" />
        </div>
      </div>

      <div id="voss-body" ref={bodyRef}>
        <div className="bm-sep">
          <div className="bm-sep-pill">Today</div>
        </div>
        {messages.map((m, i) => {
          const showSender = i === 0 || messages[i - 1].sender !== m.sender;
          return (
            <div key={m.id} className={`bm-group ${chatFromClass(m.sender)}`}>
              {showSender && <div className="bm-sender">{m.sender.toUpperCase()}</div>}
              <div className={`bm-bubble ${m.tone}`}>{m.text}</div>
              <div className="bm-ts">{m.ts}</div>
            </div>
          );
        })}
        {typing && (
          <div className="bm-typing-wrap">
            <div className="bm-typing">
              <span className="tdot" />
              <span className="tdot" />
              <span className="tdot" />
            </div>
          </div>
        )}
      </div>

      <div className="voss-footer">
        <div className="voss-input-bar">
          <div className="hint-wrap">
            <button type="button" id="hint-btn" disabled={hintCooldown || !activeLead} onClick={onHint} aria-label="Request hint">
              <i className="fas fa-lightbulb" />
            </button>
            <div className="hint-tooltip">Request hint · +8% detection</div>
            <div id="hint-cd" className={hintCooldown ? "show" : ""} />
          </div>
          <input id="voss-input" type="text" placeholder="Operation Channel — listen only" disabled readOnly />
          <button type="button" className="mic-btn" aria-label="Microphone" disabled>
            <i className="fas fa-microphone" />
          </button>
        </div>
      </div>
    </div>
  );
}
