// pneuma.js
console.log("Loading Pneuma script...");

const pneumaSong = {
  songName: "Pneuma",
  blocks: [
    {
      type: "intro",
      measures: 12,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Atmospheric",
      lyrics: "" // Instrumental riff
    },
    {
      type: "verse",
      measures: 16,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Mystical",
      lyrics: "We are spirit bound to this flesh, we go round one foot nailed down"
    },
    {
      type: "interlude",
      measures: 16,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Trippy",
      lyrics: "" // Middle Eastern drumming
    },
    {
      type: "verse",
      measures: 16,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Mystical",
      lyrics: "But bound to reach out and beyond this flesh, become Pneuma"
    },
    {
      type: "chorus",
      measures: 16,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "4/4",
      feel: "Awakening",
      lyrics: "Child, wake up, child, release the light"
    },
    {
      type: "interlude",
      measures: 16,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Intense",
      lyrics: "" // Instrumental build
    },
    {
      type: "bridge",
      measures: 16,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Tension",
      lyrics: "" // Polyrhythmic section
    },
    {
      type: "bridge",
      measures: 16,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Climactic",
      lyrics: "" // Guitar solo
    },
    {
      type: "outro",
      measures: 14,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Resolution",
      lyrics: "Pneuma, reach out and beyond, wake up remember"
    }
  ]
};

// Ensure global access
window.loadPneuma = function() {
  console.log("Executing loadPneuma...");
  loadSongData(pneumaSong);
};

// Optional: Auto-load for testing
// window.loadPneuma();
