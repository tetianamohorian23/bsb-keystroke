const block = (e) => e.preventDefault();

// Skryté vstupné pole (zachytáva klávesy; text sa zobrazuje priamo vo vete).
// Vkladanie a presúvanie textu je zakázané.
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
      readOnly={Boolean(attempt.mistake)}
    />
  );
}
