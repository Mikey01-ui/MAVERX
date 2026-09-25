import { useLayoutEffect, useRef } from "react";

type CountUpProps = {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  /** Restart the count whenever this key changes (e.g. active tab). */
  restartKey?: string | number;
};

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUp({
  value,
  duration = 1.15,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
  restartKey,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const format = (n: number) => {
      const body = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
      return `${prefix}${body}${suffix}`;
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      el.textContent = format(value);
      return;
    }

    el.textContent = format(0);
    let raf = 0;
    let start: number | null = null;
    const ms = Math.max(0.2, duration) * 1000;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / ms);
      el.textContent = format(value * easeOutCubic(p));
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        el.textContent = format(value);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, decimals, suffix, prefix, restartKey]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
