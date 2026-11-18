import { useEffect, useState } from "react";
import { MODES } from "../../constants";
import { fetchComparison } from "../../utils/api";

const ROWS = [
  ["Účastníci", (m) => m.participants],
  ["Počet príznakov", (m) => m.features],
  ["Testovacie pokusy", (m) => m.total],
  ["Presnosť top-1", (m) => `${m.top1} %`, "top1"],
  ["Presnosť top-3", (m) => `${m.top3} %`, "top3"],
  ["Zamietnuté ako neznáme", (m) => `${m.unknown_rate} %`],
  ["Priemerný čas pokusu", (m) => `${m.avg_time_s} s`],
];

export default function CompareScreen({ onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComparison().then(setData, (e) => setError(e.message));
  }, []);

  if (error) return <section className="card"><p className="bad">{error}</p></section>;
  if (!data) return <section className="card"><p className="mute">Načítava sa…</p></section>;

  const fair = data.common_participants.length >= 2;
  const stats = fair ? data.common : data.all;

  return (
    <section className="card compare-card">
      <h1>Veta vs. slovo</h1>
      <p className="mute">
        {fair
          ? `Porovnanie na ${data.common_participants.length} účastníkoch, ktorí absolvovali oba režimy (šablóna: pokusy 1–10, test: pokusy 11–15).`
          : "Zatiaľ nie sú aspoň dvaja účastníci, ktorí absolvovali oba režimy. Zobrazené sú všetky dáta, ale porovnanie nie je spravodlivé (rôzni účastníci)."}
      </p>
      <table className="compare-table">
        <thead>
          <tr>
            <th />
            {Object.entries(MODES).map(([key, { label }]) => (
              <th key={key}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([label, format, bar]) => (
            <tr key={label}>
              <td>{label}</td>
              {Object.keys(MODES).map((key) => (
                <td key={key}>
                  <b>{format(stats[key])}</b>
                  {bar && (
                    <div className="bar">
                      <i style={{ width: `${stats[key][bar]}%` }} />
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button className="ghost" onClick={onBack}>
        Späť
      </button>
    </section>
  );
}
