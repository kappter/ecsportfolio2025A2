const timeline = document.getElementById('timeline');
const currentBlockDisplay = document.getElementById('current-block-display');
const songTitleInput = document.getElementById('song-title-input');
let currentSongName = '(I Can’t Get No) Satisfaction';
let selectedBlock = null;
let isPlaying = false;
let playInterval;

const validTimeSignatures = ['4/4', '3/4', '6/8', '5/4', '7/8', '12/8'];

function updateTitle(title) {
  currentSongName = title;
  document.getElementById('print-song-name').textContent = title;
}

// Sync title input with currentSongName
songTitleInput.addEventListener('input', (e) => {
  updateTitle(e.target.value || 'Untitled');
});

function toggleTheme() {
  const body = document.body;
  body.dataset.theme = body.dataset.theme === 'dark' ? 'light' : 'dark';
}

function toggleForm() {
  const formContent = document.getElementById('form-content');
  formContent.classList.toggle('expanded');
  document.getElementById('toggle-form-btn').textContent = 
    formContent.classList.contains('expanded') ? 'Hide Parameters' : 'Show Parameters';
}

function validateBlock(data) {
  if (!data.type) return 'Part type is required';
  if (!Number.isInteger(data.measures) || data.measures < 1) return 'Measures must be a positive integer';
  if (!data.tempo || data.tempo < 20 || data.tempo > 300) return 'Tempo must be between 20 and 300 BPM';
  if (!validTimeSignatures.includes(data.timeSignature)) return 'Invalid time signature';
  return null;
}

function addBlock() {
  const blockData = {
    type: document.getElementById('part-type').value,
    measures: parseInt(document.getElementById('measures').value),
    tempo: parseInt(document.getElementById('tempo').value),
    timeSignature: document.getElementById('time-signature').value,
    feel: document.getElementById('feel').value,
    lyrics: document.getElementById('lyrics').value,
    rootNote: document.getElementById('root-note').value,
    mode: document.getElementById('mode').value,
  };

  const error = validateBlock(blockData);
  if (error) {
    alert(error);
    return;
  }

  const block = document.createElement('div');
  block.classList.add('song-block', blockData.type);
  block.setAttribute('data-measures', blockData.measures);
  block.setAttribute('data-tempo', blockData.tempo);
  block.setAttribute('data-time-signature', blockData.timeSignature);
  block.setAttribute('data-feel', blockData.feel);
  block.setAttribute('data-lyrics', blockData.lyrics);
  block.setAttribute('data-root-note', blockData.rootNote);
  block.setAttribute('data-mode', blockData.mode);
  block.innerHTML = `
    <span class="label">${formatPart(blockData.type)}: ${blockData.timeSignature} ${blockData.measures}m<br>${abbreviateKey(blockData.rootNote)} ${blockData.mode} ${blockData.tempo}b ${blockData.feel}${blockData.lyrics ? '<br>-<br>' + truncateLyrics(blockData.lyrics) : ''}</span>
    <span class="tooltip">${blockData.lyrics || 'No lyrics'}</span>
    <span class="resize-handle"></span>
    <button class="delete-btn" onclick="deleteBlock(this.parentElement)">X</button>
  `;
  updateBlockSize(block);
  setupBlock(block);
  timeline.appendChild(block);
  calculateTimings();
}

function updateBlock() {
  if (!selectedBlock) {
    alert('Select a block to update');
    return;
  }

  const blockData = {
    type: document.getElementById('part-type').value,
    measures: parseInt(document.getElementById('measures').value),
    tempo: parseInt(document.getElementById('tempo').value),
    timeSignature: document.getElementById('time-signature').value,
    feel: document.getElementById('feel').value,
    lyrics: document.getElementById('lyrics').value,
    rootNote: document.getElementById('root-note').value,
    mode: document.getElementById('mode').value,
  };

  const error = validateBlock(blockData);
  if (error) {
    alert(error);
    return;
  }

  selectedBlock.className = `song-block ${blockData.type}`;
  selectedBlock.setAttribute('data-measures', blockData.measures);
  selectedBlock.setAttribute('data-tempo', blockData.tempo);
  selectedBlock.setAttribute('data-time-signature', blockData.timeSignature);
  selectedBlock.setAttribute('data-feel', blockData.feel);
  selectedBlock.setAttribute('data-lyrics', blockData.lyrics);
  selectedBlock.setAttribute('data-root-note', blockData.rootNote);
  selectedBlock.setAttribute('data-mode', blockData.mode);
  selectedBlock.querySelector('.label').innerHTML = `${formatPart(blockData.type)}: ${blockData.timeSignature} ${blockData.measures}m<br>${abbreviateKey(blockData.rootNote)} ${blockData.mode} ${blockData.tempo}b ${blockData.feel}${blockData.lyrics ? '<br>-<br>' + truncateLyrics(blockData.lyrics) : ''}`;
  selectedBlock.querySelector('.tooltip').textContent = blockData.lyrics || 'No lyrics';
  updateBlockSize(selectedBlock);
  calculateTimings();
}

function deleteBlock(block) {
  block.remove();
  clearSelection();
  calculateTimings();
}

function setupBlock(block) {
  block.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) return;
    if (selectedBlock) selectedBlock.classList.remove('selected');
    selectedBlock = block;
    block.classList.add('selected');
    populateForm(block);
  });

  const resizeHandle = block.querySelector('.resize-handle');
  resizeHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = block.offsetWidth;

    function onMouseMove(e) {
      const newWidth = Math.max(100, startWidth + (e.clientX - startX));
      block.style.width = `${newWidth}px`;
    }

    function onMouseUp() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

function populateForm(block) {
  document.getElementById('part-type').value = block.classList[1];
  document.getElementById('measures').value = block.getAttribute('data-measures');
  document.getElementById('tempo').value = block.getAttribute('data-tempo');
  document.getElementById('time-signature').value = block.getAttribute('data-time-signature');
  document.getElementById('feel').value = block.getAttribute('data-feel');
  document.getElementById('lyrics').value = block.getAttribute('data-lyrics');
  document.getElementById('root-note').value = block.getAttribute('data-root-note');
  document.getElementById('mode').value = block.getAttribute('data-mode');
}

function clearSelection() {
  if (selectedBlock) {
    selectedBlock.classList.remove('selected');
    selectedBlock = null;
  }
}

function updateBlockSize(block) {
  const measures = parseInt(block.getAttribute('data-measures'));
  const minWidth = 100;
  const widthPerMeasure = 10;
  block.style.width = `${Math.max(minWidth, measures * widthPerMeasure)}px`;
}

function formatPart(type) {
  return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function abbreviateKey(rootNote) {
  return rootNote.length > 1 ? rootNote.replace('#', '♯') : rootNote;
}

function truncateLyrics(lyrics) {
  return lyrics.length > 20 ? lyrics.substring(0, 20) + '...' : lyrics;
}

function calculateTimings() {
  let totalSeconds = 0;
  let totalBeats = 0;

  Array.from(timeline.children).forEach(block => {
    const measures = parseInt(block.getAttribute('data-measures'));
    const tempo = parseInt(block.getAttribute('data-tempo'));
    const timeSignature = block.getAttribute('data-time-signature');
    const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
    const beats = measures * beatsPerMeasure;
    totalBeats += beats;
    totalSeconds += (beats * 60) / tempo;
  });

  return { totalSeconds, totalBeats };
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function playSong() {
  if (isPlaying) return;
  isPlaying = true;
  let currentIndex = 0;
  const blocks = Array.from(timeline.children);

  if (blocks.length === 0) {
    isPlaying = false;
    return;
  }

  function playNextBlock() {
    if (currentIndex >= blocks.length) {
      stopSong();
      return;
    }

    const block = blocks[currentIndex];
    currentBlockDisplay.querySelector('.label').textContent = block.querySelector('.label').textContent;
    const measures = parseInt(block.getAttribute('data-measures'));
    const tempo = parseInt(block.getAttribute('data-tempo'));
    const timeSignature = block.getAttribute('data-time-signature');
    const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
    const duration = (measures * beatsPerMeasure * 60 * 1000) / tempo;

    currentIndex++;
    playInterval = setTimeout(playNextBlock, duration);
  }

  playNextBlock();
}

function pauseSong() {
  if (!isPlaying) return;
  clearTimeout(playInterval);
  isPlaying = false;
}

function stopSong() {
  clearTimeout(playInterval);
  isPlaying = false;
  currentBlockDisplay.querySelector('.label').textContent = 'No block playing';
}

function updateStyle(style) {
  Array.from(timeline.children).forEach(block => {
    block.classList.remove('vibrant', 'pastel', 'monochrome');
    if (style) block.classList.add(style);
  });
}

function loadSong(songName) {
  const songs = {
    'satisfaction': [
      { type: 'intro', measures: 4, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: '', rootNote: 'E', mode: 'Mixolydian' },
      { type: 'verse', measures: 8, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: 'I can’t get no satisfaction...', rootNote: 'E', mode: 'Mixolydian' },
      { type: 'chorus', measures: 8, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: 'I can’t get no...', rootNote: 'E', mode: 'Mixolydian' },
      { type: 'verse', measures: 8, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: 'When I’m drivin’ in my car...', rootNote: 'E', mode: 'Mixolydian' },
      { type: 'chorus', measures: 8, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: 'I can’t get no...', rootNote: 'E', mode: 'Mixolydian' },
      { type: 'outro', measures: 4, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: '', rootNote: 'E', mode: 'Mixolydian' }
    ],
    'pneuma': [
      { type: 'intro', measures: 6, tempo: 92, timeSignature: '6/8', feel: 'Progressive', lyrics: '', rootNote: 'F#', mode: 'Dorian' },
      { type: 'verse', measures: 8, tempo: 92, timeSignature: '6/8', feel: 'Progressive', lyrics: 'We are spirit bound to this flesh...', rootNote: 'F#', mode: 'Dorian' },
      { type: 'chorus', measures: 8, tempo: 92, timeSignature: '6/8', feel: 'Progressive', lyrics: 'Pneuma, reach beyond...', rootNote: 'F#', mode: 'Dorian' },
      { type: 'bridge', measures: 6, tempo: 92, timeSignature: '6/8', feel: 'Progressive', lyrics: '', rootNote: 'F#', mode: 'Dorian' },
      { type: 'outro', measures: 8, tempo: 92, timeSignature: '6/8', feel: 'Progressive', lyrics: 'Wake and breathe...', rootNote: 'F#', mode: 'Dorian' }
    ],
    'jambi': [
      { type: 'intro', measures: 4, tempo: 126, timeSignature: '7/8', feel: 'Heavy', lyrics: '', rootNote: 'D', mode: 'Phrygian' },
      { type: 'verse', measures: 8, tempo: 126, timeSignature: '7/8', feel: 'Heavy', lyrics: 'Woe to you, oh earth and sea...', rootNote: 'D', mode: 'Phrygian' },
      { type: 'chorus', measures: 8, tempo: 126, timeSignature: '7/8', feel: 'Heavy', lyrics: 'If I could wish it all away...', rootNote: 'D', mode: 'Phrygian' },
      { type: 'solo', measures: 6, tempo: 126, timeSignature: '7/8', feel: 'Heavy', lyrics: '', rootNote: 'D', mode: 'Phrygian' },
      { type: 'outro', measures: 4, tempo: 126, timeSignature: '7/8', feel: 'Heavy', lyrics: '', rootNote: 'D', mode: 'Phrygian' }
    ],
    'bohemian-rhapsody': [
      { type: 'intro', measures: 4, tempo: 72, timeSignature: '4/4', feel: 'Ballad', lyrics: 'Is this the real life...', rootNote: 'Bb', mode: 'Ionian' },
      { type: 'verse', measures: 8, tempo: 72, timeSignature: '4/4', feel: 'Ballad', lyrics: 'Mama, just killed a man...', rootNote: 'Bb', mode: 'Ionian' },
      { type: 'bridge', measures: 6, tempo: 84, timeSignature: '4/4', feel: 'Operatic', lyrics: 'Scaramouche, Scaramouche...', rootNote: 'F', mode: 'Ionian' },
      { type: 'chorus', measures: 8, tempo: 120, timeSignature: '4/4', feel: 'Rock', lyrics: 'Beelzebub has a devil...', rootNote: 'Eb', mode: 'Ionian' },
      { type: 'outro', measures: 4, tempo: 72, timeSignature: '4/4', feel: 'Ballad', lyrics: 'Nothing really matters...', rootNote: 'Bb', mode: 'Ionian' }
    ],
    'master-of-puppets': [
      { type: 'intro', measures: 6, tempo: 212, timeSignature: '4/4', feel: 'Thrash', lyrics: '', rootNote: 'E', mode: 'Phrygian' },
      { type: 'verse', measures: 8, tempo: 212, timeSignature: '4/4', feel: 'Thrash', lyrics: 'End of passion play...', rootNote: 'E', mode: 'Phrygian' },
      { type: 'chorus', measures: 8, tempo: 212, timeSignature: '4/4', feel: 'Thrash', lyrics: 'Master! Master!...', rootNote: 'E', mode: 'Phrygian' },
      { type: 'solo', measures: 6, tempo: 212, timeSignature: '4/4', feel: 'Thrash', lyrics: '', rootNote: 'E', mode: 'Phrygian' },
      { type: 'outro', measures: 4, tempo: 212, timeSignature: '4/4', feel: 'Thrash', lyrics: '', rootNote: 'E', mode: 'Phrygian' }
    ],
    'sweet-child-o-mine': [
      { type: 'intro', measures: 8, tempo: 125, timeSignature: '4/4', feel: 'Rock', lyrics: '', rootNote: 'D', mode: 'Mixolydian' },
      { type: 'verse', measures: 8, tempo: 125, timeSignature: '4/4', feel: 'Rock', lyrics: 'She’s got a smile...', rootNote: 'D', mode: 'Mixolydian' },
      { type: 'chorus', measures: 8, tempo: 125, timeSignature: '4/4', feel: 'Rock', lyrics: 'Oh, sweet child o’ mine...', rootNote: 'D', mode: 'Mixolydian' },
      { type: 'solo', measures: 12, tempo: 125, timeSignature: '4/4', feel: 'Rock', lyrics: '', rootNote: 'D', mode: 'Mixolydian' },
      { type: 'outro', measures: 4, tempo: 125, timeSignature: '4/4', feel: 'Rock', lyrics: 'Where do we go now...', rootNote: 'D', mode: 'Mixolydian' }
    ],
    'hotel-california': [
      { type: 'intro', measures: 8, tempo: 75, timeSignature: '4/4', feel: 'Rock', lyrics: '', rootNote: 'Bm', mode: 'Aeolian' },
      { type: 'verse', measures: 8, tempo: 75, timeSignature: '4/4', feel: 'Rock', lyrics: 'On a dark desert highway...', rootNote: 'Bm', mode: 'Aeolian' },
      { type: 'chorus', measures: 8, tempo: 75, timeSignature: '4/4', feel: 'Rock', lyrics: 'Welcome to the Hotel California...', rootNote: 'Bm', mode: 'Aeolian' },
      { type: 'solo', measures: 12, tempo: 75, timeSignature: '4/4', feel: 'Rock', lyrics: '', rootNote: 'Bm', mode: 'Aeolian' },
      { type: 'outro', measures: 4, tempo: 75, timeSignature: '4/4', feel: 'Rock', lyrics: '', rootNote: 'Bm', mode: 'Aeolian' }
    ],
    'stairway-to-heaven': [
      { type: 'intro', measures: 8, tempo: 82, timeSignature: '4/4', feel: 'Folk', lyrics: '', rootNote: 'Am', mode: 'Aeolian' },
      { type: 'verse', measures: 8, tempo: 82, timeSignature: '4/4', feel: 'Folk', lyrics: 'There’s a lady who’s sure...', rootNote: 'Am', mode: 'Aeolian' },
      { type: 'bridge', measures: 6, tempo: 82, timeSignature: '4/4', feel: 'Rock', lyrics: 'And as we wind on down the road...', rootNote: 'Am', mode: 'Aeolian' },
      { type: 'solo', measures: 8, tempo: 82, timeSignature: '4/4', feel: 'Rock', lyrics: '', rootNote: 'Am', mode: 'Aeolian' },
      { type: 'outro', measures: 4, tempo: 82, timeSignature: '4/4', feel: 'Rock', lyrics: 'And she’s buying a stairway...', rootNote: 'Am', mode: 'Aeolian' }
    ]
  };

  timeline.innerHTML = '';
  if (selectedBlock) clearSelection();
  updateTitle(songName === 'satisfaction' ? '(I Can’t Get No) Satisfaction' : formatPart(songName));
  songTitleInput.value = currentSongName;

  songs[songName].forEach(blockData => {
    const block = document.createElement('div');
    block.classList.add('song-block', blockData.type);
    block.setAttribute('data-measures', blockData.measures);
    block.setAttribute('data-tempo', blockData.tempo);
    block.setAttribute('data-time-signature', blockData.timeSignature);
    block.setAttribute('data-feel', blockData.feel);
    block.setAttribute('data-lyrics', blockData.lyrics);
    block.setAttribute('data-root-note', blockData.rootNote);
    block.setAttribute('data-mode', blockData.mode);
    block.innerHTML = `
      <span class="label">${formatPart(blockData.type)}: ${blockData.timeSignature} ${blockData.measures}m<br>${abbreviateKey(blockData.rootNote)} ${blockData.mode} ${blockData.tempo}b ${blockData.feel}${blockData.lyrics ? '<br>-<br>' + truncateLyrics(blockData.lyrics) : ''}</span>
      <span class="tooltip">${blockData.lyrics || 'No lyrics'}</span>
      <span class="resize-handle"></span>
      <button class="delete-btn" onclick="deleteBlock(this.parentElement)">X</button>
    `;
    updateBlockSize(block);
    setupBlock(block);
    timeline.appendChild(block);
  });

  calculateTimings();
}

function randomizeSong() {
  timeline.innerHTML = '';
  if (selectedBlock) clearSelection();

  const titleAdjectives = ['Cosmic', 'Silent', 'Electric', 'Fading', 'Raging', 'Dreamy', 'Wild', 'Mystic'];
  const titleNouns = ['Echo', 'Pulse', 'Wave', 'Night', 'Fire', 'Journey', 'Sky', 'Dream'];
  const randomAdj = titleAdjectives[Math.floor(Math.random() * titleAdjectives.length)];
  const randomNoun = titleNouns[Math.floor(Math.random() * titleNouns.length)];
  const newTitle = `${randomAdj} ${randomNoun}`;
  updateTitle(newTitle);
  songTitleInput.value = newTitle;

  const partTypes = [
    'intro', 'verse', 'refrain', 'pre-chorus', 'chorus', 'post-chorus', 'bridge', 'outro',
    'elision', 'solo', 'ad-lib', 'hook', 'interlude', 'breakdown', 'drop', 'coda',
    'modulation', 'tag', 'chorus-reprise', 'countermelody', 'instrumental-verse-chorus', 'false-ending'
  ];
  const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const modes = [
    'Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian',
    'Harmonic Minor', 'Melodic Minor', 'Blues Scale', 'Pentatonic Major', 'Pentatonic Minor', 'Whole Tone'
  ];
  const feels = [
    'Happiness', 'Sadness', 'Tension', 'Euphoria', 'Calmness', 'Anger', 'Mystical',
    'Rebellion', 'Triumph', 'Bliss', 'Frustration', 'Atmospheric', 'Trippy', 'Awakening'
  ];
  const possibleLyrics = [
    '', 'La la la, here we go again...', 'Feel the rhythm, let it flow...',
    'Shadows dancing in the moonlight...', 'Break free, let your spirit soar...', 'Echoes of a forgotten dream...'
  ];

  const numBlocks = Math.floor(Math.random() * (15 - 5 + 1)) + 5;

  for (let i = 0; i < numBlocks; i++) {
    const type = partTypes[Math.floor(Math.random() * partTypes.length)];
    const measures = Math.floor(Math.random() * (16 - 1 + 1)) + 1;
    const rootNote = rootNotes[Math.floor(Math.random() * rootNotes.length)];
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const tempo = Math.floor(Math.random() * (180 - 60 + 1)) + 60;
    const timeSignature = validTimeSignatures[Math.floor(Math.random() * validTimeSignatures.length)];
    const feel = feels[Math.floor(Math.random() * feels.length)];
    const lyrics = possibleLyrics[Math.floor(Math.random() * possibleLyrics.length)];

    const blockData = { type, measures, rootNote, mode, tempo, timeSignature, feel, lyrics };
    const error = validateBlock(blockData);
    if (error) {
      console.error(`Generated block failed validation: ${error}`);
      continue;
    }

    const block = document.createElement('div');
    block.classList.add('song-block', type);
    block.setAttribute('data-measures', measures);
    block.setAttribute('data-tempo', tempo);
    block.setAttribute('data-time-signature', timeSignature);
    block.setAttribute('data-feel', feel);
    block.setAttribute('data-lyrics', lyrics);
    block.setAttribute('data-root-note', rootNote);
    block.setAttribute('data-mode', mode);
    block.innerHTML = `
      <span class="label">${formatPart(type)}: ${timeSignature} ${measures}m<br>${abbreviateKey(rootNote)} ${mode} ${tempo}b ${feel}${lyrics ? '<br>-<br>' + truncateLyrics(lyrics) : ''}</span>
      <span class="tooltip">${lyrics || 'No lyrics'}</span>
      <span class="resize-handle"></span>
      <button class="delete-btn" onclick="deleteBlock(this.parentElement)">X</button>
    `;
    updateBlockSize(block);
    setupBlock(block);
    timeline.appendChild(block);

    const styleDropdown = document.getElementById('style-dropdown');
    if (styleDropdown.value) block.classList.add(styleDropdown.value);
  }

  calculateTimings();
}

function printSong() {
  const { totalSeconds, totalBeats } = calculateTimings();
  const blockCount = timeline.children.length;
  const originalContent = currentBlockDisplay.innerHTML;

  currentBlockDisplay.innerHTML = `
    <span class="label">
      Total Duration: ${formatDuration(totalSeconds)} | Beats: ${totalBeats} | Blocks: ${blockCount}<br>
      © 2025 SongMaker by kappter. All rights reserved.
    </span>
  `;

  window.print();
  currentBlockDisplay.innerHTML = originalContent;
}

// Initial setup
songTitleInput.value = currentSongName;
loadSong('satisfaction');
