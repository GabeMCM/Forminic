import { store } from '../state/state.js';
import { audioEngine } from './engine.js';
import { RHYTHM_TOKENS, RHYTHM_VALUES } from './rhythm.tokens.js';
import { ENGINE_TOKENS } from './engine.tokens.js';
import { GLOBAL_TOKENS } from '../tokens/master.tokens.js';

export const rhythmEngine = {
  currentPreset() {
    const registry = globalThis.RHYTHM_PRESETS || RHYTHM_TOKENS.PRESETS;
    if (!store.state.rhythmEnabled) return registry.manual;
    return registry[store.state.rhythmPreset] || registry.manual;
  },

  rhythmEvent(symbol, scheduledAt, velocityOverride = null) {
    if (!symbol || symbol === RHYTHM_VALUES.PAUSE) return;
    const modern = {
      C: [ENGINE_TOKENS.STRUM_DOWN, { chord: true }],
      DS: [ENGINE_TOKENS.STRUM_DOWN, { spacing: 0.04 }],
      DF: [ENGINE_TOKENS.STRUM_DOWN, { spacing: 0.012 }],
      US: [ENGINE_TOKENS.STRUM_UP, { spacing: 0.04 }],
      UF: [ENGINE_TOKENS.STRUM_UP, { spacing: 0.012 }],
      A: [ENGINE_TOKENS.STRUM_DOWN, { spacing: 0.075 }],
      M: [ENGINE_TOKENS.STRUM_DOWN, { spacing: 0.01, muted: true }],
      T: [ENGINE_TOKENS.STRUM_DOWN, { chord: true, staccato: true }],
      H: [ENGINE_TOKENS.STRUM_DOWN, { chord: true }],
      BA: [ENGINE_TOKENS.STRUM_DOWN, { bassThenChord: true }],
    };
    if (modern[symbol]) {
      const [direction, options] = modern[symbol];
      audioEngine.previewRhythmGesture(direction, velocityOverride ?? (symbol === "T" ? 0.68 : 0.82), Boolean(options.muted), { ...options, scheduledAt });
      return;
    }
    const direction = symbol.toLowerCase() === RHYTHM_VALUES.LIGHT_UP ? ENGINE_TOKENS.STRUM_UP : ENGINE_TOKENS.STRUM_DOWN;
    const muted = symbol.toLowerCase() === RHYTHM_VALUES.MUTED;
    const velocity = velocityOverride ?? (symbol === symbol.toUpperCase() && !muted ? 1 : muted ? 0.62 : 0.72);
    audioEngine.strum(direction, velocity, muted, scheduledAt);
  },

  baseEvent(symbol, scheduledAt, preset) {
    if (!symbol || symbol === RHYTHM_VALUES.PAUSE || preset.mode !== "programmedBase") return;
    const tonic = store.state.tonic;
    if (tonic === null || symbol === "S") return;
    const midi = (store.state.octave + 1) * 12 + tonic - 12;
    audioEngine.pluckString(midi, 0, 1, scheduledAt, symbol === "B" ? 0.82 : 0.58);
  },

  scheduleRhythm() {
    if (!store.state.rhythmPlaying || !audioEngine.ctx) return;
    const preset = this.currentPreset();
    const basePreset = (globalThis.RHYTHM_PRESETS || {})[store.state.basePreset];
    const pattern = preset[store.state.rhythmVariation] || preset.a;
    const secondsPerStep = 60 / store.state.tempo * (preset.pulse || 0.25);

    while (store.state.nextStepAt < audioEngine.ctx.currentTime + 0.09) {
      const stepIndex = store.state.rhythmStep % pattern.length;
      const symbol = pattern[stepIndex];
      const articulation = preset.durations?.[stepIndex] || "1";
      const velocity = preset.velocities?.[stepIndex] ? preset.velocities[stepIndex] / 100 : null;
      this.rhythmEvent(symbol, store.state.nextStepAt, velocity);
      if (articulation === "R" && symbol !== RHYTHM_VALUES.PAUSE) {
        this.rhythmEvent(symbol, store.state.nextStepAt + secondsPerStep * 0.5, velocity);
      }
      if (basePreset) {
        this.baseEvent(basePreset.b?.[store.state.rhythmStep % (basePreset.b?.length || 1)], store.state.nextStepAt, basePreset);
      } else {
        this.baseEvent(preset.b?.[store.state.rhythmStep % (preset.b?.length || 1)], store.state.nextStepAt, preset);
      }
      if (articulation !== "R" && Number(articulation) > 1) {
        window.setTimeout(() => audioEngine.dampVoices(secondsPerStep * Number(articulation) * 0.7), secondsPerStep * Number(articulation) * 700);
      }
      store.state.rhythmStep = (store.state.rhythmStep + 1) % pattern.length;
      store.state.nextStepAt += secondsPerStep;
    }
  },

  startRhythm() {
    const preset = this.currentPreset();
    if (preset.manual) return;
    audioEngine.init();
    store.state.rhythmPlaying = true;
    store.state.rhythmStep = 0;
    store.state.nextStepAt = audioEngine.ctx.currentTime + 0.04;
    window.clearInterval(store.state.rhythmTimer);
    store.state.rhythmTimer = window.setInterval(() => this.scheduleRhythm(), 25);
    this.scheduleRhythm();
  },

  stopRhythm() {
    store.state.rhythmPlaying = false;
    window.clearInterval(store.state.rhythmTimer);
    store.state.rhythmTimer = null;
  },

  toggleRhythm() {
    if (store.state.rhythmPlaying) this.stopRhythm();
    else this.startRhythm();
  },

  toggleVariation() {
    if (this.currentPreset().manual) return;
    store.state.rhythmVariation = store.state.rhythmVariation === RHYTHM_TOKENS.VARIATION_A ? RHYTHM_TOKENS.VARIATION_B : RHYTHM_TOKENS.VARIATION_A;
    store.state.rhythmStep = 0;
  },

  startRepeatingStrum(action) {
    const direction = action === GLOBAL_TOKENS.ACTION_RHYTHM_DOWN ? ENGINE_TOKENS.STRUM_DOWN : ENGINE_TOKENS.STRUM_UP;
    if (action === GLOBAL_TOKENS.ACTION_RHYTHM_UP) {
      audioEngine.strum(direction, 0.82);
      window.setTimeout(() => audioEngine.dampRecentVoices(0.72, 0.9), 180);
      store.state.manualTimers.set(action, { pulse: true });
      return;
    }
    audioEngine.strum(direction);
    store.state.manualTimers.set(action, { sustain: true });
  },

  stopRepeatingStrum(action) {
    const timers = store.state.manualTimers.get(action);
    if (!timers) return;
    window.clearTimeout(timers.delay);
    window.clearInterval(timers.interval);
    store.state.manualTimers.delete(action);
    if (timers.sustain) audioEngine.dampVoices(1.35);
  },

  refreshHeldRhythm() {
    const preset = this.currentPreset();
    if (preset.manual) {
      if (store.state.activeActions.has(GLOBAL_TOKENS.ACTION_RHYTHM_DOWN)) audioEngine.strum(ENGINE_TOKENS.STRUM_DOWN);
      if (store.state.activeActions.has(GLOBAL_TOKENS.ACTION_RHYTHM_UP)) audioEngine.strum(ENGINE_TOKENS.STRUM_UP);
    }
  }
};
