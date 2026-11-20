// Farby pruhov podľa poradia: prvé miesto je oranžové.
const BAR_COLORS = ["var(--orange)", "var(--green)", "var(--gold)"];

export default function IdentifyResults({ result, onBack }) {
  return (
    <div className="identify-results">
      <h2>
        {result.unknown
          ? "Neznámy používateľ"
          : `Najviac sa podobá na: ${result.name}`}
      </h2>
      {!result.unknown && result.matches.map((match, i) => (
        <div className={`match${i === 0 ? " top" : ""}`} key={match.name}>
          <span className="match-name">{match.name}</span>
          <div
            className="match-bar"
            role="progressbar"
            aria-label={`Podobnosť: ${match.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={match.percent}
          >
            <i
              style={{
                width: `${match.percent}%`,
                background: BAR_COLORS[i] ?? "var(--muted)",
                animationDelay: `${i * 120}ms`,
              }}
            />
          </div>
          <b>{match.percent.toFixed(1)}%</b>
        </div>
      ))}
      <div className="identify-actions">
        <button className="ghost" onClick={onBack}>
          Späť
        </button>
      </div>
    </div>
  );
}
