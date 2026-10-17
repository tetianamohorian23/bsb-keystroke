import { DEVICES, KEYBOARDS } from "../../constants";

export default function SetupCard({ setup, onChange, onStart, onIdentify }) {
  const set = (field) => (e) => onChange({ ...setup, [field]: e.target.value });

  return (
    <section className="card setup-card">
      <div className="section-label">
        PRÍPRAVA RELÁCIE <span>●</span>
      </div>
      <div className="grid">
        <div className="full">
          <label className="f" htmlFor="pid">
            Meno a priezvisko
          </label>{" "}
          <input
            id="pid"
            value={setup.id}
            onChange={set("id")}
            placeholder="Zadajte meno a priezvisko"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="f" htmlFor="device">
            Zariadenie
          </label>
          <select id="device" value={setup.device} onChange={set("device")}>
            {DEVICES.map((device) => (
              <option key={device}>{device}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="f" htmlFor="kbd">
            Klávesnica
          </label>
          <select id="kbd" value={setup.keyboard} onChange={set("keyboard")}>
            {KEYBOARDS.map((keyboard) => (
              <option key={keyboard}>{keyboard}</option>
            ))}
          </select>
        </div>
        <label className="check full">
          <input
            type="checkbox"
            checked={setup.consent}
            onChange={(e) => onChange({ ...setup, consent: e.target.checked })}
          />
          <span>
            Súhlasím so záznamom časových údajov stlačenia kláves na výskumné
            účely.
          </span>
        </label>
      </div>
      <button disabled={!setup.consent || !setup.id.trim()} onClick={onStart}>
        Začať meranie <span>→</span>
      </button>
      <button className="ghost" onClick={onIdentify}>
        Rozpoznať pokus
      </button>
      <small className="privacy-note">
        Údaje zostávajú chránené a slúžia iba na účely projektu.
      </small>
    </section>
  );
}
