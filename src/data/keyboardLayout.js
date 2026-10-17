// Každá klávesa: [kód, popisok, relatívna šírka (predvolene 1)]
export const KEY_ROWS = [
  [
    ["Backquote", ";"],
    ...[..."1234567890"].map((c) => ["Digit" + c, c]),
    ["Minus", "="],
    ["Equal", "´"],
    ["Backspace", "⌫", 2],
  ],
  [
    ["Tab", "tab", 1.5],
    ...[..."QWERTZUIOP"].map((c) => ["Key" + (c === "Z" ? "Y" : c), c]),
    ["BracketLeft", "ú"],
    ["BracketRight", "ä"],
    ["Backslash", "ň", 1.5],
  ],
  [
    ["CapsLock", "caps", 1.8],
    ...[..."ASDFGHJKL"].map((c) => ["Key" + c, c]),
    ["Semicolon", "ô"],
    ["Quote", "§"],
    ["Enter", "enter", 2.2],
  ],
  [
    ["ShiftLeft", "shift", 2.3],
    ...[..."YXCVBNM"].map((c) => ["Key" + (c === "Y" ? "Z" : c), c]),
    ["Comma", ","],
    ["Period", "."],
    ["Slash", "-"],
    ["ShiftRight", "shift", 2.7],
  ],
  [["Space", "", 9]],
];
