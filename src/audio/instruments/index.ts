import { createSmplrAdapter } from './smplr-adapter';
import { createSpessaAdapter } from './spessa-adapter';
import { instrumentRegistry } from './instrument-registry';

instrumentRegistry.register(createSpessaAdapter());
instrumentRegistry.register(createSmplrAdapter());

export { instrumentRegistry };
export type {
  InstrumentAdapter,
  InstrumentNoteEvent,
  InstrumentPresetRef,
  InstrumentVoice,
} from './instrument-adapter.types';
