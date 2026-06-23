import { store } from '../state/state.js';
import { storage } from '../state/storage.js';
import { STORAGE_KEYS } from '../state/storage.tokens.js';
import { STATE_ACTION_TOKENS } from '../state/state.tokens.js';
import { rhythmEngine } from '../audio/rhythm.js';
import { RHYTHM_TOKENS } from '../audio/rhythm.tokens.js';
import { audioEngine } from '../audio/engine.js';
import { ENGINE_TOKENS } from '../audio/engine.tokens.js';

const GESTURES = [
  { value: '-', label: 'Pausa', short: '—', className: 'beat-pause' },
  { value: 'C', label: 'Acorde', short: 'Acorde', className: 'beat-chord' },
  { value: 'DS', label: 'Descida lenta', short: '↓ lento', className: 'beat-strong-down' },
  { value: 'DF', label: 'Descida rápida', short: '↓ rápido', className: 'beat-light-down' },
  { value: 'US', label: 'Subida lenta', short: '↑ lento', className: 'beat-strong-up' },
  { value: 'UF', label: 'Subida rápida', short: '↑ rápido', className: 'beat-light-up' },
  { value: 'A', label: 'Arpejo', short: 'Arpejo', className: 'beat-arpeggio' },
  { value: 'M', label: 'Abafado', short: 'Abafado', className: 'beat-muted' },
  { value: 'T', label: 'Staccato', short: 'Staccato', className: 'beat-staccato' },
  { value: 'H', label: 'Sustentar', short: 'Sustentar', className: 'beat-sustain' },
  { value: 'BA', label: 'Baixo + acorde', short: 'Baixo+A', className: 'beat-bass-chord' },
  { value: 'D', label: 'Legado: descida forte', short: '↓ forte', className: 'beat-strong-down' },
  { value: 'd', label: 'Legado: descida leve', short: '↓ leve', className: 'beat-light-down' },
  { value: 'U', label: 'Legado: subida forte', short: '↑ forte', className: 'beat-strong-up' },
  { value: 'u', label: 'Legado: subida leve', short: '↑ leve', className: 'beat-light-up' },
  { value: 'x', label: 'Legado: abafado', short: 'Abafado', className: 'beat-muted' },
];
const BASE_GESTURES = [
  { value: '-', label: 'Pausa', short: '—', className: 'beat-pause' },
  { value: 'B', label: 'Base forte', short: 'Base forte', className: 'beat-base' },
  { value: 'b', label: 'Base leve', short: 'Base leve', className: 'beat-light-down' },
  { value: 'S', label: 'Sustentar base', short: 'Sustentar', className: 'beat-sustain' },
];
const PULSE_VALUES = [
  { value: '1', label: '1 pulso' },
  { value: '2', label: '2 pulsos' },
  { value: '4', label: '4 pulsos' },
  { value: 'R', label: 'Repetir' },
];
let customRhythms = {};

const registry = () => globalThis.RHYTHM_PRESETS;
const gestureFor = (value, base = false) => (base ? BASE_GESTURES : GESTURES).find(item => item.value === value) || GESTURES[0];
const pulseFor = value => PULSE_VALUES.find(item => item.value === value) || PULSE_VALUES[0];
const editorKeys = new Set(['a', 'd', 'w', 's', 'q', 'e']);

export function initRhythmEditor() {
  const form = document.querySelector('#rhythmForm');
  const gridA = document.querySelector('#rhythmGridA');
  const gridB = document.querySelector('#rhythmGridB');
  const gridDuration = document.querySelector('#rhythmGridDuration');
  const library = document.querySelector('#rhythmLibrary');
  const baseLibrary = document.querySelector('#baseLibrary');
  if (!form || !gridA || !gridB || !gridDuration || !library || !baseLibrary) return;

  const nameInput = document.querySelector('#rhythmNameInput');
  const bpmInput = document.querySelector('#rhythmBpmInput');
  const stepsInput = document.querySelector('#rhythmStepsInput');
  const pulseInput = document.querySelector('#rhythmPulseInput');
  const modeInput = document.querySelector('#rhythmModeInput');
  const typeInput = document.querySelector('#rhythmTypeInput');
  const eventPosition = document.querySelector('#rhythmEventPosition');
  const eventVelocity = document.querySelector('#rhythmEventVelocity');
  let selectedIndex = 0;
  let selectedTrack = 'rhythm';
  let previewTimer = null;
  let previewPlaying = false;
  let loadedPresetId = null;

  customRhythms = storage.getJSON(STORAGE_KEYS.CUSTOM_RHYTHMS, {}) || {};
  Object.assign(registry(), customRhythms);
  const rhythmSelects = [document.querySelector('#rhythmPreset'), document.querySelector('#stageRhythmPreset')].filter(Boolean);
  const baseSelects = [document.querySelector('#basePreset'), document.querySelector('#stageBasePreset')].filter(Boolean);
  rhythmSelects.forEach(select => { select.innerHTML = ''; });
  baseSelects.forEach(select => { select.innerHTML = '<option value="">SEM BASE PROGRAMADA</option>'; });

  function stepMarkup(value, index, base = false) {
    const gesture = gestureFor(value, base);
    return `<button class="rhythm-step ${gesture.className}" data-index="${index}" data-value="${value}" type="button"><small>${index + 1}</small><strong>${gesture.short}</strong></button>`;
  }

  function buildTrack(container, count, values, base = false) {
    container.style.setProperty('--steps', count);
    container.innerHTML = Array.from({ length: count }, (_, index) => stepMarkup(values?.[index] || '-', index, base)).join('');
  }

  function buildDurations(count, values) {
    gridDuration.style.setProperty('--steps', count);
    gridDuration.innerHTML = Array.from({ length: count }, (_, index) => {
      const pulse = pulseFor(values?.[index] || '1');
      return `<button class="rhythm-step" data-index="${index}" data-value="${pulse.value}" type="button"><small>${index + 1}</small><strong>${pulse.label}</strong></button>`;
    }).join('');
  }

  function selectEvent(index, track = 'rhythm') {
    selectedIndex = index;
    selectedTrack = track;
    const container = track === 'pulse' ? gridDuration : track === 'base' ? gridB : gridA;
    const step = container.querySelector(`[data-index="${index}"]`);
    [gridA, gridB, gridDuration].forEach(trackContainer => {
      trackContainer.querySelectorAll('.rhythm-step.selected').forEach(item => item.classList.remove('selected'));
    });
    step?.classList.add('selected');
    eventPosition.textContent = `PULSO ${index + 1} · ${track === 'base' ? 'BASE' : 'ACORDE'}`;
    eventPosition.textContent = `PULSO ${index + 1} · ${track === 'pulse' ? 'DURAÇÃO' : track === 'base' ? 'BASE' : 'ACORDE'}`;
    eventVelocity.value = step?.dataset.velocity || (step?.dataset.value === 'D' || step?.dataset.value === 'B' ? 100 : 72);
  }

  function previewGesture(value, velocity = 72) {
    if (value === '-') return;
    rhythmEngine.rhythmEvent(value, null, velocity / 100);
    window.setTimeout(() => audioEngine.dampRecentVoices(.4, .32), 180);
  }

  function cycleGesture(step, base = false, direction = 1) {
    const gestures = base ? BASE_GESTURES : GESTURES;
    const current = gestures.findIndex(item => item.value === step.dataset.value);
    const next = gestures[(Math.max(0, current) + direction + gestures.length) % gestures.length];
    step.dataset.value = next.value;
    step.dataset.velocity = next.value === next.value.toUpperCase() && next.value !== '-' ? 100 : 72;
    step.className = `rhythm-step ${next.className} selected`;
    step.innerHTML = `<small>${Number(step.dataset.index) + 1}</small><strong>${next.short}</strong>`;
    selectEvent(Number(step.dataset.index), base ? 'base' : 'rhythm');
    if (!base) previewGesture(next.value, Number(step.dataset.velocity));
  }

  function cyclePulse(step, direction = 1) {
    const current = PULSE_VALUES.findIndex(item => item.value === step.dataset.value);
    const next = PULSE_VALUES[(Math.max(0, current) + direction + PULSE_VALUES.length) % PULSE_VALUES.length];
    step.dataset.value = next.value;
    step.innerHTML = `<small>${Number(step.dataset.index) + 1}</small><strong>${next.label}</strong>`;
    selectEvent(Number(step.dataset.index), 'pulse');
  }

  function updateSelectedVelocity() {
    const container = selectedTrack === 'base' ? gridB : gridA;
    const step = container.querySelector(`[data-index="${selectedIndex}"]`);
    if (!step) return;
    step.dataset.velocity = eventVelocity.value;
  }

  function selectedContainer() {
    if (selectedTrack === 'pulse') return gridDuration;
    return selectedTrack === 'base' ? gridB : gridA;
  }

  function clearSelectedEvent() {
    const step = selectedContainer().querySelector(`[data-index="${selectedIndex}"]`);
    if (!step) return;
    if (selectedTrack === 'pulse') {
      const pulse = pulseFor('1');
      step.dataset.value = pulse.value;
      step.innerHTML = `<small>${selectedIndex + 1}</small><strong>${pulse.label}</strong>`;
      selectEvent(selectedIndex, 'pulse');
      return;
    }
    const gesture = gestureFor('-', selectedTrack === 'base');
    step.dataset.value = gesture.value;
    step.dataset.velocity = 72;
    step.className = `rhythm-step ${gesture.className} selected`;
    step.innerHTML = `<small>${selectedIndex + 1}</small><strong>${gesture.short}</strong>`;
    selectEvent(selectedIndex, selectedTrack);
  }

  function copyPreviousIntoSelected() {
    if (selectedIndex <= 0) return;
    const container = selectedContainer();
    const current = container.querySelector(`[data-index="${selectedIndex}"]`);
    const previous = container.querySelector(`[data-index="${selectedIndex - 1}"]`);
    if (!current || !previous) return;
    current.dataset.value = previous.dataset.value;
    current.dataset.velocity = previous.dataset.velocity || current.dataset.velocity || 72;
    current.className = `${previous.className.replace(/\bselected\b/g, '').trim()} selected`;
    current.innerHTML = previous.innerHTML.replace(/<small>.*?<\/small>/, `<small>${selectedIndex + 1}</small>`);
    selectEvent(selectedIndex, selectedTrack);
    if (selectedTrack !== 'pulse') previewGesture(current.dataset.value, Number(current.dataset.velocity) || 72);
  }

  function adjustSelectedIntensity(direction) {
    if (selectedTrack === 'pulse') return;
    const step = selectedContainer().querySelector(`[data-index="${selectedIndex}"]`);
    if (!step) return;
    const next = Math.max(30, Math.min(100, (Number(step.dataset.velocity) || Number(eventVelocity.value) || 72) + direction * 5));
    step.dataset.velocity = next;
    eventVelocity.value = next;
  }

  function changeSelectedValue(direction) {
    const step = selectedContainer().querySelector(`[data-index="${selectedIndex}"]`);
    if (!step) return;
    if (selectedTrack === 'pulse') cyclePulse(step, direction);
    else cycleGesture(step, selectedTrack === 'base', direction);
  }

  function resetEditor() {
    loadedPresetId = null;
    nameInput.value = '';
    bpmInput.value = 100;
    stepsInput.value = 16;
    pulseInput.value = .25;
    modeInput.value = 'neutral';
    typeInput.value = 'rhythm';
    buildTrack(gridA, 16);
    buildTrack(gridB, 16, null, true);
    buildDurations(16);
    selectEvent(0);
  }

  function loadPreset(id) {
    const preset = registry()[id];
    if (!preset || preset.manual) return;
    loadedPresetId = id;
    nameInput.value = preset.name || '';
    bpmInput.value = preset.bpm || 100;
    stepsInput.value = preset.steps || preset.a?.length || 16;
    pulseInput.value = preset.pulse || .25;
    typeInput.value = preset.type === 'base' ? 'base' : 'rhythm';
    modeInput.value = typeInput.value === 'base' ? 'programmedBase' : preset.mode || 'neutral';
    modeInput.disabled = typeInput.value === 'base';
    buildTrack(gridA, Number(stepsInput.value), preset.a || []);
    buildTrack(gridB, Number(stepsInput.value), preset.b || [], true);
    buildDurations(Number(stepsInput.value), preset.durations || []);
    [...gridA.children].forEach((item, index) => { item.dataset.velocity = preset.velocities?.[index] || 72; });
    [...gridB.children].forEach((item, index) => { item.dataset.velocity = preset.baseVelocities?.[index] || 72; });
    selectEvent(0);
    store.dispatch(preset.type === 'base' ? STATE_ACTION_TOKENS.SET_BASE_PRESET : STATE_ACTION_TOKENS.SET_RHYTHM_PRESET, id);
    if (preset.type !== 'base') store.dispatch(STATE_ACTION_TOKENS.SET_TEMPO, preset.bpm || 100);
  }

  function refreshSelectors() {
    rhythmSelects.forEach(select => { select.innerHTML = ''; });
    baseSelects.forEach(select => { select.innerHTML = '<option value="">SEM BASE PROGRAMADA</option>'; });
    Object.entries(registry()).forEach(([id, preset]) => {
      if (preset.manual) return;
      const targets = preset.type === 'base' ? baseSelects : rhythmSelects;
      targets.forEach(select => select.insertAdjacentHTML('beforeend', `<option value="${id}">${preset.name.toUpperCase()}</option>`));
    });
    rhythmSelects.forEach(select => { select.value = store.state.rhythmPreset; });
    baseSelects.forEach(select => { select.value = store.state.basePreset; });
  }

  function listMarkup(entries, base = false) {
    return entries.map(([id, preset]) => `
      <article class="rhythm-list-item ${(!base && store.state.rhythmPreset === id) || (base && store.state.basePreset === id) ? 'active' : ''}">
        <button data-rhythm-select="${id}" type="button"><strong>${preset.name}</strong><span>${preset.bpm} BPM · ${preset.steps || preset.a?.length || 0} pulsos</span></button>
        ${preset.source === RHYTHM_TOKENS.SOURCE_CUSTOM ? `<button data-rhythm-delete="${id}" type="button" aria-label="Excluir ${preset.name}">×</button>` : ''}
      </article>
    `).join('');
  }

  function renderLibraries() {
    const entries = Object.entries(registry()).filter(([, preset]) => !preset.manual);
    library.innerHTML = listMarkup(entries.filter(([, preset]) => preset.type !== 'base'));
    baseLibrary.innerHTML = listMarkup(entries.filter(([, preset]) => preset.type === 'base'), true) || '<p class="rhythm-list-empty">Nenhuma base criada.</p>';
    refreshSelectors();
  }

  [gridA, gridB].forEach((container, trackIndex) => container.addEventListener('click', event => {
    const step = event.target.closest('.rhythm-step');
    if (step) selectEvent(Number(step.dataset.index), trackIndex ? 'base' : 'rhythm');
  }));
  gridDuration.addEventListener('click', event => {
    const step = event.target.closest('.rhythm-step');
    if (step) selectEvent(Number(step.dataset.index), 'pulse');
  });
  eventVelocity.addEventListener('input', updateSelectedVelocity);
  document.querySelector('#clearRhythmEvent').addEventListener('click', clearSelectedEvent);
  document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (!editorKeys.has(key) || store.state.workspace !== 'rhythm') return;
    if (event.target.closest('input, select, textarea')) return;
    event.preventDefault();
    if (key === 'a') changeSelectedValue(-1);
    if (key === 'd') changeSelectedValue(1);
    if (key === 'w') adjustSelectedIntensity(1);
    if (key === 's') adjustSelectedIntensity(-1);
    if (key === 'q') clearSelectedEvent();
    if (key === 'e') copyPreviousIntoSelected();
  });
  stepsInput.addEventListener('change', () => {
    const count = Math.max(1, Math.min(64, Number(stepsInput.value) || 16));
    buildTrack(gridA, count, [...gridA.children].map(item => item.dataset.value));
    buildTrack(gridB, count, [...gridB.children].map(item => item.dataset.value), true);
    buildDurations(count, [...gridDuration.children].map(item => item.dataset.value));
    selectEvent(Math.min(selectedIndex, count - 1), selectedTrack);
  });
  typeInput.addEventListener('change', () => {
    modeInput.value = typeInput.value === 'base' ? 'programmedBase' : 'neutral';
    modeInput.disabled = typeInput.value === 'base';
  });
  document.querySelector('#newRhythmButton').addEventListener('click', resetEditor);
  document.querySelector('#openRhythmEditor')?.addEventListener('click', () => store.dispatch(STATE_ACTION_TOKENS.SET_WORKSPACE, 'rhythm'));

  form.addEventListener('submit', event => {
    event.preventDefault();
    const sourcePreset = loadedPresetId ? registry()[loadedPresetId] : null;
    const id = sourcePreset?.source === RHYTHM_TOKENS.SOURCE_CUSTOM ? loadedPresetId : `${RHYTHM_TOKENS.PREFIX_CUSTOM}${Date.now()}`;
    const preset = {
      name: nameInput.value.trim() || RHYTHM_TOKENS.NAME_CUSTOM,
      type: typeInput.value,
      bpm: Math.max(30, Math.min(300, Number(bpmInput.value) || 100)),
      meter: RHYTHM_TOKENS.METER_FREE,
      source: RHYTHM_TOKENS.SOURCE_CUSTOM,
      mode: typeInput.value === 'base' ? 'programmedBase' : modeInput.value,
      steps: gridA.children.length,
      pulse: Math.max(.125, Number(pulseInput.value) || .25),
      a: [...gridA.children].map(item => item.dataset.value),
      b: [...gridB.children].map(item => item.dataset.value),
      durations: [...gridDuration.children].map(item => item.dataset.value),
      velocities: [...gridA.children].map(item => Number(item.dataset.velocity) || 72),
      baseVelocities: [...gridB.children].map(item => Number(item.dataset.velocity) || 72),
    };
    customRhythms[id] = preset;
    registry()[id] = preset;
    storage.setJSON(STORAGE_KEYS.CUSTOM_RHYTHMS, customRhythms);
    store.dispatch(typeInput.value === 'base' ? STATE_ACTION_TOKENS.SET_BASE_PRESET : STATE_ACTION_TOKENS.SET_RHYTHM_PRESET, id);
    if (typeInput.value !== 'base') store.dispatch(STATE_ACTION_TOKENS.SET_TEMPO, preset.bpm);
    renderLibraries();
    resetEditor();
  });

  document.querySelector('.rhythm-libraries').addEventListener('click', event => {
    const select = event.target.closest('[data-rhythm-select]');
    const remove = event.target.closest('[data-rhythm-delete]');
    if (select) {
      const id = select.dataset.rhythmSelect;
      rhythmEngine.stopRhythm();
      loadPreset(id);
      renderLibraries();
    }
    if (remove) {
      const id = remove.dataset.rhythmDelete;
      delete customRhythms[id];
      delete registry()[id];
      storage.setJSON(STORAGE_KEYS.CUSTOM_RHYTHMS, customRhythms);
      renderLibraries();
    }
  });

  function stopPreview() {
    previewPlaying = false;
    window.clearTimeout(previewTimer);
    previewTimer = null;
    document.querySelector('#previewRhythmButton').classList.remove('active');
    document.querySelector('#previewRhythmButton strong').textContent = 'OUVIR CONSTRUÇÃO';
    document.querySelector('#previewRhythmButton span').textContent = '▶';
    audioEngine.dampVoices(.28);
  }

  function startPreview() {
    if (previewPlaying) {
      stopPreview();
      return;
    }
    audioEngine.init();
    previewPlaying = true;
    const button = document.querySelector('#previewRhythmButton');
    button.classList.add('active');
    button.querySelector('strong').textContent = 'PARAR PRÉVIA';
    button.querySelector('span').textContent = '■';
    const pulseMs = 60000 / Math.max(30, Number(bpmInput.value) || 100) * Math.max(.125, Number(pulseInput.value) || .25);
    let stepIndex = 0;
    const playStep = () => {
      if (!previewPlaying) return;
      const rhythmStep = gridA.children[stepIndex];
      const baseStep = gridB.children[stepIndex];
      previewGesture(rhythmStep.dataset.value, Number(rhythmStep.dataset.velocity) || 72);
      if (typeInput.value === 'base' && baseStep.dataset.value !== '-') {
        audioEngine.previewRhythmGesture(
          ENGINE_TOKENS.STRUM_DOWN,
          baseStep.dataset.value === 'B' ? .82 : .58
        );
      }
      [gridA, gridB, gridDuration].forEach(track => {
        [...track.children].forEach(item => item.classList.toggle('playing', Number(item.dataset.index) === stepIndex));
      });
      stepIndex = (stepIndex + 1) % gridA.children.length;
      previewTimer = window.setTimeout(playStep, pulseMs);
    };
    playStep();
  }

  document.querySelector('#previewRhythmButton').addEventListener('click', startPreview);

  rhythmSelects.forEach(select => select.addEventListener('change', () => {
    rhythmSelects.forEach(peer => { peer.value = select.value; });
    rhythmEngine.stopRhythm();
    loadPreset(select.value);
  }));
  baseSelects.forEach(select => select.addEventListener('change', () => {
    baseSelects.forEach(peer => { peer.value = select.value; });
    store.dispatch(STATE_ACTION_TOKENS.SET_BASE_PRESET, select.value);
  }));

  resetEditor();
  renderLibraries();
}
