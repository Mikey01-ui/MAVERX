import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

type PageMorphProps = {
  /** Unique key for the active page — remounts + re-runs enter morph. */
  pageKey: string;
  /** 1 = arriving from the left (forward), -1 = from the right (back). */
  direction: 1 | -1;
  children: ReactNode;
  className?: string;
};

function PageMorphInner({
  direction,
  children,
  className,
  pageKey,
}: {
  direction: 1 | -1;
  children: ReactNode;
  className?: string;
  pageKey: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      const items = root.querySelectorAll<HTMLElement>("[data-morph-item]");
      const bars = root.querySelectorAll<HTMLElement>("[data-morph-bar]");

      // Clip during enter so transforms don't flash page/panel scrollbars.
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
          duration: 0.48,
          ease: "power3.out",
          onComplete: () => {
            gsap.set(root, { clearProps: "overflow,transform" });
          },
        }
      );

      if (items.length) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.42,
            stagger: 0.05,
            ease: "power2.out",
            delay: 0.05,
          }
        );
      }

      if (bars.length) {
        gsap.fromTo(
          bars,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: "left center",
            duration: 0.75,
            stagger: 0.07,
            ease: "power2.out",
            delay: 0.18,
          }
        );
      }
    }, root);

    return () => {
      ctx.revert();
    };
  }, [direction]);

  return (
    <div ref={rootRef} className={className} data-page={pageKey}>
      {children}
    </div>
  );
}

export function PageMorph({ pageKey, direction, children, className }: PageMorphProps) {
  return (
    <PageMorphInner key={pageKey} pageKey={pageKey} direction={direction} className={className}>
      {children}
    </PageMorphInner>
  );
}
