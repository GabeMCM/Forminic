import { store } from '../state/state.js';
import { audioEngine } from './engine.js';
import { RHYTHM_TOKENS, RHYTHM_VALUES } from './rhythm.tokens.js';
import { ENGINE_TOKENS } from './engine.tokens.js';
import { GLOBAL_TOKENS, MUSIC_TOKENS } from '../tokens/master.tokens.js';

export const rhythmEngine = {
  currentPreset() {
    const registry = globalThis.RHYTHM_PRESETS || RHYTHM_TOKENS.PRESETS;
    if (!store.state.rhythmEnabled) return registry.manual;
    return registry[store.state.rhythmPreset] || registry.manual;
  },

  playTrack(trackId, scheduledAt, velocity = 0.8, durationMs = null) {
    const track = store.state.rhythmTracks.find(t => t.id === trackId);
    if (!track) return;
    
    const root = 12 * (track.octave + 1) + track.tonic;
    const midiNotes = track.degrees.map(index => root + MUSIC_TOKENS.DEGREES[index][1]);
    if (midiNotes.length === 0) midiNotes.push(root);

    midiNotes.forEach(midi => {
      const voice = audioEngine.pluckString(midi, 0, 1, scheduledAt, velocity, false);
      if (durationMs && voice) {
        window.setTimeout(() => audioEngine.stopVoice(voice), durationMs);
      }
    });
  },

  scheduleRhythm() {
    if (!store.state.rhythmPlaying || !audioEngine.ctx) return;
    const preset = this.currentPreset();
    if (!preset || !preset.blocks || preset.blocks.length === 0) return;

    // We assume pattern length is calculated based on BPM and total duration of the rhythm.
    // For simplicity, let's assume a 1 bar loop (4 beats)
    const beatsPerBar = 4;
    const secondsPerBeat = 60 / (preset.bpm || store.state.tempo);
    const loopDuration = secondsPerBeat * beatsPerBar;

    while (store.state.nextStepAt < audioEngine.ctx.currentTime + 0.1) {
      const loopStart = store.state.nextStepAt;
      
      preset.blocks.forEach(block => {
        // Convert block start time from MS to seconds relative to loop start
        const eventTime = loopStart + (block.startTimeMs / 1000);
        this.playTrack(block.trackId, eventTime, (block.velocity || 80) / 100);
      });

      store.state.nextStepAt += loopDuration;
    }
  },

  startRhythm() {
    const preset = this.currentPreset();
    if (preset.manual) return;
    audioEngine.init();
    store.state.rhythmPlaying = true;
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
    // Variations not currently supported in piano-roll mode
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
