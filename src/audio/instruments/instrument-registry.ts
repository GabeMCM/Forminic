import type { InstrumentAdapter, InstrumentPresetRef } from './instrument-adapter.types';

const adapters = new Map<string, InstrumentAdapter>();

export const instrumentRegistry = {
  register(adapter: InstrumentAdapter) {
    adapters.set(adapter.id, adapter);
  },

  get(id: string) {
    return adapters.get(id) ?? null;
  },

  all() {
    return [...adapters.values()];
  },

  resolve(preset: InstrumentPresetRef) {
    return [...adapters.values()].find((adapter) => adapter.supports(preset)) ?? null;
  },

  async initAll(context: AudioContext) {
    await Promise.all([...adapters.values()].map((adapter) => adapter.init(context)));
  },

  stopAll() {
    adapters.forEach((adapter) => adapter.stopAll());
  },
};
