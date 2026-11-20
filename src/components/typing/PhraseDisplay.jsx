function charState(typed, char, index) {
  if (index < typed.length) return typed[index] === char ? "ok" : "bad";
  return index === typed.length ? "cur" : "";
}

export default function PhraseDisplay({ text, typed, mistake }) {
  return (
    <div className={`phrase${mistake ? " shake" : ""}`} aria-hidden="true">
      {[...text].map((char, i) => (
        <span className={charState(typed, char, i)} key={i}>
          {char === " " ? " " : char}
        </span>
      ))}
    </div>
  );
}
