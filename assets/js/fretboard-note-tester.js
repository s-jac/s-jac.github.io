const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TOTAL_FRETS = 24;
const OPEN_STRING_MIDI = {
  1: 64, // High E
  2: 59, // B
  3: 55, // G
  4: 50, // D
  5: 45, // A
  6: 40  // Low E
};

const STRING_LABELS = {
  1: '1 (High E)',
  2: '2 (B)',
  3: '3 (G)',
  4: '4 (D)',
  5: '5 (A)',
  6: '6 (Low E)'
};

const SWEEPS = [
  {
    name: '1 of 3 - Neck top to bottom',
    shortName: 'Top to Bottom',
    buildGroups: function(positions) {
      return buildKeyGroups(positions, function(position) {
        return position.fretNumber;
      }, 'asc');
    }
  },
  {
    name: '2 of 3 - Octave low to high',
    shortName: 'Low to High',
    buildGroups: function(positions) {
      return buildKeyGroups(positions, function(position) {
        return position.midi;
      }, 'asc');
    }
  },
  {
    name: '3 of 3 - Octave high to low',
    shortName: 'High to Low',
    buildGroups: function(positions) {
      return buildKeyGroups(positions, function(position) {
        return position.midi;
      }, 'desc');
    }
  }
];

let audioContext;
let toneSynth = null;
let toneDisabled = false;

const state = {
  currentNote: null,
  positions: [],
  sweepGroups: [],
  sweepIndex: 0,
  groupIndex: 0,
  groupRemaining: new Set(),
  acceptingInput: false
};

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function noteNameFromMidi(midiNote) {
  return CHROMATIC_NOTES[midiNote % 12];
}

function midiToFrequency(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

function midiToNoteWithOctave(midiNote) {
  const noteName = CHROMATIC_NOTES[midiNote % 12];
  const octave = Math.floor(midiNote / 12) - 1;
  return noteName + String(octave);
}

function getAudioEnabled() {
  const toggle = document.getElementById('soundToggle');
  return toggle && toggle.value === 'on';
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function hasTone() {
  return typeof window.Tone !== 'undefined' && !toneDisabled;
}

async function ensureToneSynth() {
  if (!hasTone()) {
    return false;
  }

  if (toneSynth) {
    return true;
  }

  try {
    toneSynth = new window.Tone.PluckSynth({
      attackNoise: 1.2,
      dampening: 3800,
      resonance: 0.86
    }).toDestination();
    return true;
  } catch (error) {
    toneDisabled = true;
    return false;
  }
}

async function playWithTone(midiNote) {
  const ready = await ensureToneSynth();
  if (!ready) {
    return false;
  }

  try {
    if (window.Tone.context.state !== 'running') {
      await window.Tone.start();
    }
    toneSynth.triggerAttack(midiToNoteWithOctave(midiNote));
    return true;
  } catch (error) {
    toneDisabled = true;
    toneSynth = null;
    return false;
  }
}

function playMidi(midiNote) {
  if (!getAudioEnabled()) {
    return;
  }

  playWithTone(midiNote).then(function(playedWithTone) {
    if (playedWithTone) {
      return;
    }

    ensureAudioContext();
    const now = audioContext.currentTime;
    const gain = audioContext.createGain();
    const oscillator = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(midiToFrequency(midiNote), now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.45, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.56);
  });
}

function setFeedback(message, toneClass) {
  const feedback = document.getElementById('feedbackMessage');
  if (!feedback) {
    return;
  }
  feedback.textContent = message;
  feedback.classList.remove('fretboard-feedback--good', 'fretboard-feedback--bad');
  if (toneClass) {
    feedback.classList.add(toneClass);
  }
}

function setProgress() {
  const progress = document.getElementById('progressMessage');
  if (!progress) {
    return;
  }

  if (!state.currentNote || !state.sweepGroups.length) {
    progress.textContent = '';
    return;
  }

  const currentSweep = SWEEPS[state.sweepIndex];
  const groups = state.sweepGroups[state.sweepIndex];
  const totalGroups = groups.length;
  const completedGroups = state.groupIndex;
  const remainingThisGroup = state.groupRemaining.size;
  progress.textContent = currentSweep.shortName +
    ' • Group ' + String(Math.min(totalGroups, completedGroups + 1)) +
    ' of ' + String(totalGroups) +
    ' • Remaining taps in group: ' + String(remainingThisGroup);
}

function setCardState(tone) {
  const card = document.getElementById('testerCard');
  if (!card) {
    return;
  }
  card.classList.remove('fretboard-tester-card--correct', 'fretboard-tester-card--wrong');
  if (tone) {
    card.classList.add(tone);
    window.setTimeout(function() {
      card.classList.remove('fretboard-tester-card--correct', 'fretboard-tester-card--wrong');
    }, tone === 'fretboard-tester-card--correct' ? 380 : 420);
  }
}

function getMaxFret() {
  const maxFretSelect = document.getElementById('maxFret');
  const value = maxFretSelect ? Number(maxFretSelect.value) : 12;
  return Math.min(TOTAL_FRETS, Math.max(0, value));
}

function buildPositionsForNote(noteName, maxFret) {
  const positions = [];

  for (let stringNumber = 1; stringNumber <= 6; stringNumber += 1) {
    for (let fretNumber = 0; fretNumber <= maxFret; fretNumber += 1) {
      const midi = OPEN_STRING_MIDI[stringNumber] + fretNumber;
      if (noteNameFromMidi(midi) === noteName) {
        positions.push({
          id: 's' + String(stringNumber) + 'f' + String(fretNumber),
          stringNumber: stringNumber,
          fretNumber: fretNumber,
          midi: midi
        });
      }
    }
  }

  return positions;
}

function buildKeyGroups(positions, keyGetter, direction) {
  const grouped = new Map();

  positions.forEach(function(position) {
    const key = keyGetter(position);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(position.id);
  });

  const keys = Array.from(grouped.keys()).sort(function(a, b) {
    return direction === 'desc' ? b - a : a - b;
  });

  return keys.map(function(key) {
    return grouped.get(key);
  });
}

function buildSweepGroups(positions) {
  return SWEEPS.map(function(sweep) {
    return sweep.buildGroups(positions);
  });
}

function markTappedButton(positionId) {
  const button = document.querySelector('.fretboard-grid__button[data-position-id="' + positionId + '"]');
  if (button) {
    button.classList.add('fretboard-grid__button--hit');
  }
}

function clearTappedButtons() {
  document.querySelectorAll('.fretboard-grid__button--hit').forEach(function(button) {
    button.classList.remove('fretboard-grid__button--hit');
  });
}

function setCurrentGroupRemaining() {
  const currentSweepGroups = state.sweepGroups[state.sweepIndex];
  const currentGroup = currentSweepGroups[state.groupIndex] || [];
  state.groupRemaining = new Set(currentGroup);
  setProgress();
}

function prepareSweep(index) {
  state.sweepIndex = index;
  state.groupIndex = 0;
  clearTappedButtons();
  setCurrentGroupRemaining();
  document.getElementById('sweepValue').textContent = SWEEPS[state.sweepIndex].name;
}

function getTargetReplayMidi() {
  const targetIndex = CHROMATIC_NOTES.indexOf(state.currentNote);
  return 48 + targetIndex;
}

function chooseNextNote(previousNote) {
  const options = CHROMATIC_NOTES.filter(function(note) {
    return note !== previousNote;
  });
  return randomItem(options);
}

function startNewRound() {
  const maxFret = getMaxFret();
  let note = chooseNextNote(state.currentNote);
  let positions = buildPositionsForNote(note, maxFret);

  // Safety fallback in case a very small fret range is selected.
  let guardCount = 0;
  while (positions.length === 0 && guardCount < 30) {
    note = chooseNextNote(note);
    positions = buildPositionsForNote(note, maxFret);
    guardCount += 1;
  }

  state.currentNote = note;
  state.positions = positions;
  state.sweepGroups = buildSweepGroups(positions);
  state.acceptingInput = true;

  document.getElementById('targetNoteValue').textContent = note;
  prepareSweep(0);
  setFeedback('Sweep 1: tap every ' + note + ' from top of neck to bottom.', null);
}

function handleSweepCompletion() {
  if (state.sweepIndex < SWEEPS.length - 1) {
    const nextSweepIndex = state.sweepIndex + 1;
    prepareSweep(nextSweepIndex);
    const nextSweep = SWEEPS[nextSweepIndex];
    setCardState('fretboard-tester-card--correct');
    setFeedback('Nice! Now sweep ' + nextSweep.shortName + '.', 'fretboard-feedback--good');
    return;
  }

  state.acceptingInput = false;
  setCardState('fretboard-tester-card--correct');
  setFeedback('Brilliant — all three sweeps complete. Keep it going!', 'fretboard-feedback--good');
  window.setTimeout(startNewRound, 900);
}

function handleWrongTap() {
  state.acceptingInput = false;
  setCardState('fretboard-tester-card--wrong');
  setFeedback('Not this one yet — next note coming up.', 'fretboard-feedback--bad');
  window.setTimeout(startNewRound, 900);
}

function handleTap(button) {
  if (!state.acceptingInput || !state.currentNote) {
    return;
  }

  const positionId = button.dataset.positionId;
  if (!positionId) {
    return;
  }

  const stringNumber = Number(button.dataset.string);
  const fretNumber = Number(button.dataset.fret);
  const midi = OPEN_STRING_MIDI[stringNumber] + fretNumber;
  const noteName = noteNameFromMidi(midi);
  playMidi(midi);

  if (button.classList.contains('fretboard-grid__button--hit')) {
    return;
  }

  const inCorrectGroup = state.groupRemaining.has(positionId);
  if (!inCorrectGroup || noteName !== state.currentNote) {
    handleWrongTap();
    return;
  }

  state.groupRemaining.delete(positionId);
  markTappedButton(positionId);

  if (state.groupRemaining.size > 0) {
    setFeedback('Yes! Keep going, same group.', 'fretboard-feedback--good');
    setCardState('fretboard-tester-card--correct');
    setProgress();
    return;
  }

  state.groupIndex += 1;
  const currentSweepGroups = state.sweepGroups[state.sweepIndex];
  if (state.groupIndex >= currentSweepGroups.length) {
    handleSweepCompletion();
    return;
  }

  setCurrentGroupRemaining();
  setCardState('fretboard-tester-card--correct');
  setFeedback('Great. Next group in this sweep.', 'fretboard-feedback--good');
}

function buildFretboardGrid() {
  const maxFret = getMaxFret();
  const grid = document.getElementById('fretboardGrid');
  if (!grid) {
    return;
  }

  grid.innerHTML = '';
  grid.style.setProperty('--fret-columns', String(maxFret + 1));

  const labels = document.createElement('div');
  labels.className = 'fretboard-grid__labels';
  const spacer = document.createElement('span');
  spacer.className = 'fretboard-grid__fret-label';
  spacer.textContent = '';
  labels.appendChild(spacer);

  for (let fret = 0; fret <= maxFret; fret += 1) {
    const label = document.createElement('span');
    label.className = 'fretboard-grid__fret-label';
    label.textContent = String(fret);
    labels.appendChild(label);
  }
  grid.appendChild(labels);

  for (let stringNumber = 1; stringNumber <= 6; stringNumber += 1) {
    const row = document.createElement('div');
    row.className = 'fretboard-grid__row';

    const stringLabel = document.createElement('span');
    stringLabel.className = 'fretboard-grid__string-label';
    stringLabel.textContent = STRING_LABELS[stringNumber];
    row.appendChild(stringLabel);

    for (let fretNumber = 0; fretNumber <= maxFret; fretNumber += 1) {
      const cell = document.createElement('div');
      cell.className = 'fretboard-grid__cell';

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fretboard-grid__button';
      button.dataset.string = String(stringNumber);
      button.dataset.fret = String(fretNumber);
      button.dataset.positionId = 's' + String(stringNumber) + 'f' + String(fretNumber);
      button.setAttribute('aria-label', 'String ' + STRING_LABELS[stringNumber] + ', fret ' + String(fretNumber));
      button.addEventListener('click', function() {
        handleTap(button);
      });

      cell.appendChild(button);
      row.appendChild(cell);
    }

    grid.appendChild(row);
  }
}

function addEventListeners() {
  document.getElementById('replayButton').addEventListener('click', function() {
    if (!state.currentNote) {
      return;
    }
    playMidi(getTargetReplayMidi());
  });

  document.getElementById('soundToggle').addEventListener('change', function() {
    if (getAudioEnabled() && state.currentNote) {
      playMidi(getTargetReplayMidi());
    }
  });

  document.getElementById('maxFret').addEventListener('change', function() {
    buildFretboardGrid();
    startNewRound();
  });
}

document.addEventListener('DOMContentLoaded', function() {
  buildFretboardGrid();
  addEventListeners();
  startNewRound();
});
