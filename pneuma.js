// pneuma.js
console.log("Loading Pneuma script...");

const pneumaSong = {
  songName: "Pneuma",
  blocks: [
    {
      type: "intro",
      measures: 36,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Atmospheric",
      lyrics: "" // Extended intro riff
    },
    {
      type: "verse",
      measures: 36,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Mystical",
      lyrics: "We are spirit bound to this flesh, we go round one foot nailed down"
    },
    {
      type: "interlude",
      measures: 36,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Trippy",
      lyrics: "" // Extended drumming
    },
    {
      type: "verse",
      measures: 36,
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
      measures: 36,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Intense",
      lyrics: "" // Extended build
    },
    {
      type: "bridge",
      measures: 36,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Tension",
      lyrics: "" // Polyrhythmic section
    },
    {
      type: "bridge",
      measures: 36,
      rootNote: "D",
      mode: "Dorian",
      tempo: 124,
      timeSignature: "7/4",
      feel: "Climactic",
      lyrics: "" // Extended solo
    },
    {
      type: "outro",
      measures: 72,
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
