// js/secrets.js

// --- STIPULATION LOGIC ---
const STIPULATIONS = {
    STANDARD: { name: "Standard Rules", desc: "One fall to a finish." },
    TWO_OF_THREE: { name: "2 out of 3 Falls", desc: "First to win 2 rounds takes the match." },
    SUDDEN_DEATH: { name: "Sudden Death", desc: "Start at 50% Health. No Healing. High Stakes." },
    BLINDFOLD: { name: "Blindfold Match", desc: "Attacker must be blindfolded for every move." },
    SUBMISSION: { name: "Submission Only", desc: "No Pinfalls. You must force a Tap Out to win." }
};

// --- WARDROBE DATA ---
const WARDROBE = {
    wayne: ["Shirt", "Pants", "Underwear"],
    cindy: ["Top", "Bottoms", "Lingerie"]
};

// --- SECRETS LIST ---
// We append these to the DATA object from moves.js
DATA.secrets = [
    { name: "HARDCORE MATCH", desc: "STRIP EVERYTHING. Both players naked immediately." },
    { name: "ROLE SWAP", desc: "Attacker and defender switch roles immediately! Surprise!" },
    { name: "SILENT ROUND", desc: "No talking allowed until the next move is complete." },
    { name: "LIGHTS OUT", desc: "Attacker must close eyes. If you peek, you lose the round." },
    { name: "BACKSTAGE BRAWL", desc: "NO RULES! Fight dirty until someone screams 'I QUIT!' Winner takes 2 points!" },
    { name: "BODY WRITE", desc: "Use your finger to write a secret word on their skin. If they guess it, they get a reward." },
    { name: "DOUBLE TROUBLE", desc: "Both players must perform the next move at the same time." }
];

// --- PUNISHMENTS ---
DATA.punishments = {
    sensual: ["Sensual Kiss - Kiss for 30s.", "Body Worship - Massage 20s.", "Whisper Desire"],
    domination: ["Bow to Me", "Command & Obey (3 commands)", "Pin Down (20s)", "Surrender Speech"],
    erotic: ["Oral Devotion (1m)", "Truth Time", "Penetration Denied (1m)", "Ride Me (2m)"],
    playful: ["Tickle Torture (20s)", "Role Reversal (1m)", "Costume Change", "Playful Spank (10)"]
};