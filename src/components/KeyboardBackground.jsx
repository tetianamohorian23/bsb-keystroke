import { KEY_ROWS } from "../data/keyboardLayout";

export default function KeyboardBackground({ pressed }) {
  return (
    <div className="kb-bg" aria-hidden="true">
      <div className="kb">
        {KEY_ROWS.map((row, i) => (
          <div className="kr" key={i}>
            {row.map(([code, label, width = 1]) => (
              <div
                className={`k ${pressed.has(code) ? "on" : ""}`}
                style={{ flexGrow: width }}
                key={code}
              >
                {label}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
