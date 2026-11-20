const show = (char) => (char === " " ? "medzera" : `„${char}“`);

// Vysvetlenie chyby pre používateľa (pozri useTypingAttempt).
export function describeMistake(mistake) {
  if (!mistake) return "";
  if (mistake.kind === "correction") {
    return "Opravy (Backspace/Delete) nie sú povolené. Pokus sa nezapočítal, začnete odznova.";
  }
  return `Nesprávny znak ${show(mistake.typed)}, očakávalo sa ${show(mistake.expected)}. Pokus sa nezapočítal, začnete odznova.`;
}
