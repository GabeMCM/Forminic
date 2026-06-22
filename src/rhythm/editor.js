// Rhythm Visual Editor Logic

export const BEAT_TYPES = [
  { value: '-', label: 'Pausa', class: 'beat-pause' },
  { value: 'D', label: 'Forte ↓', class: 'beat-strong-down' },
  { value: 'd', label: 'Leve ↓', class: 'beat-light-down' },
  { value: 'U', label: 'Forte ↑', class: 'beat-strong-up' },
  { value: 'u', label: 'Leve ↑', class: 'beat-light-up' },
  { value: 'x', label: 'Abafada', class: 'beat-muted' }
];

export function initRhythmEditor() {
  const rhythmDialog = document.querySelector("#rhythmDialog");
  const rhythmForm = document.querySelector("#rhythmForm");
  const closeBtn = document.querySelector("#closeRhythmDialog");
  const cancelBtn = document.querySelector("#cancelRhythm");
  const gridA = document.querySelector("#rhythmGridA");
  const gridB = document.querySelector("#rhythmGridB");
  const rhythmPresetSelect = document.querySelector("#rhythmPreset");
  const stageRhythmPreset = document.querySelector("#stageRhythmPreset");
  const openBtn = document.querySelector("#openRhythmEditor");

  if (!rhythmDialog || !gridA || !gridB) return;
  if (openBtn) openBtn.addEventListener("click", () => rhythmDialog.showModal());

  function renderGrid(container) {
    container.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const step = document.createElement("div");
      step.className = "rhythm-step";
      step.dataset.index = i;
      step.dataset.value = "-";
      step.textContent = "-";
      
      step.addEventListener("click", () => {
        const currentIndex = BEAT_TYPES.findIndex(b => b.value === step.dataset.value);
        const nextIndex = (currentIndex + 1) % BEAT_TYPES.length;
        const nextBeat = BEAT_TYPES[nextIndex];
        step.dataset.value = nextBeat.value;
        step.textContent = nextBeat.value;
        step.className = `rhythm-step ${nextBeat.class}`;
      });
      container.appendChild(step);
    }
  }

  renderGrid(gridA);
  renderGrid(gridB);

  closeBtn.addEventListener("click", () => rhythmDialog.close());
  cancelBtn.addEventListener("click", () => rhythmDialog.close());

  rhythmForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = document.querySelector("#rhythmNameInput");
    
    const getValues = (container) => Array.from(container.children).map(c => c.dataset.value);
    
    const customId = 'custom_' + Date.now();
    const customPreset = {
      name: nameInput.value || "Custom",
      bpm: 100,
      meter: "4/4",
      source: "CUSTOM",
      a: getValues(gridA),
      b: getValues(gridB)
    };

    window.RHYTHM_PRESETS[customId] = customPreset;
    
    const option = `<option value="${customId}">${customPreset.name.toUpperCase()}</option>`;
    rhythmPresetSelect.insertAdjacentHTML('beforeend', option);
    stageRhythmPreset.insertAdjacentHTML('beforeend', option);
    
    rhythmPresetSelect.value = customId;
    rhythmPresetSelect.dispatchEvent(new Event("change"));
    
    rhythmDialog.close();
  });
}
