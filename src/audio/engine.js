import { store } from '../state/state.js';
import { MUSIC_TOKENS, GLOBAL_TOKENS } from '../tokens/master.tokens.js';
import { ENGINE_TOKENS } from './engine.tokens.js';
import { WEB_AUDIO_TOKENS, JAVASCRIPT_TOKENS } from '../tokens/api.tokens.js';
import { toneSpessaEngine } from './tone-spessa.js';

let audioCtx = null;
let masterGain = null;
let reverbNode = null;
let reverbGain = null;
let bodyFilter = null;
let stringBuffers = new Map();
let effectTimers = new Map();
let voices = new Set();
let globalPitchRatio = ENGINE_TOKENS.PITCH_DEFAULT_RATIO;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function now() {
  return audioCtx?.currentTime ?? 0;
}

function currentPreset() {
  return MUSIC_TOKENS.SOUND_SETS[store.state.soundSet] || MUSIC_TOKENS.SOUND_SETS[ENGINE_TOKENS.FALLBACK_PRESET];
}

function safeTime(time) {
  return Math.max(now() + ENGINE_TOKENS.SAFE_SCHEDULE_AHEAD, time ?? now() + ENGINE_TOKENS.SAFE_SCHEDULE_AHEAD);
}

function createBodyFilter() {
  const low = audioCtx.createBiquadFilter();
  low.type = WEB_AUDIO_TOKENS.FILTER_LOWSHELF;
  low.frequency.value = ENGINE_TOKENS.BODY_LOW_FREQUENCY;
  low.gain.value = ENGINE_TOKENS.BODY_LOW_GAIN;

  const mid = audioCtx.createBiquadFilter();
  mid.type = WEB_AUDIO_TOKENS.FILTER_PEAKING;
  mid.frequency.value = ENGINE_TOKENS.BODY_MID_FREQUENCY;
  mid.Q.value = ENGINE_TOKENS.BODY_MID_Q;
  mid.gain.value = ENGINE_TOKENS.BODY_MID_GAIN;

  const high = audioCtx.createBiquadFilter();
  high.type = WEB_AUDIO_TOKENS.FILTER_HIGHSHELF;
  high.frequency.value = ENGINE_TOKENS.BODY_HIGH_FREQUENCY;
  high.gain.value = ENGINE_TOKENS.BODY_HIGH_GAIN;

  low.connect(mid);
  mid.connect(high);
  return { input: low, output: high };
}

function generateImpulseResponse() {
  const length = Math.floor(audioCtx.sampleRate * ENGINE_TOKENS.REVERB_DURATION);
  const impulse = audioCtx.createBuffer(2, length, audioCtx.sampleRate);
  for (let channelIndex = 0; channelIndex < 2; channelIndex += 1) {
    const channel = impulse.getChannelData(channelIndex);
    for (let index = 0; index < length; index += 1) {
      channel[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / length, ENGINE_TOKENS.REVERB_DECAY);
    }
  }
  return impulse;
}

function pluckBufferKey(midi, preset) {
  return `${preset.id}:${midi}`;
}

function createPluckBuffer(frequency, preset) {
  const length = Math.floor(audioCtx.sampleRate * ENGINE_TOKENS.PLUCK_BUFFER_SECONDS);
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  const period = Math.max(2, Math.floor(audioCtx.sampleRate / frequency));
  const isNylon = preset.id === ENGINE_TOKENS.NYLON_PRESET;
  const pickPosition = isNylon ? 0.34 : 0.22;
  const damping = preset.damping || (isNylon ? 0.992 : 0.988);
  const brightnessLoss = isNylon ? 0.74 : 0.56;
  let previous = 0;
  let bridge = 0;

  for (let index = 0; index < length; index += 1) {
    if (index < period) {
      const phase = index / period;
      const burst = Math.random() * 2 - 1;
      const pickComb = 1 - Math.cos(phase * Math.PI * 2 * (1 / pickPosition));
      const softened = isNylon ? Math.sin(phase * Math.PI) : 1;
      data[index] = burst * pickComb * softened * (preset.pickNoise || 0.5);
      continue;
    }
    const current = data[index - period];
    bridge = bridge * brightnessLoss + current * (1 - brightnessLoss);
    data[index] = ((current + previous) * 0.46 + bridge * 0.08) * damping;
    previous = data[index];
  }

  return buffer;
}

function scheduleVoiceCleanup(voice, seconds) {
  window.clearTimeout(voice.cleanupTimer);
  voice.cleanupTimer = window.setTimeout(() => audioEngine.stopVoice(voice, ENGINE_TOKENS.HARD_RELEASE), seconds * 1000);
}

function forgetVoice(voice) {
  window.clearTimeout(voice.cleanupTimer);
  window.clearTimeout(voice.disposeTimer);
  voices.delete(voice);
}

function stopOscillators(voice, stopAt) {
  voice.source?.oscillators?.forEach((oscillator) => {
    try { oscillator.stop(stopAt); } catch (_) {}
  });
}

function disposeNodes(voice) {
  if (voice.disposed) return;
  voice.disposed = true;
  voice.nodes?.forEach((node) => {
    try { node.disconnect(); } catch (_) {}
  });
}

function setAudioParam(param, value, time = 0.04) {
  if (!param || !audioCtx) return;
  const current = now();
  if (typeof param.cancelAndHoldAtTime === JAVASCRIPT_TOKENS.TYPE_FUNCTION) {
    param.cancelAndHoldAtTime(current);
  } else {
    param.cancelScheduledValues(current);
  }
  param.setTargetAtTime(value, current, Math.max(0.001, time));
}

function makePlaybackRateController(oscillators, frequency, ratios) {
  return {
    cancelScheduledValues: (time) => oscillators.forEach((oscillator) => oscillator.frequency.cancelScheduledValues(time)),
    setValueAtTime: (value, time) => oscillators.forEach((oscillator, index) => {
      oscillator.frequency.setValueAtTime(frequency * value * ratios[index], time);
    }),
    exponentialRampToValueAtTime: (value, time) => oscillators.forEach((oscillator, index) => {
      oscillator.frequency.exponentialRampToValueAtTime(frequency * value * ratios[index], time);
    }),
  };
}

function createOscillatorVoice(frequency, preset, startAt) {
  const isOrgan = preset.engine === GLOBAL_TOKENS.ENGINE_ORGAN;
  const isWind = preset.engine === GLOBAL_TOKENS.ENGINE_WIND;
  const windType = preset.windType || ENGINE_TOKENS.WIND_FLUTE;
  const oscillators = [audioCtx.createOscillator(), audioCtx.createOscillator(), audioCtx.createOscillator()];
  const merger = audioCtx.createGain();

  oscillators[0].type = isOrgan || (isWind && windType === ENGINE_TOKENS.WIND_FLUTE)
    ? WEB_AUDIO_TOKENS.OSC_SINE
    : WEB_AUDIO_TOKENS.OSC_SAWTOOTH;
  oscillators[1].type = isOrgan
    ? WEB_AUDIO_TOKENS.OSC_TRIANGLE
    : windType === ENGINE_TOKENS.WIND_SAX ? WEB_AUDIO_TOKENS.OSC_SQUARE : WEB_AUDIO_TOKENS.OSC_SINE;
  oscillators[2].type = WEB_AUDIO_TOKENS.OSC_SINE;

  const ratios = [
    1,
    isOrgan ? 2 : isWind ? 2.002 : 1.001,
    isWind ? 1.005 : 0.5,
  ];
  const mergerGain = isOrgan ? 0.3 : isWind ? (windType === ENGINE_TOKENS.WIND_TRUMPET ? 0.16 : 0.2) : 0.34;
  merger.gain.value = mergerGain;

  oscillators.forEach((oscillator, index) => {
    oscillator.frequency.value = frequency * ratios[index] * globalPitchRatio;
    oscillator.connect(merger);
    oscillator.start(startAt);
  });

  return {
    output: merger,
    source: {
      kind: ENGINE_TOKENS.TYPE_OSCILLATOR,
      oscillators,
      playbackRate: makePlaybackRateController(oscillators, frequency, ratios),
    },
    nodes: [merger, ...oscillators],
  };
}

function createBufferVoice(midi, frequency, preset, startAt) {
  const key = pluckBufferKey(midi, preset);
  if (!stringBuffers.has(key)) stringBuffers.set(key, createPluckBuffer(frequency, preset));
  const source = audioCtx.createBufferSource();
  source.buffer = stringBuffers.get(key);
  source.playbackRate.value = globalPitchRatio;
  source.start(startAt);
  return {
    output: source,
    source: { kind: ENGINE_TOKENS.TYPE_BUFFER, node: source, playbackRate: source.playbackRate },
    nodes: [source],
  };
}

function connectGuitarBody(output, gain, pan, preset) {
  const filter = audioCtx.createBiquadFilter();
  filter.type = WEB_AUDIO_TOKENS.FILTER_LOWPASS;
  filter.frequency.value = preset.brightness || ENGINE_TOKENS.FILTER_DEFAULT_FREQUENCY;

  const air = audioCtx.createBiquadFilter();
  air.type = WEB_AUDIO_TOKENS.FILTER_HIGHSHELF;
  air.frequency.value = preset.id === ENGINE_TOKENS.NYLON_PRESET ? 2600 : 4200;
  air.gain.value = preset.id === ENGINE_TOKENS.NYLON_PRESET ? -1.5 : 2.2;

  const bodyLow = audioCtx.createBiquadFilter();
  bodyLow.type = WEB_AUDIO_TOKENS.FILTER_PEAKING;
  bodyLow.frequency.value = 115;
  bodyLow.Q.value = 1.1;
  bodyLow.gain.value = 3.2;

  const bodyMid = audioCtx.createBiquadFilter();
  bodyMid.type = WEB_AUDIO_TOKENS.FILTER_PEAKING;
  bodyMid.frequency.value = preset.id === ENGINE_TOKENS.NYLON_PRESET ? 360 : 520;
  bodyMid.Q.value = 1.6;
  bodyMid.gain.value = preset.id === ENGINE_TOKENS.NYLON_PRESET ? 2.8 : 1.7;

  const nasalCut = audioCtx.createBiquadFilter();
  nasalCut.type = WEB_AUDIO_TOKENS.FILTER_PEAKING;
  nasalCut.frequency.value = 950;
  nasalCut.Q.value = 1.2;
  nasalCut.gain.value = -2.4;

  output.connect(filter).connect(air).connect(bodyLow).connect(bodyMid).connect(nasalCut).connect(gain).connect(pan);
  return [filter, air, bodyLow, bodyMid, nasalCut];
}

function resolveChordNotes() {
  const { tonic, octave, degrees, smartMode, smartPosition, fieldMinor, fieldLetter, fieldAccidental } = store.state;
  let resolvedTonic = tonic;

  if (smartMode && smartPosition !== null) {
    const mode = fieldMinor ? MUSIC_TOKENS.MODE_MINOR : MUSIC_TOKENS.MODE_MAJOR;
    const rootPitch = (MUSIC_TOKENS.NATURAL_PITCHES[fieldLetter] + fieldAccidental + 12) % 12;
    resolvedTonic = (rootPitch + MUSIC_TOKENS.SCALE_PATTERNS[mode][smartPosition]) % 12;
  }

  if (resolvedTonic === null) return [];

  const rootMidi = (octave + 1) * 12 + resolvedTonic;
  const pitches = degrees.size
    ? [resolvedTonic, ...[...degrees].map((degree) => (resolvedTonic + MUSIC_TOKENS.DEGREES[degree][1]) % 12)]
    : [resolvedTonic, (resolvedTonic + 4) % 12, (resolvedTonic + 7) % 12];

  return [...new Set(pitches)].map((pitch, index) => {
    let midi = (octave + 1) * 12 + pitch;
    if (midi < rootMidi) midi += 12;
    if (index > 0 && pitch === resolvedTonic) midi += 12;
    return clamp(midi, ENGINE_TOKENS.MIN_MIDI, ENGINE_TOKENS.MAX_MIDI);
  }).slice(0, ENGINE_TOKENS.MAX_CHORD_NOTES);
}

export const audioEngine = {
  init() {
    if (audioCtx) {
      if (audioCtx.state === WEB_AUDIO_TOKENS.STATE_SUSPENDED) audioCtx.resume().catch(() => {});
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = ENGINE_TOKENS.MASTER_GAIN;

    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = ENGINE_TOKENS.COMPRESSOR_THRESHOLD;
    compressor.knee.value = ENGINE_TOKENS.COMPRESSOR_KNEE;
    compressor.ratio.value = ENGINE_TOKENS.COMPRESSOR_RATIO;
    compressor.attack.value = ENGINE_TOKENS.COMPRESSOR_ATTACK;
    compressor.release.value = ENGINE_TOKENS.COMPRESSOR_RELEASE;
    masterGain.connect(compressor).connect(audioCtx.destination);

    bodyFilter = createBodyFilter();
    bodyFilter.output.connect(masterGain);

    reverbNode = audioCtx.createConvolver();
    reverbNode.buffer = generateImpulseResponse();
    reverbGain = audioCtx.createGain();
    reverbGain.gain.value = ENGINE_TOKENS.REVERB_GAIN;
    reverbNode.connect(reverbGain).connect(masterGain);

    toneSpessaEngine.init(audioCtx).catch(() => {});
  },

  get ctx() {
    return audioCtx;
  },

  get master() {
    return masterGain;
  },

  midiToFrequency(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  },

  stopAll(release = ENGINE_TOKENS.DEFAULT_RELEASE) {
    if (!audioCtx) return;
    effectTimers.forEach((timer) => window.clearInterval(timer));
    effectTimers.clear();
    globalPitchRatio = ENGINE_TOKENS.PITCH_DEFAULT_RATIO;
    [...voices].forEach((voice) => this.stopVoice(voice, release));
    toneSpessaEngine.panic?.();
  },

  dampVoices(release = ENGINE_TOKENS.DAMP_RELEASE) {
    if (!audioCtx) return;
    [...voices].forEach((voice) => this.stopVoice(voice, release));
  },

  dampRecentVoices(ageLimit = ENGINE_TOKENS.PREVIEW_STACCATO_AGE, release = ENGINE_TOKENS.PREVIEW_STACCATO_RELEASE) {
    if (!audioCtx) return;
    [...voices].forEach((voice) => {
      if (now() - voice.startedAt <= ageLimit) this.stopVoice(voice, release);
    });
  },

  stopVoice(voice, release = ENGINE_TOKENS.DEFAULT_RELEASE) {
    if (!audioCtx || !voice || voice.stopping) return;
    voice.stopping = true;

    if (voice.tone) {
      toneSpessaEngine.stopVoice(voice, release);
      forgetVoice(voice);
      return;
    }

    const stopAt = now() + Math.max(ENGINE_TOKENS.HARD_RELEASE, release);
    setAudioParam(voice.gain?.gain, ENGINE_TOKENS.VOICE_FLOOR, Math.max(ENGINE_TOKENS.HARD_RELEASE, release / 3));
    if (voice.source?.kind === ENGINE_TOKENS.TYPE_OSCILLATOR) stopOscillators(voice, stopAt + ENGINE_TOKENS.CLEANUP_EXTRA_SECONDS);
    if (voice.source?.kind === ENGINE_TOKENS.TYPE_BUFFER) {
      try { voice.source.node.stop(stopAt + ENGINE_TOKENS.CLEANUP_EXTRA_SECONDS); } catch (_) {}
    }
    voice.disposeTimer = window.setTimeout(() => {
      disposeNodes(voice);
      forgetVoice(voice);
    }, (release + ENGINE_TOKENS.CLEANUP_EXTRA_SECONDS) * 1000);
  },

  setPitchRatio(ratio, active = true) {
    if (!audioCtx) return;
    const target = active ? ratio : ENGINE_TOKENS.PITCH_DEFAULT_RATIO;
    globalPitchRatio = target;
    [...voices].forEach((voice) => {
      if (voice.tone) {
        toneSpessaEngine.bendVoice(voice, target, 0.12);
        return;
      }
      if (!voice.source?.playbackRate) return;
      const current = now();
      voice.source.playbackRate.cancelScheduledValues(current);
      voice.source.playbackRate.setValueAtTime(voice.bendRatio || ENGINE_TOKENS.PITCH_DEFAULT_RATIO, current);
      voice.source.playbackRate.exponentialRampToValueAtTime(target, current + 0.12);
      voice.bendRatio = target;
    });
  },

  applyBend(active) {
    this.setPitchRatio(ENGINE_TOKENS.PITCH_BEND_UP_RATIO, active);
  },

  setVoiceGain(voice, value, time = 0.04) {
    if (!audioCtx || !voice?.gain) return;
    if (voice.tone) {
      toneSpessaEngine.setGain(voice, value, time);
      return;
    }
    setAudioParam(voice.gain.gain, Math.max(ENGINE_TOKENS.VOICE_FLOOR, value), time);
  },

  setVoiceFilter(voice, value, time = 0.05) {
    if (!audioCtx || !voice?.filter) return;
    if (voice.tone) {
      toneSpessaEngine.setFilter(voice, value, time);
      return;
    }
    setAudioParam(voice.filter.frequency, Math.max(ENGINE_TOKENS.FILTER_MIN_FREQUENCY, value), time);
  },

  clearEffectTimer(effect) {
    const timer = effectTimers.get(effect);
    if (timer) window.clearInterval(timer);
    effectTimers.delete(effect);
  },

  applyPerformanceEffect(effect, active) {
    if (effect === GLOBAL_TOKENS.ACTION_EFFECT) {
      this.applyBend(active);
      return;
    }
    if (!audioCtx) return;
    this.clearEffectTimer(effect);

    const pitchEffects = {
      [ENGINE_TOKENS.EFFECT_BEND_DOWN]: ENGINE_TOKENS.PITCH_BEND_DOWN_RATIO,
      [ENGINE_TOKENS.EFFECT_OCTAVE_UP]: ENGINE_TOKENS.PITCH_OCTAVE_UP_RATIO,
      [ENGINE_TOKENS.EFFECT_OCTAVE_DOWN]: ENGINE_TOKENS.PITCH_OCTAVE_DOWN_RATIO,
      [ENGINE_TOKENS.EFFECT_FIFTH]: ENGINE_TOKENS.PITCH_FIFTH_RATIO,
    };
    if (pitchEffects[effect]) {
      this.setPitchRatio(pitchEffects[effect], active);
      return;
    }

    const preset = currentPreset();
    if (!active) {
      [...voices].forEach((voice) => {
        this.setVoiceGain(voice, voice.baseLevel || 0.08);
        this.setVoiceFilter(voice, preset.brightness || ENGINE_TOKENS.FILTER_DEFAULT_FREQUENCY);
        voice.pan?.pan?.setTargetAtTime?.(voice.basePan || 0, now(), 0.08);
      });
      this.setPitchRatio(ENGINE_TOKENS.PITCH_DEFAULT_RATIO, true);
      return;
    }

    if (effect === ENGINE_TOKENS.EFFECT_MUTE) [...voices].forEach((voice) => this.setVoiceFilter(voice, ENGINE_TOKENS.FILTER_MUTE_FREQUENCY));
    if (effect === ENGINE_TOKENS.EFFECT_SOFT) [...voices].forEach((voice) => this.setVoiceGain(voice, (voice.baseLevel || 0.08) * 0.45));
    if (effect === ENGINE_TOKENS.EFFECT_BRIGHT) [...voices].forEach((voice) => this.setVoiceFilter(voice, (preset.brightness || ENGINE_TOKENS.FILTER_DEFAULT_FREQUENCY) * ENGINE_TOKENS.FILTER_BRIGHT_FACTOR));
    if (effect === ENGINE_TOKENS.EFFECT_DARK) [...voices].forEach((voice) => this.setVoiceFilter(voice, ENGINE_TOKENS.FILTER_DARK_FREQUENCY));
    if (effect === ENGINE_TOKENS.EFFECT_SWELL) [...voices].forEach((voice) => this.setVoiceGain(voice, (voice.baseLevel || 0.08) * 1.6, 0.5));
    if (effect === ENGINE_TOKENS.EFFECT_WIDEN) [...voices].forEach((voice, index) => voice.pan?.pan?.setTargetAtTime?.(index % 2 ? 0.72 : -0.72, now(), 0.08));
    if (effect === ENGINE_TOKENS.EFFECT_FREEZE) [...voices].forEach((voice) => this.setVoiceGain(voice, (voice.baseLevel || 0.08) * 0.9, 0.25));

    if (effect === ENGINE_TOKENS.EFFECT_TREMOLO || effect === ENGINE_TOKENS.EFFECT_STUTTER) {
      let on = false;
      const low = effect === ENGINE_TOKENS.EFFECT_STUTTER ? ENGINE_TOKENS.STUTTER_LOW_GAIN : ENGINE_TOKENS.TREMOLO_LOW_GAIN;
      const interval = effect === ENGINE_TOKENS.EFFECT_STUTTER ? ENGINE_TOKENS.STUTTER_INTERVAL_MS : ENGINE_TOKENS.TREMOLO_INTERVAL_MS;
      effectTimers.set(effect, window.setInterval(() => {
        on = !on;
        [...voices].forEach((voice) => this.setVoiceGain(voice, (voice.baseLevel || 0.08) * (on ? 1 : low), 0.015));
      }, interval));
    }

    if (effect === ENGINE_TOKENS.EFFECT_VIBRATO) {
      let phase = 0;
      effectTimers.set(effect, window.setInterval(() => {
        phase += 1;
        this.setPitchRatio(1 + Math.sin(phase) * ENGINE_TOKENS.VIBRATO_DEPTH, true);
      }, ENGINE_TOKENS.VIBRATO_INTERVAL_MS));
    }
  },

  pluckString(midi, index, total, scheduledAt, velocity = 1, muted = false) {
    this.init();
    if (!audioCtx) return null;

    const preset = currentPreset();
    const safeMidi = clamp(midi, ENGINE_TOKENS.MIN_MIDI, ENGINE_TOKENS.MAX_MIDI);
    const startAt = safeTime(scheduledAt);
    const gmPreset = preset.id?.startsWith(ENGINE_TOKENS.GM_PREFIX);

    if (preset.engine !== GLOBAL_TOKENS.ENGINE_GUITAR && toneSpessaEngine.available) {
      const familyLevel = preset.engine === GLOBAL_TOKENS.ENGINE_PIANO ? 0.86
        : preset.engine === GLOBAL_TOKENS.ENGINE_WIND ? 0.72
          : preset.engine === GLOBAL_TOKENS.ENGINE_ORGAN ? 0.66 : 0.7;
      const level = clamp(velocity * familyLevel / Math.sqrt(Math.max(1, total)), 0.04, 0.88);
      const toneVoice = toneSpessaEngine.play(safeMidi, index, total, startAt, level, muted, preset, now());
      if (toneVoice) {
        toneVoice.baseLevel = level;
        toneVoice.basePan = 0;
        voices.add(toneVoice);
        this.setPitchRatio(globalPitchRatio, true);
        while (voices.size > ENGINE_TOKENS.MAX_ACTIVE_VOICES) this.stopVoice(voices.values().next().value, ENGINE_TOKENS.HARD_RELEASE);
        return toneVoice;
      }
    }

    if (gmPreset) return null;

    const frequency = this.midiToFrequency(safeMidi);
    const created = preset.engine === GLOBAL_TOKENS.ENGINE_GUITAR
      ? createBufferVoice(safeMidi, frequency, preset, startAt)
      : createOscillatorVoice(frequency, preset, startAt);

    const filter = audioCtx.createBiquadFilter();
    filter.type = WEB_AUDIO_TOKENS.FILTER_LOWPASS;
    filter.frequency.value = muted
      ? (preset.brightness || ENGINE_TOKENS.FILTER_DEFAULT_FREQUENCY) * ENGINE_TOKENS.FILTER_MUTED_FACTOR
      : preset.brightness || ENGINE_TOKENS.FILTER_DEFAULT_FREQUENCY;
    filter.Q.value = preset.engine === GLOBAL_TOKENS.ENGINE_WIND ? (preset.resonance || 2.2) : 0.7;

    const gain = audioCtx.createGain();
    const engineLevel = preset.engine === GLOBAL_TOKENS.ENGINE_PIANO ? (preset.hammer || 0.16)
      : preset.engine === GLOBAL_TOKENS.ENGINE_WIND ? 0.18 : 0.28;
    const level = clamp(velocity * engineLevel / Math.sqrt(Math.max(1, total)), 0.01, 0.22);
    const releaseAt = muted ? startAt + 0.15 : startAt + Math.min(preset.duration || 4, ENGINE_TOKENS.MAX_SUSTAIN_SECONDS);

    gain.gain.setValueAtTime(ENGINE_TOKENS.VOICE_FLOOR, startAt);
    gain.gain.linearRampToValueAtTime(level, startAt + (preset.engine === GLOBAL_TOKENS.ENGINE_WIND ? 0.09 : 0.015));
    if (muted) {
      gain.gain.exponentialRampToValueAtTime(ENGINE_TOKENS.VOICE_FLOOR, releaseAt);
    } else {
      gain.gain.exponentialRampToValueAtTime(Math.max(ENGINE_TOKENS.VOICE_FLOOR, level * 0.55), startAt + 0.34);
      gain.gain.exponentialRampToValueAtTime(ENGINE_TOKENS.VOICE_FLOOR, releaseAt);
    }

    const pan = audioCtx.createStereoPanner();
    pan.pan.value = total > 1 ? (index / (total - 1) - 0.5) * 0.72 + (Math.random() - 0.5) * 0.06 : 0;

    const nodes = [...created.nodes, filter, gain, pan];
    if (preset.engine === GLOBAL_TOKENS.ENGINE_GUITAR) {
      nodes.push(...connectGuitarBody(created.output, gain, pan, preset));
    } else {
      created.output.connect(filter).connect(gain).connect(pan);
    }
    pan.connect(bodyFilter.input);
    pan.connect(reverbNode);

    const voice = {
      source: created.source,
      gain,
      filter,
      pan,
      nodes,
      midi: safeMidi,
      startedAt: startAt,
      bendRatio: globalPitchRatio,
      baseLevel: level,
      basePan: pan.pan.value,
    };

    voices.add(voice);
    scheduleVoiceCleanup(voice, releaseAt - now() + ENGINE_TOKENS.CLEANUP_EXTRA_SECONDS);
    while (voices.size > ENGINE_TOKENS.MAX_ACTIVE_VOICES) this.stopVoice(voices.values().next().value, ENGINE_TOKENS.HARD_RELEASE);
    return voice;
  },

  previewRhythmGesture(direction = ENGINE_TOKENS.STRUM_DOWN, velocity = 0.8, muted = false, options = {}) {
    this.init();
    const root = store.state.tonic === null ? 60 : (store.state.octave + 1) * 12 + store.state.tonic;
    let notes = store.state.degrees.size
      ? [root, ...[...store.state.degrees].slice(0, 4).map((degree) => root + MUSIC_TOKENS.DEGREES[degree][1])]
      : [root, root + 4, root + 7];
    notes = [...new Set(notes)].sort((a, b) => direction === ENGINE_TOKENS.STRUM_DOWN ? a - b : b - a);
    const startAt = options.scheduledAt ?? now() + ENGINE_TOKENS.SAFE_SCHEDULE_AHEAD;

    if (options.bassThenChord) {
      this.pluckString(root + ENGINE_TOKENS.PREVIEW_BASS_OFFSET, 0, 1, startAt, velocity * 0.95, false);
      notes.forEach((midi, noteIndex) => {
        this.pluckString(midi, noteIndex, notes.length, startAt + ENGINE_TOKENS.PREVIEW_BASS_DELAY + noteIndex * ENGINE_TOKENS.PREVIEW_ARPEGGIO_SPACING, velocity * 0.74, muted);
      });
      return;
    }

    const spacing = options.chord ? 0 : options.spacing ?? ENGINE_TOKENS.PREVIEW_STRUM_SPACING;
    notes.forEach((midi, noteIndex) => {
      this.pluckString(midi, noteIndex, notes.length, startAt + noteIndex * spacing, velocity * (noteIndex === 0 ? 1 : 0.9), muted);
    });
    if (options.staccato) {
      window.setTimeout(() => this.dampRecentVoices(ENGINE_TOKENS.PREVIEW_STACCATO_AGE, ENGINE_TOKENS.PREVIEW_STACCATO_RELEASE), ENGINE_TOKENS.PREVIEW_STACCATO_DELAY_MS);
    }
  },

  strum(direction, velocity = 1, muted = false, scheduledAt = null) {
    this.init();
    const notes = resolveChordNotes();
    if (!notes.length) return;
    const ordered = notes.sort((a, b) => direction === ENGINE_TOKENS.STRUM_DOWN ? a - b : b - a);
    const startAt = scheduledAt ?? now() + ENGINE_TOKENS.SAFE_SCHEDULE_AHEAD;
    const spacing = direction === ENGINE_TOKENS.STRUM_DOWN ? ENGINE_TOKENS.STRUM_DOWN_SPACING : ENGINE_TOKENS.STRUM_UP_SPACING;
    ordered.forEach((midi, noteIndex) => {
      const drift = (Math.random() - 0.5) * ENGINE_TOKENS.STRUM_TIMING_DRIFT;
      this.pluckString(midi, noteIndex, ordered.length, startAt + noteIndex * spacing + drift, velocity, muted);
    });
  },
};
