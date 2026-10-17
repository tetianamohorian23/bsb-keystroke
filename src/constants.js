export const PHRASE = "Every keystroke tells a unique story.";
export const REPS = 15;
export const WINDOW_MS = 6000;

// Klávesy, ktoré sa nezaznamenávajú.
export const IGNORED_KEYS = new Set([
  "CapsLock",
  "ShiftLeft",
  "ShiftRight",
  "MetaLeft",
  "MetaRight",
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "AltGraph",
  "Tab",
  "Escape",
]);

export const DEVICES = ["Notebook", "Stolový počítač"];
export const KEYBOARDS = ["Vstavaná", "Externá USB", "Externá Bluetooth"];

export const EMPTY_MESSAGE = { text: "", kind: "" };
