import { useState } from "react";
import { EMPTY_MESSAGE, REPS } from "../../constants";
import { saveSession } from "../../utils/api";
import StatsGrid from "./StatsGrid";

export default function DoneScreen({ meta, rows, summary, onBack }) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(EMPTY_MESSAGE);

  const send = async () => {
    if (sending) return;
    setSending(true);
    try {
      const { ok, result } = await saveSession(meta, rows);
      setMessage({
        text: ok
          ? result?.status === "already_saved"
            ? "Táto relácia už bola odoslaná."
            : "Odoslané."
          : "Chyba servera. Stiahnite CSV.",
        kind: ok ? "ok" : "bad",
      });
    } catch {
      setMessage({ text: "Odoslanie zlyhalo. Skúste znova.", kind: "bad" });
      setSending(false);
    }
  };

  return (
    <section className="card done-card">
      <h1>Hotovo, ďakujeme.</h1>
      <p className="mute">
        Vaše meranie je pripravené. Váš kód: <strong>{summary.id}</strong>
      </p>
      <StatsGrid attempts={REPS} hold={summary.hold} time={summary.time} />
      <div className="row">
        <button className="ghost" disabled={sending} onClick={send}>
          {sending ? "Odosiela sa…" : "Odoslať na server"}
        </button>
        <button className="ghost" onClick={onBack}>
          Späť
        </button>
      </div>
      <p className={`done-message ${message.kind}`} role="status">
        {message.text}
      </p>
    </section>
  );
}
