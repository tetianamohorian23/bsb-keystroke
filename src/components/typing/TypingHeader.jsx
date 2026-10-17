// Horná časť karty s písaním: ukazovateľ stavu + nadpis.
export default function TypingHeader({ counter, label, title }) {
  return (
    <>
      <div className="status-row">
        <span aria-hidden="true" />
        <strong>{counter}</strong>
      </div>
      <div className="run-heading">
        <div>
          <span className="section-label">{label}</span>
          <h2>{title}</h2>
        </div>
        <span className="timer-dot">●</span>
      </div>
    </>
  );
}
