import { toneSpessaEngine } from '../tone-spessa.js';
import { INSTRUMENT_ADAPTER_TOKENS } from './instrument-adapter.tokens';
import type {
  InstrumentAdapter,
  InstrumentNoteEvent,
  InstrumentPresetRef,
  InstrumentVoice,
} from './instrument-adapter.types';

export function createSpessaAdapter(): InstrumentAdapter {
  const voices = new Map<string, InstrumentVoice & { rawVoice?: unknown }>();
  let context: AudioContext | null = null;

  return {
    id: INSTRUMENT_ADAPTER_TOKENS.ENGINE_SPESSA,

    get ready() {
      return Boolean(context && toneSpessaEngine.available);
    },

    async init(nextContext) {
      context = nextContext;
      await toneSpessaEngine.init(nextContext);
    },

    supports(preset) {
      return Boolean(preset.program !== undefined || preset.id?.startsWith('gm'));
    },

    play(event: InstrumentNoteEvent, preset: InstrumentPresetRef) {
      if (!context || !toneSpessaEngine.available) return null;
      const rawVoice = toneSpessaEngine.play(
        event.midi,
        0,
        1,
        event.time ?? context.currentTime,
        event.velocity ?? INSTRUMENT_ADAPTER_TOKENS.DEFAULT_VELOCITY,
        Boolean(event.muted),
        preset,
        context.currentTime,
      );
      if (!rawVoice) return null;

      const channel = event.channel ?? INSTRUMENT_ADAPTER_TOKENS.DEFAULT_CHANNEL;
      const id = event.stopId ?? `${channel}:${event.midi}:${context.currentTime}`;
      const voice: InstrumentVoice & { rawVoice?: unknown } = {
        id,
        engine: INSTRUMENT_ADAPTER_TOKENS.ENGINE_SPESSA,
        midi: event.midi,
        channel,
        startedAt: event.time ?? context.currentTime,
        rawVoice,
        stop: (release = INSTRUMENT_ADAPTER_TOKENS.DEFAULT_RELEASE_SECONDS) => {
          toneSpessaEngine.stopVoice(rawVoice, release);
          voices.delete(id);
        },
      };

      voices.set(id, voice);
      return voice;
    },

    stop(voice, release = INSTRUMENT_ADAPTER_TOKENS.DEFAULT_RELEASE_SECONDS) {
      voices.get(voice.id)?.stop(release);
    },

    stopAll() {
      toneSpessaEngine.panic();
      voices.clear();
    },

    setPitchRatio(ratio, voice) {
      if (voice) {
        const tracked = voices.get(voice.id);
        if (tracked?.rawVoice) toneSpessaEngine.bendVoice(tracked.rawVoice, ratio);
        return;
      }
      voices.forEach((tracked) => {
        if (tracked.rawVoice) toneSpessaEngine.bendVoice(tracked.rawVoice, ratio);
      });
    },
  };
}
