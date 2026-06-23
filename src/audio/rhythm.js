import { store } from '../state/state.js';
import { audioEngine } from './engine.js';
import { RHYTHM_TOKENS, RHYTHM_VALUES } from './rhythm.tokens.js';
import { ENGINE_TOKENS } from './engine.tokens.js';
import { GLOBAL_TOKENS } from '../tokens/master.tokens.js';

export const rhythmEngine = {
  currentPreset() {
    const registry = globalThis.RHYTHM_PRESETS || RHYTHM_TOKENS.PRESETS;
    return registry[store.state.rhythmPreset] || registry.manual;
  },

  rhythmEvent(symbol, scheduledAt) {
    if (!symbol || symbol === RHYTHM_VALUES.PAUSE) return;
    const direction = symbol.toLowerCase() === RHYTHM_VALUES.LIGHT_UP ? ENGINE_TOKENS.STRUM_UP : ENGINE_TOKENS.STRUM_DOWN;
    const muted = symbol.toLowerCase() === RHYTHM_VALUES.MUTED;
    const velocity = symbol === symbol.toUpperCase() && !muted ? 1 : muted ? 0.62 : 0.72;
    audioEngine.strum(direction, velocity, muted, scheduledAt);
  },

  scheduleRhythm() {
    if (!store.state.rhythmPlaying || !audioEngine.ctx) return;
    const preset = this.currentPreset();
    const pattern = preset[store.state.rhythmVariation] || preset.a;
    const secondsPerStep = 60 / store.state.tempo / 4;

    while (store.state.nextStepAt < audioEngine.ctx.currentTime + 0.09) {
      this.rhythmEvent(pattern[store.state.rhythmStep % pattern.length], store.state.nextStepAt);
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
