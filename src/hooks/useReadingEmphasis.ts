import { useEffect, useRef, useState } from "react";

/**
 * Group-based scroll emphasis hook.
 *
 * Finds the single group of elements whose collective center is closest
 * to an activation point at ~57% of the viewport height (center of the
 * 50–65% zone). All elements in that group are activated together; all
 * others remain muted. Hysteresis prevents flickering when two groups are
 * nearly equidistant from the activation point.
 */
export function useReadingEmphasis(groups: number[][]) {
  const [activeSet, setActiveSet] = useState<Set<number>>(new Set());
  const refs = useRef<(HTMLElement | null)[]>([]);
  const rafId = useRef<number | undefined>(undefined);
  const currentGroupRef = useRef<number>(-1);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Activation point centered in the 50–65% zone
    const ACTIVATION_RATIO = 0.575;
    // Current group stays active until another is at least this much closer
    const HYSTERESIS_PX = 40;
    // Don't activate anything if the closest group is very far away
    const MAX_DIST_RATIO = 0.35;

    function update() {
      const viewportH = window.innerHeight;
      const activationY = viewportH * ACTIVATION_RATIO;
      const maxDist = viewportH * MAX_DIST_RATIO;

      let bestGroup = -1;
      let bestEffectiveDist = Infinity;

      for (let g = 0; g < groups.length; g++) {
        let sum = 0;
        let n = 0;
        for (const idx of groups[g] ?? []) {
          const el = refs.current[idx];
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          sum += rect.top + rect.height / 2;
          n++;
        }
        if (n === 0) continue;

        const groupCenter = sum / n;
        const rawDist = Math.abs(groupCenter - activationY);

        // Apply hysteresis: current group is "sticky"
        const effectiveDist =
          g === currentGroupRef.current ? rawDist - HYSTERESIS_PX : rawDist;

        if (effectiveDist < bestEffectiveDist) {
          bestEffectiveDist = effectiveDist;
          bestGroup = g;
        }
      }

      // Deactivate if even the closest group is too far away
      if (bestGroup === -1 || bestEffectiveDist > maxDist) {
        if (currentGroupRef.current !== -1) {
          currentGroupRef.current = -1;
          setActiveSet(new Set());
        }
        return;
      }

      if (bestGroup !== currentGroupRef.current) {
        currentGroupRef.current = bestGroup;
        setActiveSet(new Set(groups[bestGroup]));
      }
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
  }, [groups]);

  const setEmphasisRef = (index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  };

  return { activeSet, setEmphasisRef };
}
