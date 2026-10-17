import { useEffect, useState } from "react";

// Sleduje práve stlačené klávesy (na zvýraznenie klávesnice v pozadí).
export function usePressedKeys(active) {
  const [pressed, setPressed] = useState(() => new Set());

  useEffect(() => {
    if (!active) return undefined;

    const onDown = (e) => {
      if (!e.repeat) setPressed((s) => new Set(s).add(e.code));
    };
    const onUp = (e) =>
      setPressed((s) => {
        const next = new Set(s);
        next.delete(e.code);
        return next;
      });

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [active]);

  return pressed;
}
