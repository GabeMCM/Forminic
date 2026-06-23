import { RHYTHM_TOKENS, RHYTHM_VALUES } from '../audio/rhythm.tokens.js';

const { PAUSE: _, STRONG_DOWN: D, LIGHT_DOWN: d, STRONG_UP: U, LIGHT_UP: u, MUTED: x } = RHYTHM_VALUES;

/*
 * Rhythm Set v1
 *
 * This file stays separate from the engine. New packages can register rhythms
 * in window.RHYTHM_PRESETS without touching the instrument.
 *
 * Symbols: D = strong down, d = light down, U/u = up, x = muted.
 * Each position represents a sixteenth note.
 */
window.RHYTHM_PRESETS = {
  manual: {
    name: RHYTHM_TOKENS.NAME_MANUAL,
    bpm: 108,
    meter: RHYTHM_TOKENS.METER_FREE,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    manual: true,
  },
  pop: {
    name: RHYTHM_TOKENS.NAME_POP,
    bpm: 108,
    meter: RHYTHM_TOKENS.METER_4_4,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    a: [D, _, d, U, _, U, d, U, D, _, d, U, _, U, d, U],
    b: [D, _, x, U, d, U, x, U, D, d, x, U, d, U, x, U],
  },
  rock: {
    name: RHYTHM_TOKENS.NAME_ROCK,
    bpm: 126,
    meter: RHYTHM_TOKENS.METER_4_4,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    a: [D, _, _, d, D, _, U, _, D, _, _, d, D, _, U, U],
    b: [D, d, x, U, D, _, U, d, D, d, x, U, D, U, d, U],
  },
  vaneirao: {
    name: RHYTHM_TOKENS.NAME_VANEIRAO,
    bpm: 144,
    meter: RHYTHM_TOKENS.METER_2_4,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    a: [D, _, d, U, D, U, d, U],
    b: [D, d, U, d, D, U, d, U],
  },
  samba: {
    name: RHYTHM_TOKENS.NAME_SAMBA,
    bpm: 102,
    meter: RHYTHM_TOKENS.METER_2_4,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    a: [d, _, U, x, D, u, x, U],
    b: [D, u, x, U, d, U, x, U],
  },
  bossa: {
    name: RHYTHM_TOKENS.NAME_BOSSA,
    bpm: 82,
    meter: RHYTHM_TOKENS.METER_4_4,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    a: [D, _, _, u, _, d, U, _, D, _, d, _, U, _, d, u],
    b: [D, _, u, _, d, _, U, u, _, D, _, u, d, _, U, _],
  },
  baiao: {
    name: RHYTHM_TOKENS.NAME_BAIAO,
    bpm: 116,
    meter: RHYTHM_TOKENS.METER_2_4,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    a: [D, _, x, U, d, U, x, _],
    b: [D, u, x, U, d, _, U, u],
  },
  reggae: {
    name: RHYTHM_TOKENS.NAME_REGGAE,
    bpm: 78,
    meter: RHYTHM_TOKENS.METER_4_4,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    a: [x, _, D, _, x, _, U, d, x, _, D, _, x, u, U, _],
    b: [x, u, D, _, x, u, U, _, x, u, D, _, x, _, U, d],
  },
  funk: {
    name: RHYTHM_TOKENS.NAME_FUNK,
    bpm: 105,
    meter: RHYTHM_TOKENS.METER_4_4,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    a: [D, _, x, _, d, U, _, x, _, u, D, _, x, U, d, U],
    b: [D, u, x, _, D, _, U, x, d, u, x, _, D, U, _, x],
  },
  valsa: {
    name: RHYTHM_TOKENS.NAME_VALSA,
    bpm: 95,
    meter: RHYTHM_TOKENS.METER_3_4,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    a: [D, _, _, _, d, U, _, _, d, U, _, _],
    b: [D, _, _, u, D, _, _, u, D, U, _, _],
  },
  xote: {
    name: RHYTHM_TOKENS.NAME_XOTE,
    bpm: 88,
    meter: RHYTHM_TOKENS.METER_2_4,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    a: [D, _, x, U, _, d, x, _],
    b: [D, u, x, _, D, _, x, U],
  },
  forro: {
    name: RHYTHM_TOKENS.NAME_FORRO,
    bpm: 120,
    meter: RHYTHM_TOKENS.METER_2_4,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    a: [D, x, U, x, d, x, U, _],
    b: [D, u, D, u, d, x, U, x],
  },
  bolero: {
    name: RHYTHM_TOKENS.NAME_BOLERO,
    bpm: 92,
    meter: RHYTHM_TOKENS.METER_4_4,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    a: [D, _, _, u, D, _, _, _, d, _, U, _, d, _, _, u],
    b: [D, _, x, u, D, _, _, x, d, _, U, _, d, _, U, _],
  },
  milonga: {
    name: RHYTHM_TOKENS.NAME_MILONGA,
    bpm: 100,
    meter: RHYTHM_TOKENS.METER_2_4,
    source: RHYTHM_TOKENS.SOURCE_NATIVE,
    a: [D, _, u, D, _, U, d, _],
    b: [D, u, _, D, u, _, D, _],
  },
};

RHYTHM_TOKENS.PRESETS = window.RHYTHM_PRESETS;
