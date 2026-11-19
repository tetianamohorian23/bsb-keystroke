import { useEffect, useState } from "react";
import { KEY_ROWS } from "../data/keyboardLayout";

const CODES = KEY_ROWS.flat().map(([code]) => code);
const rand = (min, max) => min + Math.random() * (max - min);

// Ukážková animácia: náhodné klávesy sa krátko "stlačia" (na úvodnej obrazovke).
export function useRandomKeys(active) {
  const [pressed, setPressed] = useState(() => new Set());

  useEffect(() => {
    if (!active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPressed(new Set());
      return undefined;
    }

    const timers = new Set();
    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    const tap = () => {
      const code = CODES[Math.floor(Math.random() * CODES.length)];
      setPressed((s) => new Set(s).add(code));
      later(
        () =>
          setPressed((s) => {
            const next = new Set(s);
            next.delete(code);
            return next;
          }),
        rand(90, 220),
      );
      later(tap, rand(120, 420));
    };
    later(tap, 300);

    return () => {
      timers.forEach(clearTimeout);
      setPressed(new Set());
    };
  }, [active]);

  return pressed;
}
