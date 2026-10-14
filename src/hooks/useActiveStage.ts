import { useEffect, useRef, useState } from "react";

/**
 * Tracks which of the `count` story stages is currently most visible
 * in the viewport, using IntersectionObserver. Returns the active index
 * (0-based) and a ref map function for registering stage elements.
 *
 * Falls back to stage 0 active when JS is unavailable or reduced motion
 * is preferred — the CSS handles the static readable state.
 */
export function useActiveStage(count: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestRatio = 0;
        let bestIndex = 0;
        for (const entry of entries) {
          const idx = Number(
            (entry.target as HTMLElement).dataset["stageIndex"],
          );
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = idx;
          }
        }
        if (bestRatio > 0) {
          setActiveIndex(bestIndex);
        }
      },
      { threshold: [0.15, 0.3, 0.5, 0.7, 0.85], rootMargin: "-15% 0px -35% 0px" },
    );

    for (const el of refs.current) {
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [count]);

  const setStageRef =
    (index: number) => (el: HTMLElement | null) => {
      refs.current[index] = el;
    };

  return { activeIndex, setStageRef };
}
