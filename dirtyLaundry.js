// dirtyLaundry.js
console.log("Loading Dirty Laundry script...");

const dirtyLaundrySong = {
  songName: "Dirty Laundry",
  blocks: [
    {
      type: "intro",
      measures: 8,
      rootNote: "G",
      mode: "Ionian",
      tempo: 98,
      timeSignature: "4/4",
      feel: "Cynical",
      lyrics: "" // Instrumental
    },
    {
      type: "verse",
      measures: 8,
      rootNote: "G",
      mode: "Ionian",
      tempo: 98,
      timeSignature: "4/4",
      feel: "Cynical",
      lyrics: "I make my living off the evening news, just give me something I can use"
    },
    {
      type: "chorus",
      measures: 8,
      rootNote: "G",
      mode: "Ionian",
      tempo: 98,
      timeSignature: "4/4",
      feel: "Rebellion",
      lyrics: "Kick 'em when they're up, kick 'em when they're down"
    },
    {
      type: "verse",
      measures: 8,
      rootNote: "G",
      mode: "Ionian",
      tempo: 98,
      timeSignature: "4/4",
      feel: "Cynical",
      lyrics: "Well, I coulda been an actor, but I wound up here"
    },
    {
      type: "chorus",
      measures: 8, // Fixed typo from previous "G" to 8
      rootNote: "G",
      mode: "Ionian",
      tempo: 98,
      timeSignature: "4/4",
      feel: "Rebellion",
      lyrics: "Kick 'em when they're up, kick 'em when they're down"
    },
    {
      type: "verse",
      measures: 8,
      rootNote: "G",
      mode: "Ionian",
      tempo: 98,
      timeSignature: "4/4",
      feel: "Cynical",
      lyrics: "We got the bubble-headed bleach-blonde, comes on at five"
    },
    {
      type: "bridge",
      measures: 8,
      rootNote: "G",
      mode: "Ionian",
      tempo: 98,
      timeSignature: "4/4",
      feel: "Tension",
      lyrics: "Can we film the operation? Is the head dead yet?"
    },
    {
      type: "verse",
      measures: 8,
      rootNote: "G",
      mode: "Ionian",
      tempo: 98,
      timeSignature: "4/4",
      feel: "Cynical",
      lyrics: "You don’t really need to find out what’s going on"
    },
    {
      type: "chorus",
      measures: 12,
      rootNote: "G",
      mode: "Ionian",
      tempo: 98,
      timeSignature: "4/4",
      feel: "Rebellion",
      lyrics: "Kick 'em when they're up, kick 'em when they're down, kick 'em all around"
    },
    {
      type: "outro",
      measures: 4,
      rootNote: "G",
      mode: "Ionian",
      tempo: 98,
      timeSignature: "4/4",
      feel: "Cynical",
      lyrics: "We all know that crap is king, give us dirty laundry"
    }
  ]
};

// Ensure global access
window.loadDirtyLaundry = function() {
  console.log("Executing loadDirtyLaundry...");
  loadSongData(dirtyLaundrySong);
};

// Optional: Auto-load for testing
// window.loadDirtyLaundry();
