import { useState } from "react";
import { EMPTY_MESSAGE, PHRASE } from "../../constants";
import { useTypingAttempt } from "../../hooks/useTypingAttempt";
import { identifyAttempt } from "../../utils/api";
import PhraseDisplay from "../typing/PhraseDisplay";
import TypingHeader from "../typing/TypingHeader";
import TypingInput from "../typing/TypingInput";
import IdentifyResults from "./IdentifyResults";

export default function IdentifyScreen({ onBack }) {
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(EMPTY_MESSAGE);

  const attempt = useTypingAttempt({ onEnter: finish });

  function retry() {
    setResult(null);
    setMessage(EMPTY_MESSAGE);
    attempt.reset();
    attempt.inputRef.current?.focus();
  }

  async function finish() {
    const eventRows = attempt.getEventRows();
    const downs = eventRows.filter((row) => row.event === "down").length;

    if (attempt.text !== PHRASE || attempt.dirty.current || downs !== PHRASE.length) {
      setMessage({
        text: "Napíšte vetu bez opráv a uvoľnite všetky klávesy.",
        kind: "bad",
      });
      attempt.reset();
      return;
    }

    try {
      setResult(await identifyAttempt(eventRows));
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
        label="VETA NA OVERENIE"
        title="Napíšte vetu prirodzene."
      />
      <PhraseDisplay typed={attempt.text} />
      <TypingInput attempt={attempt} ariaLabel="Pole na rozpoznanie" />
      <div className="row">
        <p className={message.kind} role="status">
          {message.text}
        </p>
        <p className="attempt-count">Enter — odoslať</p>
      </div>
      {result && <IdentifyResults result={result} onRetry={retry} onBack={onBack} />}
    </section>
  );
}
