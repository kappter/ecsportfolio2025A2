document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');

  // DOM Elements
  const timeline = document.getElementById('timeline');
  const timeCalculator = document.getElementById('time-calculator');
  const currentBlockDisplay = document.getElementById('current-block-display');
  const playBtn = document.getElementById('play-btn');
  const soundBtn = document.getElementById('sound-btn');
  const themeBtn = document.getElementById('theme-btn');
  const songDropdown = document.getElementById('song-dropdown');
  const toggleFormBtn = document.getElementById('toggle-form-btn');
  const formContent = document.getElementById('form-content');
  const printSongName = document.getElementById('print-song-name');
  const songTitleInput = document.querySelector('#form-content #song-title-input');
  const footer = document.querySelector('footer'); // Check for footer

  // State Variables
  let draggedBlock = null;
  let selectedBlock = null;
  let currentSongName = '(I Can’t Get No) Satisfaction';
  let isPlaying = false;
  let currentTime = 0;
  let currentBeat = 0;
  let blockBeat = 0;
  let blockMeasure = 0;
  let soundEnabled = true;
  let isDarkMode = true;
  let isFormCollapsed = true;
  let audioContext = new AudioContext();
  let tickBuffer, tockBuffer, tickShortBuffer, tockShortBuffer;

  console.log('Elements:', { 
    timeline, 
    songDropdown, 
    songTitleInput, 
    playBtn, 
    footer: footer ? 'Found' : 'Not found' 
  });

  // Valid Time Signatures
  const validTimeSignatures = [
    '4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '12/8', '9/8', '11/8', '15/8', '13/8', '10/4', '8/8', '14/8', '16/8', '7/4', '6/4'
  ];

  // Load Audio Buffers
  async function loadAudioBuffers() {
    const audioFiles = ['tick.wav', 'tock.wav', 'tick_short.wav', 'tock_short.wav'];
    console.log('Attempting to load audio files:', audioFiles);
    const buffers = await Promise.all(
      audioFiles.map(async (file) => {
        try {
          const response = await fetch(file);
          if (!response.ok) throw new Error(`Failed to fetch ${file}: ${response.status}`);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = await audioContext.decodeAudioData(arrayBuffer);
          console.log(`Loaded ${file}`);
          return buffer;
        } catch (error) {
          console.warn(`${file} not found, using fallback:`, error);
          return null;
        }
      })
    );
    tickBuffer = buffers[0];
    tockBuffer = buffers[1];
    tickShortBuffer = buffers[2] || tickBuffer;
    tockShortBuffer = buffers[3] || tockBuffer;
    console.log('Audio buffers loaded:', {
      tick: !!tickBuffer,
      tock: !!tockBuffer,
      tickShort: !!tickShortBuffer,
      tockShort: !!tockShortBuffer
    });
  }

  // Play a Single Block
  function playBlock(block, onFinish) {
    if (!audioContext || !tickBuffer || !tockBuffer) {
      console.error('Audio context or buffers not initialized');
      if (onFinish) onFinish();
      return;
    }

    const measures = parseInt(block.getAttribute('data-measures'));
    const tempo = parseInt(block.getAttribute('data-tempo'));
    const timeSignature = block.getAttribute('data-time-signature');
    const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
    const beatDuration = 60 / tempo;

    let currentTime = audioContext.currentTime;
    let isTick = true;

    console.log(`Scheduling block: ${block.querySelector('.label').textContent}`);

    for (let i = 0; i < measures * beatsPerMeasure; i++) {
      const isShort = beatsPerMeasure % 2 === 0 && i % beatsPerMeasure === beatsPerMeasure - 1;
      const buffer = isTick
        ? (isShort && tickShortBuffer ? tickShortBuffer : tickBuffer)
        : (isShort && tockShortBuffer ? tockShortBuffer : tockBuffer);
      
      if (soundEnabled) {
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start(currentTime);
        if (i === measures * beatsPerMeasure - 1) {
          source.onended = () => {
            console.log(`Finished block: ${block.querySelector('.label').textContent}`);
            if (onFinish) onFinish();
          };
        }
      }
      currentTime += beatDuration;
      isTick = !isTick;
    }

    block.classList.add('playing');
    console.log(`Playing block: ${block.querySelector('.label').textContent}`);
  }

  // Play Entire Song
  function playSong() {
    if (!timeline.children.length) {
      console.log('No blocks to play');
      return;
    }
    console.log('Starting song playback');
    let currentBlockIndex = 0;
    function playNextBlock() {
      if (currentBlockIndex >= timeline.children.length || !isPlaying) {
        resetPlayback();
        return;
      }
      const block = timeline.children[currentBlockIndex];
      playBlock(block, () => {
        block.classList.remove('playing');
        currentBlockIndex++;
        playNextBlock();
      });
    }
    playNextBlock();
  }

  // Toggle Play
  function togglePlay() {
    console.log('togglePlay called, isPlaying:', isPlaying);
    if (isPlaying) {
      resetPlayback();
    } else {
      isPlaying = true;
      playBtn.textContent = 'Reset';
      audioContext.resume().then(() => {
        console.log('AudioContext resumed');
        playSong();
      }).catch(err => console.error('AudioContext resume failed:', err));
    }
  }

  // Reset Playback
  function resetPlayback() {
    console.log('Resetting playback');
    isPlaying = false;
    playBtn.textContent = 'Play';
    timeline.querySelectorAll('.playing').forEach(block => block.classList.remove('playing'));
    currentTime = 0;
    currentBeat = 0;
    blockBeat = 0;
    blockMeasure = 0;
    calculateTimings();
  }

  // Populate Song Dropdown
  function populateSongDropdown() {
    const availableSongs = [
      'new-song',
      'songs/Echoes of Joy.json',
      'songs/astrothunder.js',
      'songs/astroworld.js',
      'songs/dirtyLaundry.js',
      'songs/invincible.js',
      'songs/jambi.js',
      'songs/pneuma.js',
      'songs/satisfaction.js'
    ];
    songDropdown.innerHTML = '';
    availableSongs.forEach(song => {
      const option = document.createElement('option');
      option.value = song;
      option.textContent = song === 'new-song' ? 'New Song' : song.replace('songs/', '').replace(/\.(js|json)$/, '');
      songDropdown.appendChild(option);
    });
  }

  // Load Song from Dropdown
  async function loadSongFromDropdown(filename) {
    if (!filename) return;
    if (isPlaying) resetPlayback();

    try {
      if (filename === 'new-song') {
        timeline.innerHTML = '';
        if (selectedBlock) clearSelection();
        isFormCollapsed = false;
        formContent.classList.remove('collapsed');
        toggleFormBtn.textContent = 'Hide Parameters';
        updateTitle('New Song');
        calculateTimings();
        return;
      }

      const songs = {
        'songs/satisfaction.js': [
          { type: 'intro', measures: 4, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: '', rootNote: 'E', mode: 'Mixolydian' },
          { type: 'verse', measures: 8, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: 'I can’t get no satisfaction...', rootNote: 'E', mode: 'Mixolydian' },
          { type: 'chorus', measures: 8, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: 'I can’t get no...', rootNote: 'E', mode: 'Mixolydian' },
          { type: 'verse', measures: 8, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: 'I try and I try...', rootNote: 'E', mode: 'Mixolydian' },
          { type: 'chorus', measures: 8, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: 'I can’t get no...', rootNote: 'E', mode: 'Mixolydian' },
          { type: 'verse', measures: 8, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: 'When I’m drivin’ in my car...', rootNote: 'E', mode: 'Mixolydian' },
          { type: 'chorus', measures: 8, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: 'I can’t get no...', rootNote: 'E', mode: 'Mixolydian' },
          { type: 'outro', measures: 4, tempo: 136, timeSignature: '4/4', feel: 'Rock', lyrics: '', rootNote: 'E', mode: 'Mixolydian' }
        ]
      };

      let songData;
      if (songs[filename]) {
        songData = songs[filename];
        console.log(`Using static data for ${filename}`);
      } else {
        const response = await fetch(filename);
        if (!response.ok) throw new Error(`Failed to fetch ${filename}: ${response.status}`);
        songData = await response.json();
        console.log(`Fetched ${filename} as JSON`);
      }

      timeline.innerHTML = '';
      if (selectedBlock) clearSelection();
      const songTitle = filename.replace('songs/', '').replace(/\.(js|json)$/, '');
      updateTitle(songTitle);

      songData.forEach(blockData => {
        const block = document.createElement('div');
        block.classList.add('song-block', blockData.type);
        block.setAttribute('data-measures', blockData.measures);
        block.setAttribute('data-tempo', blockData.tempo);
        block.setAttribute('data-time-signature', blockData.timeSignature);
        block.setAttribute('data-feel', blockData.feel || '');
        block.setAttribute('data-lyrics', blockData.lyrics || '');
        block.setAttribute('data-root-note', blockData.rootNote);
        block.setAttribute('data-mode', blockData.mode);
        block.innerHTML = `
          <span class="label">${formatPart(blockData.type)}: ${blockData.timeSignature} ${blockData.measures}m<br>${abbreviateKey(blockData.rootNote)} ${blockData.mode} ${blockData.tempo}b ${blockData.feel}${blockData.lyrics ? '<br>-<br>' + truncateLyrics(blockData.lyrics) : ''}</span>
          <span class="tooltip">${blockData.lyrics || 'No lyrics'}</span>
        `;
        updateBlockSize(block);
        setupBlock(block);
        timeline.appendChild(block);
      });

      calculateTimings();
      songDropdown.value = filename;
    } catch (error) {
      console.error('loadSongFromDropdown failed:', error);
    }
  }

  // Randomize Song
  function randomizeSong() {
    timeline.innerHTML = '';
    if (selectedBlock) clearSelection();

    const titleAdjectives = ['Cosmic', 'Silent', 'Electric', 'Mystic', 'Faded', 'Lunar', 'Radiant', 'Ethereal', 'Glowing', 'Distant'];
    const titleNouns = ['Echo', 'Pulse', 'Wave', 'Dream', 'Shadow', 'Flame', 'Horizon', 'Void', 'Star', 'Mist'];
    const newTitle = `${titleAdjectives[Math.floor(Math.random() * titleAdjectives.length)]} ${titleNouns[Math.floor(Math.random() * titleNouns.length)]}`;
    updateTitle(newTitle);

    const rootNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const modes = ['Ionian', 'Dorian', 'Mixolydian', 'Aeolian', 'Phrygian'];
    const timeSignatures = ['4/4', '3/4', '6/8'];
    const tempos = [90, 100, 110, 120, 130, 140, 150];
    const feels = ['Happiness', 'Sadness', 'Tension', 'Calmness', 'Energy'];

    const songRootNote = rootNotes[Math.floor(Math.random() * rootNotes.length)];
    const songMode = modes[Math.floor(Math.random() * modes.length)];
    const songTimeSignature = timeSignatures[Math.floor(Math.random() * timeSignatures.length)];
    const songTempo = tempos[Math.floor(Math.random() * tempos.length)];
    const songFeel = feels[Math.floor(Math.random() * feels.length)];

    const possibleParts = [
      { type: 'intro', measures: 4 },
      { type: 'verse', measures: 8 },
      { type: 'chorus', measures: 8 },
      { type: 'verse', measures: 8 },
      { type: 'chorus', measures: 8 },
      { type: 'bridge', measures: 4 },
      { type: 'outro', measures: 4 }
    ].slice(0, Math.floor(Math.random() * 5) + 3);

    possibleParts.forEach(baseData => {
      const blockData = {
        type: baseData.type,
        measures: baseData.measures,
        rootNote: songRootNote,
        mode: songMode,
        tempo: songTempo,
        timeSignature: songTimeSignature,
        feel: songFeel,
        lyrics: baseData.type === 'intro' || baseData.type === 'outro' ? '' : `Random ${baseData.type} lyrics...`
      };
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
      `;
      updateBlockSize(block);
      setupBlock(block);
      timeline.appendChild(block);
    });

    calculateTimings();
  }

  // Utility Functions
  function updateTitle(title) {
    currentSongName = title;
    printSongName.textContent = title;
    songTitleInput.value = title;
  }

  function formatPart(part) {
    return part.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  function abbreviateKey(rootNote) {
    return rootNote;
  }

  function truncateLyrics(lyrics) {
    return lyrics.length > 50 ? lyrics.substring(0, 47) + '...' : lyrics;
  }

  function updateBlockSize(block) {
    const measures = parseInt(block.getAttribute('data-measures'));
    const width = Math.max(120, (measures / 4) * 120);
    block.style.width = `${width}px`;
  }

  function setupBlock(block) {
    block.draggable = true;
    block.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('resize-handle')) {
        e.preventDefault();
        return;
      }
      draggedBlock = block;
      block.style.opacity = '0.5';
    });
    block.addEventListener('dragend', () => {
      draggedBlock.style.opacity = '1';
      draggedBlock = null;
    });
    block.addEventListener('dragover', (e) => e.preventDefault());
    block.addEventListener('drop', (e) => {
      e.preventDefault();
      if (draggedBlock && draggedBlock !== block) {
        const allBlocks = Array.from(timeline.children);
        const draggedIndex = allBlocks.indexOf(draggedBlock);
        const droppedIndex = allBlocks.indexOf(block);
        if (draggedIndex < droppedIndex) {
          timeline.insertBefore(draggedBlock, block.nextSibling);
        } else {
          timeline.insertBefore(draggedBlock, block);
        }
        calculateTimings();
      }
    });
    block.addEventListener('click', () => {
      if (selectedBlock) selectedBlock.classList.remove('selected');
      selectedBlock = block;
      block.classList.add('selected');
    });

    const resizeHandle = document.createElement('div');
    resizeHandle.classList.add('resize-handle');
    block.appendChild(resizeHandle);

    let startX, startWidth;
    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      startX = e.pageX;
      startWidth = block.offsetWidth;
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
    });

    function resize(e) {
      const snapWidth = 30;
      const newWidth = Math.max(120, Math.round((startWidth + (e.pageX - startX)) / snapWidth) * snapWidth);
      block.style.width = `${newWidth}px`;
      const measures = Math.round((newWidth / 120) * 4);
      block.setAttribute('data-measures', measures);
      const type = block.classList[1];
      const tempo = block.getAttribute('data-tempo');
      const timeSignature = block.getAttribute('data-time-signature');
      const feel = block.getAttribute('data-feel');
      const lyrics = block.getAttribute('data-lyrics');
      const rootNote = block.getAttribute('data-root-note');
      const mode = block.getAttribute('data-mode');
      block.querySelector('.label').innerHTML = `${formatPart(type)}: ${timeSignature} ${measures}m<br>${abbreviateKey(rootNote)} ${mode} ${tempo}b ${feel}${lyrics ? '<br>-<br>' + truncateLyrics(lyrics) : ''}`;
    }

    function stopResize() {
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
      calculateTimings();
    }
  }

  function calculateTimings() {
    const blocks = Array.from(timeline.children);
    let totalSeconds = 0;
    blocks.forEach(block => {
      const tempo = parseInt(block.getAttribute('data-tempo'));
      const measures = parseInt(block.getAttribute('data-measures'));
      const beatsPerMeasure = parseInt(block.getAttribute('data-time-signature').split('/')[0]);
      totalSeconds += (measures * beatsPerMeasure * 60) / tempo;
    });
    timeCalculator.textContent = `Total Duration: ${formatDuration(totalSeconds)}`;
  }

  function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Event Listeners
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      console.log('Play button clicked');
      togglePlay();
    });
  } else {
    console.error('Play button not found in DOM');
  }

  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? 'Sound On' : 'Sound Off';
  });
  themeBtn.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    themeBtn.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
  });
  toggleFormBtn.addEventListener('click', () => {
    isFormCollapsed = !isFormCollapsed;
    formContent.classList.toggle('collapsed');
    toggleFormBtn.textContent = isFormCollapsed ? 'Show Parameters' : 'Hide Parameters';
  });
  songDropdown.addEventListener('change', (e) => loadSongFromDropdown(e.target.value));
  songTitleInput.addEventListener('input', (e) => updateTitle(e.target.value || 'Untitled'));

  // Expose Functions Globally
  window.togglePlay = togglePlay;
  window.toggleSound = () => {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? 'Sound On' : 'Sound Off';
  };
  window.toggleTheme = () => {
    isDarkMode = !isDarkMode;
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  };
  window.loadSongFromDropdown = loadSongFromDropdown;
  window.randomizeSong = randomizeSong;

  // Initial Setup
  loadAudioBuffers().then(() => {
    populateSongDropdown();
    loadSongFromDropdown('songs/satisfaction.js');
  });
});
