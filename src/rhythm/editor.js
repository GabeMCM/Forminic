import { UI_SELECTORS } from '../ui/elements.tokens.js';
import { DOM_EVENTS_TOKENS, DOM_ELEMENTS_TOKENS } from '../tokens/api.tokens.js';
import { BEAT_TYPES, RHYTHM_VALUES } from '../audio/rhythm.tokens.js';
import { store } from '../state/state.js';
import { GLOBAL_TOKENS } from '../tokens/master.tokens.js';
import { RHYTHM_TOKENS } from '../audio/rhythm.tokens.js';

export function initRhythmEditor() {
  const rhythmDialog = document.querySelector(UI_SELECTORS.rhythmDialog);
  const rhythmForm = document.querySelector(UI_SELECTORS.rhythmForm);
  const closeBtn = document.querySelector(UI_SELECTORS.closeRhythmDialog);
  const cancelBtn = document.querySelector(UI_SELECTORS.cancelRhythm);
  const gridA = document.querySelector(UI_SELECTORS.rhythmGridA);
  const gridB = document.querySelector(UI_SELECTORS.rhythmGridB);
  const rhythmPresetSelect = document.querySelector(UI_SELECTORS.rhythmPresetSelect);
  const stageRhythmPreset = document.querySelector(UI_SELECTORS.stageRhythmPreset);
  const openBtn = document.querySelector(UI_SELECTORS.openRhythmEditor);

  if (!rhythmDialog || !gridA || !gridB) return;
  if (openBtn) openBtn.addEventListener(DOM_EVENTS_TOKENS.CLICK, () => rhythmDialog.showModal());

  function renderGrid(container) {
    container.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const step = document.createElement(DOM_ELEMENTS_TOKENS.DIV);
      step.className = UI_SELECTORS.rhythmStepClass;
      step.dataset.index = i;
      step.dataset.value = RHYTHM_VALUES.PAUSE;
      step.textContent = RHYTHM_VALUES.PAUSE;
      
      step.addEventListener(DOM_EVENTS_TOKENS.CLICK, () => {
        const currentIndex = BEAT_TYPES.findIndex(b => b.value === step.dataset.value);
        const nextIndex = (currentIndex + 1) % BEAT_TYPES.length;
        const nextBeat = BEAT_TYPES[nextIndex];
        step.dataset.value = nextBeat.value;
        step.textContent = nextBeat.value;
        step.className = `${UI_SELECTORS.rhythmStepClass} ${nextBeat.class}`;
      });
      container.appendChild(step);
    }
  }

  renderGrid(gridA);
  renderGrid(gridB);

  closeBtn.addEventListener(DOM_EVENTS_TOKENS.CLICK, () => rhythmDialog.close());
  cancelBtn.addEventListener(DOM_EVENTS_TOKENS.CLICK, () => rhythmDialog.close());

  rhythmForm.addEventListener(DOM_EVENTS_TOKENS.SUBMIT, (e) => {
    e.preventDefault();
    const nameInput = document.querySelector(UI_SELECTORS.rhythmNameInput);
    
    const getValues = (container) => Array.from(container.children).map(c => c.dataset.value);
    
    const customId = RHYTHM_TOKENS.PREFIX_CUSTOM + Date.now();
    const customPreset = {
      name: nameInput.value || RHYTHM_TOKENS.NAME_CUSTOM,
      bpm: 100,
      meter: RHYTHM_TOKENS.METER_4_4,
      source: RHYTHM_TOKENS.SOURCE_CUSTOM,
      a: getValues(gridA),
      b: getValues(gridB)
    };

    window.RHYTHM_PRESETS[customId] = customPreset;
    
    const option = `<option value="${customId}">${customPreset.name.toUpperCase()}</option>`;
    rhythmPresetSelect.insertAdjacentHTML(DOM_EVENTS_TOKENS.BEFORE_END, option);
    stageRhythmPreset.insertAdjacentHTML(DOM_EVENTS_TOKENS.BEFORE_END, option);
    
    rhythmPresetSelect.value = customId;
    rhythmPresetSelect.dispatchEvent(new Event(DOM_EVENTS_TOKENS.CHANGE));
    
    rhythmDialog.close();
  });
}
