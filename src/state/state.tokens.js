export const TONICS = [
  ["C", 0], ["C♯", 1], ["D", 2], ["D♯", 3], ["E", 4], ["F", 5],
  ["F♯", 6], ["G", 7], ["G♯", 8], ["A", 9], ["A♯", 10], ["B", 11],
];

export const NOTE_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
export const NATURAL_PITCHES = [0, 2, 4, 5, 7, 9, 11];

export const SCALE_PATTERNS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

export const SCALE_DEGREES = ["I", "II", "III", "IV", "V", "VI", "VII"];

export const DEGREES = [
  ["2", 2, "MAIOR"], ["3", 4, "MAIOR"], ["4", 5, "JUSTA"], ["5", 7, "JUSTA"],
  ["6", 9, "MAIOR"], ["7", 11, "MAIOR"], ["9", 14, "COMPOSTA"], ["10", 16, "COMPOSTA"],
  ["11", 17, "COMPOSTA"], ["12", 19, "COMPOSTA"], ["13", 21, "COMPOSTA"], ["14", 23, "COMPOSTA"],
  ["♭2", 1, "BEMOL"], ["♯2", 3, "SUSTENIDO"], ["♭3", 3, "BEMOL"], ["♯3", 5, "SUSTENIDO"],
  ["♭4", 4, "BEMOL"], ["♯4", 6, "SUSTENIDO"], ["♭5", 6, "BEMOL"], ["♯5", 8, "SUSTENIDO"],
  ["♭6", 8, "BEMOL"], ["♯6", 10, "SUSTENIDO"], ["♭7", 10, "BEMOL"], ["♯7", 12, "SUSTENIDO"],
  ["♭9", 13, "BEMOL"], ["♯9", 15, "SUSTENIDO"], ["♭10", 15, "BEMOL"], ["♯10", 17, "SUSTENIDO"],
  ["♭11", 16, "BEMOL"], ["♯11", 18, "SUSTENIDO"], ["♭12", 18, "BEMOL"], ["♯12", 20, "SUSTENIDO"],
  ["♭13", 20, "BEMOL"], ["♯13", 22, "SUSTENIDO"], ["♭14", 22, "BEMOL"], ["♯14", 24, "SUSTENIDO"],
];

export const SOUND_SETS = {
  piano: {
    label: "PIANO · GRAND CONCERT",
    engine: "piano",
    duration: 6.8,
    brightness: 5600,
    hammer: 0.16,
    warmth: 1,
    room: 0.28,
  },
  pianoSoft: {
    label: "PIANO · FELT",
    engine: "piano",
    duration: 6.2,
    brightness: 3100,
    hammer: 0.055,
    warmth: 1.25,
    room: 0.34,
  },
  guitarNylon: {
    label: "VIOLÃO · NYLON",
    engine: "guitar",
    duration: 5.5,
    brightness: 3200,
    pickNoise: 0.35,
    damping: 0.98,
    room: 0.15,
  },
  guitarSteel: {
    label: "VIOLÃO · AÇO",
    engine: "guitar",
    duration: 6.5,
    brightness: 6500,
    pickNoise: 0.85,
    damping: 0.992,
    room: 0.25,
  },
  synthPad: {
    label: "SYNTH · WARM PAD",
    engine: "synth",
    duration: 8.0,
    brightness: 1800,
    room: 0.5,
  },
  synthLead: {
    label: "SYNTH · BRIGHT LEAD",
    engine: "synth",
    duration: 4.0,
    brightness: 8000,
    room: 0.4,
  },
  organ: {
    label: "ÓRGÃO · ELETRIC",
    engine: "organ",
    duration: Infinity, // Or handled by adsr
    brightness: 4500,
    room: 0.3,
  },
};

export const DEFAULT_BINDINGS = {
  tonic0: "Digit1", tonic1: "Digit2", tonic2: "Digit3", tonic3: "Digit4",
  tonic4: "Digit5", tonic5: "Digit6", tonic6: "Digit7", tonic7: "Digit8",
  tonic8: "Digit9", tonic9: "Digit0", tonic10: "Minus", tonic11: "Equal",
  degree0: "KeyQ", degree1: "KeyW", degree2: "KeyE", degree3: "KeyR",
  degree4: "KeyT", degree5: "KeyY", degree6: "KeyU", degree7: "KeyI",
  degree8: "KeyO", degree9: "KeyP", degree10: "BracketLeft", degree11: "BracketRight",
  degree12: null, degree13: null, degree14: null, degree15: null,
  degree16: null, degree17: null, degree18: null, degree19: null,
  degree20: null, degree21: null, degree22: null, degree23: null,
  degree24: null, degree25: null, degree26: null, degree27: null,
  degree28: null, degree29: null, degree30: null, degree31: null,
  degree32: null, degree33: null, degree34: null, degree35: null,
  octaveDown: "KeyZ", octaveUp: "KeyX",
  rhythmDown: "Space", rhythmUp: "Enter", effect: "Semicolon",
  memory0: "KeyA", memory1: "KeyS", memory2: "KeyD", memory3: "KeyF",
  memory4: "KeyG", memory5: "KeyH", memory6: "KeyJ", memory7: "KeyK",
  memory8: "KeyL", memory9: null, memory10: "Quote", memory11: "Backslash",
  memory12: null, memory13: null, memory14: null, memory15: null,
  memory16: null, memory17: null, memory18: null, memory19: null,
  memory20: null, memory21: null, memory22: null, memory23: null,
};

const DEFAULT_PERFORMANCE_CODES = [
  "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6",
  "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal",
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8",
];

DEFAULT_PERFORMANCE_CODES.forEach((code, index) => {
  DEFAULT_BINDINGS[`performance${index}`] = code;
});

const DEFAULT_BASE_CODES = [
  "Numpad1", "Numpad2", "Numpad3", "Numpad4", "Numpad5",
  "Numpad6", "Numpad7", "Numpad8", "Numpad9", "Numpad0",
];

DEFAULT_BASE_CODES.forEach((code, index) => {
  DEFAULT_BINDINGS[`base${index}`] = code;
});
