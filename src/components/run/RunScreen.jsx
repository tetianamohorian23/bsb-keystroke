import { useEffect, useRef, useState } from "react";
import { EMPTY_MESSAGE, MODES, REPS } from "../../constants";
import { useTypingAttempt } from "../../hooks/useTypingAttempt";
import { describeMistake } from "../../utils/mistake";
import { summarizeAttempts } from "../../utils/summary";
import PhraseDisplay from "../typing/PhraseDisplay";
import RhythmCanvas from "../typing/RhythmCanvas";
import TypingHeader from "../typing/TypingHeader";
import TypingInput from "../typing/TypingInput";

export default function RunScreen({ meta, onComplete }) {
  const mode = MODES[meta.mode];
  const [rep, setRep] = useState(0);
  const [message, setMessage] = useState(EMPTY_MESSAGE);
  const [ghost, setGhost] = useState([]);
  const rows = useRef([]);
  const attemptsBars = useRef([]);

  const attempt = useTypingAttempt({ target: mode.text, onEnter: finish });

  // Staré hlásenie zmizne, keď účastník začne písať.
  useEffect(() => {
    if (attempt.text) setMessage(EMPTY_MESSAGE);
  }, [attempt.text]);

  function reject(text) {
    setMessage({ text, kind: "bad" });
    attempt.reset();
  }

  function finish() {
    const eventRows = attempt.getEventRows();
    const downs = eventRows.filter((row) => row.event === "down").length;
    const ups = eventRows.length - downs;

    if (attempt.text !== mode.text) {
      return reject(`Text sa nezhoduje so zadaným textom. Napíšte ${mode.noun} znova.`);
    }
    if (downs !== ups) {
      return reject("Nie všetky klávesy boli uvoľnené. Skúste znova.");
    }

    const next = rep + 1;
    const savedBars = attempt.getBars();
    rows.current.push(...eventRows.map((row) => ({ ...meta, rep: next, ...row })));
    attemptsBars.current.push(savedBars);
    setGhost(savedBars);
    setRep(next);
    attempt.reset();

    if (next >= REPS) {
      onComplete(
        rows.current,
        summarizeAttempts(attemptsBars.current, meta.participant_id),
      );
    } else {
      setMessage({ text: "Započítané. Ešte raz.", kind: "ok" });
    }
  }

  const progress = (rep / REPS) * 100;
  const status = attempt.mistake
    ? { text: describeMistake(attempt.mistake), kind: "bad" }
    : message.text || attempt.text
      ? message
      : { text: "Začnite písať, text sa zobrazuje priamo vo vete.", kind: "" };

  return (
    <section className="card run-card">
      <TypingHeader
        counter={
          <>
            {String(rep).padStart(2, "0")} <small>/ {REPS}</small>
          </>
        }
        label={mode.header}
        title="Udržte prirodzený rytmus."
      />
      <PhraseDisplay text={mode.text} typed={attempt.text} mistake={attempt.mistake} />
      <TypingInput attempt={attempt} ariaLabel="Pole na písanie" />
      <RhythmCanvas bars={attempt.bars} ghost={ghost} expectedMs={mode.expectedMs} />
      <div className="progress-meta">
        <span>POSTUP MERANIA</span>
        <b>{Math.round(progress)}%</b>
      </div>
      <div className="bar">
        <i style={{ width: `${progress}%` }} />
      </div>
      <div className="row">
        <p className={status.kind} role="status">
          {status.text}
        </p>
        <p className="attempt-count">
          Opakovanie {rep} z {REPS}
        </p>
      </div>
    </section>
  );
}
