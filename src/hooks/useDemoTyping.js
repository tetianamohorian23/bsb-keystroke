import { useEffect, useState } from "react";

const rand = (min, max) => min + Math.random() * (max - min);
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Znak -> kód klávesy na slovenskej (QWERTZ) klávesnici; diakritika sa mapuje na základné písmeno.
function codeOf(ch) {
  const c = ch.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (c === " ") return "Space";
  if (c === ".") return "Period";
  if (c === ",") return "Comma";
  if (/^[a-z]$/.test(c)) return "Key" + (c === "z" ? "Y" : c === "y" ? "Z" : c.toUpperCase());
  return null;
}

// Ľudský rytmus: po medzere a bodke je pauza dlhšia, medzi písmenami náhodná.
const delayAfter = (ch) => (ch === " " ? rand(120, 210) : ch === "." ? rand(250, 400) : rand(65, 175));

const HOLD_MS = 1800; // ako dlho zostane celá veta zobrazená
const ERASE_MS = 26; // rýchlosť mazania (Backspace)
const NEXT_MS = 450; // pauza pred ďalšou vetou

const NONE = new Set();

// Úvodná obrazovka: statické frázy sa po jednej "napíšu" a zmažú dookola.
// Vracia aktuálny text a množinu práve stlačených kláves pre klávesnicu v pozadí.
export function useDemoTyping(active, phrases) {
  const [text, setText] = useState(() => (prefersReducedMotion() ? phrases[0] : ""));
  const [pressed, setPressed] = useState(NONE);

  useEffect(() => {
    if (!active) {
      setPressed(NONE);
      return undefined;
    }
    if (prefersReducedMotion()) {
      // Bez animácie: vypíše sa len prvá fráza.
      setText(phrases[0]);
      setPressed(NONE);
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

    let index = 0; // ktorá fráza
    let n = 0; // koľko znakov je napísaných

    const typeNext = () => {
      const phrase = phrases[index % phrases.length];
      if (n >= phrase.length) {
        later(erase, HOLD_MS);
        return;
      }
      const ch = phrase[n];
      n += 1;
      setText(phrase.slice(0, n));
      const code = codeOf(ch);
      if (code) {
        setPressed(new Set([code]));
        later(() => setPressed(NONE), rand(60, 120));
      }
      later(typeNext, delayAfter(ch));
    };

    const erase = () => {
      const phrase = phrases[index % phrases.length];
      if (n <= 0) {
        setPressed(NONE);
        index += 1;
        later(typeNext, NEXT_MS);
        return;
      }
      n -= 1;
      setText(phrase.slice(0, n));
      setPressed(new Set(["Backspace"]));
      later(erase, ERASE_MS);
    };

    setText("");
    later(typeNext, 400);

    return () => {
      timers.forEach(clearTimeout);
      setPressed(NONE);
    };
  }, [active, phrases]);

  return { text, pressed };
}
