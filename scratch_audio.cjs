const fs = require('fs');

let code = fs.readFileSync('src/app.js', 'utf8');

const replacement = `
  if (preset.engine === 'synth' || preset.engine === 'organ') {
    const oscillators = [];
    const freq = midiToFrequency(midi);
    
    if (preset.engine === 'synth' && state.soundSet === 'synthPad') {
      [0, 5, -5].forEach(detune => {
        const osc = state.audio.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        osc.detune.value = detune;
        osc.start(startAt);
        if (preset.duration !== Infinity) osc.stop(startAt + preset.duration);
        oscillators.push(osc);
      });
      filter.frequency.value = preset.brightness;
      filter.Q.value = 1.0;
      
      const humanVelocity = velocity * (0.94 + Math.random() * 0.1);
      const padLevel = ((0.78 - index * 0.025) / Math.sqrt(Math.max(1, total * 0.85))) * humanVelocity * 0.8;
      
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, padLevel), startAt + 0.4); 
      gain.gain.setTargetAtTime(padLevel * 0.8, startAt + 0.4, 1.5);
    } else if (preset.engine === 'synth' && state.soundSet === 'synthLead') {
      const osc1 = state.audio.createOscillator();
      osc1.type = 'square';
      osc1.frequency.value = freq;
      osc1.start(startAt);
      if (preset.duration !== Infinity) osc1.stop(startAt + preset.duration);
      oscillators.push(osc1);
      
      filter.frequency.value = preset.brightness;
      filter.Q.value = 2.5;
      
      const humanVelocity = velocity * (0.94 + Math.random() * 0.1);
      const leadLevel = ((0.78 - index * 0.025) / Math.sqrt(Math.max(1, total * 0.85))) * humanVelocity;
      
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, leadLevel * 1.2), startAt + 0.05);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, leadLevel * 0.8), startAt + 0.2);
    } else if (preset.engine === 'organ') {
      const harmonics = [
        { ratio: 0.5, amp: 1 },
        { ratio: 1.5, amp: 0.6 },
        { ratio: 1, amp: 1 },
        { ratio: 2, amp: 0.8 },
        { ratio: 3, amp: 0.4 },
        { ratio: 4, amp: 0.2 }
      ];
      harmonics.forEach(h => {
        const osc = state.audio.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq * h.ratio;
        osc.start(startAt);
        if (preset.duration !== Infinity) osc.stop(startAt + preset.duration);
        oscillators.push({ osc, amp: h.amp });
      });
      
      filter.frequency.value = preset.brightness;
      filter.Q.value = 0.5;
      
      const humanVelocity = velocity * (0.94 + Math.random() * 0.1);
      const organLevel = ((0.78 - index * 0.025) / Math.sqrt(Math.max(1, total * 0.85))) * humanVelocity;
      
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, organLevel), startAt + 0.02);
      gain.gain.setTargetAtTime(organLevel, startAt + 0.02, 0.1);
    }

    if (preset.engine === 'organ') {
      oscillators.forEach(h => {
        const hGain = state.audio.createGain();
        hGain.gain.value = h.amp;
        h.osc.connect(hGain).connect(filter);
      });
    } else {
      oscillators.forEach(osc => osc.connect(filter));
    }
    
    pan.pan.value = total > 1 ? (index / (total - 1) - 0.5) * 0.72 : 0;
    filter.connect(gain).connect(pan).connect(state.master);
    
    const firstOsc = preset.engine === 'organ' ? oscillators[0].osc : oscillators[0];
    const voice = { source: firstOsc, gain, midi, startedAt: startAt, isOsc: true, oscillators };
    state.voices.push(voice);
    
    setTimeout(() => {
        state.voices = state.voices.filter(item => item !== voice);
        if (!state.voices.length) {
            document.body.classList.remove('sounding');
            soundState.textContent = 'AGUARDANDO GESTO';
        }
    }, preset.duration === Infinity ? 60000 : preset.duration * 1000);
    
    return voice;
  }
`;

const pluckRegex = /(function pluckString\(midi, index, total, startAt, velocity = 1, muted = false\) \{[\s\S]*?const now = state\.audio\.currentTime;)/;

code = code.replace(pluckRegex, '$1\n  ' + replacement.replace(/\$/g, '$$$$'));

// Now we update dampVoices to also call .stop() on oscillators after the release
const dampRegex = /(gain\.gain\.setTargetAtTime\(0\.001, now, musicalRelease \/ 4\);\s*}\s*})/;
const dampReplacement = `$1
    if (source.stop && !source.isOsc) source.stop(now + musicalRelease + 0.2);
    if (source.isOsc) {
       source.oscillators.forEach(o => {
          const osc = o.osc || o;
          try { osc.stop(now + musicalRelease + 0.2); } catch(e){}
       });
    }
`;
code = code.replace(dampRegex, dampReplacement);

fs.writeFileSync('src/app.js', code);
console.log('Synth and Organ engines injected.');
