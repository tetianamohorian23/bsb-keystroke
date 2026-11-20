// Režimy písania: dlhá veta alebo jedno krátke slovo.
export const MODES = {
  phrase: {
    label: "Veta",
    expectedMs: 11000, // typický čas pokusu: určuje mierku grafu rytmu pri prvom pokuse
    text: "Every keystroke tells a unique story.",
    noun: "vetu",
    header: "VETA NA ODPÍSANIE",
  },
  word: {
    label: "Slovo",
    expectedMs: 2200,
    text: "biometrics",
    noun: "slovo",
    header: "SLOVO NA ODPÍSANIE",
  },
};
export const DEFAULT_MODE = "phrase";

// Frázy, ktoré sa dookola "píšu" na úvodnej obrazovke (len ukážka, nie zber dát).
export const HOME_PHRASES = [
  "Every keystroke tells a unique story.",
  "Rytmus písania je ako odtlačok prsta.",
  "Nepotrebujete heslo, stačí váš rytmus.",
];
export const REPS = 15;
// Ako dlho zostane po chybe viditeľné vysvetlenie, kým sa pokus vynuluje.
export const MISTAKE_MS = 1600;

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

// Opravné klávesy: zrušia aktuálny pokus a nikdy sa nevykonajú.
export const CORRECTION_KEYS = new Set(["Backspace", "Delete"]);

export const DESKTOP = "Stolový počítač";
export const DEVICES = ["Notebook", DESKTOP];
export const BUILT_IN_KEYBOARD = "Vstavaná";
export const KEYBOARDS = [BUILT_IN_KEYBOARD, "Externá USB", "Externá Bluetooth"];

export const EMPTY_MESSAGE = { text: "", kind: "" };
