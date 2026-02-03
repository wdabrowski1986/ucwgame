let winningMove = "";

// The Library of Gloating
const finisherSpeeches = {
    "ABSOLUTE ZERO": [
        "How was the view from under there? Looks like you're exactly where you belong.",
        "Total weight, total silence. That’s the power of the Goddess.",
        "I’d ask if you could breathe, but I’m too busy enjoying my win."
    ],
    "THE MATRIARCH": [
        "Shh... the Goddess is in control now. Just accept your defeat.",
        "I told you I’d handle you. Now stay right there and enjoy the view.",
        "Dominance looks good on me, doesn't it?"
    ],
    "THE BLACK WIDOW": [
        "The more you struggle, the tighter the squeeze. You never had a chance.",
        "You walked right into my trap. Now you're stuck in my web.",
        "Caught and conquered. Just the way I like it."
    ],
    "THE VENUS TRAP": [
        "Total engulfment. You completely disappeared into my power.",
        "There's no escape once you're in this deep, Technician.",
        "You look so peaceful when you're completely overwhelmed."
    ]
};

function runVictoryAnimation(move) {
    winningMove = move.name; // Save the name of the finisher used
    const hud = document.getElementById('arena-hud');
    const animLayer = document.getElementById('victory-anim-layer');
    
    hud.classList.add('screen-shake');
    animLayer.classList.remove('hidden');

    setTimeout(() => {
        hud.classList.remove('screen-shake');
        showVictoryMenu(); // Transition to Cindy's speech selection
    }, 4000);
}

function showVictoryMenu() {
    const speechMenu = document.getElementById('speech-menu');
    speechMenu.innerHTML = `<h3>GODDESS, CHOOSE YOUR REMARKS:</h3>`;
    
    // Get quotes for the specific move used, or use general quotes if it wasn't a finisher
    const quotes = finisherSpeeches[winningMove] || ["Better luck next time, mortal!", "The Goddess reigns!"];

    quotes.forEach((quote, index) => {
        const btn = document.createElement('button');
        btn.className = 'btn-speech';
        btn.innerText = `Quote ${index + 1}`;
        btn.onclick = () => {
            displaySpeechOnTV(quote);
        };
        speechMenu.appendChild(btn);
    });

    speechMenu.classList.remove('hidden');
}

function displaySpeechOnTV(text) {
    const display = document.getElementById('speech-display');
    display.innerText = `"${text}"`;
    display.classList.remove('hidden');
    document.getElementById('speech-menu').classList.add('hidden');
    document.getElementById('btn-credits').classList.remove('hidden'); // Show the roll credits button
}
