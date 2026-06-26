import * as Tone from 'tone';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const STORAGE_KEY = 'forminc_guitar_composer_v1';
const PX_PER_MS = 0.12;
const TIMELINE_LABEL_WIDTH = 142;
const TIMELINE_MS = 12000;
const TECHNIQUES = [
  ['normal', 'Normal'],
  ['palmMute', 'Palm mute'],
  ['muted', 'Abafado'],
  ['slideUp', 'Slide +'],
  ['slideDown', 'Slide -'],
  ['hammerOn', 'Hammer-on'],
  ['pullOff', 'Pull-off'],
  ['vibrato', 'Vibrato'],
  ['harmonic', 'Harmônico'],
  ['deadNote', 'Dead note'],
];

const defaultState = {
  bpm: 96,
  snapMs: 100,
  selectedShapeId: 'shape_c',
  selectedPatternId: 'pattern_pop',
  selectedBlockId: 'lh_1',
  selectedEventId: null,
  instrument: {
    name: 'Violão Nylon',
    frets: 22,
    strings: [
      { string: 6, note: 'E', octave: 2 },
      { string: 5, note: 'A', octave: 2 },
      { string: 4, note: 'D', octave: 3 },
      { string: 3, note: 'G', octave: 3 },
      { string: 2, note: 'B', octave: 3 },
      { string: 1, note: 'E', octave: 4 },
    ],
  },
  shapes: {
    shape_c: {
      id: 'shape_c',
      name: 'C Maior',
      positions: [
        { string: 5, fret: 3 },
        { string: 4, fret: 2 },
        { string: 3, fret: 0 },
        { string: 2, fret: 1 },
        { string: 1, fret: 0 },
      ],
      muted: [6],
    },
    shape_am: {
      id: 'shape_am',
      name: 'A menor',
      positions: [
        { string: 5, fret: 0 },
        { string: 4, fret: 2 },
        { string: 3, fret: 2 },
        { string: 2, fret: 1 },
        { string: 1, fret: 0 },
      ],
      muted: [6],
    },
  },
  patterns: {
    pattern_pop: {
      id: 'pattern_pop',
      name: 'Pop dedilhado',
      events: [
        { id: 'evt_1', atMs: 0, strings: [5], velocity: 0.82, durationMs: 900, technique: 'normal' },
        { id: 'evt_2', atMs: 140, strings: [4], velocity: 0.74, durationMs: 820, technique: 'normal' },
        { id: 'evt_3', atMs: 280, strings: [3], velocity: 0.72, durationMs: 820, technique: 'normal' },
        { id: 'evt_4', atMs: 420, strings: [2], velocity: 0.7, durationMs: 760, technique: 'hammerOn', targetFretOffset: 2 },
        { id: 'evt_5', atMs: 560, strings: [1], velocity: 0.76, durationMs: 920, technique: 'vibrato' },
        { id: 'evt_6', atMs: 860, strings: [5, 4, 3, 2, 1], velocity: 0.62, durationMs: 650, technique: 'palmMute', spreadMs: 18 },
      ],
    },
  },
  timeline: {
    leftHandTrack: [
      { id: 'lh_1', shapeId: 'shape_c', startMs: 0, durationMs: 2200 },
      { id: 'lh_2', shapeId: 'shape_am', startMs: 2400, durationMs: 1800 },
    ],
    rightHandTrack: [
      { id: 'rh_1', patternId: 'pattern_pop', startMs: 0, durationMs: 2200 },
      { id: 'rh_2', patternId: 'pattern_pop', startMs: 2400, durationMs: 1800 },
    ],
  },
};

let state = loadState();
let elements = {};
let audio = null;
let raf = null;
let isPlaying = false;
let playStartedAt = 0;
let dragState = null;
let renderPending = false;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...clone(defaultState), ...JSON.parse(stored) } : clone(defaultState);
  } catch (_) {
    return clone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function safeTarget(target) {
  return target instanceof HTMLElement ? target : null;
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function snap(value) {
  const step = Number(state.snapMs) || 10;
  return Math.max(0, Math.round(value / step) * step);
}

function noteToMidi(note, octave) {
  return (Number(octave) + 1) * 12 + NOTE_NAMES.indexOf(note);
}

function midiToNote(midi) {
  return `${NOTE_NAMES[(midi + 1200) % 12]}${Math.floor(midi / 12) - 1}`;
}

function noteForStringFret(stringNumber, fret) {
  const string = state.instrument.strings.find(item => item.string === stringNumber);
  if (!string) return 'C4';
  return midiToNote(noteToMidi(string.note, string.octave) + Number(fret || 0));
}

function activeBlockAt(track, timeMs) {
  return state.timeline[track]
    .filter(block => timeMs >= block.startMs && timeMs < block.startMs + block.durationMs)
    .sort((a, b) => a.startMs - b.startMs)
    .pop() || null;
}

function activeShapeAt(timeMs) {
  const block = activeBlockAt('leftHandTrack', timeMs);
  return block ? state.shapes[block.shapeId] : null;
}

function fretFor(shape, stringNumber) {
  if (!shape || shape.muted.includes(stringNumber)) return null;
  return shape.positions.find(pos => pos.string === stringNumber)?.fret ?? 0;
}

function ensureAudio() {
  if (audio) return audio;
  const master = new Tone.Gain(0.65).toDestination();
  const body = new Tone.Filter(4200, 'lowpass').connect(master);
  const resonance = new Tone.Reverb({ decay: 1.8, preDelay: 0.018, wet: 0.18 }).connect(master);
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle8' },
    envelope: { attack: 0.003, decay: 0.55, sustain: 0.08, release: 1.15 },
  });
  synth.connect(body);
  synth.connect(resonance);
  const muted = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    octaves: 1.1,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.06 },
  }).connect(master);
  audio = { synth, muted, body, resonance };
  return audio;
}

function playStringEvent(event, shape, time, stringNumber, spreadIndex = 0) {
  const engine = ensureAudio();
  const fret = fretFor(shape, stringNumber);
  const stringDelay = event.stringDelays?.[stringNumber] ?? (event.spreadMs || 0) * spreadIndex;
  const offset = Number(stringDelay || 0) / 1000;
  const when = time + offset;
  const velocity = Math.max(0.05, Math.min(1, Number(event.velocity) || 0.75));
  if (fret === null || event.technique === 'deadNote' || event.technique === 'muted') {
    engine.muted.triggerAttackRelease('C2', 0.055, when, velocity * 0.55);
    return;
  }

  const duration = Math.max(0.05, (Number(event.durationMs) || 700) / 1000);
  const note = noteForStringFret(stringNumber, fret);
  if (event.technique === 'palmMute') {
    engine.body.frequency.setValueAtTime(920, when);
    engine.body.frequency.exponentialRampToValueAtTime(2600, when + 0.12);
    engine.synth.triggerAttackRelease(note, Math.min(0.22, duration), when, velocity * 0.72);
    return;
  }
  if (event.technique === 'harmonic') {
    engine.synth.triggerAttackRelease(midiToNote(noteToMidi(note.slice(0, -1), note.slice(-1)) + 12), duration * 0.55, when, velocity * 0.48);
    return;
  }
  if (event.technique === 'hammerOn') {
    const target = noteForStringFret(stringNumber, fret + Math.max(1, Number(event.targetFretOffset) || 2));
    engine.synth.triggerAttackRelease(note, 0.11, when, velocity * 0.58);
    engine.synth.triggerAttackRelease(target, duration, when + 0.105, velocity * 0.82);
    return;
  }
  if (event.technique === 'pullOff') {
    const target = noteForStringFret(stringNumber, Math.max(0, fret - Math.max(1, Number(event.targetFretOffset) || 2)));
    engine.synth.triggerAttackRelease(note, 0.14, when, velocity);
    engine.synth.triggerAttackRelease(target, duration * 0.8, when + 0.12, velocity * 0.64);
    return;
  }
  if (event.technique === 'slideUp' || event.technique === 'slideDown') {
    const delta = event.technique === 'slideUp' ? 2 : -2;
    const target = noteForStringFret(stringNumber, Math.max(0, fret + delta));
    engine.synth.triggerAttackRelease(note, 0.14, when, velocity * 0.72);
    engine.synth.triggerAttackRelease(target, duration, when + 0.13, velocity * 0.86);
    return;
  }
  if (event.technique === 'vibrato') {
    engine.synth.triggerAttackRelease(note, duration, when, velocity);
    engine.synth.triggerAttackRelease(midiToNote(noteToMidi(note.slice(0, -1), note.slice(-1)) + 1), 0.08, when + 0.22, velocity * 0.18);
    return;
  }
  engine.synth.triggerAttackRelease(note, duration, when, velocity);
}

function schedulePlayback() {
  Tone.Transport.cancel(0);
  Tone.Transport.bpm.value = Number(state.bpm) || 96;
  const blocks = state.timeline.rightHandTrack;
  blocks.forEach(block => {
    const pattern = state.patterns[block.patternId];
    if (!pattern) return;
    pattern.events.forEach(event => {
      const eventTimeMs = block.startMs + event.atMs;
      if (eventTimeMs > block.startMs + block.durationMs) return;
      Tone.Transport.schedule(time => {
        const shape = activeShapeAt(eventTimeMs);
        if (!shape) return;
        event.strings.forEach((stringNumber, index) => playStringEvent(event, shape, time, stringNumber, index));
      }, eventTimeMs / 1000);
    });
  });
}

function stopPlayback() {
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  audio?.synth?.releaseAll?.(Tone.now());
  isPlaying = false;
  playStartedAt = 0;
  elements.time.textContent = '0.00s';
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  render();
}

async function togglePlayback() {
  await Tone.start();
  if (isPlaying) {
    Tone.Transport.pause();
    isPlaying = false;
    render();
    return;
  }
  schedulePlayback();
  Tone.Transport.seconds = 0;
  Tone.Transport.start();
  playStartedAt = performance.now();
  isPlaying = true;
  tick();
  render();
}

function tick() {
  if (!isPlaying) return;
  const ms = Tone.Transport.seconds * 1000;
  elements.time.textContent = `${(ms / 1000).toFixed(2)}s`;
  renderTimeline(ms);
  raf = requestAnimationFrame(tick);
}

function setState(mutator) {
  mutator(state);
  saveState();
  schedulePlayback();
  render();
}

function mutateDuringDrag(mutator) {
  mutator(state);
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(() => {
    renderPending = false;
    renderTimeline();
    renderInspector();
  });
}

function renderTuning() {
  elements.tuning.innerHTML = state.instrument.strings.map(string => `
    <label class="guitar-tuning-row">
      <span>Corda ${string.string}</span>
      <select data-tuning-note="${string.string}">
        ${NOTE_NAMES.map(note => `<option value="${note}" ${note === string.note ? 'selected' : ''}>${note}</option>`).join('')}
      </select>
      <input data-tuning-octave="${string.string}" type="number" min="0" max="8" value="${string.octave}" />
    </label>
  `).join('');
}

function renderLibraries() {
  elements.shapes.innerHTML = Object.values(state.shapes).map(shape => `
    <button class="guitar-library-card ${shape.id === state.selectedShapeId ? 'active' : ''}" data-select-shape="${shape.id}" type="button">
      <strong>${shape.name}</strong><span>${shape.positions.length} cordas · ${shape.muted.length} abafadas</span>
    </button>
  `).join('');
  elements.patterns.innerHTML = Object.values(state.patterns).map(pattern => `
    <button class="guitar-library-card ${pattern.id === state.selectedPatternId ? 'active' : ''}" data-select-pattern="${pattern.id}" type="button">
      <strong>${pattern.name}</strong><span>${pattern.events.length} eventos</span>
    </button>
  `).join('');
}

function renderFretboard() {
  const shape = state.shapes[state.selectedShapeId];
  elements.activeShapeName.textContent = shape?.name || 'Sem shape';
  const frets = Array.from({ length: 12 }, (_, index) => index + 1);
  elements.fretboard.innerHTML = `
    <div class="guitar-fret-grid-head">
      <span>Corda</span>
      ${frets.map(fretNumber => `<b>${fretNumber}</b>`).join('')}
    </div>
    ${state.instrument.strings.map(string => {
      const muted = shape?.muted.includes(string.string);
      const fret = shape?.positions.find(pos => pos.string === string.string)?.fret ?? 0;
      return `
        <div class="guitar-fret-grid-row">
          <button class="guitar-string-state ${muted ? 'muted' : ''}" data-toggle-string="${string.string}" type="button">
            <strong>${muted ? 'X' : fret === 0 ? 'O' : fret}</strong>
            <span>${string.note}${string.octave}</span>
          </button>
          ${frets.map(fretNumber => `
            <button class="guitar-fret-box ${fret === fretNumber && !muted ? 'active' : ''}" data-set-fret="${string.string}:${fretNumber}" type="button">
              <strong>${noteForStringFret(string.string, fretNumber)}</strong>
              <span>${fretNumber}</span>
            </button>
          `).join('')}
        </div>
      `;
    }).join('')}
  `;
}

function renderActionEditor() {
  const pattern = state.patterns[state.selectedPatternId];
  elements.activePatternName.textContent = pattern?.name || 'Sem padrão';
  if (!pattern) {
    elements.actionEditor.innerHTML = '';
    return;
  }
  const total = Math.max(1000, ...pattern.events.map(event => event.atMs + 220));
  elements.actionEditor.innerHTML = `
    <div class="guitar-action-strings">
      ${state.instrument.strings.map(string => `
        <button class="guitar-action-string" data-add-event-string="${string.string}" type="button">
          <span>${string.note}${string.octave}</span><i></i>
        </button>
      `).join('')}
    </div>
    <div class="guitar-action-events">
      ${pattern.events.map(event => {
        const string = event.strings[0] || 1;
        return `
          <button class="guitar-action-event ${event.id === state.selectedEventId ? 'active' : ''}" data-select-event="${event.id}" style="--x:${(event.atMs / total) * 100}%; --y:${((6 - string) / 6) * 100 + 8}%;" type="button">
            <strong>${event.strings.join('+')}</strong><span>${event.technique}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function renderActionEditorSimple() {
  const pattern = state.patterns[state.selectedPatternId];
  elements.activePatternName.textContent = pattern?.name || 'Sem padrão';
  if (!pattern) {
    elements.actionEditor.innerHTML = '';
    return;
  }
  if (!pattern.events.length) {
    pattern.events.push({ id: uid('evt'), atMs: 0, strings: [], velocity: 0.75, durationMs: 700, technique: 'normal' });
  }
  elements.actionEditor.innerHTML = `
    <div class="guitar-action-blocks">
      ${pattern.events.map((event, index) => {
        const previous = pattern.events[index - 1];
        const gap = previous ? Math.max(0, event.atMs - previous.atMs) : event.atMs;
        return `
          <article class="guitar-action-block ${event.id === state.selectedEventId ? 'active' : ''}" data-select-event="${event.id}">
            <header>
              <span>TOQUE ${index + 1}</span>
              <strong>${gap}ms</strong>
            </header>
            <div class="guitar-action-boxes">
              ${state.instrument.strings.map(string => `
                <div class="guitar-action-string-card ${event.strings.includes(string.string) ? 'selected' : ''}">
                  <button class="guitar-action-box" data-toggle-event-string="${event.id}:${string.string}" type="button">
                    <strong>${string.string}</strong>
                    <span>${string.note}${string.octave}</span>
                  </button>
                  <label>
                    <span>delay</span>
                    <input data-edit-string-delay="${event.id}:${string.string}" type="number" min="0" max="3000" step="10" value="${event.stringDelays?.[string.string] ?? 0}" />
                  </label>
                </div>
              `).join('')}
            </div>
            <footer>${event.strings.length ? `Ordem ${event.strings.join(' → ')}` : 'Selecione as cordas'}</footer>
          </article>
        `;
      }).join('')}
      <button class="guitar-add-action-block" data-add-action-block type="button">
        <span>+</span>
        <strong>NOVO BLOCO</strong>
      </button>
    </div>
    <aside class="guitar-action-gap-panel">
      <header>
        <span>DISTÂNCIA</span>
        <strong>ENTRE BLOCOS</strong>
      </header>
      ${pattern.events.map((event, index) => {
        const previous = pattern.events[index - 1];
        const gap = previous ? Math.max(0, event.atMs - previous.atMs) : event.atMs;
        return `
          <button class="guitar-gap-row ${event.id === state.selectedEventId ? 'active' : ''}" data-select-event="${event.id}" type="button">
            <span>${index === 0 ? 'INÍCIO' : `BLOCO ${index} → ${index + 1}`}</span>
            <strong>${gap}ms</strong>
          </button>
        `;
      }).join('')}
    </aside>
  `;
}

function blockLabel(block, track) {
  return track === 'leftHandTrack'
    ? state.shapes[block.shapeId]?.name || block.shapeId
    : state.patterns[block.patternId]?.name || block.patternId;
}

function renderTimeline(playheadMs = Tone.Transport.seconds * 1000) {
  const width = TIMELINE_LABEL_WIDTH + TIMELINE_MS * PX_PER_MS;
  elements.timeline.innerHTML = `
    <div class="guitar-time-ruler" style="width:${width}px">
      ${Array.from({ length: 13 }, (_, index) => `<span style="left:${TIMELINE_LABEL_WIDTH + index * 1000 * PX_PER_MS}px">${index}s</span>`).join('')}
    </div>
    ${['leftHandTrack', 'rightHandTrack'].map(track => `
      <div class="guitar-track" data-track="${track}" style="width:${width}px">
        <strong>${track === 'leftHandTrack' ? 'MÃO ESQUERDA' : 'MÃO DIREITA'}</strong>
        ${state.timeline[track].map(block => `
          <article class="guitar-block ${block.id === state.selectedBlockId ? 'active' : ''}" data-block="${block.id}" data-track="${track}" style="left:${TIMELINE_LABEL_WIDTH + block.startMs * PX_PER_MS}px; width:${block.durationMs * PX_PER_MS}px">
            <button data-block-move="${block.id}" type="button">${blockLabel(block, track)}</button>
            <i data-block-resize-left="${block.id}"></i>
            <b data-block-resize-right="${block.id}"></b>
          </article>
        `).join('')}
      </div>
    `).join('')}
    <div class="guitar-playhead" style="transform:translateX(${TIMELINE_LABEL_WIDTH + playheadMs * PX_PER_MS}px)"></div>
  `;
}

function selectedBlock() {
  for (const track of ['leftHandTrack', 'rightHandTrack']) {
    const index = state.timeline[track].findIndex(block => block.id === state.selectedBlockId);
    if (index >= 0) return { track, index, block: state.timeline[track][index] };
  }
  return null;
}

function selectedEvent() {
  const pattern = state.patterns[state.selectedPatternId];
  const event = pattern?.events.find(item => item.id === state.selectedEventId);
  return event ? { pattern, event } : null;
}

function renderInspector() {
  const blockRef = selectedBlock();
  const eventRef = selectedEvent();
  elements.inspector.innerHTML = `
    ${blockRef ? `
      <div class="guitar-inspector-card">
        <span>BLOCO</span>
        <strong>${blockLabel(blockRef.block, blockRef.track)}</strong>
        <label>Início ms<input data-edit-block="startMs" type="number" value="${blockRef.block.startMs}" /></label>
        <label>Duração ms<input data-edit-block="durationMs" type="number" value="${blockRef.block.durationMs}" /></label>
        <label>${blockRef.track === 'leftHandTrack' ? 'Shape' : 'Padrão'}
          <select data-edit-block-ref>
            ${Object.values(blockRef.track === 'leftHandTrack' ? state.shapes : state.patterns).map(item => `<option value="${item.id}" ${(blockRef.block.shapeId || blockRef.block.patternId) === item.id ? 'selected' : ''}>${item.name}</option>`).join('')}
          </select>
        </label>
        <button class="guitar-danger-button" data-delete-block="${blockRef.block.id}" type="button">REMOVER BLOCO</button>
      </div>
    ` : ''}
    ${eventRef ? `
      <div class="guitar-inspector-card">
        <span>EVENTO</span>
        <strong>${eventRef.event.strings.join('+')} · ${eventRef.event.technique}</strong>
        <label>Tempo ms<input data-edit-event="atMs" type="number" value="${eventRef.event.atMs}" /></label>
        <label>Duração ms<input data-edit-event="durationMs" type="number" value="${eventRef.event.durationMs}" /></label>
        <label>Força<input data-edit-event="velocity" type="number" min="0.05" max="1" step="0.05" value="${eventRef.event.velocity}" /></label>
        <label>Técnica<select data-edit-event="technique">${TECHNIQUES.map(([id, label]) => `<option value="${id}" ${eventRef.event.technique === id ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
        <button class="guitar-danger-button" data-delete-event="${eventRef.event.id}" type="button">REMOVER EVENTO</button>
      </div>
    ` : '<p>Selecione um bloco ou evento.</p>'}
  `;
}

function render() {
  if (!elements.root) return;
  elements.bpm.value = state.bpm;
  elements.snap.value = state.snapMs;
  elements.play.textContent = isPlaying ? 'PAUSE' : 'PLAY';
  renderTuning();
  renderLibraries();
  renderFretboard();
  renderActionEditorSimple();
  renderTimeline();
  renderInspector();
}

function addShape() {
  const id = uid('shape');
  setState(next => {
    next.shapes[id] = { id, name: `Shape ${Object.keys(next.shapes).length + 1}`, positions: next.instrument.strings.map(s => ({ string: s.string, fret: 0 })), muted: [] };
    next.selectedShapeId = id;
  });
}

function addPattern() {
  const id = uid('pattern');
  setState(next => {
    next.patterns[id] = { id, name: `Padrão ${Object.keys(next.patterns).length + 1}`, events: [] };
    next.selectedPatternId = id;
    next.selectedEventId = null;
  });
}

function addEvent(stringNumber) {
  const pattern = state.patterns[state.selectedPatternId];
  if (!pattern) return;
  const atMs = snap((pattern.events.at(-1)?.atMs || 0) + 160);
  setState(next => {
    next.patterns[next.selectedPatternId].events.push({
      id: uid('evt'),
      atMs,
      strings: [stringNumber],
      velocity: 0.75,
      durationMs: 700,
      technique: 'normal',
    });
  });
}

function bindEvents() {
  elements.play.addEventListener('click', togglePlayback);
  elements.stop.addEventListener('click', stopPlayback);
  elements.bpm.addEventListener('change', () => setState(next => { next.bpm = Number(elements.bpm.value) || 96; }));
  elements.snap.addEventListener('change', () => setState(next => { next.snapMs = Number(elements.snap.value) || 100; }));
  elements.addShape.addEventListener('click', addShape);
  elements.addPattern.addEventListener('click', addPattern);

  elements.root.addEventListener('change', event => {
    const target = safeTarget(event.target);
    if (!target) return;
    const noteString = target.dataset.tuningNote;
    const octaveString = target.dataset.tuningOctave;
    if (noteString) setState(next => { next.instrument.strings.find(s => s.string === Number(noteString)).note = target.value; });
    if (octaveString) setState(next => { next.instrument.strings.find(s => s.string === Number(octaveString)).octave = Number(target.value) || 3; });

    const blockField = target.dataset.editBlock;
    if (blockField) setState(next => {
      const ref = selectedBlock();
      if (!ref) return;
      next.timeline[ref.track][ref.index][blockField] = Math.max(blockField === 'durationMs' ? 100 : 0, snap(Number(target.value) || 0));
    });
    if (target.dataset.editBlockRef !== undefined) setState(next => {
      const ref = selectedBlock();
      if (!ref) return;
      if (ref.track === 'leftHandTrack') next.timeline[ref.track][ref.index].shapeId = target.value;
      else next.timeline[ref.track][ref.index].patternId = target.value;
    });

    const eventField = target.dataset.editEvent;
    if (eventField) setState(next => {
      const item = next.patterns[next.selectedPatternId]?.events.find(ev => ev.id === next.selectedEventId);
      if (!item) return;
      item[eventField] = eventField === 'technique' ? target.value : Number(target.value);
      if (eventField === 'atMs') item.atMs = snap(item.atMs);
    });

    const stringDelay = target.dataset.editStringDelay;
    if (stringDelay) setState(next => {
      const [eventId, stringRaw] = stringDelay.split(':');
      const stringNumber = Number(stringRaw);
      const item = next.patterns[next.selectedPatternId]?.events.find(ev => ev.id === eventId);
      if (!item) return;
      item.stringDelays = item.stringDelays || {};
      item.stringDelays[stringNumber] = Math.max(0, snap(Number(target.value) || 0));
      next.selectedEventId = eventId;
    });
  });

  elements.root.addEventListener('click', event => {
    const target = safeTarget(event.target);
    if (!target) return;
    const shapeId = target.closest('[data-select-shape]')?.dataset.selectShape;
    if (shapeId) setState(next => { next.selectedShapeId = shapeId; });
    const patternId = target.closest('[data-select-pattern]')?.dataset.selectPattern;
    if (patternId) setState(next => { next.selectedPatternId = patternId; next.selectedEventId = null; });
    const eventId = target.closest('[data-select-event]')?.dataset.selectEvent;
    if (eventId) setState(next => { next.selectedEventId = eventId; });
    const addString = target.closest('[data-add-event-string]')?.dataset.addEventString;
    if (addString) addEvent(Number(addString));
    const addBlock = target.closest('[data-add-action-block]');
    if (addBlock) setState(next => {
      const pattern = next.patterns[next.selectedPatternId];
      if (!pattern) return;
      const previous = pattern.events.at(-1);
      const atMs = snap((previous?.atMs ?? 0) + 240);
      const id = uid('evt');
      pattern.events.push({ id, atMs, strings: [], velocity: 0.75, durationMs: 700, technique: 'normal' });
      next.selectedEventId = id;
    });
    const actionBox = target.closest('[data-toggle-event-string]')?.dataset.toggleEventString;
    if (actionBox) setState(next => {
      const [eventId, stringRaw] = actionBox.split(':');
      const stringNumber = Number(stringRaw);
      const pattern = next.patterns[next.selectedPatternId];
      const item = pattern?.events.find(ev => ev.id === eventId);
      if (!item) return;
      item.strings = item.strings.includes(stringNumber)
        ? item.strings.filter(value => value !== stringNumber)
        : [...item.strings, stringNumber];
      next.selectedEventId = eventId;
    });
    const deleteEvent = target.closest('[data-delete-event]')?.dataset.deleteEvent;
    if (deleteEvent) setState(next => {
      const pattern = next.patterns[next.selectedPatternId];
      if (!pattern) return;
      pattern.events = pattern.events.filter(item => item.id !== deleteEvent);
      if (next.selectedEventId === deleteEvent) next.selectedEventId = null;
    });
    const deleteBlock = target.closest('[data-delete-block]')?.dataset.deleteBlock;
    if (deleteBlock) setState(next => {
      for (const track of ['leftHandTrack', 'rightHandTrack']) {
        next.timeline[track] = next.timeline[track].filter(block => block.id !== deleteBlock);
      }
      if (next.selectedBlockId === deleteBlock) next.selectedBlockId = null;
    });
    const toggleString = target.closest('[data-toggle-string]')?.dataset.toggleString;
    if (toggleString) setState(next => {
      const shape = next.shapes[next.selectedShapeId];
      const stringNumber = Number(toggleString);
      if (shape.muted.includes(stringNumber)) {
        shape.muted = shape.muted.filter(item => item !== stringNumber);
        if (!shape.positions.some(pos => pos.string === stringNumber)) shape.positions.push({ string: stringNumber, fret: 0 });
      } else {
        shape.muted.push(stringNumber);
        shape.positions = shape.positions.filter(pos => pos.string !== stringNumber);
      }
    });
    const fretData = target.closest('[data-set-fret]')?.dataset.setFret;
    if (fretData) setState(next => {
      const [stringRaw, fretRaw] = fretData.split(':').map(Number);
      const shape = next.shapes[next.selectedShapeId];
      shape.muted = shape.muted.filter(item => item !== stringRaw);
      const pos = shape.positions.find(item => item.string === stringRaw);
      if (pos) pos.fret = pos.fret === fretRaw ? 0 : fretRaw;
      else shape.positions.push({ string: stringRaw, fret: fretRaw });
    });
    const blockElement = target.closest('[data-block]');
    if (blockElement) setState(next => { next.selectedBlockId = blockElement.dataset.block; });
  });

  elements.timeline.addEventListener('pointerdown', event => {
    const target = safeTarget(event.target);
    if (!target) return;
    const moveId = target.closest('[data-block-move]')?.dataset.blockMove;
    const leftId = target.closest('[data-block-resize-left]')?.dataset.blockResizeLeft;
    const rightId = target.closest('[data-block-resize-right]')?.dataset.blockResizeRight;
    const id = moveId || leftId || rightId;
    if (!id) return;
    const ref = selectedBlockById(id);
    if (!ref) return;
    event.preventDefault();
    dragState = { mode: moveId ? 'move' : leftId ? 'resizeLeft' : 'resizeRight', id, startX: event.clientX, initial: clone(ref.block), track: ref.track, index: ref.index };
    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', handleDragEnd, { once: true });
  });
}

function selectedBlockById(id) {
  for (const track of ['leftHandTrack', 'rightHandTrack']) {
    const index = state.timeline[track].findIndex(block => block.id === id);
    if (index >= 0) return { track, index, block: state.timeline[track][index] };
  }
  return null;
}

function handleDragMove(event) {
  if (!dragState) return;
  const deltaMs = snap((event.clientX - dragState.startX) / PX_PER_MS);
  mutateDuringDrag(next => {
    const block = next.timeline[dragState.track][dragState.index];
    if (dragState.mode === 'move') block.startMs = Math.max(0, dragState.initial.startMs + deltaMs);
    if (dragState.mode === 'resizeRight') block.durationMs = Math.max(100, dragState.initial.durationMs + deltaMs);
    if (dragState.mode === 'resizeLeft') {
      const end = dragState.initial.startMs + dragState.initial.durationMs;
      block.startMs = Math.max(0, Math.min(end - 100, dragState.initial.startMs + deltaMs));
      block.durationMs = end - block.startMs;
    }
  });
}

function handleDragEnd() {
  saveState();
  schedulePlayback();
  render();
  dragState = null;
  window.removeEventListener('pointermove', handleDragMove);
}

export function initGuitarComposer() {
  elements = {
    root: document.querySelector('#guitarWorkspace'),
    play: document.querySelector('#guitarPlay'),
    stop: document.querySelector('#guitarStop'),
    bpm: document.querySelector('#guitarBpm'),
    snap: document.querySelector('#guitarSnap'),
    time: document.querySelector('#guitarTime'),
    tuning: document.querySelector('#guitarTuning'),
    shapes: document.querySelector('#guitarShapes'),
    patterns: document.querySelector('#guitarPatterns'),
    addShape: document.querySelector('#guitarAddShape'),
    addPattern: document.querySelector('#guitarAddPattern'),
    fretboard: document.querySelector('#guitarFretboard'),
    actionEditor: document.querySelector('#guitarActionEditor'),
    timeline: document.querySelector('#guitarTimeline'),
    inspector: document.querySelector('#guitarInspector'),
    activeShapeName: document.querySelector('#guitarActiveShapeName'),
    activePatternName: document.querySelector('#guitarActivePatternName'),
  };
  if (!elements.root) return;
  bindEvents();
  schedulePlayback();
  render();
}
