const CHROMATIC_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TOTAL_FRETS = 24;
const FRETBOARD_INLAYS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
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

let audioContext;
let toneSynth = null;
let toneDisabled = false;
let currentRound = null;
let canAnswer = true;

function midiToFrequency(midiNote) {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

function noteNameFromMidi(midiNote) {
  return CHROMATIC_NOTES[midiNote % 12];
}

function randomInt(min, maxInclusive) {
  return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
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

function midiToNoteWithOctave(midiNote) {
  const noteName = CHROMATIC_NOTES[midiNote % 12];
  const octave = Math.floor(midiNote / 12) - 1;
  return noteName + String(octave);
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

function playCurrentNote() {
  if (!currentRound || !getAudioEnabled()) {
    return;
  }

  playWithTone(currentRound.midi).then(function(playedWithTone) {
    if (playedWithTone) {
      return;
    }

    ensureAudioContext();

    const now = audioContext.currentTime;
    const gain = audioContext.createGain();
    const oscillator = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(currentRound.frequency, now);

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
  feedback.textContent = message;
  feedback.classList.remove('fretboard-feedback--good', 'fretboard-feedback--bad');
  if (toneClass) {
    feedback.classList.add(toneClass);
  }
}

function clearNoteHighlights() {
  document.querySelectorAll('.fretboard-note').forEach(function(button) {
    button.classList.remove('fretboard-note--correct', 'fretboard-note--wrong');
  });
}

function fretToPercent(fretNumber) {
  return (fretNumber / (TOTAL_FRETS + 1)) * 100;
}

function fretCenterToPercent(fretNumber) {
  return ((fretNumber + 0.5) / (TOTAL_FRETS + 1)) * 100;
}

function positionPercentForFret(fretNumber) {
  if (fretNumber <= 0) {
    return 1.2;
  }
  return fretCenterToPercent(fretNumber - 1);
}

function stringToPercent(stringNumber) {
  return ((stringNumber - 1) / 5) * 100;
}

function buildFretboardNeck() {
  const neck = document.getElementById('fretboardNeck');
  if (!neck) {
    return;
  }

  neck.innerHTML = '';

  const fretLabels = document.createElement('div');
  fretLabels.className = 'fretboard-neck__fret-labels';
  neck.appendChild(fretLabels);

  for (let fret = 1; fret <= TOTAL_FRETS; fret += 1) {
    const fretLabel = document.createElement('div');
    fretLabel.className = 'fretboard-neck__fret-label';
    fretLabel.style.left = positionPercentForFret(fret) + '%';
    fretLabel.textContent = String(fret);
    fretLabels.appendChild(fretLabel);
  }

  const boardWrap = document.createElement('div');
  boardWrap.className = 'fretboard-neck__board-wrap';
  neck.appendChild(boardWrap);

  const stringLabels = document.createElement('div');
  stringLabels.className = 'fretboard-neck__string-labels';
  boardWrap.appendChild(stringLabels);

  for (let stringNumber = 1; stringNumber <= 6; stringNumber += 1) {
    const stringLabel = document.createElement('div');
    stringLabel.className = 'fretboard-neck__string-label';
    stringLabel.textContent = String(stringNumber);
    stringLabels.appendChild(stringLabel);
  }

  const board = document.createElement('div');
  board.className = 'fretboard-neck__board';
  boardWrap.appendChild(board);

  const nut = document.createElement('div');
  nut.className = 'fretboard-neck__nut';
  board.appendChild(nut);

  for (let fret = 1; fret <= TOTAL_FRETS; fret += 1) {
    const fretLine = document.createElement('div');
    fretLine.className = 'fretboard-neck__fret-line';
    fretLine.style.left = fretToPercent(fret) + '%';
    board.appendChild(fretLine);
  }

  for (let stringNumber = 1; stringNumber <= 6; stringNumber += 1) {
    const stringLine = document.createElement('div');
    stringLine.className = 'fretboard-neck__string-line';
    stringLine.style.top = stringToPercent(stringNumber) + '%';
    stringLine.style.setProperty('--string-index', String(stringNumber));
    board.appendChild(stringLine);
  }

  FRETBOARD_INLAYS.forEach(function(fret) {
    const inlay = document.createElement('div');
    inlay.className = 'fretboard-neck__inlay';
    inlay.style.left = positionPercentForFret(fret) + '%';
    if (fret === 12 || fret === 24) {
      inlay.classList.add('fretboard-neck__inlay--double');
    }
    board.appendChild(inlay);
  });

  const rangeMask = document.createElement('div');
  rangeMask.className = 'fretboard-neck__range-mask';
  rangeMask.id = 'fretboardRangeMask';
  board.appendChild(rangeMask);

  const target = document.createElement('div');
  target.className = 'fretboard-neck__target';
  target.id = 'fretboardTarget';
  board.appendChild(target);
}

function setFretboardRange(maxFret) {
  const rangeMask = document.getElementById('fretboardRangeMask');
  if (!rangeMask) {
    return;
  }

  const activePercent = maxFret >= TOTAL_FRETS ? 100 : fretToPercent(maxFret);
  rangeMask.style.left = activePercent + '%';
}

function updateFretboardVisual(maxFret) {
  setFretboardRange(maxFret);

  if (!currentRound) {
    return;
  }

  const target = document.getElementById('fretboardTarget');
  if (target) {
    target.style.left = positionPercentForFret(currentRound.fretNumber) + '%';
    target.style.top = stringToPercent(currentRound.stringNumber) + '%';
  }
}

function nextRound() {
  clearNoteHighlights();

  const maxFretControl = document.getElementById('maxFret');
  const maxFret = Number(maxFretControl.value);
  const stringNumber = randomInt(1, 6);
  const fretNumber = randomInt(0, maxFret);
  const midi = OPEN_STRING_MIDI[stringNumber] + fretNumber;
  const note = noteNameFromMidi(midi);

  currentRound = {
    stringNumber: stringNumber,
    fretNumber: fretNumber,
    midi: midi,
    note: note,
    frequency: midiToFrequency(midi)
  };

  document.getElementById('stringValue').textContent = STRING_LABELS[stringNumber];
  document.getElementById('fretValue').textContent = String(fretNumber);

  const gameCard = document.getElementById('gameCard');
  gameCard.classList.remove('fretboard-card--correct', 'fretboard-card--wrong');

  canAnswer = true;
  setFeedback('Listen, then tap the matching note below.');
  updateFretboardVisual(maxFret);
  playCurrentNote();
}

function handleGuess(guessButton) {
  if (!currentRound || !canAnswer) {
    return;
  }

  const selectedNote = guessButton.dataset.note;
  const isCorrect = selectedNote === currentRound.note;
  const gameCard = document.getElementById('gameCard');
  clearNoteHighlights();

  if (isCorrect) {
    canAnswer = false;
    guessButton.classList.add('fretboard-note--correct');
    gameCard.classList.remove('fretboard-card--wrong');
    gameCard.classList.add('fretboard-card--correct');
    setFeedback('Nice one! That is correct.', 'fretboard-feedback--good');
    window.setTimeout(nextRound, 850);
  } else {
    canAnswer = true;
    guessButton.classList.add('fretboard-note--wrong');
    gameCard.classList.remove('fretboard-card--correct');
    gameCard.classList.add('fretboard-card--wrong');
    setFeedback('Not quite. Give it another go.', 'fretboard-feedback--bad');
    playCurrentNote();
    window.setTimeout(function() {
      gameCard.classList.remove('fretboard-card--wrong');
    }, 320);
  }
}

function addEventListeners() {
  document.querySelectorAll('.fretboard-note').forEach(function(button) {
    button.addEventListener('click', function() {
      handleGuess(button);
    });
  });

  document.getElementById('replayButton').addEventListener('click', function() {
    playCurrentNote();
  });

  document.getElementById('soundToggle').addEventListener('change', function() {
    if (getAudioEnabled()) {
      playCurrentNote();
    }
  });

  document.getElementById('maxFret').addEventListener('change', function() {
    nextRound();
  });
}

document.addEventListener('DOMContentLoaded', function() {
  buildFretboardNeck();
  addEventListeners();
  nextRound();
});
