/*
 * Rhythm Set v1
 *
 * Este arquivo é deliberadamente separado do motor. Novos pacotes podem
 * registrar ritmos em window.RHYTHM_PRESETS sem alterar o instrumento.
 *
 * Símbolos: D = batida forte ↓, d = leve ↓, U/u = batida ↑, x = abafada.
 * Cada posição representa uma semicolcheia.
 */
window.RHYTHM_PRESETS = {
  manual: {
    name: "Manual",
    bpm: 108,
    meter: "LIVRE",
    source: "NATIVO",
    manual: true,
  },
  pop: {
    name: "Pop",
    bpm: 108,
    meter: "4/4",
    source: "NATIVO",
    a: ["D", "-", "d", "U", "-", "U", "d", "U", "D", "-", "d", "U", "-", "U", "d", "U"],
    b: ["D", "-", "x", "U", "d", "U", "x", "U", "D", "d", "x", "U", "d", "U", "x", "U"],
  },
  rock: {
    name: "Rock",
    bpm: 126,
    meter: "4/4",
    source: "NATIVO",
    a: ["D", "-", "-", "d", "D", "-", "U", "-", "D", "-", "-", "d", "D", "-", "U", "U"],
    b: ["D", "d", "x", "U", "D", "-", "U", "d", "D", "d", "x", "U", "D", "U", "d", "U"],
  },
  vaneirao: {
    name: "Vaneirão",
    bpm: 144,
    meter: "2/4",
    source: "NATIVO",
    a: ["D", "-", "d", "U", "D", "U", "d", "U"],
    b: ["D", "d", "U", "d", "D", "U", "d", "U"],
  },
  samba: {
    name: "Samba",
    bpm: 102,
    meter: "2/4",
    source: "NATIVO",
    a: ["d", "-", "U", "x", "D", "u", "x", "U"],
    b: ["D", "u", "x", "U", "d", "U", "x", "U"],
  },
  bossa: {
    name: "Bossa nova",
    bpm: 82,
    meter: "4/4",
    source: "NATIVO",
    a: ["D", "-", "-", "u", "-", "d", "U", "-", "D", "-", "d", "-", "U", "-", "d", "u"],
    b: ["D", "-", "u", "-", "d", "-", "U", "u", "-", "D", "-", "u", "d", "-", "U", "-"],
  },
  baiao: {
    name: "Baião",
    bpm: 116,
    meter: "2/4",
    source: "NATIVO",
    a: ["D", "-", "x", "U", "d", "U", "x", "-"],
    b: ["D", "u", "x", "U", "d", "-", "U", "u"],
  },
};
