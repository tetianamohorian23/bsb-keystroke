import { useCallback, useEffect, useRef, useState } from "react";
import { IGNORED_KEYS } from "../constants";

/**
 * Zaznamenáva časy stlačenia a uvoľnenia kláves jedného pokusu písania.
 * `onEnter` sa zavolá po stlačení Enter; vždy sa použije jeho najnovšia verzia.
 */
export function useTypingAttempt({ onEnter }) {
  const inputRef = useRef(null);
  const [text, setText] = useState("");
  const [bars, setBars] = useState([]);

  const events = useRef([]);
  const liveBars = useRef([]);
  const dirty = useRef(false);
  const t0 = useRef(null);

  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  const reset = useCallback(() => {
    events.current = [];
    liveBars.current = [];
    dirty.current = false;
    t0.current = null;
    setText("");
    setBars([]);
  }, []);

  useEffect(() => {
    const input = inputRef.current;
    input.focus();

    const onKeyDown = (e) => {
      if (e.repeat) {
        e.preventDefault();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onEnterRef.current();
        return;
      }
      if (IGNORED_KEYS.has(e.code)) {
        e.preventDefault();
        return;
      }

      const t = performance.now();
      if (t0.current === null) t0.current = t;

      events.current.push({ event: "down", code: e.code, key: e.key, t });
      liveBars.current.push({ code: e.code, s: t - t0.current, e: null });
      setBars([...liveBars.current]);
    };

    const onKeyUp = (e) => {
      if (IGNORED_KEYS.has(e.code)) {
        e.preventDefault();
        return;
      }
      if (e.key === "Enter" || t0.current === null) return;

      const t = performance.now();
      events.current.push({ event: "up", code: e.code, key: e.key, t });

      for (let i = liveBars.current.length - 1; i >= 0; i -= 1) {
        if (liveBars.current[i].code === e.code && liveBars.current[i].e === null) {
          liveBars.current[i].e = t - t0.current;
          break;
        }
      }
      setBars([...liveBars.current]);
    };

    input.addEventListener("keydown", onKeyDown);
    input.addEventListener("keyup", onKeyUp);
    return () => {
      input.removeEventListener("keydown", onKeyDown);
      input.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Udalosti pokusu v tvare riadkov exportu (bez metadát relácie).
  const getEventRows = () =>
    events.current.map((x, seq) => ({
      seq,
      event: x.event,
      code: x.code,
      key: x.key,
      t_ms: (x.t - t0.current).toFixed(2),
    }));

  return {
    inputRef,
    text,
    setText,
    bars,
    dirty,
    reset,
    getEventRows,
    getBars: () => liveBars.current,
  };
}
