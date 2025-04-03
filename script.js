document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');

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
  let activeTimeManager = null;
  let scheduledSources = [];
  let audioContext = new AudioContext();

  console.log('Elements:', { timeline, songDropdown, songTitleInput });

  songDropdown.addEventListener('change', (e) => {
    console.log('Dropdown changed to:', e.target.value);
    loadSongFromDropdown(e.target.value);
  });

  const validTimeSignatures = [
    '4/4', '3/4', '6/8', '2/4', '5/4', '7/8', '12/8', '9/8', '11/8', '15/8', '13/8', '10/4', '8/8', '14/8', '16/8', '7/4', '6/4'
  ];

  let tickBuffer = null;
  let tockBuffer = null;
  let tickShortBuffer = null;
  let tockShortBuffer = null;
  

 async function loadAudioBuffers() {
  const audioFiles = ['tick.wav', 'tock.wav', 'tick_short.wav', 'tock_short.wav'];
  console.log('Attempting to load audio files:', audioFiles);
  try {
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
          return null; // Return null for failed loads
        }
      })
    );
    tickBuffer = buffers[0];
    tockBuffer = buffers[1];
    tickShortBuffer = buffers[2] || tickBuffer; // Fallback to tickBuffer
    tockShortBuffer = buffers[3] || tockBuffer; // Fallback to tockBuffer
    console.log('Audio buffers loaded:', {
      tick: !!tickBuffer,
      tock: !!tockBuffer,
      tickShort: !!tickShortBuffer,
      tockShort: !!tockShortBuffer
    });
  } catch (error) {
    console.error('Audio loading failed entirely:', error);
  }
}

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
  const beatDuration = 60 / tempo; // Seconds per beat

  let currentTime = audioContext.currentTime;
  let isTick = true;

  for (let i = 0; i < measures * beatsPerMeasure; i++) {
    const isShort = beatsPerMeasure % 2 === 0 && i % beatsPerMeasure === beatsPerMeasure - 1;
    const buffer = isTick
      ? (isShort && tickShortBuffer ? tickShortBuffer : tickBuffer)
      : (isShort && tockShortBuffer ? tockShortBuffer : tockBuffer);
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(currentTime);
    source.onended = () => {
      if (i === measures * beatsPerMeasure - 1 && onFinish) onFinish();
    };

    currentTime += beatDuration;
    isTick = !isTick;
  }

  block.classList.add('playing');
  console.log(`Playing block: ${block.querySelector('.label').textContent}`);
}
  const audioBufferPromise = loadAudioBuffers();

  function playSound(buffer, time) {
    if (!buffer || !soundEnabled) return null;
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(time);
    return source;
  }

  const TEMPO_THRESHOLD = 150;

  class TimeManager {
    constructor(tempo, beatsPerMeasure, totalBeats, callback) {
      this.tempo = tempo;
      this.beatsPerMeasure = beatsPerMeasure;
      this.totalBeats = totalBeats;
      this.callback = callback;
      this.startTime = null;
      this.lastBeat = -1;
      this.beatDuration = 60 / tempo;
      this.running = false;
    }

    start() {
      this.running = true;
      this.startTime = performance.now() / 1000 - (this.lastBeat + 1) * this.beatDuration;
      requestAnimationFrame(this.tick.bind(this));
    }

    stop() {
      this.running = false;
    }

    tick(timestamp) {
      if (!this.running) return;
      const currentTime = timestamp / 1000;
      const elapsed = currentTime - this.startTime;
      const currentBeat = Math.floor(elapsed / this.beatDuration);

      if (currentBeat <= this.totalBeats && currentBeat !== this.lastBeat) {
        this.lastBeat = currentBeat;
        const isFirstBeatOfMeasure = currentBeat % this.beatsPerMeasure === 0;
        this.callback({
          elapsedTime: elapsed,
          beat: currentBeat,
          measure: Math.floor(currentBeat / this.beatsPerMeasure) + 1,
          isFirstBeat: isFirstBeatOfMeasure
        });
      }

      if (currentBeat < this.totalBeats) {
        requestAnimationFrame(this.tick.bind(this));
      } else {
        this.stop();
      }
    }
  }

  function toggleSound() {
    soundEnabled = !soundEnabled;
    soundBtn.textContent = soundEnabled ? 'Sound On' : 'Sound Off';
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    themeBtn.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
  }

  function toggleForm() {
    isFormCollapsed = !isFormCollapsed;
    formContent.classList.toggle('collapsed');
    toggleFormBtn.textContent = isFormCollapsed ? 'Show Parameters' : 'Hide Parameters';
  }

  function changeBlockStyle(style) {
    const blocks = document.querySelectorAll('.song-block');
    blocks.forEach(block => {
      block.classList.remove('default', 'vibrant', 'pastel', 'monochrome');
      if (style) block.classList.add(style);
    });
  }

  playBtn.addEventListener('click', () => {
  audioContext.resume().then(() => playSong());
});

  songTitleInput.addEventListener('input', (e) => {
    updateTitle(e.target.value || 'Untitled');
  });

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
    const maxLength = 50;
    return lyrics.length > maxLength ? lyrics.substring(0, maxLength - 3) + '...' : lyrics;
  }

  function validateBlock(block) {
    if (!block.type) return 'Type is required';
    if (!block.measures || block.measures < 1) return 'Measures must be at least 1';
    if (!block.rootNote) return 'Root note is required';
    if (!block.mode) return 'Mode is required';
    if (!block.tempo || block.tempo < 1) return 'Tempo must be at least 1';
    if (!block.timeSignature || !validTimeSignatures.includes(block.timeSignature)) return 'Invalid time signature';
    return null;
  }

  function updateBlockSize(block) {
    if (!block.style.width) {
      const measures = parseInt(block.getAttribute('data-measures'));
      const baseWidth = 120;
      const minWidth = 120;
      const width = Math.max(minWidth, (measures / 4) * baseWidth);
      block.style.width = `${width}px`;
    }
  }

  function setupBlock(block) {
    console.log('Setting up block:', block.outerHTML);
    block.draggable = true;

    block.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('resize-handle')) {
        e.preventDefault();
        return;
      }
      draggedBlock = block;
      e.dataTransfer.setData('text/plain', '');
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

    block.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn') || e.target.classList.contains('resize-handle')) return;
      if (selectedBlock) selectedBlock.classList.remove('selected');
      selectedBlock = block;
      block.classList.add('selected');

      document.getElementById('part-type').value = block.classList[1];
      document.getElementById('measures').value = block.getAttribute('data-measures');
      document.getElementById('root-note').value = block.getAttribute('data-root-note') || 'C';
      document.getElementById('mode').value = block.getAttribute('data-mode') || 'Ionian';
      document.getElementById('tempo').value = block.getAttribute('data-tempo');
      document.getElementById('time-signature').value = block.getAttribute('data-time-signature');
      document.getElementById('feel').value = block.getAttribute('data-feel') || '';
      document.getElementById('lyrics').value = block.getAttribute('data-lyrics') || '';
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = 'X';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      block.remove();
      if (selectedBlock === block) clearSelection();
      calculateTimings();
    });
    block.appendChild(deleteBtn);

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
      const newWidth = Math.min(480, Math.max(120, Math.round((startWidth + (e.pageX - startX)) / snapWidth) * snapWidth));
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

  function addBlock() {
    const type = document.getElementById('part-type').value;
    const measures = parseInt(document.getElementById('measures').value);
    const rootNote = document.getElementById('root-note').value;
    const mode = document.getElementById('mode').value;
    const tempo = parseInt(document.getElementById('tempo').value);
    const timeSignature = document.getElementById('time-signature').value;
    const feel = document.getElementById('feel').value;
    const lyrics = document.getElementById('lyrics').value;

    const blockData = { type, measures, rootNote, mode, tempo, timeSignature, feel, lyrics };
    const error = validateBlock(blockData);
    if (error) {
      alert(`Error: ${error}`);
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
    block.innerHTML = `<span class="label">${formatPart(type)}: ${timeSignature} ${measures}m<br>${abbreviateKey(rootNote)} ${mode} ${tempo}b ${feel}${lyrics ? '<br>-<br>' + truncateLyrics(lyrics) : ''}</span><span class="tooltip">${lyrics || 'No lyrics'}</span>`;
    updateBlockSize(block);
    setupBlock(block);
    timeline.appendChild(block);

    const styleDropdown = document.getElementById('style-dropdown');
    if (styleDropdown.value) block.classList.add(styleDropdown.value);

    calculateTimings();
  }

  function updateBlock() {
    if (!selectedBlock) {
      alert('Please select a block to update');
      return;
    }

    const type = document.getElementById('part-type').value;
    const measures = parseInt(document.getElementById('measures').value);
    const rootNote = document.getElementById('root-note').value;
    const mode = document.getElementById('mode').value;
    const tempo = parseInt(document.getElementById('tempo').value);
    const timeSignature = document.getElementById('time-signature').value;
    const feel = document.getElementById('feel').value;
    const lyrics = document.getElementById('lyrics').value;

    const blockData = { type, measures, rootNote, mode, tempo, timeSignature, feel, lyrics };
    const error = validateBlock(blockData);
    if (error) {
      alert(`Error: ${error}`);
      return;
    }

    selectedBlock.className = `song-block ${type}`;
    selectedBlock.setAttribute('data-measures', measures);
    selectedBlock.setAttribute('data-tempo', tempo);
    selectedBlock.setAttribute('data-time-signature', timeSignature);
    selectedBlock.setAttribute('data-feel', feel);
    selectedBlock.setAttribute('data-lyrics', lyrics);
    selectedBlock.setAttribute('data-root-note', rootNote);
    selectedBlock.setAttribute('data-mode', mode);
    selectedBlock.innerHTML = `<span class="label">${formatPart(type)}: ${timeSignature} ${measures}m<br>${abbreviateKey(rootNote)} ${mode} ${tempo}b ${feel}${lyrics ? '<br>-<br>' + truncateLyrics(lyrics) : ''}</span><span class="tooltip">${lyrics || 'No lyrics'}</span>`;
    updateBlockSize(selectedBlock);

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = 'X';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedBlock.remove();
      if (selectedBlock === selectedBlock) clearSelection();
      calculateTimings();
    });
    selectedBlock.appendChild(deleteBtn);

    const resizeHandle = document.createElement('div');
    resizeHandle.classList.add('resize-handle');
    selectedBlock.appendChild(resizeHandle);

    const styleDropdown = document.getElementById('style-dropdown');
    if (styleDropdown.value) selectedBlock.classList.add(styleDropdown.value);

    calculateTimings();
  }

  function clearSelection() {
    if (selectedBlock) {
      selectedBlock.classList.remove('selected');
      selectedBlock = null;
    }
    document.getElementById('part-type').value = 'intro';
    document.getElementById('measures').value = 4;
    document.getElementById('root-note').value = 'C';
    document.getElementById('mode').value = 'Ionian';
    document.getElementById('tempo').value = 120;
    document.getElementById('time-signature').value = '4/4';
    document.getElementById('feel').value = 'Happiness';
    document.getElementById('lyrics').value = '';
  }

  function getBeatsPerMeasure(timeSignature) {
    const [numerator, denominator] = timeSignature.split('/').map(Number);
    if (timeSignature === '6/4') return 6;
    return numerator;
  }

  function calculateTimings() {
    const blocks = Array.from(timeline.children);
    let totalSeconds = 0;
    let totalBeats = 0;
    let totalMeasures = 0;
    const timings = blocks.map((block, index) => {
      const tempo = parseInt(block.getAttribute('data-tempo'));
      const measures = parseInt(block.getAttribute('data-measures'));
      const timeSignature = block.getAttribute('data-time-signature');
      const beatsPerMeasure = getBeatsPerMeasure(timeSignature);
      const beatDuration = 60 / tempo;
      const totalBlockBeats = measures * beatsPerMeasure;
      const duration = totalBlockBeats * beatDuration;

      totalSeconds += duration;
      totalBeats += totalBlockBeats;
      totalMeasures += measures;

      return {
        block,
        blockIndex: index,
        tempo,
        beatsPerMeasure,
        totalBeats: totalBlockBeats,
        totalMeasures: measures,
        duration
      };
    });

    timeCalculator.textContent = `Current Time: ${formatDuration(currentTime)} / Total Duration: ${formatDuration(totalSeconds)} | Song Beat: ${currentBeat} of ${totalBeats} | Block: ${blockBeat} of ${timings.length} (Measure: ${blockMeasure} of ${totalMeasures})`;
    return { timings, totalSeconds, totalBeats };
  }

  function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function togglePlay() {
    if (isPlaying) {
      isPlaying = false;
      playBtn.textContent = 'Play';
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
      audioContext.resume().then(() => {
        audioBufferPromise.then(() => playLeadIn(timings, totalSeconds, totalBeats));
      });
    }
  }

  function playLeadIn(timings, totalSeconds, totalBeats) {
    const firstBlock = timings[0];
    const beatDuration = 60 / firstBlock.tempo;
    const leadInBeats = firstBlock.beatsPerMeasure;

    const useShortSounds = firstBlock.tempo > TEMPO_THRESHOLD;
    const currentTickBuffer = useShortSounds ? tickShortBuffer : tickBuffer;
    const currentTockBuffer = useShortSounds ? tockShortBuffer : tockBuffer;

    currentBlockDisplay.classList.add('pulse');
    currentBlockDisplay.style.animation = `pulse ${beatDuration}s infinite`;
    currentBlockDisplay.innerHTML = `
      <span class="label">Lead-In (${firstBlock.block.getAttribute('data-time-signature')})</span>
      <span class="info">Beat: 0 of ${leadInBeats}</span>
    `;

    const startTime = audioContext.currentTime;
    for (let beat = 0; beat < leadInBeats; beat++) {
      const soundTime = startTime + (beat * beatDuration);
      const isFirstBeat = beat === 0;
      const source = playSound(isFirstBeat ? currentTickBuffer : currentTockBuffer, soundTime);
      if (source) scheduledSources.push(source);
    }

    activeTimeManager = new TimeManager(firstBlock.tempo, leadInBeats, leadInBeats - 1, ({ elapsedTime, beat, isFirstBeat }) => {
      currentBlockDisplay.innerHTML = `
        <span class="label">Lead-In (${firstBlock.block.getAttribute('data-time-signature')})</span>
        <span class="info">Beat: ${beat + 1} of ${leadInBeats}</span>
      `;
      currentTime = elapsedTime;
      timeCalculator.textContent = `Current Time: ${formatDuration(currentTime)} / Total Duration: ${formatDuration(totalSeconds)} | Song Beat: ${currentBeat} of ${totalBeats} | Block: ${blockBeat} of ${timings.length} (Measure: ${blockMeasure} of 0)`;

      if (isFirstBeat) {
        currentBlockDisplay.classList.add('one-count');
      } else {
        currentBlockDisplay.classList.remove('one-count');
      }
    });

    activeTimeManager.start();

    setTimeout(() => {
      if (activeTimeManager) activeTimeManager.stop();
      activeTimeManager = null;
      currentTime = 0;
      playSong(timings, totalSeconds, totalBeats);
    }, leadInBeats * beatDuration * 1000);
  }

  function playSong(timings, totalSeconds, totalBeats) {
    let currentIndex = 0;
    let blockStartTime = audioContext.currentTime;
    let cumulativeBeats = 0;

    function playNextBlock() {
      if (!isPlaying || currentIndex >= timings.length) {
        resetPlayback();
        return;
      }

      const currentTiming = timings[currentIndex];
      const beatDuration = 60 / currentTiming.tempo;
      const totalBlockBeats = currentTiming.totalBeats;

      const useShortSounds = currentTiming.tempo > TEMPO_THRESHOLD;
      const currentTickBuffer = useShortSounds ? tickShortBuffer : tickBuffer;
      const currentTockBuffer = useShortSounds ? tockShortBuffer : tockBuffer;

      for (let beat = 0; beat < totalBlockBeats; beat++) {
        const soundTime = blockStartTime + (beat * beatDuration);
        const isFirstBeatOfMeasure = beat % currentTiming.beatsPerMeasure === 0;
        const source = playSound(isFirstBeatOfMeasure ? currentTickBuffer : currentTockBuffer, soundTime);
        if (source) scheduledSources.push(source);
      }

      updateCurrentBlock(currentTiming);

      activeTimeManager = new TimeManager(
        currentTiming.tempo,
        currentTiming.beatsPerMeasure,
        totalBlockBeats - 1,
        ({ elapsedTime, beat, measure, isFirstBeat }) => {
          blockBeat = beat + 1;
          blockMeasure = measure;
          currentTime = elapsedTime + (cumulativeBeats * (60 / timings[currentIndex].tempo));
          currentBeat = cumulativeBeats + beat + 1;

          const totalBlocks = timings.length;
          const blockNum = currentIndex + 1;
          const rootNote = currentTiming.block.getAttribute('data-root-note');
          const mode = currentTiming.block.getAttribute('data-mode');

          currentBlockDisplay.innerHTML = `
            <span class="label">${formatPart(currentTiming.block.classList[1])}: ${currentTiming.block.getAttribute('data-time-signature')} ${currentTiming.totalMeasures}m<br>${abbreviateKey(rootNote)} ${mode} ${currentTiming.tempo}b ${currentTiming.block.getAttribute('data-feel')}</span>
            <span class="info">Beat: ${blockBeat} of ${currentTiming.totalBeats} | Measure: ${blockMeasure} of ${currentTiming.totalMeasures} | Block: ${blockNum} of ${totalBlocks}</span>
          `;

          timeCalculator.textContent = `Current Time: ${formatDuration(currentTime)} / Total Duration: ${formatDuration(totalSeconds)} | Song Beat: ${currentBeat} of ${totalBeats} | Block: ${blockNum} of ${totalBlocks} (Measure: ${blockMeasure} of ${currentTiming.totalMeasures})`;

          currentBlockDisplay.classList.add('pulse');
          currentBlockDisplay.style.animation = `pulse ${beatDuration}s infinite`;

          if (isFirstBeat) {
            currentBlockDisplay.classList.add('one-count');
          } else {
            currentBlockDisplay.classList.remove('one-count');
          }
        }
      );

      activeTimeManager.start();

      setTimeout(() => {
        if (activeTimeManager) activeTimeManager.stop();
        activeTimeManager = null;
        cumulativeBeats += totalBlockBeats;
        blockStartTime += currentTiming.duration;
        currentIndex++;
        playNextBlock();
      }, currentTiming.duration * 1000 + 10);
    }

    playNextBlock();
  }

  function updateCurrentBlock(timing) {
    const previousBlock = timeline.querySelector('.playing');
    if (previousBlock) previousBlock.classList.remove('playing');
    timing.block.classList.add('playing');
  }

  function resetPlayback() {
    if (activeTimeManager) {
      activeTimeManager.stop();
      activeTimeManager = null;
    }

    scheduledSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {}
    });
    scheduledSources = [];

    audioContext.close().then(() => {
      audioContext = new AudioContext();
      audioBufferPromise.then(() => {
        console.log('Audio buffers reloaded after reset');
      }).catch(error => console.error('Failed to reload audio buffers:', error));
    });

    currentTime = 0;
    currentBeat = 0;
    blockBeat = 0;
    blockMeasure = 0;

    isPlaying = false;
    playBtn.textContent = 'Play';

    const previousBlock = timeline.querySelector('.playing');
    if (previousBlock) previousBlock.classList.remove('playing');

    currentBlockDisplay.classList.remove('pulse', 'one-count');
    currentBlockDisplay.style.animation = 'none';
    currentBlockDisplay.innerHTML = '<span class="label">No block playing</span>';

    calculateTimings();
  }

  function exportSong() {
    const blocks = Array.from(timeline.children).map(block => ({
      type: block.classList[1],
      measures: parseInt(block.getAttribute('data-measures')),
      rootNote: block.getAttribute('data-root-note'),
      mode: block.getAttribute('data-mode'),
      tempo: parseInt(block.getAttribute('data-tempo')),
      timeSignature: block.getAttribute('data-time-signature'),
      feel: block.getAttribute('data-feel'),
      lyrics: block.getAttribute('data-lyrics')
    }));

    const songData = { songName: currentSongName, blocks };
    const blob = new Blob([JSON.stringify(songData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentSongName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importSong(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const songData = JSON.parse(e.target.result);
        loadSongData(songData);
      } catch (error) {
        alert(`Failed to import song: ${error.message}`);
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
      if (error) throw new Error(`Block ${i + 1}: ${error}`);
    }

    if (isPlaying) resetPlayback();

    timeline.innerHTML = '';
    if (selectedBlock) clearSelection();

    updateTitle(songData.songName);

    songData.blocks.forEach(({ type, measures, rootNote, mode, tempo, timeSignature, feel, lyrics }) => {
      const block = document.createElement('div');
      block.classList.add('song-block', type);
      block.setAttribute('data-measures', measures);
      block.setAttribute('data-tempo', tempo);
      block.setAttribute('data-time-signature', timeSignature);
      block.setAttribute('data-feel', feel || '');
      block.setAttribute('data-lyrics', lyrics || '');
      block.setAttribute('data-root-note', rootNote);
      block.setAttribute('data-mode', mode);
      block.innerHTML = `<span class="label">${formatPart(type)}: ${timeSignature} ${measures}m<br>${abbreviateKey(rootNote)} ${mode} ${tempo}b ${feel || ''}${lyrics ? '<br>-<br>' + truncateLyrics(lyrics) : ''}</span><span class="tooltip">${lyrics || 'No lyrics'}</span>`;
      updateBlockSize(block);
      setupBlock(block);
      timeline.appendChild(block);
    });

    const styleDropdown = document.getElementById('style-dropdown');
    if (styleDropdown.value) changeBlockStyle(styleDropdown.value);

    calculateTimings();
  }

  function loadSongFromDropdown(filename) {
  console.log('loadSongFromDropdown called with:', filename);
  if (!filename) {
    console.log("No filename selected");
    return;
  }

  if (!timeline) {
    console.error('Timeline element not found!');
    return;
  }

  if (isPlaying) resetPlayback();

  try {
    if (filename === 'new-song') {
      console.log('Loading new song');
      timeline.innerHTML = '';
      if (selectedBlock) clearSelection();
      isFormCollapsed = false;
      formContent.classList.remove('collapsed');
      toggleFormBtn.textContent = 'Hide Parameters';
      currentSongName = 'New Song';
      updateTitle(currentSongName);
      calculateTimings();
      const styleDropdown = document.getElementById('style-dropdown');
      styleDropdown.value = '';
      console.log('New song loaded, timeline:', timeline.innerHTML);
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

    const songData = songs[filename];
    if (!songData) {
      console.error(`Song ${filename} not found in static songs object`);
      return;
    }

    console.log('Clearing timeline and loading song:', filename);
    timeline.innerHTML = '';
    if (selectedBlock) clearSelection();

    updateTitle('(I Can’t Get No) Satisfaction');

    console.log('Song data has', songData.length, 'blocks');
    songData.forEach((blockData, index) => {
      console.log(`Creating block ${index + 1} with data:`, blockData);
      const block = document.createElement('div');
      block.classList.add('song-block', blockData.type);
      block.setAttribute('data-measures', blockData.measures);
      block.setAttribute('data-tempo', blockData.tempo);
      block.setAttribute('data-time-signature', blockData.timeSignature);
      block.setAttribute('data-feel', blockData.feel);
      block.setAttribute('data-lyrics', blockData.lyrics || '');
      block.setAttribute('data-root-note', blockData.rootNote);
      block.setAttribute('data-mode', blockData.mode);
      block.innerHTML = `
        <span class="label">${formatPart(blockData.type)}: ${blockData.timeSignature} ${blockData.measures}m<br>${abbreviateKey(blockData.rootNote)} ${blockData.mode} ${blockData.tempo}b ${blockData.feel}${blockData.lyrics ? '<br>-<br>' + truncateLyrics(blockData.lyrics) : ''}</span>
        <span class="tooltip">${blockData.lyrics || 'No lyrics'}</span>
      `;
      updateBlockSize(block);
      setupBlock(block);
      console.log(`Appending block ${index + 1} to timeline:`, block.outerHTML);
      timeline.appendChild(block);
    });

    console.log('Timeline after load:', timeline.innerHTML);
    calculateTimings();
    songDropdown.value = filename;
  } catch (error) {
    console.error('loadSongFromDropdown failed:', error);
  }
}

async function loadSongFromDropdown(filename) {
  console.log('loadSongFromDropdown called with:', filename);
  if (!filename) {
    console.log("No filename selected");
    return;
  }

  if (!timeline) {
    console.error('Timeline element not found!');
    return;
  }

  if (isPlaying) resetPlayback();

  try {
    if (filename === 'new-song') {
      console.log('Loading new song');
      timeline.innerHTML = '';
      if (selectedBlock) clearSelection();
      isFormCollapsed = false;
      formContent.classList.remove('collapsed');
      toggleFormBtn.textContent = 'Hide Parameters';
      currentSongName = 'New Song';
      updateTitle(currentSongName);
      calculateTimings();
      const styleDropdown = document.getElementById('style-dropdown');
      styleDropdown.value = '';
      console.log('New song loaded, timeline:', timeline.innerHTML);
      return;
    }

    // Static song data for satisfaction (as a fallback)
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
      console.log('Using static song data for:', filename);
    } else {
      console.log('Fetching song data from:', filename);
      const response = await fetch(filename);
      if (!response.ok) throw new Error(`Failed to fetch ${filename}: ${response.status}`);
      if (filename.endsWith('.json')) {
        songData = await response.json();
      } else if (filename.endsWith('.js')) {
        const module = await import(filename); // Dynamic import for JS modules
        songData = module.default || module; // Assumes the JS file exports an array or object
      }
      console.log('Fetched song data:', songData);
    }

    if (!songData || !Array.isArray(songData)) {
      console.error(`Invalid song data for ${filename}:`, songData);
      return;
    }

    console.log('Clearing timeline and loading song:', filename);
    timeline.innerHTML = '';
    if (selectedBlock) clearSelection();

    // Extract song title from filename if not provided in data
    const songTitle = filename.replace('songs/', '').replace(/\.(js|json)$/, '');
    updateTitle(songTitle);

    console.log('Song data has', songData.length, 'blocks');
    songData.forEach((blockData, index) => {
      console.log(`Creating block ${index + 1} with data:`, blockData);
      const block = document.createElement('div');
      block.classList.add('song-block', blockData.type);
      block.setAttribute('data-measures', blockData.measures);
      block.setAttribute('data-tempo', blockData.tempo);
      block.setAttribute('data-time-signature', blockData.timeSignature);
      block.setAttribute('data-feel', blockData.feel);
      block.setAttribute('data-lyrics', blockData.lyrics || '');
      block.setAttribute('data-root-note', blockData.rootNote);
      block.setAttribute('data-mode', blockData.mode);
      block.innerHTML = `
        <span class="label">${formatPart(blockData.type)}: ${blockData.timeSignature} ${blockData.measures}m<br>${abbreviateKey(blockData.rootNote)} ${blockData.mode} ${blockData.tempo}b ${blockData.feel}${blockData.lyrics ? '<br>-<br>' + truncateLyrics(blockData.lyrics) : ''}</span>
        <span class="tooltip">${blockData.lyrics || 'No lyrics'}</span>
      `;
      updateBlockSize(block);
      setupBlock(block);
      console.log(`Appending block ${index + 1} to timeline:`, block.outerHTML);
      timeline.appendChild(block);
    });

    console.log('Timeline after load:', timeline.innerHTML);
    calculateTimings();
    songDropdown.value = filename;
  } catch (error) {
    console.error('loadSongFromDropdown failed:', error);
  }
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

  // Expose functions globally for onclick
  window.togglePlay = togglePlay;
  window.toggleSound = toggleSound;
  window.toggleTheme = toggleTheme;
  window.exportSong = exportSong;
  window.importSong = importSong;
  window.loadSongFromDropdown = loadSongFromDropdown;
  window.changeBlockStyle = changeBlockStyle;
  window.randomizeSong = randomizeSong;
  window.printSong = printSong;
  window.toggleForm = toggleForm;
  window.addBlock = addBlock;
  window.updateBlock = updateBlock;

  // Initial setup
  console.log('Starting initial setup');
populateSongDropdown();
songTitleInput.value = currentSongName;
updateTitle(currentSongName);
console.log('Calling loadSongFromDropdown with songs/satisfaction.js');
loadSongFromDropdown('songs/satisfaction.js');
console.log('Initial setup complete');
}); // Line ~959: This should be the only closing brace here
