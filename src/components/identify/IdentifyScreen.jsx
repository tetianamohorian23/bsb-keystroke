import { useEffect, useState } from "react";
import { EMPTY_MESSAGE, MODES } from "../../constants";
import { useTypingAttempt } from "../../hooks/useTypingAttempt";
import { identifyAttempt } from "../../utils/api";
import { describeMistake } from "../../utils/mistake";
import PhraseDisplay from "../typing/PhraseDisplay";
import TypingHeader from "../typing/TypingHeader";
import TypingInput from "../typing/TypingInput";
import IdentifyResults from "./IdentifyResults";

export default function IdentifyScreen({ mode: modeKey, onBack }) {
  const mode = MODES[modeKey];
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(EMPTY_MESSAGE);

  const attempt = useTypingAttempt({ target: mode.text, onEnter: finish });

  // Staré hlásenie a výsledok zmiznú, keď účastník začne písať.
  useEffect(() => {
    if (attempt.text) {
      setMessage(EMPTY_MESSAGE);
      setResult(null);
    }
  }, [attempt.text]);

  async function finish() {
    const eventRows = attempt.getEventRows();
    const downs = eventRows.filter((row) => row.event === "down").length;

    if (attempt.text !== mode.text || downs !== mode.text.length) {
      setMessage({
        text: `Napíšte ${mode.noun} presne a uvoľnite všetky klávesy.`,
        kind: "bad",
      });
      attempt.reset();
      return;
    }

    try {
      setResult(await identifyAttempt(eventRows, modeKey));
      setMessage(EMPTY_MESSAGE);
    } catch (error) {
      setMessage({ text: error.message, kind: "bad" });
    }
    attempt.reset();
  }

  return (
    <section className="card run-card">
      <TypingHeader
        counter={
          <>
            ROZPOZNÁVANIE <small>jeden pokus</small>
          </>
        }
        label={`${mode.noun.toUpperCase()} NA OVERENIE`}
        title="Píšte prirodzene."
      />
      <PhraseDisplay text={mode.text} typed={attempt.text} mistake={attempt.mistake} />
      <TypingInput attempt={attempt} ariaLabel="Pole na rozpoznanie" />
      <div className="row">
        <p
          className={attempt.mistake ? "bad" : message.kind}
          role="status"
        >
          {attempt.mistake
            ? describeMistake(attempt.mistake)
            : message.text || (attempt.text || result ? "" : "Začnite písať, text sa zobrazuje priamo vo vete.")}
        </p>
        <p className="attempt-count">Enter — odoslať</p>
      </div>
      {result && <IdentifyResults result={result} onBack={onBack} />}
    </section>
  );
}
