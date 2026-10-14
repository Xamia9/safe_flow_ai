import { useEffect, useRef, useState } from "react";

/**
 * Tracks which story stages have been revealed by scrolling.
 * A stage becomes "revealed" the first time it enters the viewport and
 * stays revealed permanently — text never reverts to gray once shown.
 *
 * `activeIndex` is the most-visible stage, used for the progress dots.
 * `revealed` is a boolean array marking every stage that has been seen.
 *
 * Falls back to all-revealed when JS is unavailable or reduced motion
 * is preferred — the CSS handles the static readable state.
 */
export function useActiveStage(count: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    Array.from({ length: count }, () => false),
  );
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestRatio = 0;
        let bestIndex = 0;
        const newlyRevealed: { [idx: number]: boolean } = {};
        for (const entry of entries) {
          const idx = Number(
            (entry.target as HTMLElement).dataset["stageIndex"],
          );
          if (entry.intersectionRatio > 0.05) {
            newlyRevealed[idx] = true;
          }
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = idx;
          }
        }
        if (Object.keys(newlyRevealed).length > 0) {
          setRevealed((prev) => {
            const next = [...prev];
            for (const k of Object.keys(newlyRevealed)) {
              next[Number(k)] = true;
            }
            return next;
          });
        }
        if (bestRatio > 0) {
          setActiveIndex(bestIndex);
        }
      },
      { threshold: [0.05, 0.15, 0.3, 0.5, 0.7, 0.85], rootMargin: "-15% 0px -35% 0px" },
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

  return { activeIndex, revealed, setStageRef };
}
