// pneuma.js
const pneumaSong = {
  songName: "Pneuma",
  blocks: [
    {
      type: "intro",
      measures: 12,
      rootNote: "D",
      mode: "Dorian",
      tempo: 120,
      timeSignature: "7/4",
      feel: "Atmospheric",
      lyrics: "" // Instrumental
    },
    {
      type: "verse",
      measures: 8,
      rootNote: "D",
      mode: "Dorian",
      tempo: 120,
      timeSignature: "7/4", // Simplified; could split into 7/4 + 5/8
      feel: "Mystical",
      lyrics: "We are spirit bound to this flesh, we go round one foot nailed down"
    },
    {
      type: "interlude",
      measures: 8,
      rootNote: "D",
      mode: "Dorian",
      tempo: 120,
      timeSignature: "7/4",
      feel: "Trippy",
      lyrics: "" // Instrumental with Middle Eastern drumming
    },
    {
      type: "verse",
      measures: 8,
      rootNote: "D",
      mode: "Dorian",
      tempo: 120,
      timeSignature: "7/4",
      feel: "Mystical",
      lyrics: "But bound to reach out and beyond this flesh, become Pneuma"
    },
    {
      type: "chorus",
      measures: 8,
      rootNote: "D",
      mode: "Dorian",
      tempo: 120,
      timeSignature: "4/4",
      feel: "Awakening",
      lyrics: "Child, wake up, child, release the light"
    },
    {
      type: "bridge",
      measures: 24,
      rootNote: "D",
      mode: "Dorian",
      tempo: 120,
      timeSignature: "7/4", // Mixed meters simplified
      feel: "Intense",
      lyrics: "" // Extended instrumental
    },
    {
      type: "outro",
      measures: 12,
      rootNote: "D",
      mode: "Dorian",
      tempo: 120,
      timeSignature: "7/4",
      feel: "Climactic",
      lyrics: "Pneuma, reach out and beyond, wake up remember"
    }
  ]
};

// Function to load the song into SongMaker
function loadPneuma() {
  loadSongData(pneumaSong);
}

// Uncomment to load automatically when script is included
// loadPneuma();
