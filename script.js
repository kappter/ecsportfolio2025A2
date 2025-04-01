// Global variables
const timeline = document.getElementById('timeline');
let selectedBlock = null;
const validTimeSignatures = ['4/4', '3/4', '6/8', '5/4', '7/8'];
let isPlaying = false;
let currentTime = 0;
let totalDuration = 0;
let currentBlockIndex = 0;
let currentMeasure = 0;
let currentBeat = 0;
let isLightMode = false;

// Utility functions
function formatPart(part) {
  return part.charAt(0).toUpperCase() + part.slice(1);
}

function abbreviateKey(key) {
  return key.replace('sharp', '#').replace('flat', 'b');
}

function truncateLyrics(lyrics) {
  const words = lyrics.split(' ');
  return words.length > 5 ? words.slice(0, 5).join(' ') + '...' : lyrics;
}

function validateBlock(block) {
  if (!block.type || typeof block.type !== 'string') return 'Invalid block type';
  if (!Number.isInteger(block.measures) || block.measures <= 0) return 'Invalid measures';
  if (!validTimeSignatures.includes(block.timeSignature)) return 'Invalid time signature';
  if (!block.rootNote || typeof block.rootNote !== 'string') return 'Invalid root note';
  if (!block.mode || typeof block.mode !== 'string') return 'Invalid mode';
  if (!Number.isInteger(block.tempo) || block.tempo <= 0) return 'Invalid tempo';
  if (!block.feel || typeof block.feel !== 'string') return 'Invalid feel';
  return null;
}

function updateBlockSize(block) {
  const measures = parseInt(block.getAttribute('data-measures'), 10);
  block.style.width = `${200 + (measures - 4) * 10}px`;
}

function setupBlock(block) {
  block.addEventListener('click', () => {
    if (selectedBlock) clearSelection();
    block.classList.add('selected');
    selectedBlock = block;
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn');
  deleteBtn.textContent = 'X';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    block.remove();
    calculateTimings();
  });
  block.appendChild(deleteBtn);
}

function clearSelection() {
  if (selectedBlock) {
    selectedBlock.classList.remove('selected');
    selectedBlock = null;
  }
}

// Randomize song
async function randomizeSong() {
  timeline.innerHTML = '';
  if (selectedBlock) clearSelection();

  const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const modes = [
    'Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian',
    'Harmonic Minor', 'Melodic Minor', 'Blues Scale', 'Pentatonic Major', 'Pentatonic Minor', 'Whole Tone'
  ];
  const feels = [
    'Happiness', 'Sadness', 'Tension', 'Euphoria', 'Calmness', 'Anger', 'Mystical',
    'Rebellion', 'Triumph', 'Bliss', 'Frustration', 'Atmospheric', 'Trippy', 'Awakening', 'Intense', 'Climactic'
  ];

  let songs = [];
  try {
    const response = await fetch('songs.json');
    if (!response.ok) throw new Error(`Failed to load songs.json: ${response.status} ${response.statusText}`);
    const data = await response.json();
    songs = data.songs || [];
  } catch (error) {
    console.error('Error loading songs:', error);
    songs = [{ title: 'Default Song', artist: 'Unknown', lyrics: '', blocks: [] }];
  }

  const introTypes = ['intro', 'instrumental-verse-chorus'];
  const outroTypes = ['outro', 'coda', 'false-ending'];
  const mainSectionTypes = ['verse', 'chorus', 'pre-chorus', 'refrain', 'post-chorus'];
  const breakSectionTypes = ['bridge', 'solo', 'interlude', 'breakdown', 'drop'];

  const rootNote = rootNotes[Math.floor(Math.random() * rootNotes.length)];
  const mode = modes[Math.floor(Math.random() * modes.length)];
  const tempo = Math.floor(Math.random() * (180 - 60 + 1)) + 60;

  const numBlocks = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
  const structure = [];

  structure.push({
    type: introTypes[Math.floor(Math.random() * introTypes.length)],
    measures: Math.floor(Math.random() * (4 - 1 + 1)) + 1
  });

  const numMainSections = numBlocks - 2;
  let hasSolo = false;
  for (let i = 0; i < numMainSections; i++) {
    const position = i % 3;
    if (position === 0) {
      structure.push({ type: 'verse', measures: Math.floor(Math.random() * (8 - 4 + 1)) + 4 });
    } else if (position === 1 && Math.random() > 0.3) {
      structure.push({ type: 'pre-chorus', measures: Math.floor(Math.random() * (4 - 2 + 1)) + 2 });
    } else {
      structure.push({ type: 'chorus', measures: Math.floor(Math.random() * (8 - 4 + 1)) + 4 });
      if (i === 4 && !hasSolo && Math.random() > 0.5) {
        structure.push({
          type: breakSectionTypes[Math.floor(Math.random() * breakSectionTypes.length)],
          measures: Math.floor(Math.random() * (6 - 2 + 1)) + 2
        });
        hasSolo = true;
        i++;
      }
    }
  }

  structure.push({
    type: outroTypes[Math.floor(Math.random() * outroTypes.length)],
    measures: Math.floor(Math.random() * (4 - 1 + 1)) + 1
  });

  structure.forEach(({ type, measures }) => {
    const timeSignature = validTimeSignatures[Math.floor(Math.random() * validTimeSignatures.length)];
    const feel = feels[Math.floor(Math.random() * feels.length)];
    const song = songs[Math.floor(Math.random() * songs.length)];
    const lyrics = song.lyrics;

    const blockData = { type, measures, rootNote, mode, tempo, timeSignature, feel, lyrics };
    const error = validateBlock(blockData);
    if (error) {
      console.error(`Generated block failed validation: ${error}`);
      return;
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
    block.setAttribute('data-song-title', song.title);
    block.setAttribute('data-song-artist', song.artist);
    block.innerHTML = `
      <span class="label">${formatPart(type)}: ${timeSignature} ${measures}m<br>${abbreviateKey(rootNote)} ${mode} ${tempo}b ${feel}${lyrics ? '<br>-<br>' + truncateLyrics(lyrics) : ''}</span>
      <span class="tooltip">${lyrics || 'No lyrics'}</span>
    `;
    updateBlockSize(block);
    setupBlock(block);
    timeline.appendChild(block);

    const styleDropdown = document.getElementById('style-dropdown');
    if (styleDropdown && styleDropdown.value) block.classList.add(styleDropdown.value);
  });

  calculateTimings();
  resetPlayback();
}

// Populate song dropdown
async function populateSongDropdown() {
  const dropdown = document.getElementById('song-dropdown');
  if (!dropdown) {
    console.error('Song dropdown element not found in the DOM');
    return false;
  }

  let songs = [];
  try {
    const response = await fetch('songs.json');
    if (!response.ok) throw new Error(`Failed to load songs.json: ${response.status} ${response.statusText}`);
    const data = await response.json();
    songs = data.songs || [];
    if (songs.length === 0) {
      console.warn('No songs found in songs.json');
    }
  } catch (error) {
    console.error('Error loading songs for dropdown:', error);
    songs = [];
  }

  dropdown.innerHTML = '';
  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = 'Select a song...';
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  dropdown.appendChild(placeholderOption);

  songs.forEach(song => {
    const option = document.createElement('option');
    option.value = song.title;
    option.textContent = song.title;
    dropdown.appendChild(option);
  });

  const defaultSongTitle = "(I Can’t Get No) Satisfaction";
  const defaultOption = Array.from(dropdown.options).find(option => option.value === defaultSongTitle);
  if (defaultOption) {
    defaultOption.selected = true;
  } else {
    console.warn(`Default song "${defaultSongTitle}" not found in dropdown options`);
  }

  return songs.length > 0;
}

// Load a song
async function loadSong(songTitle) {
  let songs = [];
  try {
    const response = await fetch('songs.json');
    if (!response.ok) throw new Error(`Failed to load songs.json: ${response.status} ${response.statusText}`);
    const data = await response.json();
    songs = data.songs || [];
  } catch (error) {
    console.error('Error loading songs:', error);
    songs = [{ title: 'Default Song', artist: 'Unknown', lyrics: '', blocks: [] }];
  }

  const selectedSong = songs.find(song => song.title === songTitle);
  if (!selectedSong || !selectedSong.blocks || selectedSong.blocks.length === 0) {
    console.error(`Song not found or has no blocks: ${songTitle}`);
    return;
  }

  const songTitleElement = document.getElementById('print-song-name');
  if (songTitleElement) {
    songTitleElement.textContent = selectedSong.title;
  }

  timeline.innerHTML = '';
  if (selectedBlock) clearSelection();

  selectedSong.blocks.forEach(block => {
    const { type, measures, timeSignature, rootNote, mode, tempo, feel } = block;
    const lyrics = selectedSong.lyrics;

    const blockData = { type, measures, rootNote, mode, tempo, timeSignature, feel, lyrics };
    const error = validateBlock(blockData);
    if (error) {
      console.error(`Block failed validation: ${error}`);
      return;
    }

    const newBlock = document.createElement('div');
    newBlock.classList.add('song-block', type);
    newBlock.setAttribute('data-measures', measures);
    newBlock.setAttribute('data-tempo', tempo);
    newBlock.setAttribute('data-time-signature', timeSignature);
    newBlock.setAttribute('data-feel', feel);
    newBlock.setAttribute('data-lyrics', lyrics);
    newBlock.setAttribute('data-root-note', rootNote);
    newBlock.setAttribute('data-mode', mode);
    newBlock.setAttribute('data-song-title', selectedSong.title);
    newBlock.setAttribute('data-song-artist', selectedSong.artist);
    newBlock.innerHTML = `
      <span class="label">${formatPart(type)}: ${timeSignature} ${measures}m<br>${abbreviateKey(rootNote)} ${mode} ${tempo}b ${feel}${lyrics ? '<br>-<br>' + truncateLyrics(lyrics) : ''}</span>
      <span class="tooltip">${lyrics || 'No lyrics'}</span>
    `;
    updateBlockSize(newBlock);
    setupBlock(newBlock);
    timeline.appendChild(newBlock);

    const styleDropdown = document.getElementById('style-dropdown');
    if (styleDropdown && styleDropdown.value) newBlock.classList.add(styleDropdown.value);
  });

  calculateTimings();
  resetPlayback();
}

// Calculate timings
function calculateTimings() {
  const blocks = document.querySelectorAll('.song-block');
  let totalBeats = 0;
  let totalMeasures = 0;
  let totalSeconds = 0;

  blocks.forEach(block => {
    const measures = parseInt(block.getAttribute('data-measures'), 10);
    const tempo = parseInt(block.getAttribute('data-tempo'), 10);
    const timeSignature = block.getAttribute('data-time-signature');
    const beatsPerMeasure = parseInt(timeSignature.split('/')[0], 10);

    const blockBeats = measures * beatsPerMeasure;
    totalBeats += blockBeats;
    totalMeasures += measures;

    const blockSeconds = (blockBeats * 60) / tempo;
    totalSeconds += blockSeconds;
  });

  totalDuration = totalSeconds;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const timeCalculator = document.getElementById('time-calculator');
  if (timeCalculator) {
    timeCalculator.textContent = `Current Time: 0:00 / Total Duration: ${minutes}:${seconds < 10 ? '0' : ''}${seconds} | Song Beat: 0 of ${totalBeats} | Block: 0 of ${blocks.length} (Measure: 0 of ${totalMeasures})`;
  }
}

// Reset playback state
function resetPlayback() {
  isPlaying = false;
  currentTime = 0;
  currentBlockIndex = 0;
  currentMeasure = 0;
  currentBeat = 0;

  const playBtn = document.getElementById('play-btn');
  if (playBtn) {
    playBtn.textContent = 'Play';
  }

  const currentBlockDisplay = document.getElementById('current-block-display');
  if (currentBlockDisplay) {
    currentBlockDisplay.textContent = 'No block playing';
  }

  updateTimeDisplay();
}

// Update time display during playback
function updateTimeDisplay() {
  const blocks = document.querySelectorAll('.song-block');
  const totalBeats = Array.from(blocks).reduce((sum, block) => {
    const measures = parseInt(block.getAttribute('data-measures'), 10);
    const timeSignature = block.getAttribute('data-time-signature');
    const beatsPerMeasure = parseInt(timeSignature.split('/')[0], 10);
    return sum + (measures * beatsPerMeasure);
  }, 0);

  const totalMeasures = Array.from(blocks).reduce((sum, block) => {
    return sum + parseInt(block.getAttribute('data-measures'), 10);
  }, 0);

  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime % 60);
  const timeCalculator = document.getElementById('time-calculator');
  if (timeCalculator) {
    timeCalculator.textContent = `Current Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds} / Total Duration: ${Math.floor(totalDuration / 60)}:${Math.floor(totalDuration % 60) < 10 ? '0' : ''}${Math.floor(totalDuration % 60)} | Song Beat: ${currentBeat} of ${totalBeats} | Block: ${currentBlockIndex} of ${blocks.length} (Measure: ${currentMeasure} of ${totalMeasures})`;
  }
}

// Play song
function playSong() {
  if (isPlaying) {
    isPlaying = false;
    const playBtn = document.getElementById('play-btn');
    if (playBtn) playBtn.textContent = 'Play';
    return;
  }

  isPlaying = true;
  const playBtn = document.getElementById('play-btn');
  if (playBtn) playBtn.textContent = 'Pause';

  const blocks = document.querySelectorAll('.song-block');
  if (blocks.length === 0) {
    resetPlayback();
    return;
  }

  const playInterval = setInterval(() => {
    if (!isPlaying) {
      clearInterval(playInterval);
      return;
    }

    currentTime += 0.1;
    if (currentTime >= totalDuration) {
      resetPlayback();
      clearInterval(playInterval);
      return;
    }

    let elapsedBeats = 0;
    let currentBlock = null;
    let blockIndex = 0;

    for (const block of blocks) {
      const measures = parseInt(block.getAttribute('data-measures'), 10);
      const tempo = parseInt(block.getAttribute('data-tempo'), 10);
      const timeSignature = block.getAttribute('data-time-signature');
      const beatsPerMeasure = parseInt(timeSignature.split('/')[0], 10);
      const blockBeats = measures * beatsPerMeasure;
      const blockSeconds = (blockBeats * 60) / tempo;

      if (currentTime >= elapsedBeats / (tempo / 60) && currentTime < (elapsedBeats + blockBeats) / (tempo / 60)) {
        currentBlock = block;
        currentBlockIndex = blockIndex + 1;
        const beatsInBlock = (currentTime - elapsedBeats / (tempo / 60)) * (tempo / 60);
        currentMeasure = Math.floor(beatsInBlock / beatsPerMeasure) + 1;
        currentBeat = elapsedBeats + Math.floor(beatsInBlock) + 1;
        break;
      }

      elapsedBeats += blockBeats;
      blockIndex++;
    }

    const currentBlockDisplay = document.getElementById('current-block-display');
    if (currentBlockDisplay && currentBlock) {
      const type = currentBlock.classList[1];
      currentBlockDisplay.textContent = `${formatPart(type)} playing`;
    }

    updateTimeDisplay();
  }, 100);
}

// Toggle theme
function toggleTheme() {
  isLightMode = !isLightMode;
  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.textContent = isLightMode ? 'Dark Mode' : 'Light Mode';
  }

  document.body.classList.toggle('light-mode');
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
  // Populate the dropdown and load the default song
  const songsLoaded = await populateSongDropdown();

  // Load the default song "(I Can’t Get No) Satisfaction"
  const defaultSongTitle = "(I Can’t Get No) Satisfaction";
  if (songsLoaded) {
    await loadSong(defaultSongTitle);
  } else {
    console.error('Failed to load songs; cannot load default song');
  }

  // Song dropdown change
  const songDropdown = document.getElementById('song-dropdown');
  if (songDropdown) {
    songDropdown.addEventListener('change', (event) => {
      const selectedSongTitle = event.target.value;
      if (selectedSongTitle) {
        loadSong(selectedSongTitle);
      }
    });
  } else {
    console.error('Song dropdown element not found for event listener');
  }

  // Randomize button
  const randomizeBtn = document.getElementById('randomize-btn');
  if (randomizeBtn) {
    randomizeBtn.addEventListener('click', randomizeSong);
  } else {
    console.error('Randomize button not found in the DOM');
  }

  // Print button
  const printBtn = document.getElementById('print-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  } else {
    console.error('Print button not found in the DOM');
  }

  // Toggle form button
  const toggleFormBtn = document.getElementById('toggle-form-btn');
  const formContent = document.getElementById('form-content');
  if (toggleFormBtn && formContent) {
    toggleFormBtn.addEventListener('click', () => {
      const isHidden = formContent.style.display === 'none' || formContent.style.display === '';
      formContent.style.display = isHidden ? 'block' : 'none';
      toggleFormBtn.textContent = isHidden ? 'HIDE PARAMETERS' : 'SHOW PARAMETERS';
    });
  } else {
    console.error('Toggle form button or form content not found in the DOM');
  }

  // Play button
  const playBtn = document.getElementById('play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', playSong);
  } else {
    console.error('Play button not found in the DOM');
  }

  // Theme button
  const themeBtn = document.getElementById('theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  } else {
    console.error('Theme button not found in the DOM');
  }
});
