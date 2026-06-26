import { Soundfont } from 'smplr';
import { INSTRUMENT_ADAPTER_TOKENS } from './instrument-adapter.tokens';
import { SMPLR_ADAPTER_TOKENS } from './smplr-adapter.tokens';
import type {
  InstrumentAdapter,
  InstrumentNoteEvent,
  InstrumentPresetRef,
  InstrumentVoice,
} from './instrument-adapter.types';

type SmplrInstrument = {
  start: (event: Record<string, unknown>) => void | ((event?: Record<string, unknown>) => void);
  stop?: (stopId?: unknown) => void;
  ready?: Promise<void>;
};

export function createSmplrAdapter(): InstrumentAdapter {
  let context: AudioContext | null = null;
  const instruments = new Map<string, SmplrInstrument>();
  const voices = new Map<string, InstrumentVoice>();

  function instrumentName(preset: InstrumentPresetRef) {
    return preset.id || SMPLR_ADAPTER_TOKENS.DEFAULT_INSTRUMENT;
  }

  function getInstrument(preset: InstrumentPresetRef) {
    if (!context) return null;
    const name = instrumentName(preset);
    if (!instruments.has(name)) {
      instruments.set(name, Soundfont(context, {
        instrument: name,
        volume: SMPLR_ADAPTER_TOKENS.DEFAULT_VOLUME,
      }) as unknown as SmplrInstrument);
    }
    return instruments.get(name) ?? null;
  }

  const adapter: InstrumentAdapter = {
    id: INSTRUMENT_ADAPTER_TOKENS.ENGINE_SMPLR,

    get ready() {
      return Boolean(context);
    },

    init(nextContext) {
      context = nextContext;
    },

    supports(preset) {
      return preset.engine === INSTRUMENT_ADAPTER_TOKENS.ENGINE_SMPLR;
    },

    play(event: InstrumentNoteEvent, preset: InstrumentPresetRef) {
      const instrument = getInstrument(preset);
      if (!instrument || !context) return null;

      const channel = event.channel ?? INSTRUMENT_ADAPTER_TOKENS.DEFAULT_CHANNEL;
      const id = event.stopId
        ?? `${SMPLR_ADAPTER_TOKENS.MIDI_NOTE_PREFIX}${channel}${SMPLR_ADAPTER_TOKENS.VOICE_SEPARATOR}${event.midi}${SMPLR_ADAPTER_TOKENS.VOICE_SEPARATOR}${context.currentTime}`;

      const stopResult = instrument.start({
        note: event.midi,
        velocity: Math.round((event.velocity ?? INSTRUMENT_ADAPTER_TOKENS.DEFAULT_VELOCITY) * 127),
        time: event.time,
        duration: event.duration ?? preset.duration ?? INSTRUMENT_ADAPTER_TOKENS.DEFAULT_DURATION_SECONDS,
        stopId: id,
      });

      const voice: InstrumentVoice = {
        id,
        engine: INSTRUMENT_ADAPTER_TOKENS.ENGINE_SMPLR,
        midi: event.midi,
        channel,
        startedAt: event.time ?? context.currentTime,
        stop: (release = INSTRUMENT_ADAPTER_TOKENS.DEFAULT_RELEASE_SECONDS) => {
          if (typeof stopResult === 'function') stopResult({ time: context?.currentTime, release });
          else instrument.stop?.(id);
          voices.delete(id);
        },
      };

      voices.set(id, voice);
      return voice;
    },

    stop(voice) {
      const tracked = voices.get(voice.id);
      tracked?.stop();
    },

    stopAll() {
      instruments.forEach((instrument) => instrument.stop?.());
      voices.clear();
    },
  };

  return adapter;
}
