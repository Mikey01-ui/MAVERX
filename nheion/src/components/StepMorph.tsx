import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

type StepMorphProps = {
  /** Unique key for the active step — remounts + re-runs enter morph. */
  stepKey: string;
  /** 1 = forward, -1 = back. */
  direction?: 1 | -1;
  children: ReactNode;
  className?: string;
  /** Optional marker for targeting (e.g. invite modal vs list). */
  dataAttr?: string;
};

function StepMorphInner({
  direction,
  children,
  className,
  stepKey,
  dataAttr,
}: {
  direction: 1 | -1;
  children: ReactNode;
  className?: string;
  stepKey: string;
  dataAttr?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      gsap.set(root, { clearProps: "transform,opacity" });
      return;
    }

    gsap.killTweensOf(root);

    const ctx = gsap.context(() => {
      const items = root.querySelectorAll<HTMLElement>("[data-step-item]");

      // Clip during the tween so x/y motion never flashes a scrollbar.
      gsap.set(root, { overflow: "hidden" });

      gsap.fromTo(
        root,
        {
          opacity: 0,
          x: direction * 28,
          y: 10,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.42,
          ease: "power3.out",
          overwrite: true,
          onComplete: () => {
            gsap.set(root, { clearProps: "overflow,transform" });
          },
        }
      );

      if (items.length) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: 0.36,
            stagger: 0.04,
            ease: "power2.out",
            delay: 0.04,
            overwrite: true,
          }
        );
      }
    }, root);

    return () => {
      ctx.revert();
    };
  }, [direction, stepKey]);

  return (
    <div
      ref={rootRef}
      className={`overflow-hidden ${className ?? ""}`.trim()}
      data-step={stepKey}
      data-invite-flow={dataAttr === "data-invite-flow" ? stepKey : undefined}
      data-invite-list={dataAttr === "data-invite-list" ? stepKey : undefined}
    >
      {children}
    </div>
  );
}

/** Same GSAP enter morph as PageMorph, scoped to modal / panel step changes. */
export function StepMorph({ stepKey, direction = 1, children, className, dataAttr }: StepMorphProps) {
  return (
    <StepMorphInner
      key={stepKey}
      stepKey={stepKey}
      direction={direction}
      className={className}
      dataAttr={dataAttr}
    >
      {children}
    </StepMorphInner>
  );
}
