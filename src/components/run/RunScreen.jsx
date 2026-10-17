import { useRef, useState } from "react";
import { EMPTY_MESSAGE, PHRASE, REPS } from "../../constants";
import { useTypingAttempt } from "../../hooks/useTypingAttempt";
import { summarizeAttempts } from "../../utils/summary";
import PhraseDisplay from "../typing/PhraseDisplay";
import RhythmCanvas from "../typing/RhythmCanvas";
import TypingHeader from "../typing/TypingHeader";
import TypingInput from "../typing/TypingInput";

export default function RunScreen({ meta, onComplete }) {
  const [rep, setRep] = useState(0);
  const [message, setMessage] = useState(EMPTY_MESSAGE);
  const [ghost, setGhost] = useState([]);
  const rows = useRef([]);
  const attemptsBars = useRef([]);

  const attempt = useTypingAttempt({ onEnter: finish });

  function reject(text) {
    setMessage({ text, kind: "bad" });
    attempt.reset();
  }

  function finish() {
    const eventRows = attempt.getEventRows();
    const downs = eventRows.filter((row) => row.event === "down").length;
    const ups = eventRows.length - downs;

    if (attempt.text !== PHRASE) {
      return reject("Text sa nezhoduje s vetou. Skúste znova.");
    }
    if (attempt.dirty.current) {
      return reject("Použili ste Backspace alebo Delete. Napíšte znova bez opráv.");
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

  return (
    <section className="card run-card">
      <TypingHeader
        counter={
          <>
            {String(rep).padStart(2, "0")} <small>/ {REPS}</small>
          </>
        }
        label="VETA NA ODPÍSANIE"
        title="Udržte prirodzený rytmus."
      />
      <PhraseDisplay typed={attempt.text} />
      <TypingInput attempt={attempt} ariaLabel="Pole na písanie vety" />
      <RhythmCanvas bars={attempt.bars} ghost={ghost} />
      <div className="progress-meta">
        <span>POSTUP MERANIA</span>
        <b>{Math.round(progress)}%</b>
      </div>
      <div className="bar">
        <i style={{ width: `${progress}%` }} />
      </div>
      <div className="row">
        <p className={message.kind} role="status">
          {message.text}
        </p>
        <p className="attempt-count">
          Opakovanie {rep} z {REPS}
        </p>
      </div>
    </section>
  );
}
