let player1 = { name: "Wayne", hp: 100, st: 100 };
let player2 = { name: "Cindy", hp: 100, st: 60 };
let currentAttacker = "Wayne";
let sensualCombo = 0;
let isLoveDrunk = false;
let selectedFinishers = { Wayne: null, Cindy: null };
let matchHistory = [];

function executeMove(moveName) {
    const move = moves.find(m => m.name === moveName);
    const attacker = (currentAttacker === "Wayne") ? player1 : player2;
    const defender = (currentAttacker === "Wayne") ? player2 : player1;

    // Love-Drunk Logic
    if (move.type === 'sensual') {
        sensualCombo++;
        if (sensualCombo >= 3) isLoveDrunk = true;
    } else {
        sensualCombo = 0;
    }

    let finalDamage = move.damage;
    if (isLoveDrunk && move.type !== 'sensual') {
        finalDamage *= 2;
        isLoveDrunk = false;
    }

    if (move.type === 'finisher') {
        triggerVictory();
        return;
    }

    // Apply outcome
    defender.hp -= finalDamage;
    attacker.st -= (move.staminaCost || 0);
    matchHistory.push(`${currentAttacker}: ${move.name}`);
    
    updateUI();
    showMoveOnTV(move);
}

function updateUI() {
    document.getElementById('hp-w').style.width = player1.hp + "%";
    document.getElementById('st-w').style.width = player1.st + "%";
    document.getElementById('hp-c').style.width = player2.hp + "%";
    document.getElementById('st-c').style.width = player2.st + "%";
    
    if (isLoveDrunk) document.body.classList.add('love-drunk-mode');
    else document.body.classList.remove('love-drunk-mode');

    renderRemote();
}

function renderRemote() {
    const menu = document.getElementById('remote-menu');
    menu.innerHTML = '';
    const opponent = (currentAttacker === "Wayne") ? player2 : player1;

    let available = moves.filter(m => m.attacker === currentAttacker || !m.attacker);
    
    // Sudden Death Filter
    if (opponent.hp > 25) {
        available = available.filter(m => m.type !== 'finisher');
    } else {
        available = available.filter(m => m.type !== 'finisher' || m.name === selectedFinishers[currentAttacker]);
    }

    available.forEach(m => {
        const btn = document.createElement('button');
        btn.className = `btn-move ${m.type}`;
        btn.innerText = m.name;
        btn.onclick = () => executeMove(m.name);
        menu.appendChild(btn);
    });
}
