import { useCallback, useEffect, useRef, useState } from "react";
import { CORRECTION_KEYS, IGNORED_KEYS, MISTAKE_MS } from "../constants";

/**
 * Zaznamenáva časy stlačenia a uvoľnenia kláves jedného pokusu písania.
 * `onEnter` sa zavolá po stlačení Enter. Chyba (Backspace/Delete alebo, ak je zadaný
 * `target`, znak, po ktorom text nie je začiatkom cieľa) pokus nezruší hneď: na
 * MISTAKE_MS sa zamkne vstup a `mistake` opíše, čo sa stalo ({ kind, typed, expected });
 * potom sa pokus vynuluje. Počas zámku sa všetky klávesy ignorujú. `onMistake` sa
 * zavolá pri vzniku chyby. Vždy sa použije najnovšia verzia callbackov.
 */
export function useTypingAttempt({ target, onEnter, onMistake }) {
  const inputRef = useRef(null);
  const [text, setText] = useState("");
  const [bars, setBars] = useState([]);
  const [mistake, setMistake] = useState(null);
  const locked = useRef(false);
  const unlockTimer = useRef(null);

  const events = useRef([]);
  const liveBars = useRef([]);
  const t0 = useRef(null);

  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;
  const onMistakeRef = useRef(onMistake);
  onMistakeRef.current = onMistake;

  const reset = useCallback(() => {
    events.current = [];
    liveBars.current = [];
    t0.current = null;
    setText("");
    setBars([]);
  }, []);

  const flagMistake = useCallback((info) => {
    if (locked.current) return;
    locked.current = true;
    setMistake(info);
    onMistakeRef.current?.(info);
    unlockTimer.current = setTimeout(() => {
      locked.current = false;
      setMistake(null);
      reset();
      inputRef.current?.focus();
    }, MISTAKE_MS);
  }, [reset]);

  useEffect(() => () => clearTimeout(unlockTimer.current), []);

  useEffect(() => {
    const input = inputRef.current;
    input.focus();

    const onKeyDown = (e) => {
      if (e.repeat || locked.current) {
        e.preventDefault();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onEnterRef.current();
        return;
      }
      if (CORRECTION_KEYS.has(e.code)) {
        e.preventDefault();
        flagMistake({ kind: "correction" });
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
      if (IGNORED_KEYS.has(e.code) || CORRECTION_KEYS.has(e.code) || locked.current) {
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

    // Pole je skryté, preto ho po kliknutí kamkoľvek alebo pri písaní mimo neho znova zaostríme.
    const refocus = (e) => {
      if (e.target instanceof Element && e.target.closest("button, a, select")) return;
      if (document.activeElement !== input) input.focus();
    };

    input.addEventListener("keydown", onKeyDown);
    input.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousedown", refocus);
    window.addEventListener("keydown", refocus);
    return () => {
      input.removeEventListener("keydown", onKeyDown);
      input.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousedown", refocus);
      window.removeEventListener("keydown", refocus);
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
    mistake,
    // Nesprávny znak (text nie je začiatkom cieľového textu) spustí chybový stav.
    setText: (value) => {
      if (locked.current) return;
      if (target && !target.startsWith(value)) {
        let index = 0;
        while (index < value.length && value[index] === target[index]) index += 1;
        setText(value);
        flagMistake({ kind: "wrong", index, typed: value[index], expected: target[index] ?? "" });
        return;
      }
      setText(value);
    },
    bars,
    reset,
    getEventRows,
    getBars: () => liveBars.current,
  };
}
