export const UI_RENDERER_TOKENS = {
  SHORTCUT_LABELS: {
    Space: "ESPAÇO", Enter: "ENTER", ShiftLeft: "SHIFT", ShiftRight: "SHIFT",
    Minus: "−", Equal: "=", BracketLeft: "[", BracketRight: "]",
    Semicolon: ";", Quote: "'", Backslash: "\\",
    ArrowUp: "CIMA", ArrowDown: "BAIXO", ArrowLeft: "ESQ", ArrowRight: "DIR",
  },
  COMPACT_PREFIXES: [
    { regex: /^Key/, replace: "" },
    { regex: /^Digit/, replace: "" },
    { regex: /^Numpad/, replace: "N" },
    { regex: /^Arrow/, replace: "" },
    { regex: /^Control/, replace: "CTRL" },
    { regex: /^Alt/, replace: "ALT" },
    { regex: /^Shift/, replace: "SHIFT" },
    { regex: /^Intl/, replace: "" }
  ],
  SHORTCUT_PARTS: {
    Shift: "SHIFT", Control: "CTRL", Alt: "ALT", Meta: "CMD"
  },
  LABEL_CLARO: "CLARO",
  LABEL_ESCURO: "ESCURO",
};
