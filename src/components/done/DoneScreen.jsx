import { useEffect, useState } from "react";
import { REPS } from "../../constants";
import { saveSession } from "../../utils/api";
import { downloadCsv } from "../../utils/csv";
import StatsGrid from "./StatsGrid";

export default function DoneScreen({ meta, rows, summary, onBack }) {
  const [status, setStatus] = useState("sending"); // sending | saved | error

  // Relácia sa uloží automaticky; server ignoruje duplicitné odoslanie (rovnaké session_id).
  const send = async () => {
    setStatus("sending");
    try {
      const { ok } = await saveSession(meta, rows);
      setStatus(ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    send();
  }, []);

  const text = {
    sending: "Ukladá sa na server…",
    saved: "Uložené na server.",
    error: "Uloženie zlyhalo. Skúste znova alebo stiahnite CSV.",
  }[status];

  return (
    <section className="card done-card">
      <h1>Hotovo, ďakujeme.</h1>
      <p className="mute">
        Vaše meranie je pripravené. Váš kód: <strong>{summary.id}</strong>
      </p>
      <StatsGrid attempts={REPS} hold={summary.hold} time={summary.time} />
      <p
        className={`done-message ${status === "saved" ? "ok" : status === "error" ? "bad" : ""}`}
        role="status"
      >
        {text}
      </p>
      <div className="row">
        {status === "error" && (
          <>
            <button className="ghost" onClick={send}>
              Skúsiť znova
            </button>
            <button className="ghost" onClick={() => downloadCsv(rows, summary.id)}>
              Stiahnuť CSV
            </button>
          </>
        )}
        <button className="ghost" disabled={status === "sending"} onClick={onBack}>
          Späť
        </button>
      </div>
    </section>
  );
}
