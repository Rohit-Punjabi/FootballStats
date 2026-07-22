"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a number from 0 to `to` on mount (ease-out cubic). Used for hero
 * metrics so the numbers feel alive — "count-up" per the Bold design system.
 * Respects prefers-reduced-motion.
 */
export function CountUp({
  to,
  duration = 1000,
  decimals = 0,
}: {
  to: number;
  duration?: number;
  decimals?: number;
}) {
  const [n, setN] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(to);
      done.current = true;
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(to * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else done.current = true;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);

  return <>{decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString()}</>;
}
