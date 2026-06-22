import { TONICS, DEFAULT_BINDINGS, DEGREES } from './state.tokens.js';

export function loadBindings() {
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

export function loadMemories() {
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

export function loadPerformanceMemories() {
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

export function loadBaseMemories() {
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

export function loadSets() {
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

export function loadTonicLinks() {
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

export function loadSmartLinks() {
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

export const state = {
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
