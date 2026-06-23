const TONICS = [
  ["C", 0], ["C♯", 1], ["D", 2], ["D♯", 3], ["E", 4], ["F", 5],
  ["F♯", 6], ["G", 7], ["G♯", 8], ["A", 9], ["A♯", 10], ["B", 11],
];

const NOTE_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PITCHES = [0, 2, 4, 5, 7, 9, 11];
const SCALE_PATTERNS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};
const SCALE_DEGREES = ["I", "II", "III", "IV", "V", "VI", "VII"];

const DEGREES = [
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

const SOUND_SETS = {
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
};

const DEFAULT_BINDINGS = {
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

const state = {
  bindings: loadBindings(),
  activeActions: new Set(),
  pointerActions: new Map(),
  tonic: null,
  degrees: new Set(),
  memories: loadMemories(),
  tonicLinks: loadTonicLinks(),
  smartMode: localStorage.getItem("instrument-smart-mode") === "true",
  smartCommandMode: localStorage.getItem("instrument-smart-command-mode") || "note",
  fieldLetter: Number(localStorage.getItem("instrument-field-letter")) || 0,
  fieldAccidental: Number(localStorage.getItem("instrument-field-accidental")) || 0,
  fieldMinor: localStorage.getItem("instrument-field-minor") === "true",
  smartLinks: loadSmartLinks(),
  smartPosition: null,
  octave: 4,
  voices: [],
  audio: null,
  master: null,
  bodyFilter: null,
  reverb: null,
  reverbGain: null,
  stringBuffers: new Map(),
  remapping: null,
  soundSet: localStorage.getItem("instrument-sound-set")?.startsWith("piano")
    ? localStorage.getItem("instrument-sound-set")
    : "piano",
  rhythmPreset: localStorage.getItem("instrument-rhythm-preset") || "pop",
  tempo: 108,
  rhythmPlaying: false,
  rhythmVariation: "a",
  rhythmStep: 0,
  rhythmTimer: null,
  nextStepAt: 0,
  manualTimers: new Map(),
  editingMemory: null,
  workspace: localStorage.getItem("instrument-workspace") === "performance" ? "performance" : "composer",
  performanceMemories: loadPerformanceMemories(),
  baseMemories: loadBaseMemories(),
  sets: loadSets(),
  activeSetId: localStorage.getItem("instrument-active-set-id") || null,
  activePerformanceSlot: null,
  activeBaseSlot: null,
  baseVoices: [],
  pendingCapture: null,
  currentMemoryIndex: null,
  actionsByPhysicalKey: new Map(),
  remapModifierCodes: new Set(),
  pendingShortcut: null,
  draggedSetId: null,
};

const tonicKeys = document.querySelector("#tonicKeys");
const tonicLinkGrid = document.querySelector("#tonicLinkGrid");
const smartModeToggle = document.querySelector("#smartModeToggle");
const fieldControls = document.querySelector("#fieldControls");
const fieldName = document.querySelector("#fieldName");
const fieldMinorButton = document.querySelector("#fieldMinor");
const fieldFlatButton = document.querySelector("#fieldFlat");
const fieldSharpButton = document.querySelector("#fieldSharp");
const tonicModeDescription = document.querySelector("#tonicModeDescription");
const tonicLinksDescription = document.querySelector("#tonicLinksDescription");
const degreeKeys = document.querySelector("#degreeKeys");
const octaveValue = document.querySelector("#octaveValue");
const degreeCount = document.querySelector("#degreeCount");
const memoryCount = document.querySelector("#memoryCount");
const memoryGrid = document.querySelector("#memoryGrid");
const soundState = document.querySelector("#soundState");
const audioStatus = document.querySelector("#audioStatus");
const soundSetSelect = document.querySelector("#soundSet");
const rhythmPresetSelect = document.querySelector("#rhythmPreset");
const tempoControl = document.querySelector("#tempoControl");
const beatState = document.querySelector("#beatState");
const engineLabel = document.querySelector("#engineLabel");
const settingsDialog = document.querySelector("#settingsDialog");
const helpDialog = document.querySelector("#helpDialog");
const mappingList = document.querySelector("#mappingList");
const memoryDialog = document.querySelector("#memoryDialog");
const memoryForm = document.querySelector("#memoryForm");
const memoryNameInput = document.querySelector("#memoryNameInput");
const memoryDialogTitle = document.querySelector("#memoryDialogTitle");
const memoryDialogDegrees = document.querySelector("#memoryDialogDegrees");
const mappingSearch = document.querySelector("#mappingSearch");
const shortcutCapture = document.querySelector("#shortcutCapture");
const captureActionName = document.querySelector("#captureActionName");
const captureShortcutPreview = document.querySelector("#captureShortcutPreview");
const confirmShortcut = document.querySelector("#confirmShortcut");
const cancelShortcut = document.querySelector("#cancelShortcut");
const smartCommandModeInputs = document.querySelectorAll('input[name="smartCommandMode"]');
const themeToggle = document.querySelector("#themeToggle");
const themeLabel = document.querySelector("#themeLabel");

function applyTheme(theme) {
  const light = theme === "light";
  document.body.dataset.theme = light ? "light" : "dark";
  themeToggle.checked = light;
  themeLabel.textContent = light ? "CLARO" : "ESCURO";
  localStorage.setItem("instrument-theme", light ? "light" : "dark");
}

applyTheme(localStorage.getItem("instrument-theme") || "dark");
const composerWorkspace = document.querySelector("#composerWorkspace");
const performanceWorkspace = document.querySelector("#performanceWorkspace");
const performanceMemoryGrid = document.querySelector("#performanceMemoryGrid");
const baseMemoryGrid = document.querySelector("#baseMemoryGrid");
const stageCurrentNote = document.querySelector("#stageCurrentNote");
const stageCurrentShape = document.querySelector("#stageCurrentShape");
const stageRhythmPreset = document.querySelector("#stageRhythmPreset");
const stageTempoControl = document.querySelector("#stageTempoControl");
const autoRhythmButton = document.querySelector("#autoRhythmButton");
const rhythmVariationButton = document.querySelector("#rhythmVariationButton");
const stageAutoRhythmButton = document.querySelector("#stageAutoRhythmButton");
const stageRhythmVariationButton = document.querySelector("#stageRhythmVariationButton");
const captureDialog = document.querySelector("#captureDialog");
const captureDialogNote = document.querySelector("#captureDialogNote");
const captureAsNote = document.querySelector("#captureAsNote");
const captureAsBase = document.querySelector("#captureAsBase");
const setList = document.querySelector("#setList");
const setEmpty = document.querySelector("#setEmpty");
const newSetButton = document.querySelector("#newSetButton");
const updateSetButton = document.querySelector("#updateSetButton");
const setDialog = document.querySelector("#setDialog");
const setForm = document.querySelector("#setForm");
const setNameInput = document.querySelector("#setNameInput");
const setDialogSummary = document.querySelector("#setDialogSummary");
const previousSetButton = document.querySelector("#previousSetButton");
const nextSetButton = document.querySelector("#nextSetButton");
const setPosition = document.querySelector("#setPosition");

function loadBindings() {
  try {
    const stored = JSON.parse(localStorage.getItem("instrument-bindings")) || {};
    const migrated = { ...stored };
    if (stored.rhythm && !stored.rhythmDown) migrated.rhythmDown = stored.rhythm;
    if (!localStorage.getItem("instrument-directional-migration")) {
      if (migrated.effect === "ArrowDown" || migrated.effect === "ShiftLeft") {
        const semicolonOwner = Object.keys(migrated).find(action =>
          action !== "effect" && migrated[action] === "Semicolon"
        );
        if (semicolonOwner) migrated[semicolonOwner] = null;
        migrated.effect = "Semicolon";
      }
    }
    const bindings = Object.fromEntries(Object.keys(DEFAULT_BINDINGS).map(action => [
      action,
      Object.prototype.hasOwnProperty.call(migrated, action) ? migrated[action] : DEFAULT_BINDINGS[action],
    ]));
    if (!localStorage.getItem("instrument-personal-default-bindings")) {
      localStorage.setItem("instrument-personal-default-bindings", JSON.stringify(bindings));
    }
    localStorage.setItem("instrument-directional-migration", "true");
    localStorage.setItem("instrument-bindings", JSON.stringify(bindings));
    return bindings;
  } catch {
    return { ...DEFAULT_BINDINGS };
  }
}

function personalDefaultBindings() {
  try {
    const stored = JSON.parse(localStorage.getItem("instrument-personal-default-bindings"));
    return stored ? { ...DEFAULT_BINDINGS, ...stored, effect: "Semicolon" } : { ...DEFAULT_BINDINGS };
  } catch {
    return { ...DEFAULT_BINDINGS };
  }
}

function loadMemories() {
  try {
    const stored = JSON.parse(localStorage.getItem("instrument-memories"));
    if (!Array.isArray(stored)) return Array(24).fill(null);
    return Array.from({ length: 24 }, (_, index) => {
      const memory = stored[index];
      if (!memory || !Array.isArray(memory.degrees)) return null;
      return {
        name: String(memory.name || "").slice(0, 24),
        degrees: memory.degrees.filter(value => Number.isInteger(value) && value >= 0 && value < DEGREES.length).slice(0, 4),
      };
    });
  } catch {
    return Array(24).fill(null);
  }
}

function loadPerformanceMemories() {
  try {
    const stored = JSON.parse(localStorage.getItem("instrument-performance-memories"));
    if (!Array.isArray(stored)) return Array(20).fill(null);
    return Array.from({ length: 20 }, (_, index) => {
      const item = stored[index];
      if (!item || !Number.isInteger(item.tonic)) return null;
      return {
        tonic: Math.max(0, Math.min(11, item.tonic)),
        noteName: String(item.noteName || TONICS[item.tonic]?.[0] || "—").slice(0, 8),
        octave: Math.max(1, Math.min(7, Number(item.octave) || 4)),
        degrees: Array.isArray(item.degrees)
          ? item.degrees.filter(value => Number.isInteger(value) && value >= 0 && value < DEGREES.length).slice(0, 4)
          : [],
        memoryIndex: Number.isInteger(item.memoryIndex) && item.memoryIndex >= 0 && item.memoryIndex < 24
          ? item.memoryIndex
          : null,
        memoryName: item.memoryName ? String(item.memoryName).slice(0, 24) : null,
        displayName: item.displayName ? String(item.displayName).slice(0, 36) : null,
      };
    });
  } catch {
    return Array(20).fill(null);
  }
}

function loadBaseMemories() {
  try {
    const stored = JSON.parse(localStorage.getItem("instrument-base-memories"));
    if (!Array.isArray(stored)) return Array(10).fill(null);
    return Array.from({ length: 10 }, (_, index) => {
      const item = stored[index];
      if (!item || !Number.isInteger(item.tonic)) return null;
      return {
        tonic: Math.max(0, Math.min(11, item.tonic)),
        noteName: String(item.noteName || TONICS[item.tonic]?.[0] || "—").slice(0, 8),
        octave: Math.max(1, Math.min(7, Number(item.octave) || 4)),
        degrees: Array.isArray(item.degrees)
          ? item.degrees.filter(value => Number.isInteger(value) && value >= 0 && value < DEGREES.length).slice(0, 4)
          : [],
        memoryIndex: Number.isInteger(item.memoryIndex) && item.memoryIndex >= 0 && item.memoryIndex < 24
          ? item.memoryIndex
          : null,
        memoryName: item.memoryName ? String(item.memoryName).slice(0, 24) : null,
        displayName: item.displayName ? String(item.displayName).slice(0, 36) : null,
      };
    });
  } catch {
    return Array(10).fill(null);
  }
}

function loadSets() {
  try {
    const stored = JSON.parse(localStorage.getItem("instrument-sets"));
    if (!Array.isArray(stored)) return [];
    return stored.filter(set =>
      set && typeof set.id === "string" && Array.isArray(set.notes) && Array.isArray(set.bases)
    ).map(set => ({
      id: set.id,
      name: String(set.name || "Conjunto sem nome").slice(0, 40),
      notes: Array.from({ length: 20 }, (_, index) => set.notes[index] || null),
      bases: Array.from({ length: 10 }, (_, index) => set.bases[index] || null),
      createdAt: Number(set.createdAt) || Date.now(),
      updatedAt: Number(set.updatedAt) || Number(set.createdAt) || Date.now(),
    }));
  } catch {
    return [];
  }
}

function savePerformanceMemories() {
  localStorage.setItem("instrument-performance-memories", JSON.stringify(state.performanceMemories));
}

function saveBaseMemories() {
  localStorage.setItem("instrument-base-memories", JSON.stringify(state.baseMemories));
}

function saveSets() {
  localStorage.setItem("instrument-sets", JSON.stringify(state.sets));
  localStorage.setItem("instrument-active-set-id", state.activeSetId || "");
}

function loadTonicLinks() {
  try {
    const storedLinks = JSON.parse(localStorage.getItem("instrument-tonic-links"));
    if (Array.isArray(storedLinks)) {
      return Array.from({ length: 12 }, (_, index) => {
        const memoryIndex = storedLinks[index];
        return Number.isInteger(memoryIndex) && memoryIndex >= 0 && memoryIndex < 24
          ? memoryIndex
          : null;
      });
    }

    const oldMemories = JSON.parse(localStorage.getItem("instrument-memories"));
    const migrated = Array(12).fill(null);
    if (Array.isArray(oldMemories)) {
      oldMemories.forEach((memory, memoryIndex) => {
        if (Number.isInteger(memory?.tonic) && memory.tonic >= 0 && memory.tonic < 12 && memoryIndex < 24) {
          migrated[memory.tonic] = memoryIndex;
        }
      });
    }
    return migrated;
  } catch {
    return Array(12).fill(null);
  }
}

function saveTonicLinks() {
  localStorage.setItem("instrument-tonic-links", JSON.stringify(state.tonicLinks));
}

function loadSmartLinks() {
  try {
    const stored = JSON.parse(localStorage.getItem("instrument-smart-links"));
    const sanitize = values => Array.from({ length: 7 }, (_, index) => {
      const memoryIndex = values?.[index];
      return Number.isInteger(memoryIndex) && memoryIndex >= 0 && memoryIndex < 24
        ? memoryIndex
        : null;
    });
    return {
      major: sanitize(stored?.major),
      minor: sanitize(stored?.minor),
    };
  } catch {
    return { major: Array(7).fill(null), minor: Array(7).fill(null) };
  }
}

function saveSmartState() {
  localStorage.setItem("instrument-smart-mode", String(state.smartMode));
  localStorage.setItem("instrument-field-letter", String(state.fieldLetter));
  localStorage.setItem("instrument-field-accidental", String(state.fieldAccidental));
  localStorage.setItem("instrument-field-minor", String(state.fieldMinor));
  localStorage.setItem("instrument-smart-links", JSON.stringify(state.smartLinks));
  localStorage.setItem("instrument-smart-command-mode", state.smartCommandMode);
}

function smartScale() {
  const mode = state.fieldMinor ? "minor" : "major";
  const rootPitch = (NATURAL_PITCHES[state.fieldLetter] + state.fieldAccidental + 12) % 12;
  const pattern = SCALE_PATTERNS[mode];
  return pattern.map((interval, position) => {
    const letterIndex = (state.fieldLetter + position) % 7;
    const targetPitch = (rootPitch + interval) % 12;
    let difference = targetPitch - NATURAL_PITCHES[letterIndex];
    while (difference > 6) difference -= 12;
    while (difference < -6) difference += 12;
    const accidental = difference < 0 ? "♭".repeat(Math.abs(difference)) : "♯".repeat(difference);
    return {
      name: `${NOTE_LETTERS[letterIndex]}${accidental}`,
      pitch: targetPitch,
      position,
    };
  });
}

function fieldDisplayName() {
  const accidental = state.fieldAccidental < 0 ? "♭" : state.fieldAccidental > 0 ? "♯" : "";
  return `${NOTE_LETTERS[state.fieldLetter]}${accidental} ${state.fieldMinor ? "MENOR" : "MAIOR"}`;
}

function smartPositionForLetter(letterIndex) {
  return smartScale().findIndex(note => note.name.startsWith(NOTE_LETTERS[letterIndex]));
}

function saveMemories() {
  localStorage.setItem("instrument-memories", JSON.stringify(state.memories));
}

function saveBindings() {
  localStorage.setItem("instrument-bindings", JSON.stringify(state.bindings));
}

function keyLabel(code) {
  if (code?.includes("+")) {
    return code.split("+").map(part => {
      const short = {
        Shift: "SHIFT", Control: "CTRL", Alt: "ALT", Meta: "CMD",
      }[part];
      return short || keyLabel(part);
    }).join("+");
  }
  const labels = {
    Space: "ESPAÇO", Enter: "ENTER", ShiftLeft: "SHIFT", ShiftRight: "SHIFT",
    Minus: "−", Equal: "=", BracketLeft: "[", BracketRight: "]",
    Semicolon: ";", Quote: "'", Backslash: "\\",
    ArrowUp: "CIMA", ArrowDown: "BAIXO", ArrowLeft: "ESQ", ArrowRight: "DIR",
  };
  if (!code) return "—";
  if (labels[code]) return labels[code];
  const compact = code
    .replace(/^Key/, "")
    .replace(/^Digit/, "")
    .replace(/^Numpad/, "N")
    .replace(/^Arrow/, "")
    .replace(/^Control/, "CTRL")
    .replace(/^Alt/, "ALT")
    .replace(/^Shift/, "SHIFT")
    .replace(/^Intl/, "");
  return compact.length > 7 ? `${compact.slice(0, 6)}…` : compact;
}

function isModifierCode(code) {
  return ["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight"].includes(code);
}

function shortcutFromEvent(event) {
  if (isModifierCode(event.code)) return event.code;
  const parts = [];
  if (event.ctrlKey) parts.push("Control");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  if (event.metaKey) parts.push("Meta");
  parts.push(event.code);
  return parts.join("+");
}

function cancelStandaloneModifiers(event) {
  const modifierCodes = [];
  if (event.shiftKey) modifierCodes.push("ShiftLeft", "ShiftRight");
  if (event.ctrlKey) modifierCodes.push("ControlLeft", "ControlRight");
  if (event.altKey) modifierCodes.push("AltLeft", "AltRight");
  if (event.metaKey) modifierCodes.push("MetaLeft", "MetaRight");

  modifierCodes.forEach(code => {
    const action = state.actionsByPhysicalKey.get(code);
    if (action) {
      state.actionsByPhysicalKey.delete(code);
      deactivate(action);
    }
  });
}

function actionLabel(action) {
  if (action.startsWith("tonic")) return `Tônica ${TONICS[Number(action.slice(5))][0]}`;
  if (action.startsWith("degree")) return `Grau ${DEGREES[Number(action.slice(6))][0]}`;
  if (action.startsWith("memory")) return `Memória ${Number(action.slice(6)) + 1}`;
  if (action.startsWith("performance")) return `Apresentação ${Number(action.slice(11)) + 1}`;
  if (action.startsWith("base")) return `Nota base ${Number(action.slice(4)) + 1}`;
  return {
    octaveDown: "Oitava −",
    octaveUp: "Oitava +",
    rhythmDown: "Sustentar",
    rhythmUp: "Toque",
    effect: "Bend +2",
  }[action];
}

function mappingGroup(action) {
  if (action.startsWith("tonic")) return ["TÔNICAS", "Compositor", "composer"];
  if (action.startsWith("degree")) return ["GRAUS", "Compositor", "composer"];
  if (action.startsWith("memory")) return ["MEMÓRIAS HARMÔNICAS", "Compositor", "composer"];
  if (action.startsWith("performance")) return ["NOTAS DE APRESENTAÇÃO", "Apresentação", "stage"];
  if (action.startsWith("base")) return ["NOTAS BASE", "Apresentação", "stage"];
  if (["octaveDown", "octaveUp"].includes(action)) return ["OITAVA", "Compositor", "composer"];
  return ["PERFORMANCE AO VIVO", "Compartilhado", "stage"];
}

function renderKeys() {
  if (state.smartMode) {
    tonicKeys.classList.add("smart-tonic-grid");
    tonicKeys.innerHTML = smartScale().map(({ name }, position) => `
      <div class="tonic-cell">
        <button class="note-key tonic-key" data-action="smartTonic${position}" type="button" aria-label="Posição ${SCALE_DEGREES[position]}, ${name}">
          <span class="note-name">${name}</span>
          <span class="scale-degree">${SCALE_DEGREES[position]} · BOTÃO ${position + 1}</span>
          <span class="keycap">${state.smartCommandMode === "note" ? name.charAt(0) : position + 1}</span>
        </button>
        <button class="tonic-add" data-add-smart-tonic="${position}" type="button" aria-label="Adicionar ${name} à apresentação">+</button>
      </div>
    `).join("");
  } else {
    tonicKeys.classList.remove("smart-tonic-grid");
    tonicKeys.innerHTML = TONICS.map(([name], index) => `
      <div class="tonic-cell">
        <button class="note-key tonic-key" data-action="tonic${index}" type="button" aria-label="Tônica ${name}">
          <span class="note-name">${name}</span>
          <span class="keycap">${keyLabel(state.bindings[`tonic${index}`])}</span>
        </button>
        <button class="tonic-add" data-add-tonic="${index}" type="button" aria-label="Adicionar ${name} à apresentação">+</button>
      </div>
    `).join("");
  }

  degreeKeys.innerHTML = DEGREES.slice(0, 12).map(([name, , quality], index) => {
    const flatIndex = 12 + index * 2;
    const sharpIndex = flatIndex + 1;
    const degreeButton = (degreeIndex, extraClass = "") => {
      const [degreeName, , degreeQuality] = DEGREES[degreeIndex];
      return `
        <button class="note-key degree-key ${extraClass}" data-action="degree${degreeIndex}" type="button" aria-label="Grau ${degreeName}">
          <span class="note-name">${degreeName}</span>
          <span class="interval">${degreeQuality}</span>
          ${state.bindings[`degree${degreeIndex}`] ? `<span class="keycap">${keyLabel(state.bindings[`degree${degreeIndex}`])}</span>` : ""}
        </button>
      `;
    };

    return `
      <div class="degree-family">
        ${degreeButton(index, "degree-natural")}
        <div class="degree-alterations">
          ${degreeButton(flatIndex, "altered flat")}
          ${degreeButton(sharpIndex, "altered sharp")}
        </div>
      </div>
    `;
  }).join("");

  for (const action of ["octaveDown", "octaveUp"]) {
    document.querySelector(`[data-action="${action}"] .keycap`).textContent = keyLabel(state.bindings[action]);
  }
  for (const action of ["rhythmDown", "rhythmUp", "effect"]) {
    document.querySelector(`[data-action="${action}"] .wide-keycap`).textContent = keyLabel(state.bindings[action]);
    document.querySelectorAll(`[data-stage-action="${action}"] .wide-keycap`).forEach(keycap => {
      keycap.textContent = keyLabel(state.bindings[action]);
    });
  }
  bindPointerControls();
  bindTonicAddButtons();
  renderMemories();
  renderTonicLinks();
  updateUI();
}

function memoryName(degrees) {
  if (!degrees.length) return "SEM GRAUS";
  return degrees.map(index => DEGREES[index][0]).join(" · ");
}

function matchingMemoryIndex(degrees = [...state.degrees]) {
  const signature = [...degrees].sort((a, b) => a - b).join(",");
  return state.memories.findIndex(memory =>
    memory && [...memory.degrees].sort((a, b) => a - b).join(",") === signature
  );
}

function currentCaptureSnapshot() {
  if (state.tonic === null) return null;
  const matchedIndex = matchingMemoryIndex();
  const currentMemoryMatches = state.currentMemoryIndex !== null
    && state.memories[state.currentMemoryIndex]
    && [...state.memories[state.currentMemoryIndex].degrees].sort((a, b) => a - b).join(",")
      === [...state.degrees].sort((a, b) => a - b).join(",");
  const memoryIndex = currentMemoryMatches ? state.currentMemoryIndex : matchedIndex;
  const memoryLabel = memoryIndex >= 0
    ? state.memories[memoryIndex].name
    : state.degrees.size
      ? memoryName([...state.degrees])
      : "Tônica";
  const noteName = currentNoteName();
  return {
    tonic: state.tonic,
    noteName,
    octave: state.octave,
    degrees: [...state.degrees],
    memoryIndex: memoryIndex >= 0 ? memoryIndex : null,
    memoryName: memoryIndex >= 0 ? state.memories[memoryIndex].name : null,
    displayName: `${noteName}${memoryLabel}`,
  };
}

function currentNoteName() {
  if (state.tonic === null) return "—";
  const staged = state.activePerformanceSlot !== null
    ? state.performanceMemories[state.activePerformanceSlot]
    : null;
  if (staged && staged.tonic === state.tonic) return staged.noteName;
  if (state.smartMode && state.smartPosition !== null) return smartScale()[state.smartPosition].name;
  return TONICS[state.tonic][0];
}

function capturePerformanceMemory(index) {
  const snapshot = state.pendingCapture || currentCaptureSnapshot();
  if (!snapshot) {
    soundState.textContent = "ESCOLHA UMA TÔNICA NO COMPOSITOR";
    return;
  }
  state.performanceMemories[index] = { ...snapshot };
  savePerformanceMemories();
  renderPerformanceMemories();
  soundState.textContent = `APRESENTAÇÃO ${index + 1} · ${state.performanceMemories[index].displayName}`;
}

function captureInNextPerformanceSlot() {
  const nextIndex = state.performanceMemories.findIndex(item => !item);
  if (nextIndex < 0) {
    soundState.textContent = "OS 20 ESPAÇOS DE APRESENTAÇÃO ESTÃO OCUPADOS";
    return;
  }
  capturePerformanceMemory(nextIndex);
}

function captureInNextBaseSlot() {
  const nextIndex = state.baseMemories.findIndex(item => !item);
  if (nextIndex < 0) {
    soundState.textContent = "AS 10 NOTAS BASE ESTÃO OCUPADAS";
    return;
  }
  const snapshot = state.pendingCapture || currentCaptureSnapshot();
  if (!snapshot) return;
  state.baseMemories[nextIndex] = { ...snapshot };
  saveBaseMemories();
  renderBaseMemories();
  soundState.textContent = `BASE ${nextIndex + 1} · ${snapshot.displayName}`;
}

function openCaptureDialog() {
  const snapshot = currentCaptureSnapshot();
  if (!snapshot) return;
  const noteFree = state.performanceMemories.some(item => !item);
  const baseFree = state.baseMemories.some(item => !item);
  if (!noteFree && !baseFree) {
    soundState.textContent = "APRESENTAÇÃO E BASES ESTÃO COMPLETAS";
    return;
  }
  state.pendingCapture = snapshot;
  if (!baseFree) {
    captureInNextPerformanceSlot();
    state.pendingCapture = null;
    return;
  }
  if (!noteFree) {
    captureInNextBaseSlot();
    state.pendingCapture = null;
    return;
  }
  captureDialogNote.textContent = `${snapshot.displayName} · OITAVA ${snapshot.octave}`;
  captureAsNote.disabled = !noteFree;
  captureAsBase.disabled = !baseFree;
  captureDialog.showModal();
}

function bindTonicAddButtons() {
  tonicKeys.querySelectorAll("[data-add-tonic]").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      const tonicIndex = Number(button.dataset.addTonic);
      dampVoices(SOUND_SETS[state.soundSet].engine === "piano" ? 0.24 : 0.12);
      state.tonic = tonicIndex;
      state.smartPosition = null;
      recallLinkedMemory(tonicIndex);
      updateUI();
      openCaptureDialog();
    });
  });
  tonicKeys.querySelectorAll("[data-add-smart-tonic]").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      selectSmartPosition(Number(button.dataset.addSmartTonic));
      openCaptureDialog();
    });
  });
}

function recallPerformanceMemory(index) {
  const item = state.performanceMemories[index];
  if (!item) {
    soundState.textContent = `NOTA ${index + 1} VAZIA`;
    return;
  }
  dampVoices(SOUND_SETS[state.soundSet].engine === "piano" ? 0.24 : 0.12);
  state.tonic = item.tonic;
  state.octave = item.octave;
  state.degrees = new Set(item.degrees);
  state.currentMemoryIndex = item.memoryIndex;
  state.smartPosition = null;
  state.activePerformanceSlot = index;
  updateUI();
  renderPerformanceMemories();
  updateStageCurrent();
  refreshHeldRhythm();
  soundState.textContent = `P${String(index + 1).padStart(2, "0")} · ${item.noteName}`;
}

function updateStageCurrent() {
  stageCurrentNote.textContent = state.tonic === null
    ? "NENHUMA TÔNICA"
    : `${currentNoteName()} · OITAVA ${state.octave}`;
  const memoryIndex = state.currentMemoryIndex !== null
    ? state.currentMemoryIndex
    : matchingMemoryIndex();
  stageCurrentShape.textContent = memoryIndex >= 0
    ? `M${memoryIndex + 1} · ${state.memories[memoryIndex].name}`
    : state.degrees.size
      ? memoryName([...state.degrees])
      : "TÔNICA PURA";
}

function renderPerformanceMemories() {
  performanceMemoryGrid.innerHTML = state.performanceMemories.map((item, index) => `
    <article class="performance-memory-slot ${item ? "saved" : "empty"} ${state.activePerformanceSlot === index ? "active" : ""}" ${item ? `data-stage-recall="${index}"` : ""}>
      <span class="stage-slot-number">P${String(index + 1).padStart(2, "0")}</span>
      ${item ? `<button class="stage-slot-clear" data-stage-clear="${index}" type="button" aria-label="Limpar espaço ${index + 1}">×</button>` : ""}
      ${item
        ? `<strong class="stage-slot-note">${item.displayName || `${item.noteName}${item.memoryName || memoryName(item.degrees)}`}</strong>`
        : `<span class="empty-slot-symbol" aria-label="Espaço vazio">∅</span>`
      }
      <span class="stage-slot-detail">${
        item
          ? `${item.noteName} · OITAVA ${item.octave}<br>${item.memoryName ? item.memoryName : memoryName(item.degrees)}`
          : ""
      }</span>
      <div class="stage-slot-actions">
        <span>${item ? "TOCAR" : ""}</span>
        <span class="keycap">${keyLabel(state.bindings[`performance${index}`])}</span>
      </div>
    </article>
  `).join("");

  performanceMemoryGrid.querySelectorAll("[data-stage-recall]").forEach(slot => {
    slot.addEventListener("click", event => {
      if (event.target.closest("[data-stage-clear]")) return;
      recallPerformanceMemory(Number(slot.dataset.stageRecall));
    });
  });
  performanceMemoryGrid.querySelectorAll("[data-stage-clear]").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      const index = Number(button.dataset.stageClear);
      state.performanceMemories[index] = null;
      if (state.activePerformanceSlot === index) state.activePerformanceSlot = null;
      savePerformanceMemories();
      renderPerformanceMemories();
    });
  });
}

function renderBaseMemories() {
  baseMemoryGrid.innerHTML = state.baseMemories.map((item, index) => `
    <article class="base-memory-slot ${item ? "saved" : "empty"} ${state.activeBaseSlot === index ? "active" : ""}" ${item ? `data-base-recall="${index}"` : ""}>
      <span class="stage-slot-number">B${String(index + 1).padStart(2, "0")}</span>
      ${item ? `<button class="stage-slot-clear" data-base-clear="${index}" type="button" aria-label="Limpar base ${index + 1}">×</button>` : ""}
      ${item
        ? `<strong class="stage-slot-note">${item.displayName}</strong>`
        : `<span class="empty-slot-symbol" aria-label="Base vazia">∅</span>`
      }
      <span class="stage-slot-detail">${item ? `OITAVA ${item.octave}` : ""}</span>
      <div class="stage-slot-actions">
        <span>${item ? "LIGAR / DESLIGAR" : ""}</span>
        <span class="keycap">${keyLabel(state.bindings[`base${index}`])}</span>
      </div>
    </article>
  `).join("");

  baseMemoryGrid.querySelectorAll("[data-base-recall]").forEach(slot => {
    slot.addEventListener("click", event => {
      if (event.target.closest("[data-base-clear]")) return;
      toggleBaseMemory(Number(slot.dataset.baseRecall));
    });
  });
  baseMemoryGrid.querySelectorAll("[data-base-clear]").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      const index = Number(button.dataset.baseClear);
      if (state.activeBaseSlot === index) stopBase();
      state.baseMemories[index] = null;
      saveBaseMemories();
      renderBaseMemories();
    });
  });
}

function cloneSlots(slots, length) {
  return Array.from({ length }, (_, index) => {
    const item = slots[index];
    return item ? JSON.parse(JSON.stringify(item)) : null;
  });
}

function setStats(set) {
  return {
    notes: set.notes.filter(Boolean).length,
    bases: set.bases.filter(Boolean).length,
  };
}

function formatSetDate(timestamp) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

function renderSets() {
  const hasSets = state.sets.length > 0;
  setEmpty.hidden = hasSets;
  setList.hidden = !hasSets;
  updateSetButton.disabled = !state.activeSetId;
  const activeIndex = state.sets.findIndex(set => set.id === state.activeSetId);
  previousSetButton.disabled = !hasSets || activeIndex === 0;
  nextSetButton.disabled = !hasSets || activeIndex === state.sets.length - 1;
  setPosition.querySelector("strong").textContent = activeIndex >= 0
    ? `${activeIndex + 1} / ${state.sets.length}`
    : `— / ${state.sets.length || "—"}`;
  setPosition.querySelector("span").textContent = activeIndex >= 0
    ? state.sets[activeIndex].name
    : "SEM CONJUNTO";

  setList.innerHTML = state.sets.map((set, index) => {
    const stats = setStats(set);
    return `
      <article class="set-card ${state.activeSetId === set.id ? "active" : ""}" data-set-load="${set.id}" draggable="true">
        <span class="set-card-index">CONJUNTO ${String(index + 1).padStart(2, "0")}</span>
        <span class="set-drag-handle" aria-hidden="true">⠿</span>
        <button class="set-card-delete" data-set-delete="${set.id}" type="button" aria-label="Excluir ${set.name}">×</button>
        <h4>${escapeHtml(set.name)}</h4>
        <div class="set-card-stats">
          <span><strong>${stats.notes}</strong> NOTAS</span>
          <span><strong>${stats.bases}</strong> BASES</span>
        </div>
        <span class="set-card-date">${state.activeSetId === set.id ? "ATIVO · " : ""}${formatSetDate(set.updatedAt)}</span>
      </article>
    `;
  }).join("");

  setList.querySelectorAll("[data-set-load]").forEach(card => {
    card.addEventListener("click", event => {
      if (event.target.closest("[data-set-delete]")) return;
      loadSet(card.dataset.setLoad);
    });
  });

  setList.querySelectorAll("[data-set-delete]").forEach(button => {
    button.addEventListener("click", event => {
      event.stopPropagation();
      deleteSet(button.dataset.setDelete);
    });
  });

  setList.querySelectorAll("[data-set-load]").forEach(card => {
    card.addEventListener("dragstart", event => {
      state.draggedSetId = card.dataset.setLoad;
      card.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", state.draggedSetId);
    });
    card.addEventListener("dragend", () => {
      state.draggedSetId = null;
      setList.querySelectorAll(".set-card").forEach(item => {
        item.classList.remove("dragging", "drag-over");
      });
    });
    card.addEventListener("dragover", event => {
      event.preventDefault();
      if (card.dataset.setLoad === state.draggedSetId) return;
      card.classList.add("drag-over");
      event.dataTransfer.dropEffect = "move";
    });
    card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
    card.addEventListener("drop", event => {
      event.preventDefault();
      card.classList.remove("drag-over");
      reorderSet(state.draggedSetId, card.dataset.setLoad);
    });
  });
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}

function openSetDialog() {
  const notes = state.performanceMemories.filter(Boolean).length;
  const bases = state.baseMemories.filter(Boolean).length;
  if (!notes && !bases) {
    soundState.textContent = "ADICIONE NOTAS OU BASES ANTES DE SALVAR";
    return;
  }
  setDialogSummary.textContent = `${notes} NOTAS · ${bases} BASES · O ritmo permanecerá livre.`;
  setNameInput.value = "";
  setDialog.showModal();
  window.setTimeout(() => setNameInput.focus(), 0);
}

function createSet(name) {
  const now = Date.now();
  const set = {
    id: `set-${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    notes: cloneSlots(state.performanceMemories, 20),
    bases: cloneSlots(state.baseMemories, 10),
    createdAt: now,
    updatedAt: now,
  };
  state.sets.unshift(set);
  state.activeSetId = set.id;
  saveSets();
  renderSets();
  soundState.textContent = `CONJUNTO SALVO · ${set.name}`;
}

function loadSet(id) {
  const set = state.sets.find(item => item.id === id);
  if (!set) return;
  stopBase();
  state.performanceMemories = cloneSlots(set.notes, 20);
  state.baseMemories = cloneSlots(set.bases, 10);
  state.activeSetId = id;
  state.activePerformanceSlot = null;
  savePerformanceMemories();
  saveBaseMemories();
  saveSets();
  renderPerformanceMemories();
  renderBaseMemories();
  renderSets();
  soundState.textContent = `CONJUNTO CARREGADO · ${set.name}`;
}

function updateActiveSet() {
  const set = state.sets.find(item => item.id === state.activeSetId);
  if (!set) return;
  set.notes = cloneSlots(state.performanceMemories, 20);
  set.bases = cloneSlots(state.baseMemories, 10);
  set.updatedAt = Date.now();
  saveSets();
  renderSets();
  soundState.textContent = `CONJUNTO ATUALIZADO · ${set.name}`;
}

function deleteSet(id) {
  const set = state.sets.find(item => item.id === id);
  if (!set) return;
  state.sets = state.sets.filter(item => item.id !== id);
  if (state.activeSetId === id) state.activeSetId = null;
  saveSets();
  renderSets();
  soundState.textContent = `CONJUNTO EXCLUÍDO · ${set.name}`;
}

function reorderSet(draggedId, targetId) {
  if (!draggedId || !targetId || draggedId === targetId) return;
  const fromIndex = state.sets.findIndex(set => set.id === draggedId);
  const toIndex = state.sets.findIndex(set => set.id === targetId);
  if (fromIndex < 0 || toIndex < 0) return;
  const [moved] = state.sets.splice(fromIndex, 1);
  state.sets.splice(toIndex, 0, moved);
  saveSets();
  renderSets();
  soundState.textContent = `ORDEM ATUALIZADA · ${moved.name}`;
}

function navigateSet(direction) {
  if (!state.sets.length) return;
  const currentIndex = state.sets.findIndex(set => set.id === state.activeSetId);
  const nextIndex = currentIndex < 0
    ? direction > 0 ? 0 : state.sets.length - 1
    : Math.max(0, Math.min(state.sets.length - 1, currentIndex + direction));
  if (nextIndex === currentIndex) return;
  loadSet(state.sets[nextIndex].id);
}

function baseMidiNotes(item) {
  const root = 12 * (item.octave + 1) + item.tonic;
  return [...new Set([
    root - 12,
    ...item.degrees.map(index => root + DEGREES[index][1]),
  ])].slice(0, 5);
}

function stopBase() {
  if (!state.audio || !state.baseVoices.length) {
    state.activeBaseSlot = null;
    renderBaseMemories();
    return;
  }
  const now = state.audio.currentTime;
  state.baseVoices.forEach(({ oscillators, gain }) => {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0.0001, now, 0.16);
    oscillators.forEach(oscillator => oscillator.stop(now + 0.9));
  });
  state.baseVoices = [];
  state.activeBaseSlot = null;
  window.setTimeout(renderBaseMemories, 40);
}

function startBase(index) {
  const item = state.baseMemories[index];
  if (!item) return;
  stopBase();
  initAudio();
  const now = state.audio.currentTime;
  const notes = baseMidiNotes(item);

  state.baseVoices = notes.map((midi, noteIndex) => {
    const gain = state.audio.createGain();
    const filter = state.audio.createBiquadFilter();
    const pan = state.audio.createStereoPanner();
    const oscillators = [];
    const level = 0.055 / Math.sqrt(notes.length);

    filter.type = "lowpass";
    filter.frequency.value = SOUND_SETS[state.soundSet].engine === "piano" ? 1500 : 1100;
    filter.Q.value = 0.6;
    pan.pan.value = notes.length > 1 ? (noteIndex / (notes.length - 1) - 0.5) * 0.38 : 0;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.8);

    [-5, 5].forEach((cents, voiceIndex) => {
      const oscillator = state.audio.createOscillator();
      oscillator.type = voiceIndex ? "sine" : "triangle";
      oscillator.frequency.value = midiToFrequency(midi);
      oscillator.detune.value = cents;
      oscillator.connect(filter);
      oscillator.start(now);
      oscillators.push(oscillator);
    });

    filter.connect(gain).connect(pan).connect(state.master);
    return { oscillators, gain };
  });

  state.activeBaseSlot = index;
  renderBaseMemories();
  soundState.textContent = `BASE · ${item.displayName}`;
}

function toggleBaseMemory(index) {
  if (!state.baseMemories[index]) {
    soundState.textContent = `BASE ${index + 1} VAZIA`;
    return;
  }
  if (state.activeBaseSlot === index) stopBase();
  else startBase(index);
}

function renderMemories() {
  memoryGrid.innerHTML = state.memories.map((memory, index) => `
    <div class="memory-slot ${memory ? "saved" : ""}">
      <button class="memory-recall" data-memory-recall="${index}" type="button" ${memory ? "" : "disabled"}>
        <span class="memory-number">M${String(index + 1).padStart(2, "0")}</span>
        <span class="memory-name">${memory ? memory.name : "VAZIA"}</span>
      </button>
      <button class="memory-save ${memory ? "replace" : ""}" data-memory-save="${index}" type="button" aria-label="${memory ? `Substituir memória ${index + 1}` : `Salvar memória ${index + 1}`}">
        ${memory ? `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 7h-5V2M4 17h5v5M19 12a7 7 0 0 0-12-5L4 10M5 12a7 7 0 0 0 12 5l3-3" />
          </svg>
        ` : "SALVAR"}
      </button>
      ${memory ? `<button class="memory-edit" data-memory-edit="${index}" type="button" aria-label="Renomear memória ${index + 1}">✎</button>` : ""}
      <span class="keycap memory-key">${keyLabel(state.bindings[`memory${index}`])}</span>
    </div>
  `).join("");

  memoryGrid.querySelectorAll("[data-memory-recall]").forEach(button => {
    button.addEventListener("click", () => recallMemory(Number(button.dataset.memoryRecall)));
  });
  memoryGrid.querySelectorAll("[data-memory-save]").forEach(button => {
    button.addEventListener("click", () => openMemoryDialog(Number(button.dataset.memorySave), false));
  });
  memoryGrid.querySelectorAll("[data-memory-edit]").forEach(button => {
    button.addEventListener("click", () => openMemoryDialog(Number(button.dataset.memoryEdit), true));
  });
}

function renderTonicLinks() {
  if (state.smartMode) {
    const mode = state.fieldMinor ? "minor" : "major";
    const scale = smartScale();
    tonicLinkGrid.innerHTML = scale.map(({ name }, position) => {
      const options = state.memories.map((memory, memoryIndex) => memory
        ? `<option value="${memoryIndex}" ${state.smartLinks[mode][position] === memoryIndex ? "selected" : ""}>M${memoryIndex + 1} · ${memory.name}</option>`
        : ""
      ).join("");
      return `
        <label class="tonic-link-select">
          <span>${SCALE_DEGREES[position]} · ${name}</span>
          <select data-smart-link="${position}" aria-label="Memória da posição ${SCALE_DEGREES[position]}">
            <option value="">LIVRE</option>
            ${options}
          </select>
        </label>
      `;
    }).join("");
    tonicLinkGrid.querySelectorAll("[data-smart-link]").forEach(select => {
      select.addEventListener("change", () => {
        const position = Number(select.dataset.smartLink);
        state.smartLinks[mode][position] = select.value === "" ? null : Number(select.value);
        saveSmartState();
        if (state.smartPosition === position && state.smartLinks[mode][position] !== null) {
          recallMemory(state.smartLinks[mode][position]);
        }
      });
    });
    return;
  }

  tonicLinkGrid.innerHTML = TONICS.map(([tonicName], tonicIndex) => {
    const options = state.memories.map((memory, memoryIndex) => memory
      ? `<option value="${memoryIndex}" ${state.tonicLinks[tonicIndex] === memoryIndex ? "selected" : ""}>M${memoryIndex + 1} · ${memory.name}</option>`
      : ""
    ).join("");
    return `
      <label class="tonic-link-select">
        <span>${tonicName}</span>
        <select data-tonic-link="${tonicIndex}" aria-label="Memória automática para ${tonicName}">
          <option value="">LIVRE</option>
          ${options}
        </select>
      </label>
    `;
  }).join("");

  tonicLinkGrid.querySelectorAll("[data-tonic-link]").forEach(select => {
    select.addEventListener("change", () => {
      const tonicIndex = Number(select.dataset.tonicLink);
      state.tonicLinks[tonicIndex] = select.value === "" ? null : Number(select.value);
      saveTonicLinks();
      if (state.tonic === tonicIndex && state.tonicLinks[tonicIndex] !== null) {
        recallMemory(state.tonicLinks[tonicIndex]);
      }
    });
  });
}

function renderMappings() {
  const query = mappingSearch.value.trim().toLocaleLowerCase("pt-BR");
  const groups = new Map();

  Object.keys(state.bindings).forEach(action => {
    const label = actionLabel(action);
    const [groupName, context, contextClass] = mappingGroup(action);
    const haystack = `${label} ${groupName} ${context} ${keyLabel(state.bindings[action])}`.toLocaleLowerCase("pt-BR");
    if (query && !haystack.includes(query)) return;
    if (!groups.has(groupName)) groups.set(groupName, { context, contextClass, actions: [] });
    groups.get(groupName).actions.push(action);
  });

  mappingList.innerHTML = [...groups.entries()].map(([groupName, group]) => `
    <section class="mapping-group">
      <div class="mapping-group-header">
        <span>${groupName}</span>
        <small>${group.context} · ${group.actions.length}</small>
      </div>
      <div class="mapping-group-grid">
        ${group.actions.map(action => `
          <button class="mapping-item ${state.remapping === action ? "listening" : ""}" data-map="${action}" type="button">
            <span>
              <span class="mapping-function">${actionLabel(action)}</span>
              <span class="mapping-item-context">${group.context}</span>
            </span>
            <span class="mapping-item-key">
              <span class="keycap">${keyLabel(state.bindings[action])}</span>
              <span class="mapping-change">ALTERAR</span>
            </span>
          </button>
        `).join("")}
      </div>
    </section>
  `).join("");

  mappingList.querySelectorAll("[data-map]").forEach(button => {
    button.addEventListener("click", () => beginShortcutCapture(button.dataset.map));
  });
}

function beginShortcutCapture(action) {
  state.remapping = action;
  state.pendingShortcut = null;
  state.remapModifierCodes.clear();
  shortcutCapture.hidden = false;
  captureActionName.textContent = actionLabel(action);
  captureShortcutPreview.textContent = "PRESSIONE UMA TECLA";
  confirmShortcut.disabled = true;
  renderMappings();
}

function cancelShortcutCapture() {
  state.remapping = null;
  state.pendingShortcut = null;
  state.remapModifierCodes.clear();
  shortcutCapture.hidden = true;
  confirmShortcut.disabled = true;
  renderMappings();
}

function setShortcutPreview(shortcut) {
  state.pendingShortcut = shortcut;
  captureShortcutPreview.textContent = keyLabel(shortcut);
  confirmShortcut.disabled = false;
}

function commitShortcutCapture() {
  if (!state.remapping || !state.pendingShortcut) return;
  const action = state.remapping;
  const swapped = findConflictingAction(state.pendingShortcut, action);
  if (swapped && swapped !== action) state.bindings[swapped] = state.bindings[action];
  state.bindings[action] = state.pendingShortcut;
  saveBindings();
  cancelShortcutCapture();
  renderKeys();
  renderPerformanceMemories();
  renderBaseMemories();
}

function initAudio() {
  if (state.audio) {
    if (state.audio.state === "suspended") state.audio.resume();
    return;
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  state.audio = new AudioContext();
  state.master = state.audio.createGain();
  state.bodyFilter = state.audio.createBiquadFilter();
  state.reverb = state.audio.createConvolver();
  state.reverbGain = state.audio.createGain();
  const dryGain = state.audio.createGain();
  const bodyLow = state.audio.createBiquadFilter();
  const bodyHigh = state.audio.createBiquadFilter();
  const bodyGain = state.audio.createGain();
  const compressor = state.audio.createDynamicsCompressor();

  state.master.gain.value = 0.38;
  state.bodyFilter.type = "peaking";
  state.bodyFilter.frequency.value = 190;
  state.bodyFilter.Q.value = 1.4;
  state.bodyFilter.gain.value = 5;
  bodyLow.type = "peaking";
  bodyLow.frequency.value = 116;
  bodyLow.Q.value = 1.1;
  bodyLow.gain.value = 2.4;
  bodyHigh.type = "peaking";
  bodyHigh.frequency.value = 410;
  bodyHigh.Q.value = 1.7;
  bodyHigh.gain.value = 1.8;
  bodyGain.gain.value = 0.94;
  dryGain.gain.value = 0.88;
  state.reverbGain.gain.value = SOUND_SETS[state.soundSet].room;
  state.reverb.buffer = createRoomImpulse(3.6, 2.25);

  state.master
    .connect(bodyLow)
    .connect(state.bodyFilter)
    .connect(bodyHigh)
    .connect(bodyGain);
  bodyGain.connect(dryGain).connect(compressor);
  bodyGain.connect(state.reverb).connect(state.reverbGain).connect(compressor);
  compressor.threshold.value = -20;
  compressor.knee.value = 24;
  compressor.ratio.value = 2.4;
  compressor.attack.value = 0.012;
  compressor.release.value = 0.42;
  compressor.connect(state.audio.destination);

  audioStatus.lastChild.textContent = " ÁUDIO ATIVO";
}

function createRoomImpulse(duration, decay) {
  const sampleRate = state.audio.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const impulse = state.audio.createBuffer(2, length, sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    let smooth = 0;
    for (let i = 0; i < length; i += 1) {
      const time = i / sampleRate;
      const envelope = Math.pow(1 - i / length, decay);
      const noise = Math.random() * 2 - 1;
      smooth = smooth * 0.62 + noise * 0.38;
      const early = time < 0.09 && i % Math.max(1, Math.floor(sampleRate * 0.011)) === 0
        ? (Math.random() - 0.5) * 0.7
        : 0;
      data[i] = (smooth * 0.38 + early) * envelope;
    }
  }
  return impulse;
}

function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function currentMidiNotes() {
  if (state.tonic === null) return [];
  const root = 12 * (state.octave + 1) + TONICS[state.tonic][1];
  const tonic = root - 12;
  const notes = [tonic, ...[...state.degrees].map(index => root + DEGREES[index][1])];
  return [...new Set(notes)].slice(0, 5);
}

function buildStringBuffer(midi) {
  const preset = SOUND_SETS[state.soundSet];
  const sampleRate = state.audio.sampleRate;
  const length = Math.floor(sampleRate * preset.duration);
  const buffer = state.audio.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  if (preset.engine === "piano") {
    const frequency = midiToFrequency(midi);
    const warmth = preset.warmth;
    const harmonics = [
      [1, 1, 5.8],
      [2.0018, 0.43 / warmth, 4.1],
      [3.006, 0.22 / warmth, 3.1],
      [4.014, 0.115 / warmth, 2.25],
      [5.026, 0.058 / warmth, 1.7],
      [6.041, 0.027 / warmth, 1.25],
    ];
    const phases = harmonics.map(() => Math.random() * Math.PI * 2);
    const detunes = midi < 48 ? [0] : [-0.00125, 0, 0.00118];
    let pink = 0;

    for (let i = 0; i < length; i += 1) {
      const time = i / sampleRate;
      let sample = 0;
      harmonics.forEach(([ratio, amplitude, decay], harmonicIndex) => {
        const harmonicDecay = Math.exp(-time / (decay + Math.max(0, 64 - midi) * 0.018));
        detunes.forEach((detune, stringIndex) => {
          sample += Math.sin(
            Math.PI * 2 * frequency * ratio * (1 + detune) * time
            + phases[harmonicIndex]
            + stringIndex * 0.7
          ) * amplitude * harmonicDecay / detunes.length;
        });
      });
      pink = pink * 0.82 + (Math.random() * 2 - 1) * 0.18;
      const hammer = time < 0.032
        ? pink * Math.pow(1 - time / 0.032, 3.7) * preset.hammer
        : 0;
      const soundboard = (
        Math.sin(Math.PI * 2 * 92 * time + phases[0]) * 0.018
        + Math.sin(Math.PI * 2 * 138 * time + phases[1]) * 0.013
        + Math.sin(Math.PI * 2 * frequency * 0.5 * time) * 0.035
      ) * Math.exp(-time / 5.8);
      const attack = 1 - Math.exp(-time / 0.0035);
      data[i] = Math.tanh((sample * 0.42 + hammer + soundboard) * 1.25) * attack;
    }
    return buffer;
  }

  const period = Math.max(2, Math.round(sampleRate / midiToFrequency(midi)));

  for (let i = 0; i < period; i += 1) {
    const position = i / period;
    const pickShape = Math.sin(Math.PI * position);
    data[i] = (Math.random() * 2 - 1) * (0.72 + pickShape * preset.pickNoise);
  }

  for (let i = period; i < length; i += 1) {
    const previous = data[i - period];
    const neighbor = data[i - period + 1] || data[i - period];
    const decay = Math.pow(1 - i / length, 0.08);
    data[i] = (previous + neighbor) * 0.5 * preset.damping * decay;
  }
  return buffer;
}

function createStringBuffer(midi) {
  const cacheKey = `${state.soundSet}:${midi}`;
  if (!state.stringBuffers.has(cacheKey)) {
    const variants = 1;
    state.stringBuffers.set(cacheKey, Array.from({ length: variants }, () => buildStringBuffer(midi)));
  }
  const pool = state.stringBuffers.get(cacheKey);
  const buffer = pool.shift();
  pool.push(buffer);
  return buffer;
}

function pluckString(midi, index, total, startAt, velocity = 1, muted = false) {
  const preset = SOUND_SETS[state.soundSet];
  const source = state.audio.createBufferSource();
  const filter = state.audio.createBiquadFilter();
  const gain = state.audio.createGain();
  const pan = state.audio.createStereoPanner();
  const now = state.audio.currentTime;

  source.buffer = createStringBuffer(midi);
  source.playbackRate.value = state.activeActions.has("effect") ? Math.pow(2, 2 / 12) : 1;
  source.detune.value = (Math.random() - 0.5) * 2.2;
  filter.type = "lowpass";
  filter.frequency.value = (preset.brightness - Math.max(0, midi - 60) * 11)
    * (0.94 + Math.random() * 0.11);
  filter.Q.value = 0.42 + Math.random() * 0.12;
  const humanVelocity = velocity * (0.94 + Math.random() * 0.1);
  const level = ((0.78 - index * 0.025) / Math.sqrt(Math.max(1, total * 0.64)))
    * humanVelocity;
  gain.gain.setValueAtTime(0.0001, startAt);
  if (muted) gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.085);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, level), startAt + 0.009);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, level * 0.58), startAt + 0.34);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, level * 0.2), startAt + 3.2);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + preset.duration);
  pan.pan.value = total > 1
    ? (index / (total - 1) - 0.5) * 0.58 + (Math.random() - 0.5) * 0.06
    : 0;

  source.connect(filter).connect(gain).connect(pan).connect(state.master);
  source.start(startAt);
  source.stop(startAt + preset.duration);

  const voice = { source, gain, midi, startedAt: startAt };
  state.voices.push(voice);
  source.onended = () => {
    state.voices = state.voices.filter(item => item !== voice);
    if (!state.voices.length) {
      document.body.classList.remove("sounding");
      soundState.textContent = "AGUARDANDO GESTO";
    }
  };
  return voice;
}

function strum(direction, velocity = 1, muted = false, scheduledAt = null) {
  initAudio();
  let notes = currentMidiNotes();
  if (!notes.length) {
    soundState.textContent = "SEGURE UMA TÔNICA";
    return;
  }

  notes = notes.sort((a, b) => direction === "down" ? a - b : b - a);
  const now = scheduledAt ?? state.audio.currentTime + 0.012;
  const spacing = direction === "down" ? 0.014 : 0.01;
  notes.forEach((midi, index) => {
    const timingDrift = (Math.random() - 0.5) * 0.006;
    pluckString(midi, index, notes.length, now + index * spacing + timingDrift, velocity, muted);
  });

  document.body.classList.add("sounding");
  soundState.textContent = `${direction === "down" ? "↓" : "↑"} ${noteDescription()}`;
}

function dampVoices(release = 0.14) {
  if (!state.audio || !state.voices.length) return;
  const now = state.audio.currentTime;
  const musicalRelease = Math.max(0.9, release);
  state.voices.forEach(({ gain }) => {
    if (typeof gain.gain.cancelAndHoldAtTime === "function") {
      gain.gain.cancelAndHoldAtTime(now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + musicalRelease);
    } else {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0.001, now, musicalRelease / 4);
    }
  });
}

function applyBend(active) {
  if (!state.audio) return;
  const now = state.audio.currentTime;
  const target = active ? Math.pow(2, 2 / 12) : 1;
  state.voices.forEach(({ source }) => {
    source.playbackRate.cancelScheduledValues(now);
    source.playbackRate.setValueAtTime(source.playbackRate.value, now);
    source.playbackRate.exponentialRampToValueAtTime(target, now + (active ? 0.17 : 0.13));
  });
  if (active && state.voices.length) soundState.textContent = `BEND +2 · ${noteDescription()}`;
}

function currentRhythmPreset() {
  return window.RHYTHM_PRESETS[state.rhythmPreset] || window.RHYTHM_PRESETS.manual;
}

function rhythmEvent(symbol, scheduledAt) {
  if (!symbol || symbol === "-") return;
  const direction = symbol.toLowerCase() === "u" ? "up" : "down";
  const muted = symbol.toLowerCase() === "x";
  const velocity = symbol === symbol.toUpperCase() && !muted ? 1 : muted ? 0.62 : 0.72;
  strum(direction, velocity, muted, scheduledAt);
}

function scheduleRhythm() {
  if (!state.rhythmPlaying || !state.audio) return;
  const preset = currentRhythmPreset();
  const pattern = preset[state.rhythmVariation] || preset.a;
  const secondsPerStep = 60 / state.tempo / 4;

  while (state.nextStepAt < state.audio.currentTime + 0.09) {
    rhythmEvent(pattern[state.rhythmStep % pattern.length], state.nextStepAt);
    state.rhythmStep = (state.rhythmStep + 1) % pattern.length;
    state.nextStepAt += secondsPerStep;
  }
  beatState.textContent = `${preset.meter} · ${state.rhythmVariation.toUpperCase()} · ${state.tempo} BPM`;
}

function startRhythm() {
  const preset = currentRhythmPreset();
  if (preset.manual) return;
  initAudio();
  state.rhythmPlaying = true;
  state.rhythmStep = 0;
  state.nextStepAt = state.audio.currentTime + 0.04;
  window.clearInterval(state.rhythmTimer);
  state.rhythmTimer = window.setInterval(scheduleRhythm, 25);
  scheduleRhythm();
  updateUI();
}

function stopRhythm() {
  state.rhythmPlaying = false;
  window.clearInterval(state.rhythmTimer);
  state.rhythmTimer = null;
  beatState.textContent = `${currentRhythmPreset().meter} · PARADO`;
  updateUI();
}

function toggleRhythm() {
  if (state.rhythmPlaying) stopRhythm();
  else startRhythm();
}

function toggleVariation() {
  if (currentRhythmPreset().manual) return;
  state.rhythmVariation = state.rhythmVariation === "a" ? "b" : "a";
  state.rhythmStep = 0;
  soundState.textContent = `VARIAÇÃO ${state.rhythmVariation.toUpperCase()} · ${currentRhythmPreset().name.toUpperCase()}`;
  updateUI();
}

function startRepeatingStrum(action) {
  const direction = action === "rhythmDown" ? "down" : "up";
  if (action === "rhythmUp") {
    strum(direction, 0.82);
    window.setTimeout(() => dampRecentVoices(0.72, 0.9), 180);
    state.manualTimers.set(action, { pulse: true });
    return;
  }
  strum(direction);
  state.manualTimers.set(action, { sustain: true });
}

function stopRepeatingStrum(action) {
  const timers = state.manualTimers.get(action);
  if (!timers) return;
  window.clearTimeout(timers.delay);
  window.clearInterval(timers.interval);
  state.manualTimers.delete(action);
  if (timers.sustain) dampVoices(1.35);
}

function dampRecentVoices(ageLimit = 0.72, release = 0.9) {
  if (!state.audio || !state.voices.length) return;
  const now = state.audio.currentTime;
  state.voices.forEach(({ gain, startedAt = now }) => {
    if (now - startedAt > ageLimit) return;
    if (typeof gain.gain.cancelAndHoldAtTime === "function") {
      gain.gain.cancelAndHoldAtTime(now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + release);
    } else {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0.001, now, release / 4);
    }
  });
}

function refreshHeldRhythm() {
  const preset = currentRhythmPreset();
  if (preset.manual) {
    if (state.activeActions.has("rhythmDown")) strum("down");
    if (state.activeActions.has("rhythmUp")) strum("up");
  }
}

function noteDescription() {
  const tonic = state.tonic === null
    ? "—"
    : state.smartMode && state.smartPosition !== null
      ? smartScale()[state.smartPosition].name
      : TONICS[state.tonic][0];
  const degrees = [...state.degrees].map(i => DEGREES[i][0]).join(" · ");
  return degrees ? `${tonic} + ${degrees}` : `${tonic} · TÔNICA`;
}

function openMemoryDialog(index, renameOnly) {
  const memory = state.memories[index];
  if (!renameOnly && !state.degrees.size) {
    soundState.textContent = "ESCOLHA AO MENOS UM GRAU";
    return;
  }
  if (renameOnly && !memory) return;

  const degrees = renameOnly ? memory.degrees : [...state.degrees].slice(0, 4);
  state.editingMemory = { index, degrees };
  memoryDialogTitle.textContent = renameOnly ? `Renomear memória ${index + 1}` : `Salvar memória ${index + 1}`;
  memoryDialogDegrees.textContent = `FORMA · ${memoryName(degrees)}`;
  memoryNameInput.value = memory?.name || memoryName(degrees);
  memoryDialog.showModal();
  window.setTimeout(() => {
    memoryNameInput.focus();
    memoryNameInput.select();
  }, 0);
}

function storeMemory(index, degrees, name) {
  state.memories[index] = {
    name: name.trim() || memoryName(degrees),
    degrees,
  };
  saveMemories();
  renderMemories();
  renderTonicLinks();
  updateUI();
  soundState.textContent = `MEMÓRIA ${index + 1} SALVA · ${state.memories[index].name}`;
}

function recallMemory(index) {
  const memory = state.memories[index];
  if (!memory) {
    soundState.textContent = `MEMÓRIA ${index + 1} VAZIA`;
    return;
  }
  if (state.workspace === "composer") state.activePerformanceSlot = null;
  dampVoices(SOUND_SETS[state.soundSet].engine === "piano" ? 0.22 : 0.11);
  state.degrees = new Set(memory.degrees);
  state.currentMemoryIndex = index;
  refreshHeldRhythm();
  updateUI();
  soundState.textContent = `M${String(index + 1).padStart(2, "0")} · ${memory.name}`;
}

function recallLinkedMemory(tonicIndex) {
  const memoryIndex = state.tonicLinks[tonicIndex];
  if (memoryIndex !== null && state.memories[memoryIndex]) recallMemory(memoryIndex);
}

function selectSmartPosition(position) {
  const scaleNote = smartScale()[position];
  if (!scaleNote) return;
  state.activePerformanceSlot = null;
  dampVoices(SOUND_SETS[state.soundSet].engine === "piano" ? 0.24 : 0.12);
  state.smartPosition = position;
  state.tonic = scaleNote.pitch;
  const mode = state.fieldMinor ? "minor" : "major";
  const memoryIndex = state.smartLinks[mode][position];
  if (memoryIndex !== null && state.memories[memoryIndex]) recallMemory(memoryIndex);
  refreshHeldRhythm();
  updateUI();
}

function refreshSmartField(selectRoot = false) {
  saveSmartState();
  if (state.smartMode) {
    dampVoices(SOUND_SETS[state.soundSet].engine === "piano" ? 0.24 : 0.12);
    if (selectRoot || state.smartPosition === null) state.smartPosition = 0;
    const scaleNote = smartScale()[state.smartPosition];
    state.tonic = scaleNote.pitch;
    const mode = state.fieldMinor ? "minor" : "major";
    const memoryIndex = state.smartLinks[mode][state.smartPosition];
    if (memoryIndex !== null && state.memories[memoryIndex]) recallMemory(memoryIndex);
  }
  renderKeys();
}

function activate(action) {
  if (state.activeActions.has(action)) return;
  state.activeActions.add(action);

  if (action.startsWith("smartTonic")) {
    selectSmartPosition(Number(action.slice(10)));
  } else if (action.startsWith("tonic")) {
    state.activePerformanceSlot = null;
    dampVoices(SOUND_SETS[state.soundSet].engine === "piano" ? 0.24 : 0.12);
    state.tonic = Number(action.slice(5));
    recallLinkedMemory(state.tonic);
    refreshHeldRhythm();
  } else if (action.startsWith("degree")) {
    state.activePerformanceSlot = null;
    const index = Number(action.slice(6));
    state.currentMemoryIndex = null;
    if (state.degrees.has(index)) {
      state.degrees.delete(index);
      updateUI();
      return;
    }
    if (state.degrees.size >= 4) {
      state.activeActions.delete(action);
      const element = document.querySelector(`[data-action="${action}"]`);
      element?.classList.add("blocked");
      window.setTimeout(() => element?.classList.remove("blocked"), 420);
      return;
    }
    state.degrees.add(index);
    refreshHeldRhythm();
  } else if (action === "octaveDown") {
    state.activePerformanceSlot = null;
    state.octave = Math.max(1, state.octave - 1);
  } else if (action === "octaveUp") {
    state.activePerformanceSlot = null;
    state.octave = Math.min(7, state.octave + 1);
  } else if (action === "rhythmDown" || action === "rhythmUp") {
    startRepeatingStrum(action);
  } else if (action.startsWith("memory")) {
    recallMemory(Number(action.slice(6)));
  } else if (action === "effect") {
    initAudio();
    applyBend(true);
  }
  updateUI();
}

function deactivate(action) {
  if (!state.activeActions.has(action)) return;
  state.activeActions.delete(action);

  if (action.startsWith("smartTonic")) {
    // A posição do campo permanece selecionada.
  } else if (action.startsWith("tonic")) {
    // A tônica permanece selecionada após soltar a tecla.
  } else if (action.startsWith("degree")) {
    // Os graus permanecem selecionados até serem tocados novamente.
  } else if (action === "rhythmDown" || action === "rhythmUp") {
    stopRepeatingStrum(action);
  } else if (action.startsWith("memory")) {
    // Memórias são chamadas uma vez no pressionamento.
  } else if (action === "effect") {
    applyBend(false);
  }
  updateUI();
}

function updateUI() {
  document.querySelectorAll("[data-action]").forEach(element => {
    const action = element.dataset.action;
    let active = state.activeActions.has(action);
    if (action.startsWith("smartTonic")) active = state.smartPosition === Number(action.slice(10));
    if (action.startsWith("tonic")) active = state.tonic === Number(action.slice(5));
    if (action.startsWith("degree")) active = state.degrees.has(Number(action.slice(6)));
    element.classList.toggle("active", active);
  });
  octaveValue.textContent = state.octave;
  degreeCount.textContent = state.degrees.size;
  memoryCount.textContent = state.memories.filter(Boolean).length;
  document.querySelector('[data-action="rhythmDown"]').classList.toggle("latched", state.rhythmPlaying);
  document.querySelector('[data-action="rhythmUp"]').classList.toggle("variation-active", state.rhythmVariation === "b");
  document.querySelectorAll('[data-stage-action="rhythmDown"]').forEach(element => {
    element.classList.toggle("latched", state.rhythmPlaying);
    element.classList.toggle("active", state.activeActions.has("rhythmDown"));
  });
  document.querySelectorAll('[data-stage-action="rhythmUp"]').forEach(element => {
    element.classList.toggle("variation-active", state.rhythmVariation === "b");
    element.classList.toggle("active", state.activeActions.has("rhythmUp"));
  });
  document.querySelectorAll('[data-stage-action="effect"]').forEach(element => {
    element.classList.toggle("active", state.activeActions.has("effect"));
  });
  smartModeToggle.checked = state.smartMode;
  fieldControls.hidden = !state.smartMode;
  fieldName.textContent = fieldDisplayName();
  fieldMinorButton.textContent = state.fieldMinor ? "MAIOR" : "MENOR";
  fieldFlatButton.classList.toggle("active", state.fieldAccidental === -1);
  fieldSharpButton.classList.toggle("active", state.fieldAccidental === 1);
  tonicModeDescription.textContent = state.smartMode
    ? "SETE POSIÇÕES DO CAMPO HARMÔNICO"
    : "SELECIONE A NOTA PRINCIPAL";
  tonicLinksDescription.textContent = state.smartMode
    ? `Memórias por posição no campo ${state.fieldMinor ? "menor" : "maior"}.`
    : "Escolha qual memória cada tônica deve carregar.";
  updateStageCurrent();
}

function setWorkspace(workspace) {
  state.workspace = workspace;
  localStorage.setItem("instrument-workspace", workspace);
  const performance = workspace === "performance";
  if (!performance) state.activePerformanceSlot = null;
  composerWorkspace.hidden = performance;
  performanceWorkspace.hidden = !performance;
  document.querySelectorAll("[data-workspace]").forEach(button => {
    button.classList.toggle("active", button.dataset.workspace === workspace);
  });
  if (performance) {
    renderPerformanceMemories();
    renderBaseMemories();
    updateStageCurrent();
  }
  [...state.activeActions].forEach(deactivate);
}

function findAction(shortcut) {
  return Object.keys(state.bindings).find(action => state.bindings[action] === shortcut);
}

function findPerformanceAction(shortcut) {
  return Object.keys(state.bindings).find(action =>
    action.startsWith("performance") && state.bindings[action] === shortcut
  );
}

function findBaseAction(shortcut) {
  return Object.keys(state.bindings).find(action =>
    action.startsWith("base") && state.bindings[action] === shortcut
  );
}

function findConflictingAction(code, targetAction) {
  const stageOnly = action => action.startsWith("performance") || action.startsWith("base");
  const sharedLive = action => ["rhythmDown", "rhythmUp", "effect"].includes(action);
  return Object.keys(state.bindings).find(action =>
    action !== targetAction
    && (
      stageOnly(targetAction)
        ? stageOnly(action) || sharedLive(action)
        : !stageOnly(action)
    )
    && state.bindings[action] === code
  );
}

window.addEventListener("keydown", event => {
  if (state.remapping && settingsDialog.open) {
    event.preventDefault();
    if (isModifierCode(event.code)) {
      state.remapModifierCodes.add(event.code);
      const modifiers = [];
      if (event.ctrlKey) modifiers.push("Control");
      if (event.altKey) modifiers.push("Alt");
      if (event.shiftKey) modifiers.push("Shift");
      if (event.metaKey) modifiers.push("Meta");
      captureShortcutPreview.textContent = modifiers.length
        ? `${modifiers.map(keyLabel).join("+")}+…`
        : keyLabel(event.code);
      return;
    }
    const shortcut = shortcutFromEvent(event);
    setShortcutPreview(shortcut);
    return;
  }

  if (event.repeat || event.target.closest("dialog") || event.target.matches("select, input")) return;
  const shortcut = shortcutFromEvent(event);
  if (shortcut.includes("+")) cancelStandaloneModifiers(event);

  if (state.workspace === "performance") {
    if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
      event.preventDefault();
      navigateSet(event.code === "ArrowRight" ? 1 : -1);
      return;
    }
    const baseAction = findBaseAction(shortcut);
    if (baseAction) {
      event.preventDefault();
      state.actionsByPhysicalKey.set(event.code, baseAction);
      toggleBaseMemory(Number(baseAction.slice(4)));
      return;
    }
    const performanceAction = findPerformanceAction(shortcut);
    if (performanceAction) {
      event.preventDefault();
      state.actionsByPhysicalKey.set(event.code, performanceAction);
      recallPerformanceMemory(Number(performanceAction.slice(11)));
      return;
    }
    const liveAction = findAction(shortcut);
    if (["rhythmDown", "rhythmUp", "effect"].includes(liveAction)) {
      event.preventDefault();
      state.actionsByPhysicalKey.set(event.code, liveAction);
      activate(liveAction);
    }
    return;
  }

  if (state.smartMode) {
    const letterIndex = NOTE_LETTERS.findIndex(letter => event.code === `Key${letter}`);
    const digitMatch = event.code.match(/^Digit([1-7])$/);
    if (letterIndex >= 0) {
      event.preventDefault();
      if (state.smartCommandMode === "note") {
        if (event.shiftKey) {
          state.fieldLetter = letterIndex;
          state.fieldAccidental = 0;
          refreshSmartField(true);
        } else {
          const position = smartPositionForLetter(letterIndex);
          if (position >= 0) selectSmartPosition(position);
        }
      } else {
        state.fieldLetter = letterIndex;
        state.fieldAccidental = 0;
        refreshSmartField(true);
      }
      return;
    }
    if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
      event.preventDefault();
      state.fieldAccidental = event.code === "ArrowLeft"
        ? (state.fieldAccidental === -1 ? 0 : -1)
        : (state.fieldAccidental === 1 ? 0 : 1);
      refreshSmartField(true);
      return;
    }
    if (event.code === "ArrowUp" || event.code === "ArrowDown") {
      event.preventDefault();
      state.fieldMinor = event.code === "ArrowDown";
      refreshSmartField(true);
      return;
    }
    if (digitMatch && state.smartCommandMode === "position") {
      event.preventDefault();
      activate(`smartTonic${Number(digitMatch[1]) - 1}`);
      return;
    }
  }

  const comboAction = shortcut.includes("+") ? findAction(shortcut) : null;
  if (comboAction) {
    event.preventDefault();
    state.actionsByPhysicalKey.set(event.code, comboAction);
    activate(comboAction);
    return;
  }

  const action = findAction(shortcut);
  if (!action) return;
  event.preventDefault();
  state.actionsByPhysicalKey.set(event.code, action);
  activate(action);
});

window.addEventListener("keyup", event => {
  if (state.remapping && settingsDialog.open && isModifierCode(event.code)) {
    event.preventDefault();
    if (!state.pendingShortcut && state.remapModifierCodes.has(event.code)) {
      setShortcutPreview(event.code);
    }
    state.remapModifierCodes.delete(event.code);
    return;
  }

  const trackedAction = state.actionsByPhysicalKey.get(event.code);
  if (trackedAction) state.actionsByPhysicalKey.delete(event.code);

  if (state.workspace === "performance") {
    if (["rhythmDown", "rhythmUp", "effect"].includes(trackedAction)) {
      event.preventDefault();
      deactivate(trackedAction);
    }
    return;
  }

  if (trackedAction) {
    event.preventDefault();
    deactivate(trackedAction);
    return;
  }

  if (state.smartMode) {
    const digitMatch = event.code.match(/^Digit([1-7])$/);
    if (digitMatch && state.smartCommandMode === "position") {
      event.preventDefault();
      deactivate(`smartTonic${Number(digitMatch[1]) - 1}`);
      return;
    }
  }
  const action = trackedAction || findAction(shortcutFromEvent(event));
  if (!action) return;
  event.preventDefault();
  deactivate(action);
});

window.addEventListener("blur", () => {
  [...state.activeActions].forEach(deactivate);
  state.actionsByPhysicalKey.clear();
  state.remapModifierCodes.clear();
});

function bindPointerControls() {
  document.querySelectorAll("[data-action]").forEach(element => {
    element.onpointerdown = event => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      event.preventDefault();
      element.setPointerCapture?.(event.pointerId);
      state.pointerActions.set(event.pointerId, element.dataset.action);
      activate(element.dataset.action);
    };
    element.onpointerup = element.onpointercancel = event => {
      const action = state.pointerActions.get(event.pointerId);
      if (!action) return;
      state.pointerActions.delete(event.pointerId);
      deactivate(action);
    };
  });
}

function updateRhythmControls() {
  const preset = currentRhythmPreset();
  const manual = Boolean(preset.manual);
  document.querySelector("#rhythmPrimaryLabel").textContent = "SUSTENTAR";
  document.querySelector("#rhythmPrimaryCopy").textContent = "SEGURE PARA MANTER";
  document.querySelector("#rhythmSecondaryLabel").textContent = "TOQUE";
  document.querySelector("#rhythmSecondaryCopy").textContent = "ATAQUE CURTO";
  tempoControl.disabled = manual;
  stageTempoControl.disabled = manual;
  stageRhythmPreset.value = state.rhythmPreset;
  stageTempoControl.value = state.tempo;
  engineLabel.textContent = `RHYTHM SET · ${preset.source || "INSTALADO"}`;
  beatState.textContent = manual ? "COMPASSO: LIVRE" : `${preset.meter} · PARADO`;
  [autoRhythmButton, stageAutoRhythmButton].forEach(button => {
    button.disabled = manual;
    button.classList.toggle("active", state.rhythmPlaying);
    button.textContent = state.rhythmPlaying ? "PARAR" : "AUTO";
  });
  [rhythmVariationButton, stageRhythmVariationButton].forEach(button => {
    button.disabled = manual;
    button.classList.toggle("active", state.rhythmVariation === "b");
    button.textContent = `VAR. ${state.rhythmVariation.toUpperCase()}`;
  });
  updateUI();
}

rhythmPresetSelect.innerHTML = Object.entries(window.RHYTHM_PRESETS)
  .map(([id, preset]) => `<option value="${id}">${preset.name.toUpperCase()}</option>`)
  .join("");
stageRhythmPreset.innerHTML = rhythmPresetSelect.innerHTML;
if (!window.RHYTHM_PRESETS[state.rhythmPreset]) state.rhythmPreset = "pop";
rhythmPresetSelect.value = state.rhythmPreset;
stageRhythmPreset.value = state.rhythmPreset;
state.tempo = currentRhythmPreset().bpm;
tempoControl.value = state.tempo;
stageTempoControl.value = state.tempo;

rhythmPresetSelect.addEventListener("change", () => {
  stopRhythm();
  state.rhythmPreset = rhythmPresetSelect.value;
  state.rhythmVariation = "a";
  state.tempo = currentRhythmPreset().bpm;
  tempoControl.value = state.tempo;
  stageRhythmPreset.value = state.rhythmPreset;
  stageTempoControl.value = state.tempo;
  localStorage.setItem("instrument-rhythm-preset", state.rhythmPreset);
  soundState.textContent = `RITMO · ${currentRhythmPreset().name.toUpperCase()}`;
  updateRhythmControls();
});

tempoControl.addEventListener("change", () => {
  state.tempo = Math.max(50, Math.min(220, Number(tempoControl.value) || currentRhythmPreset().bpm));
  tempoControl.value = state.tempo;
  stageTempoControl.value = state.tempo;
  if (state.rhythmPlaying && state.audio) {
    state.nextStepAt = state.audio.currentTime + 0.04;
  }
  updateRhythmControls();
});

stageRhythmPreset.addEventListener("change", () => {
  rhythmPresetSelect.value = stageRhythmPreset.value;
  rhythmPresetSelect.dispatchEvent(new Event("change"));
});

stageTempoControl.addEventListener("change", () => {
  tempoControl.value = stageTempoControl.value;
  tempoControl.dispatchEvent(new Event("change"));
});

[autoRhythmButton, stageAutoRhythmButton].forEach(button => {
  button.addEventListener("click", toggleRhythm);
});

[rhythmVariationButton, stageRhythmVariationButton].forEach(button => {
  button.addEventListener("click", toggleVariation);
});

soundSetSelect.value = SOUND_SETS[state.soundSet] ? state.soundSet : "piano";
soundSetSelect.addEventListener("change", () => {
  state.soundSet = soundSetSelect.value;
  state.stringBuffers.clear();
  if (state.reverbGain && state.audio) {
    state.reverbGain.gain.setTargetAtTime(
      SOUND_SETS[state.soundSet].room,
      state.audio.currentTime,
      0.18
    );
  }
  localStorage.setItem("instrument-sound-set", state.soundSet);
  soundState.textContent = `SET · ${SOUND_SETS[state.soundSet].label}`;
  updateRhythmControls();
});

smartModeToggle.addEventListener("change", () => {
  state.smartMode = smartModeToggle.checked;
  if (state.smartMode) {
    state.smartPosition = 0;
    refreshSmartField(true);
  } else {
    state.smartPosition = null;
    saveSmartState();
    renderKeys();
  }
});

fieldFlatButton.addEventListener("click", () => {
  state.fieldAccidental = state.fieldAccidental === -1 ? 0 : -1;
  refreshSmartField(true);
});

fieldSharpButton.addEventListener("click", () => {
  state.fieldAccidental = state.fieldAccidental === 1 ? 0 : 1;
  refreshSmartField(true);
});

fieldMinorButton.addEventListener("click", () => {
  state.fieldMinor = !state.fieldMinor;
  refreshSmartField(true);
});

document.querySelectorAll("[data-workspace]").forEach(button => {
  button.addEventListener("click", () => setWorkspace(button.dataset.workspace));
});

document.querySelectorAll("[data-stage-action]").forEach(element => {
  element.addEventListener("pointerdown", event => {
    event.preventDefault();
    element.setPointerCapture?.(event.pointerId);
    activate(element.dataset.stageAction);
  });
  element.addEventListener("pointerup", event => {
    event.preventDefault();
    deactivate(element.dataset.stageAction);
  });
  element.addEventListener("pointercancel", () => deactivate(element.dataset.stageAction));
});

document.querySelector("#settingsButton").addEventListener("click", () => {
  cancelShortcutCapture();
  mappingSearch.value = "";
  smartCommandModeInputs.forEach(input => {
    input.checked = input.value === state.smartCommandMode;
  });
  renderMappings();
  settingsDialog.showModal();
});

document.querySelector("#helpButton").addEventListener("click", () => helpDialog.showModal());

document.querySelectorAll(".guide-nav a").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    const target = helpDialog.querySelector(link.getAttribute("href"));
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll("[data-close-dialog]").forEach(button => {
  button.addEventListener("click", () => {
    cancelShortcutCapture();
    state.pendingCapture = null;
    button.closest("dialog").close();
    if (window.location.hash.startsWith("#guide-")) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  });
});

mappingSearch.addEventListener("input", renderMappings);
cancelShortcut.addEventListener("click", cancelShortcutCapture);
confirmShortcut.addEventListener("click", commitShortcutCapture);
smartCommandModeInputs.forEach(input => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    state.smartCommandMode = input.value;
    saveSmartState();
    renderKeys();
    soundState.textContent = input.value === "note"
      ? "COMANDOS INTELIGENTES · POR NOME DA NOTA"
      : "COMANDOS INTELIGENTES · POR POSIÇÃO";
  });
});

themeToggle.addEventListener("change", () => {
  applyTheme(themeToggle.checked ? "light" : "dark");
});

captureAsNote.addEventListener("click", () => {
  captureInNextPerformanceSlot();
  state.pendingCapture = null;
  captureDialog.close();
});

captureAsBase.addEventListener("click", () => {
  captureInNextBaseSlot();
  state.pendingCapture = null;
  captureDialog.close();
});

newSetButton.addEventListener("click", openSetDialog);
updateSetButton.addEventListener("click", updateActiveSet);
previousSetButton.addEventListener("click", () => navigateSet(-1));
nextSetButton.addEventListener("click", () => navigateSet(1));

setForm.addEventListener("submit", event => {
  event.preventDefault();
  const name = setNameInput.value.trim();
  if (!name) return;
  createSet(name);
  setDialog.close();
});

memoryForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!state.editingMemory) return;
  const { index, degrees } = state.editingMemory;
  storeMemory(index, degrees, memoryNameInput.value);
  state.editingMemory = null;
  memoryDialog.close();
});

document.querySelector("#resetMappings").addEventListener("click", () => {
  state.bindings = personalDefaultBindings();
  state.remapping = null;
  saveBindings();
  renderKeys();
  renderMappings();
  renderPerformanceMemories();
  renderBaseMemories();
});

[settingsDialog, helpDialog, memoryDialog, captureDialog, setDialog].forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      state.editingMemory = null;
      state.pendingCapture = null;
      dialog.close();
    }
  });
});

helpDialog.addEventListener("close", () => {
  if (window.location.hash.startsWith("#guide-")) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
});

renderKeys();
if (state.smartMode) {
  state.smartPosition = 0;
  const firstScaleNote = smartScale()[0];
  state.tonic = firstScaleNote.pitch;
  const initialMode = state.fieldMinor ? "minor" : "major";
  const initialMemory = state.smartLinks[initialMode][0];
  if (initialMemory !== null && state.memories[initialMemory]) {
    state.degrees = new Set(state.memories[initialMemory].degrees);
  }
  renderKeys();
}
updateRhythmControls();
renderPerformanceMemories();
renderBaseMemories();
if (!state.sets.some(set => set.id === state.activeSetId)) state.activeSetId = null;
renderSets();
setWorkspace(state.workspace);
