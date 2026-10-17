import { PHRASE } from "../../constants";

function charState(typed, char, index) {
  if (index < typed.length) return typed[index] === char ? "ok" : "bad";
  return index === typed.length ? "cur" : "";
}

export default function PhraseDisplay({ typed }) {
  return (
    <div className="phrase" aria-hidden="true">
      {[...PHRASE].map((char, i) => (
        <span className={charState(typed, char, i)} key={i}>
          {char === " " ? " " : char}
        </span>
      ))}
    </div>
  );
}
