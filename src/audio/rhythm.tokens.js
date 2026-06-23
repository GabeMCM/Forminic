export const RHYTHM_VALUES = {
  PAUSE: '-',
  STRONG_DOWN: 'D',
  LIGHT_DOWN: 'd',
  STRONG_UP: 'U',
  LIGHT_UP: 'u',
  MUTED: 'x',
};

export const BEAT_TYPES = [
  { value: RHYTHM_VALUES.PAUSE, label: 'Pausa', class: 'beat-pause' },
  { value: RHYTHM_VALUES.STRONG_DOWN, label: 'Forte ↓', class: 'beat-strong-down' },
  { value: RHYTHM_VALUES.LIGHT_DOWN, label: 'Leve ↓', class: 'beat-light-down' },
  { value: RHYTHM_VALUES.STRONG_UP, label: 'Forte ↑', class: 'beat-strong-up' },
  { value: RHYTHM_VALUES.LIGHT_UP, label: 'Leve ↑', class: 'beat-light-up' },
  { value: RHYTHM_VALUES.MUTED, label: 'Abafada', class: 'beat-muted' }
];

const { PAUSE: _, STRONG_DOWN: D, LIGHT_DOWN: d, STRONG_UP: U, LIGHT_UP: u, MUTED: x } = RHYTHM_VALUES;

const NAME_MANUAL = "Manual";
const NAME_POP = "Pop";
const NAME_ROCK = "Rock";
const NAME_VANEIRAO = "Vaneirão";
const NAME_SAMBA = "Samba";
const NAME_BOSSA = "Bossa nova";
const NAME_BAIAO = "Baião";
const NAME_REGGAE = "Reggae";
const NAME_FUNK = "Funk";
const NAME_VALSA = "Valsa";
const NAME_XOTE = "Xote";
const NAME_FORRO = "Forró";
const NAME_BOLERO = "Bolero";
const NAME_MILONGA = "Milonga";

const METER_4_4 = "4/4";
const METER_3_4 = "3/4";
const METER_2_4 = "2/4";
const METER_FREE = "LIVRE";

const SOURCE_NATIVE = "NATIVO";

export const RHYTHM_TOKENS = {
  VARIATION_A: "a",
  VARIATION_B: "b",
  DEFAULT_PRESET: "pop",
  METER_4_4,
  METER_3_4,
  METER_2_4,
  METER_FREE,
  SOURCE_CUSTOM: "CUSTOM",
  SOURCE_NATIVE,
  NAME_CUSTOM: "Custom",
  PREFIX_CUSTOM: "custom_",
  NAME_MANUAL,
  NAME_POP,
  NAME_ROCK,
  NAME_VANEIRAO,
  NAME_SAMBA,
  NAME_BOSSA,
  NAME_BAIAO,
  NAME_REGGAE,
  NAME_FUNK,
  NAME_VALSA,
  NAME_XOTE,
  NAME_FORRO,
  NAME_BOLERO,
  NAME_MILONGA,
  PRESETS: {
    manual: {
      name: NAME_MANUAL,
      bpm: 108,
      meter: METER_FREE,
      source: SOURCE_NATIVE,
      manual: true,
    },
    pop: {
      name: NAME_POP,
      bpm: 108,
      meter: METER_4_4,
      source: SOURCE_NATIVE,
      a: [D, _, d, U, _, U, d, U, D, _, d, U, _, U, d, U],
      b: [D, _, x, U, d, U, x, U, D, d, x, U, d, U, x, U],
    },
    rock: {
      name: NAME_ROCK,
      bpm: 126,
      meter: METER_4_4,
      source: SOURCE_NATIVE,
      a: [D, _, _, d, D, _, U, _, D, _, _, d, D, _, U, U],
      b: [D, d, x, U, D, _, U, d, D, d, x, U, D, U, d, U],
    },
    vaneirao: {
      name: NAME_VANEIRAO,
      bpm: 144,
      meter: METER_2_4,
      source: SOURCE_NATIVE,
      a: [D, _, d, U, D, U, d, U],
      b: [D, d, U, d, D, U, d, U],
    },
    samba: {
      name: NAME_SAMBA,
      bpm: 102,
      meter: METER_2_4,
      source: SOURCE_NATIVE,
      a: [d, _, U, x, D, u, x, U],
      b: [D, u, x, U, d, U, x, U],
    },
    bossa: {
      name: NAME_BOSSA,
      bpm: 82,
      meter: METER_4_4,
      source: SOURCE_NATIVE,
      a: [D, _, _, u, _, d, U, _, D, _, d, _, U, _, d, u],
      b: [D, _, u, _, d, _, U, u, _, D, _, u, d, _, U, _],
    },
    baiao: {
      name: NAME_BAIAO,
      bpm: 116,
      meter: METER_2_4,
      source: SOURCE_NATIVE,
      a: [D, _, x, U, d, U, x, _],
      b: [D, u, x, U, d, _, U, u],
    },
    reggae: {
      name: NAME_REGGAE,
      bpm: 78,
      meter: METER_4_4,
      source: SOURCE_NATIVE,
      a: [x, _, D, _, x, _, U, d, x, _, D, _, x, u, U, _],
      b: [x, u, D, _, x, u, U, _, x, u, D, _, x, _, U, d],
    },
    funk: {
      name: NAME_FUNK,
      bpm: 105,
      meter: METER_4_4,
      source: SOURCE_NATIVE,
      a: [D, _, x, _, d, U, _, x, _, u, D, _, x, U, d, U],
      b: [D, u, x, _, D, _, U, x, d, u, x, _, D, U, _, x],
    },
    valsa: {
      name: NAME_VALSA,
      bpm: 95,
      meter: METER_3_4,
      source: SOURCE_NATIVE,
      a: [D, _, _, _, d, U, _, _, d, U, _, _],
      b: [D, _, _, u, D, _, _, u, D, U, _, _],
    },
    xote: {
      name: NAME_XOTE,
      bpm: 88,
      meter: METER_2_4,
      source: SOURCE_NATIVE,
      a: [D, _, x, U, _, d, x, _],
      b: [D, u, x, _, D, _, x, U],
    },
    forro: {
      name: NAME_FORRO,
      bpm: 120,
      meter: METER_2_4,
      source: SOURCE_NATIVE,
      a: [D, x, U, x, d, x, U, _],
      b: [D, u, D, u, d, x, U, x],
    },
    bolero: {
      name: NAME_BOLERO,
      bpm: 92,
      meter: METER_4_4,
      source: SOURCE_NATIVE,
      a: [D, _, _, u, D, _, _, _, d, _, U, _, d, _, _, u],
      b: [D, _, x, u, D, _, _, x, d, _, U, _, d, _, U, _],
    },
    milonga: {
      name: NAME_MILONGA,
      bpm: 100,
      meter: METER_2_4,
      source: SOURCE_NATIVE,
      a: [D, _, u, D, _, U, d, _],
      b: [D, u, _, D, u, _, D, _],
    },
  }
};
