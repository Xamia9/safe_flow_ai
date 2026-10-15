import { useEffect, useRef, useState } from "react";

/**
 * Bidirectional center-band emphasis hook.
 *
 * Each registered element is active when its vertical center is inside
 * a band centered on the viewport's vertical middle. When the element
 * scrolls past the band (up or down) it deactivates and returns to gray.
 * This works repeatedly in both scroll directions.
 */
export function useReadingEmphasis(count: number) {
  const [activeSet, setActiveSet] = useState<Set<number>>(new Set());
  const refs = useRef<(HTMLElement | null)[]>([]);
  const rafId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Band covers the middle ~30% of the viewport (35%–65% from top).
    // An element is active when its center falls within this band.
    const BAND_TOP_RATIO = 0.35;
    const BAND_BOTTOM_RATIO = 0.65;

    function update() {
      const viewportH = window.innerHeight;
      const bandTop = viewportH * BAND_TOP_RATIO;
      const bandBottom = viewportH * BAND_BOTTOM_RATIO;
      const next = new Set<number>();

      for (let i = 0; i < refs.current.length; i++) {
        const el = refs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        if (center >= bandTop && center <= bandBottom) {
          next.add(i);
        }
      }

      setActiveSet((prev) => {
        if (prev.size === next.size && [...prev].every((v) => next.has(v))) {
          return prev;
        }
        return next;
      });
    }

    function onScroll() {
      if (rafId.current !== undefined) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId.current !== undefined) cancelAnimationFrame(rafId.current);
    };
  }, [count]);

  const setEmphasisRef = (index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  };

  return { activeSet, setEmphasisRef };
}
