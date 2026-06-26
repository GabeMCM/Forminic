import type { InstrumentEngineId } from './instrument-adapter.tokens';

export type InstrumentVoiceId = string;

export interface InstrumentPresetRef {
  id: string;
  label: string;
  engine?: string;
  program?: number;
  brightness?: number;
  duration?: number;
  room?: number;
}

export interface InstrumentNoteEvent {
  midi: number;
  velocity?: number;
  time?: number;
  duration?: number;
  channel?: number;
  muted?: boolean;
  stopId?: InstrumentVoiceId;
}

export interface InstrumentVoice {
  id: InstrumentVoiceId;
  engine: InstrumentEngineId;
  midi: number;
  channel: number;
  startedAt: number;
  stop: (release?: number) => void;
}

export interface InstrumentAdapter {
  readonly id: InstrumentEngineId;
  readonly ready: boolean;
  init: (context: AudioContext) => Promise<void> | void;
  supports: (preset: InstrumentPresetRef) => boolean;
  play: (event: InstrumentNoteEvent, preset: InstrumentPresetRef) => InstrumentVoice | null;
  stop: (voice: InstrumentVoice, release?: number) => void;
  stopAll: () => void;
  setPitchRatio?: (ratio: number, voice?: InstrumentVoice) => void;
  setGain?: (value: number, voice?: InstrumentVoice) => void;
  setFilter?: (value: number, voice?: InstrumentVoice) => void;
}
