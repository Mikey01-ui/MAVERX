import { ReactNode } from "react";

export function AmbientShell({
  children,
  theme,
}: {
  children: ReactNode;
  theme?: "theme-v2";
}) {
  const content = (
    <>
      <div className="ambient-glow" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />
      <div className="bg-grid" aria-hidden="true" />
      <div className="corner corner--tl" aria-hidden="true" />
      <div className="corner corner--tr" aria-hidden="true" />
      <div className="corner corner--bl" aria-hidden="true" />
      <div className="corner corner--br" aria-hidden="true" />
      {children}
    </>
  );

  return theme ? <div className={theme}>{content}</div> : content;
}
