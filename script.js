const timeline = document.getElementById('timeline');
const timeCalculator = document.getElementById('time-calculator');
const currentBlockDisplay = document.getElementById('current-block-display');
const playBtn = document.getElementById('play-btn');
const soundBtn = document.getElementById('sound-btn');
const themeBtn = document.getElementById('theme-btn');
const songDropdown = document.getElementById('song-dropdown');
const printSongName = document.getElementById('print-song-name');
let draggedBlock = null;
let selectedBlock = null;
let currentSongName = 'Echoes of Joy';
let isPlaying = false;
let playInterval = null;
let currentTime = 0;
let currentBeat = 0;
let blockBeat = 0;
let blockMeasure = 0;
let lastBeatTime = 0;
let soundEnabled = true;
let isDarkMode = true;

const validTimeSignatures = ['4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '12/8', '9/8', '11/8', '15/8', '13/8', '10/4', '8/8', '14/8', '16/8', '7/4'];
const tickSound = new Audio('tick.wav');
const tockSound = new Audio('tock.wav');

function toggleSound() {
  soundEnabled = !soundEnabled;
  soundBtn.textContent = soundEnabled ? 'Sound On' : 'Sound Off';
}

function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  themeBtn.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
}

function updateTitle(songName) {
  currentSongName = songName || 'SongMaker';
  document.title = `${currentSongName} - SongMaker`;
  printSongName.textContent = currentSongName;
  document.getElementById('song-name').value = currentSongName;
}

function formatPart(part) {
  return part.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function abbreviateKey(key) {
  return key.replace(' Major', '').replace(' Minor', 'm');
}

function truncateLyrics(lyrics) {
  if (!lyrics) return '';
  const words = lyrics.split(' ');
  return words.length > 5 ? words.slice(0, 5).join(' ') + '...' : lyrics;
}

function updateBlockSize(block) {
  const measures = parseInt(block.getAttribute('data-measures'));
  const pixelsPerMeasure = 25;
  block.style.width = `${measures * pixelsPerMeasure}px`;
}

function getBeatsPerMeasure(timeSignature) {
  switch (timeSignature) {
    case '4/4': return 4;
    case '3/4': return 3;
    case '6/8': return 6;
    case '2/4': return 2;
    case '5/4': return 5;
    case '7/8': return 7;
    case '12/8': return 12;
    case '9/8': return 9;
    case '11/8': return 11;
    case '15/8': return 15;
    case '13/8': return 13;
    case '10/4': return 10;
    case '8/8': return 8;
    case '14/8': return 14;
    case '16/8': return 16;
    case '7/4': return 7;
    default: return 4;
  }
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(1);
  return `${minutes}:${remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds}`;
}

function calculateTimings() {
  const blocks = Array.from(timeline.querySelectorAll('.song-block:not(.transition)'));
  let totalSeconds = 0;
  let totalBeats = 0;
  const timings = [];

  blocks.forEach((block, index) => {
    const measures = parseInt(block.getAttribute('data-measures'));
    const tempo = parseInt(block.getAttribute('data-tempo'));
    const timeSignature = block.getAttribute('data-time-signature');
    const beatsPerMeasure = getBeatsPerMeasure(timeSignature);
    const beats = measures * beatsPerMeasure;
    const seconds = (beats / tempo) * 60;

    if (index > 0) {
      const nextPart = formatPart(blocks[index].classList[1]);
      const transitionBeats = beatsPerMeasure * 2;
      const transitionSeconds = (transitionBeats / tempo) * 60;
      const transitionStart = totalSeconds;
      timings.push({
        isTransition: true,
        block: null,
        start: transitionStart,
        duration: transitionSeconds,
        label: `Transition to ${nextPart}`,
        tempo,
        beatsPerMeasure,
        totalBeats: transitionBeats,
        totalMeasures: 2,
        blockIndex: index
      });
      totalSeconds += transitionSeconds;
      totalBeats += transitionBeats;
    }

    timings.push({
      isTransition: false,
      block,
      start: totalSeconds,
      duration: seconds,
      label: block.querySelector('.label').innerHTML,
      tempo,
      beatsPerMeasure,
      totalBeats: beats,
      totalMeasures: measures,
      blockIndex: index
    });
    totalSeconds += seconds;
    totalBeats += beats;
  });

  timeCalculator.textContent = `Current Time: ${formatDuration(currentTime)} / Total Duration: ${formatDuration(totalSeconds)} | Song Beat: ${currentBeat} of ${totalBeats} | Block: ${blockBeat} of 0 (Measure: ${blockMeasure} of 0)`;
  return { timings, totalSeconds, totalBeats };
}

function loadBlockIntoForm(block) {
  document.getElementById('part-type').value = block.classList[1];
  document.getElementById('measures').value = block.getAttribute('data-measures');
  document.getElementById('key').value = block.getAttribute('data-key') || 'C Major';
  document.getElementById('tempo').value = block.getAttribute('data-tempo');
  document.getElementById('time-signature').value = block.getAttribute('data-time-signature');
  document.getElementById('feel').value = block.getAttribute('data-feel');
  document.getElementById('lyrics').value = block.getAttribute('data-lyrics') || '';
}

function clearSelection() {
  if (selectedBlock) {
    selectedBlock.classList.remove('selected');
    selectedBlock = null;
  }
  document.getElementById('part-type').value = 'intro';
  document.getElementById('measures').value = '4';
  document.getElementById('key').value = 'C Major';
  document.getElementById('tempo').value = '120';
  document.getElementById('time-signature').value = '4/4';
  document.getElementById('feel').value = 'Happiness';
  document.getElementById('lyrics').value = '';
}

function setupBlock(block) {
  block.draggable = true;

  block.addEventListener('dragstart', (e) => {
    draggedBlock = block;
    setTimeout(() => block.style.opacity = '0.5', 0);
    e.dataTransfer.setData('text/plain', '');
  });

  block.addEventListener('dragend', () => {
    draggedBlock.style.opacity = '1';
    draggedBlock = null;
    calculateTimings();
  });

  block.addEventListener('dragover', (e) => e.preventDefault());

  block.addEventListener('dragenter', () => {
    if (block !== draggedBlock) {
      block.style.border = '2px dashed var(--accent-color)';
    }
  });

  block.addEventListener('dragleave', () => {
    block.style.border = 'none';
  });

  block.addEventListener('drop', (e) => {
    e.preventDefault();
    block.style.border = 'none';
    if (draggedBlock && draggedBlock !== block) {
      const allBlocks = [...timeline.querySelectorAll('.song-block:not(.transition)')];
      const draggedIndex = allBlocks.indexOf(draggedBlock);
      const dropIndex = allBlocks.indexOf(block);
      if (draggedIndex < dropIndex) {
        block.after(draggedBlock);
      } else {
        block.before(draggedBlock);
      }
    }
    calculateTimings();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.classList.add('delete-btn');
  deleteBtn.textContent = 'X';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    block.remove();
    if (block === selectedBlock) clearSelection();
    calculateTimings();
  });
  block.appendChild(deleteBtn);

  block.addEventListener('click', () => {
    if (selectedBlock) selectedBlock.classList.remove('selected');
    selectedBlock = block;
    block.classList.add('selected');
    loadBlockIntoForm(block);
  });
}

function addBlock() {
  const partType = document.getElementById('part-type').value;
  const measures = document.getElementById('measures').value;
  const key = document.getElementById('key').value;
  const tempo = document.getElementById('tempo').value;
  const timeSignature = document.getElementById('time-signature').value;
  const feel = document.getElementById('feel').value;
  const lyrics = document.getElementById('lyrics').value;

  if (!measures || measures < 1 || !tempo || tempo < 1) {
    alert('Please enter valid measures and tempo.');
    return;
  }

  const block = document.createElement('div');
  block.classList.add('song-block', partType);
  block.setAttribute('data-measures', measures);
  block.setAttribute('data-tempo', tempo);
  block.setAttribute('data-time-signature', timeSignature);
  block.setAttribute('data-feel', feel);
  block.setAttribute('data-lyrics', lyrics);
  block.setAttribute('data-key', key);

  const label = document.createElement('span');
  label.classList.add('label');
  label.innerHTML = `${formatPart(partType)}: ${timeSignature}  ${measures}m<br>${abbreviateKey(key)}  ${tempo}b  ${feel}${lyrics ? '<br>-<br>' + truncateLyrics(lyrics) : ''}`;
  block.appendChild(label);

  const tooltip = document.createElement('span');
  tooltip.classList.add('tooltip');
  tooltip.textContent = lyrics || 'No lyrics';
  block.appendChild(tooltip);

  updateBlockSize(block);
  setupBlock(block);
  timeline.appendChild(block);

  calculateTimings();
  document.getElementById('lyrics').value = '';
}

function updateBlock() {
  if (!selectedBlock) {
    alert('Please select a block to update.');
    return;
  }

  const partType = document.getElementById('part-type').value;
  const measures = document.getElementById('measures').value;
  const key = document.getElementById('key').value;
  const tempo = document.getElementById('tempo').value;
  const timeSignature = document.getElementById('time-signature').value;
  const feel = document.getElementById('feel').value;
  const lyrics = document.getElementById('lyrics').value;

  if (!measures || measures < 1 || !tempo || tempo < 1) {
    alert('Please enter valid measures and tempo.');
    return;
  }

  selectedBlock.className = `song-block ${partType}`;
  selectedBlock.setAttribute('data-measures', measures);
  selectedBlock.setAttribute('data-tempo', tempo);
  selectedBlock.setAttribute('data-time-signature', timeSignature);
  selectedBlock.setAttribute('data-feel', feel);
  selectedBlock.setAttribute('data-lyrics', lyrics);
  selectedBlock.setAttribute('data-key', key);
  selectedBlock.querySelector('.label').innerHTML = `${formatPart(partType)}: ${timeSignature}  ${measures}m<br>${abbreviateKey(key)}  ${tempo}b  ${feel}${lyrics ? '<br>-<br>' + truncateLyrics(lyrics) : ''}`;
  selectedBlock.querySelector('.tooltip').textContent = lyrics || 'No lyrics';
  updateBlockSize(selectedBlock);
  clearSelection();
  calculateTimings();
}

function printSong() {
  window.print();
}

function togglePlay() {
  if (isPlaying) {
    clearInterval(playInterval);
    playBtn.textContent = 'Play';
    isPlaying = false;
    resetPlayback();
  } else {
    const { timings, totalSeconds, totalBeats } = calculateTimings();
    if (timings.length === 0) return;
    playBtn.textContent = 'Reset';
    isPlaying = true;
    currentTime = 0;
    currentBeat = 0;
    blockBeat = 0;
    blockMeasure = 0;
    lastBeatTime = 0;
    playLeadIn(timings, totalSeconds, totalBeats);
  }
}

// ... (rest of script.js remains unchanged until playLeadIn)

function playLeadIn(timings, totalSeconds, totalBeats) {
  const firstBlock = timings[0];
  const tempo = firstBlock.tempo;
  const beatsPerSecond = tempo / 60;
  const beatDuration = 1 / beatsPerSecond;
  const leadInBeats = 4;
  let leadInTime = 0;
  let leadInCount = 0;

  currentBlockDisplay.style.backgroundColor = '#3b4048'; // Lead-in background
  currentBlockDisplay.innerHTML = `
    <span class="label">Lead-In</span>
    <span class="info">Beat: ${leadInCount} of 4</span>
  `;
  currentBlockDisplay.classList.add('pulse');
  currentBlockDisplay.style.animation = `pulse ${beatDuration}s infinite`;

  playInterval = setInterval(() => {
    leadInTime += 0.01;
    const currentBeatTime = leadInTime * beatsPerSecond;

    if (currentBeatTime >= leadInCount && leadInCount < leadInBeats) {
      if (soundEnabled) {
        if (leadInCount === 0) {
          tockSound.cloneNode().play();
        } else {
          tickSound.cloneNode().play();
        }
      }
      leadInCount++;
      currentBlockDisplay.innerHTML = `
        <span class="label">Lead-In</span>
        <span class="info">Beat: ${leadInCount} of 4</span>
      `;
    }

    if (leadInTime >= leadInBeats * beatDuration) {
      clearInterval(playInterval);
      currentBlockDisplay.classList.remove('pulse'); // Reset pulse before song starts
      playSong(timings, totalSeconds, totalBeats);
    }

    timeCalculator.textContent = `Current Time: ${formatDuration(currentTime)} / Total Duration: ${formatDuration(totalSeconds)} | Song Beat: ${currentBeat} of ${totalBeats} | Block: ${blockBeat} of 0 (Measure: ${blockMeasure} of 0)`;
  }, 10);
}

function playSong(timings, totalSeconds, totalBeats) {
  let currentIndex = 0;
  updateCurrentBlock(timings[currentIndex]); // Initial block update
  blockBeat = 0;
  blockMeasure = 1;
  lastBeatTime = currentTime;

  playInterval = setInterval(() => {
    currentTime += 0.01;
    const currentTiming = timings[currentIndex];
    const beatsPerSecond = currentTiming.tempo / 60;
    const songBeat = Math.floor(currentTime * beatsPerSecond);
    const timeInBlock = currentTime - currentTiming.start;
    const beatInBlock = timeInBlock * beatsPerSecond;

    if (soundEnabled && currentTime - lastBeatTime >= 1 / beatsPerSecond) {
      const isFirstBeatOfMeasure = blockBeat % currentTiming.beatsPerMeasure === 0;
      (isFirstBeatOfMeasure ? tockSound : tickSound).cloneNode().play();
      lastBeatTime = currentTime;
    }

    currentBeat = songBeat;

    if (currentTime >= currentTiming.start + currentTiming.duration) {
      currentIndex++;
      if (currentIndex < timings.length) {
        updateCurrentBlock(timings[currentIndex]);
        blockBeat = 0;
        blockMeasure = 1;
      } else {
        clearInterval(playInterval);
        playBtn.textContent = 'Play';
        isPlaying = false;
        resetPlayback();
        return;
      }
    } else {
      blockBeat = Math.floor(beatInBlock);
      blockMeasure = Math.floor(blockBeat / currentTiming.beatsPerMeasure) + 1;
      // Update block display without resetting animation unnecessarily
      const totalBlocks = Array.from(timeline.querySelectorAll('.song-block:not(.transition)')).length;
      const blockNum = currentTiming.isTransition ? currentTiming.blockIndex : currentTiming.blockIndex + 1;
      const totalBlockCount = totalBlocks + timings.filter(t => t.isTransition).length;
      currentBlockDisplay.innerHTML = `
        <span class="label">${currentTiming.label}</span>
        <span class="info">Beat: ${blockBeat} of ${currentTiming.totalBeats} | Measure: ${blockMeasure} of ${currentTiming.totalMeasures} | Block: ${blockNum} of ${totalBlockCount}</span>
      `;
    }

    timeCalculator.textContent = `Current Time: ${formatDuration(currentTime)} / Total Duration: ${formatDuration(totalSeconds)} | Song Beat: ${currentBeat} of ${totalBeats} | Block: ${blockBeat} of ${currentTiming.totalBeats} (Measure: ${blockMeasure} of ${currentTiming.totalMeasures})`;
  }, 10);
}

function updateCurrentBlock(timing) {
  const previousBlock = timeline.querySelector('.playing');
  if (previousBlock) previousBlock.classList.remove('playing');
  currentBlockDisplay.classList.remove('pulse'); // Reset pulse to restart animation

  const totalBlocks = Array.from(timeline.querySelectorAll('.song-block:not(.transition)')).length;
  const blockNum = timing.isTransition ? timing.blockIndex : timing.blockIndex + 1;
  const totalBlockCount = totalBlocks + timings.filter(t => t.isTransition).length;

  // Update content
  currentBlockDisplay.innerHTML = `
    <span class="label">${timing.label}</span>
    <span class="info">Beat: ${blockBeat} of ${timing.totalBeats} | Measure: ${blockMeasure} of ${timing.totalMeasures} | Block: ${blockNum} of ${totalBlockCount}</span>
  `;

  // Update background and playback styling
  if (timing.isTransition) {
    const existingTransition = timeline.querySelector('.transition');
    if (existingTransition) existingTransition.remove();

    const transitionBlock = document.createElement('div');
    transitionBlock.classList.add('song-block', 'transition');
    transitionBlock.innerHTML = '<span class="label">T</span>';
    const nextBlock = timeline.querySelectorAll('.song-block:not(.transition)')[Array.from(timings).filter(t => !t.isTransition).findIndex(t => t.start > timing.start)];
    if (nextBlock) nextBlock.before(transitionBlock);
    transitionBlock.classList.add('playing');

    currentBlockDisplay.style.background = 'linear-gradient(135deg, var(--transition-bg-start), var(--timeline-bg))';
  } else {
    const existingTransition = timeline.querySelector('.transition');
    if (existingTransition) existingTransition.remove();

    timing.block.classList.add('playing');
    const blockStyle = window.getComputedStyle(timing.block);
    const bgGradient = blockStyle.backgroundImage || blockStyle.background;
    currentBlockDisplay.style.background = bgGradient;
  }

  const beatDuration = 60 / timing.tempo;
  currentBlockDisplay.style.animation = `pulse ${beatDuration}s infinite`;
  currentBlockDisplay.classList.add('pulse');
}

function resetPlayback() {
  currentTime = 0;
  currentBeat = 0;
  blockBeat = 0;
  blockMeasure = 0;
  lastBeatTime = 0;
  const previousBlock = timeline.querySelector('.playing');
  if (previousBlock) previousBlock.classList.remove('playing');
  const transitionBlock = timeline.querySelector('.transition');
  if (transitionBlock) transitionBlock.remove();
  currentBlockDisplay.classList.remove('pulse');
  currentBlockDisplay.style.animation = '';
  currentBlockDisplay.style.background = 'var(--form-bg)';
  currentBlockDisplay.innerHTML = '<span class="label">No block playing</span>';
  calculateTimings();
}

// ... (rest of script.js remains unchanged)

function exportSong() {
  const blocks = Array.from(timeline.querySelectorAll('.song-block:not(.transition)')).map(block => ({
    type: block.classList[1],
    measures: block.getAttribute('data-measures'),
    key: block.getAttribute('data-key'),
    tempo: block.getAttribute('data-tempo'),
    timeSignature: block.getAttribute('data-time-signature'),
    feel: block.getAttribute('data-feel'),
    lyrics: block.getAttribute('data-lyrics')
  }));
  const songData = {
    songName: currentSongName,
    blocks: blocks
  };
  const json = JSON.stringify(songData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${currentSongName || 'Untitled'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function validateBlock(block) {
  const requiredFields = ['type', 'measures', 'key', 'tempo', 'timeSignature'];
  for (const field of requiredFields) {
    if (!block[field] || block[field] === '') {
      return `Missing or empty required field: ${field}`;
    }
  }
  const measures = parseInt(block.measures);
  const tempo = parseInt(block.tempo);
  if (isNaN(measures) || measures <= 0) {
    return 'Measures must be a positive number';
  }
  if (isNaN(tempo) || tempo <= 0) {
    return 'Tempo must be a positive number';
  }
  if (!validTimeSignatures.includes(block.timeSignature)) {
    return `Invalid time signature: ${block.timeSignature}. Must be one of ${validTimeSignatures.join(', ')}`;
  }
  return null;
}

function importSong(event) {
  const file = event.target.files[0];
  if (!file || !file.name.endsWith('.json')) {
    alert('Please select a valid .json file.');
    return;
  }
  loadSongFile(file);
}

function loadSongFromDropdown(filename) {
  if (!filename) return;
  fetch(filename)
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch song file');
      return response.text();
    })
    .then(data => {
      loadSongData(JSON.parse(data));
    })
    .catch(error => {
      alert(`Failed to load song: ${error.message}`);
    });
}

function loadSongFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const songData = JSON.parse(e.target.result);
      loadSongData(songData);
    } catch (error) {
      alert(`Failed to load song: ${error.message}`);
    }
  };
  reader.readAsText(file);
}

function loadSongData(songData) {
  if (!songData.songName || !Array.isArray(songData.blocks)) {
    throw new Error('Invalid song file format: missing songName or blocks array.');
  }

  for (let i = 0; i < songData.blocks.length; i++) {
    const error = validateBlock(songData.blocks[i]);
    if (error) {
      throw new Error(`Block ${i + 1}: ${error}`);
    }
  }

  if (isPlaying) {
    clearInterval(playInterval);
    playBtn.textContent = 'Play';
    isPlaying = false;
    resetPlayback();
  }

  timeline.innerHTML = '';
  if (selectedBlock) clearSelection();

  updateTitle(songData.songName);

  songData.blocks.forEach(({ type, measures, key, tempo, timeSignature, feel, lyrics }) => {
    const block = document.createElement('div');
    block.classList.add('song-block', type);
    block.setAttribute('data-measures', measures);
    block.setAttribute('data-tempo', tempo);
    block.setAttribute('data-time-signature', timeSignature);
    block.setAttribute('data-feel', feel || '');
    block.setAttribute('data-lyrics', lyrics || '');
    block.setAttribute('data-key', key);
    block.innerHTML = `<span class="label">${formatPart(type)}: ${timeSignature}  ${measures}m<br>${abbreviateKey(key)}  ${tempo}b  ${feel || ''}${lyrics ? '<br>-<br>' + truncateLyrics(lyrics) : ''}</span><span class="tooltip">${lyrics || 'No lyrics'}</span>`;
    updateBlockSize(block);
    setupBlock(block);
    timeline.appendChild(block);
  });

  calculateTimings();
}

function populateSongDropdown() {
  // For local testing, manually list files (no filesystem access in browser)
  const availableSongs = ['Pneuma.json', 'Echoes of Joy.json']; // Add your JSON files here
  availableSongs.forEach(song => {
    const option = document.createElement('option');
    option.value = song;
    option.textContent = song.replace('.json', '');
    songDropdown.appendChild(option);
  });

  // For a server-hosted solution, uncomment and configure:
  /*
  fetch('/songs') // Replace with your server endpoint
    .then(response => response.json())
    .then(files => {
      files.filter(f => f.endsWith('.json')).forEach(song => {
        const option = document.createElement('option');
        option.value = song;
        option.textContent = song.replace('.json', '');
        songDropdown.appendChild(option);
      });
    })
    .catch(error => console.error('Error fetching song list:', error));
  */
}

const initialBlocks = [
  { type: 'intro', measures: 4, key: 'C Major', tempo: 120, timeSignature: '4/4', feel: 'Happiness', lyrics: 'Here we go now' },
  { type: 'verse', measures: 8, key: 'C Major', tempo: 120, timeSignature: '3/4', feel: 'Calmness', lyrics: 'The wind blows soft and low' },
  { type: 'chorus', measures: 8, key: 'D Major', tempo: 120, timeSignature: '6/8', feel: 'Euphoria', lyrics: 'Rise up, feel the beat' },
  { type: 'bridge', measures: 4, key: 'G Minor', tempo: 100, timeSignature: '7/8', feel: 'Tension', lyrics: 'Hold your breath' },
  { type: 'solo', measures: 16, key: 'G Minor', tempo: 100, timeSignature: '4/4', feel: 'Triumph', lyrics: '' },
  { type: 'outro', measures: 8, key: 'C Major', tempo: 120, timeSignature: '4/4', feel: 'Bliss', lyrics: 'Fade into the light' }
];

initialBlocks.forEach(({ type, measures, key, tempo, timeSignature, feel, lyrics }) => {
  const block = document.createElement('div');
  block.classList.add('song-block', type);
  block.setAttribute('data-measures', measures);
  block.setAttribute('data-tempo', tempo);
  block.setAttribute('data-time-signature', timeSignature);
  block.setAttribute('data-feel', feel);
  block.setAttribute('data-lyrics', lyrics);
  block.setAttribute('data-key', key);
  block.innerHTML = `<span class="label">${formatPart(type)}: ${timeSignature}  ${measures}m<br>${abbreviateKey(key)}  ${tempo}b  ${feel}${lyrics ? '<br>-<br>' + truncateLyrics(lyrics) : ''}</span><span class="tooltip">${lyrics || 'No lyrics'}</span>`;
  updateBlockSize(block);
  setupBlock(block);
  timeline.appendChild(block);
});

updateTitle(currentSongName);
calculateTimings();
document.body.setAttribute('data-theme', 'dark');
populateSongDropdown();
