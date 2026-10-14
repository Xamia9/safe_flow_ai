import { useEffect, useRef, useState } from "react";

/**
 * Reading-position-based emphasis hook.
 *
 * Tracks each registered element relative to a "reading band" centered
 * on the vertical middle of the viewport. An element becomes active
 * when its center enters the band — roughly when it reaches the
 * viewport's vertical center — and stays active after scrolling past.
 *
 * This ensures text transitions from gray to navy/green *before* it
 * reaches the top of the screen, while content further down remains
 * gray until the user scrolls toward it.
 */
export function useReadingEmphasis(count: number) {
  const [activeSet, setActiveSet] = useState<Set<number>>(new Set());
  const refs = useRef<(HTMLElement | null)[]>([]);
  const rafId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Activation zone: from 35% to 65% of viewport height.
    // An element becomes active when its center crosses below the
    // top of this band (i.e. reaches ~35% from top), which is well
    // before it could be clipped at the top of the viewport.
    const BAND_TOP_RATIO = 0.35;

    function update() {
      const viewportH = window.innerHeight;
      const bandTop = viewportH * BAND_TOP_RATIO;
      const next = new Set<number>();

      for (let i = 0; i < refs.current.length; i++) {
        const el = refs.current[i];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        // Active once the element's center has scrolled to or above
        // the top of the reading band (35% from viewport top).
        if (center <= bandTop) {
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

  const setEmphasisRef =
    (index: number) => (el: HTMLElement | null) => {
      refs.current[index] = el;
    };

  return { activeSet, setEmphasisRef };
}
