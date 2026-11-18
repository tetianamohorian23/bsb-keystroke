// Režimy písania: dlhá veta alebo jedno krátke slovo.
export const MODES = {
  phrase: {
    label: "Veta (37 kláves)",
    text: "Every keystroke tells a unique story.",
    noun: "vetu",
    header: "VETA NA ODPÍSANIE",
  },
  word: {
    label: "Slovo (10 kláves)",
    text: "biometrics",
    noun: "slovo",
    header: "SLOVO NA ODPÍSANIE",
  },
};
export const DEFAULT_MODE = "phrase";
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
