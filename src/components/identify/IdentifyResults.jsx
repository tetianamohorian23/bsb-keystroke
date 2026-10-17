export default function IdentifyResults({ result, onRetry, onBack }) {
  return (
    <div className="identify-results">
      <h2>
        {result.unknown
          ? "Neznámy používateľ"
          : `Najviac sa podobá na: ${result.name}`}
      </h2>
      {result.matches.map((match) => (
        <div className="match" key={match.name}>
          <span>{match.name}</span>
          <b>{match.percent}%</b>
        </div>
      ))}
      <div className="identify-actions">
        <button className="ghost" onClick={onRetry}>
          Skontrolovať znova
        </button>
        <button className="ghost" onClick={onBack}>
          Späť
        </button>
      </div>
    </div>
  );
}
