const block = (e) => e.preventDefault();

// Vstupné pole, v ktorom je zakázané vkladanie a presúvanie textu.
export default function TypingInput({ attempt, ariaLabel }) {
  return (
    <input
      ref={attempt.inputRef}
      className="typing-input"
      value={attempt.text}
      onChange={(e) => attempt.setText(e.target.value)}
      onPaste={block}
      onDrop={block}
      onContextMenu={block}
      onCut={block}
      autoComplete="off"
      spellCheck="false"
      aria-label={ariaLabel}
      placeholder="Začnite písať…"
    />
  );
}
