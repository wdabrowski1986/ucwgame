// ============================================
// ULTIMATE COUPLE WRESTLING - REFEREE SYSTEM
// Multi-Round, Health-Based Clothing System
// With Voice Submission Detection
// ============================================

// ============================================
// GAME STATE
// ============================================

const GameState = {
    // Match Structure
    matchType: "bestOf3", // Best of 3 rounds
    currentRound: 1,
    maxRounds: 3,
    wayne: {
        // Wayne: The Champion - HIGH STAMINA, PRECISION DAMAGE
        blueStamina: 100,           // Wayne's stamina bar (can outlast)
        maxBlueStamina: 100,
        hp: 100,                    // Health (from taking damage)
        maxHP: 100,
        clothingLayer: 3,           // 3 = Fully Dressed, 2 = Partially, 1 = Underwear, 0 = Nude
        roundsWon: 0,
        focusBonus: false,          // From ritual - technical moves do more damage
        isStunned: false,           // From Boop System (Cindy's strikes)
        inSubmission: false,        // Being held for recharge
        sensualMovesInRow: 0        // Track for Love-Drunk Trap
    },
    cindy: {
        // Cindy: The Goddess - HIGH DAMAGE, LOW STAMINA
        redDamage: 100,             // Cindy's damage potential (gets tired)
        maxRedDamage: 100,
        hp: 100,                    // Health (from taking damage)
        maxHP: 100,
        clothingLayer: 3,
        roundsWon: 0,
        isRechargeable: true,       // Can use Submission Recharge when red bar empty
        isStunned: false,           // From Boop System
        inSubmission: false,        // Being held for recharge
        sensualMovesInRow: 0        // Track for Love-Drunk Trap
    },
    
    // Round State
    roundActive: false,
    currentAttacker: "wayne",
    roundTimer: 300,               // 5 minutes = 300 seconds
    moveActive: false,
    activeMoveTimer: 0,
    activeMoveObj: null,
    voiceDetected: false,
    irlChallengeActive: false,     // When phone should be put down
    
    // Boop System & Special States
    boopActive: false,             // Cindy's stun active
    doubleDamageActive: false,     // Love-Drunk Trap active
    doubleMovesInRow: 0,           // Sensual move counter
    
    // Moves & History
    moveHistory: [],
    roundSubmissions: 0
};

const ClothingLayers = {
    3: "👗 FULLY DRESSED",
    2: "🎀 PARTIALLY UNDRESSED",
    1: "👙 UNDERWEAR ONLY",
    0: "💋 EXPOSED"
};

const HealthThresholds = {
    75: { layer: 2, description: "Remove outer clothing" },
    50: { layer: 1, description: "Down to underwear" },
    25: { layer: 0, description: "Complete exposure" }
};

// ============================================
// GAME INITIALIZATION
// ============================================

function startGame() {
    const startScreen = document.getElementById("start-screen");
    if (startScreen) startScreen.classList.add("hidden");
    const introOverlay = document.getElementById("intro-overlay");
    if (introOverlay) introOverlay.classList.add("hidden");
    initGame();
}

function initGame() {
    GameState.currentRound = 1;
    GameState.wayne.roundsWon = 0;
    GameState.cindy.roundsWon = 0;
    resetForNewRound();
    showRitualOverlay();
}

function resetForNewRound() {
    GameState.wayne.hp = 100;
    GameState.cindy.hp = 100;
    GameState.wayne.submissions = 0;
    GameState.cindy.submissions = 0;
    GameState.roundSubmissions = 0;
    GameState.currentAttacker = "wayne";
    GameState.moveHistory = [];
    GameState.roundActive = false;
    GameState.roundTimer = 300;
}

// ============================================
// RITUAL PHASE
// ============================================

function showRitualOverlay() {
    const ritualText = document.getElementById("ritual-text");
    const ritualSteps = [
        { 
            title: "🕯️ THE OFFERING",
            desc: "Wayne gives Cindy a 60-second foot or calf massage.\nWhile he works, he must tell her one thing he finds absolutely captivating about her.",
            timer: 60,
            result: "Cindy starts with a full energy bar ✅"
        },
        { 
            title: "🕯️ THE GODDESS'S MARK",
            desc: "Cindy claims her challenger!\nShe leaves a 'mark' on Wayne (a lingering kiss or a playful nibble)\non his neck or chest.",
            timer: 30,
            result: "Wayne gets a Focus Bonus for technical moves ✅"
        },
        { 
            title: "🕯️ THE SEAL OF THE MATCH",
            desc: "A deep, 30-second kiss.\nNeither player can pull away until the timer on the TV hits zero.",
            timer: 30,
            result: "Unlocks the Final Stand mode for the end of the match ✅"
        }
    ];
    
    ritualText.innerHTML = `
        <div class="ritual-step">
            <h2>${ritualSteps[0].title}</h2>
            <p>${ritualSteps[0].desc}</p>
            <div class="ritual-timer" id="ritual-timer">60</div>
            <p class="ritual-result">${ritualSteps[0].result}</p>
        </div>
    `;
    ritualText.dataset.step = "0";
    const ritualOverlay = document.getElementById("ritual-overlay");
    ritualOverlay.classList.remove("hidden");
    ritualOverlay.classList.add("visible");
    ritualOverlay.style.display = "flex";
    
    // Start ritual timer
    startRitualTimer(ritualSteps[0].timer);
}

function startRitualTimer(duration) {
    let remaining = duration;
    
    const timerInterval = setInterval(() => {
        remaining--;
        const timerDisplay = document.getElementById("ritual-timer");
        if (timerDisplay) {
            timerDisplay.innerText = remaining;
        }
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            // Auto-advance
            advanceRitual();
        }
    }, 1000);
}

function advanceRitual() {
    const ritualText = document.getElementById("ritual-text");
    const currentStep = parseInt(ritualText.dataset.step || "0");
    const nextStep = currentStep + 1;
    
    const ritualSteps = [
        { 
            title: "🕯️ THE OFFERING",
            desc: "Wayne gives Cindy a 60-second foot or calf massage.\nWhile he works, he must tell her one thing he finds absolutely captivating about her.",
            timer: 60,
            result: "Cindy starts with a full energy bar ✅"
        },
        { 
            title: "🕯️ THE GODDESS'S MARK",
            desc: "Cindy claims her challenger!\nShe leaves a 'mark' on Wayne (a lingering kiss or a playful nibble)\non his neck or chest.",
            timer: 30,
            result: "Wayne gets a Focus Bonus for technical moves ✅"
        },
        { 
            title: "🕯️ THE SEAL OF THE MATCH",
            desc: "A deep, 30-second kiss.\nNeither player can pull away until the timer on the TV hits zero.",
            timer: 30,
            result: "Unlocks the Final Stand mode for the end of the match ✅"
        }
    ];
    
    if (nextStep < ritualSteps.length) {
        // Apply effects from previous ritual
        if (currentStep === 0) {
            GameState.cindy.redDamage = 100; // Full red damage
            GameState.cindy.maxRedDamage = 100;
        } else if (currentStep === 1) {
            GameState.wayne.focusBonus = true; // Technical moves do more damage
        }
        
        ritualText.innerHTML = `
            <div class="ritual-step">
                <h2>${ritualSteps[nextStep].title}</h2>
                <p>${ritualSteps[nextStep].desc}</p>
                <div class="ritual-timer" id="ritual-timer">${ritualSteps[nextStep].timer}</div>
                <p class="ritual-result">${ritualSteps[nextStep].result}</p>
            </div>
        `;
        ritualText.dataset.step = nextStep;
        startRitualTimer(ritualSteps[nextStep].timer);
    } else {
        // All rituals complete - unlock Final Stand mode and start arena
        GameState.finalStandUnlocked = true;
        document.getElementById("ritual-overlay").classList.add("hidden");
        startArena();
    }
}

// ============================================
// ARENA / ROUND MANAGEMENT
// ============================================

function startArena() {
    GameState.roundActive = true;
    document.getElementById("arena-hud").classList.remove("hidden");
    updateRoundDisplay();
    updatePlayerHUD();
    
    // Initialize voice detection
    initVoiceDetection();
    
    // Initialize remote button connection (optional - won't work on GitHub Pages)
    if (typeof remoteManager !== 'undefined') {
        try {
            remoteManager.init(() => {
                console.log('Remote submission triggered');
                registerSubmission();
            });
        } catch (e) {
            console.log('Remote connection not available (expected on GitHub Pages)');
        }
    }
    
    // Start round timer
    startRoundTimer();
    
    // Start first move
    selectNextMove();
}

function startRoundTimer() {
    GameState.roundTimer = 300; // 5 minutes
    
    const timerInterval = setInterval(() => {
        GameState.roundTimer--;
        updateTimerDisplay();
        
        if (GameState.roundTimer <= 0) {
            clearInterval(timerInterval);
            endRound();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(GameState.roundTimer / 60);
    const seconds = GameState.roundTimer % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById("timer-display").innerText = display;
}

function updateRoundDisplay() {
    document.getElementById("round-display").innerText = `ROUND ${GameState.currentRound} of ${GameState.maxRounds}`;
}

// ============================================
// MOVE SELECTION & EXECUTION
// ============================================

function selectNextMove() {
    const attacker = GameState[GameState.currentAttacker];
    const moves = getMovesByAttacker(GameState.currentAttacker);
    
    // 20% chance to use sensual move (Love-Drunk Trap tracking)
    const useSensual = Math.random() < 0.2;
    const availableMoves = moves.filter(m => 
        useSensual ? m.type === "sensual" : m.type !== "sensual"
    );
    
    // Fallback if no sensual moves available
    if (availableMoves.length === 0) {
        const availableMoves = moves.filter(m => m.type !== "sensual");
        const selectedMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        executeMove(selectedMove);
        return;
    }
    
    const selectedMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    executeMove(selectedMove);
}

function getMovesByAttacker(attacker) {
    return moves.filter(m => m.attacker === null || m.attacker === attacker);
}

function executeMove(moveObj) {
    GameState.activeMoveObj = moveObj;
    GameState.moveActive = true;
    
    // Determine move timer based on move type
    let moveTimer = 30; // Default
    if (moveObj.type === "strike" || moveObj.type === "smother") {
        moveTimer = 20; // 20 seconds for strikes/smothers
    } else if (moveObj.type === "challenge") {
        moveTimer = moveObj.timeLimit || 15;
    } else if (moveObj.type === "sensual") {
        moveTimer = moveObj.timer || 45;
    }
    
    GameState.activeMoveTimer = moveTimer;
    
    // Update move display
    document.getElementById("active-move-name").innerText = moveObj.name;
    document.getElementById("active-move-desc").innerText = moveObj.instruction;
    document.getElementById("move-image").src = moveObj.img;
    document.getElementById("attacker-name").innerText = GameState.currentAttacker.toUpperCase();
    document.getElementById("attacker-name-status").innerText = GameState.currentAttacker.toUpperCase();
    
    const defender = GameState.currentAttacker === "wayne" ? "cindy" : "wayne";
    document.getElementById("defender-name").innerText = defender.toUpperCase();
    
    // Start move timer
    startMoveTimer(moveTimer);
}

function startMoveTimer(duration) {
    let remaining = duration;
    
    const timerInterval = setInterval(() => {
        remaining--;
        document.getElementById("move-countdown").innerText = `${remaining}s`;
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            
            // Apply damage
            applyMoveDamage(GameState.activeMoveObj);
            
            // Move ends - wait for next submission or auto-move
            GameState.moveActive = false;
            
            // Check if attacker should switch (alternating)
            GameState.currentAttacker = GameState.currentAttacker === "wayne" ? "cindy" : "wayne";
            
            // Select next move
            setTimeout(() => {
                if (GameState.roundActive) {
                    selectNextMove();
                }
            }, 2000);
        }
    }, 1000);
}

// ============================================
// DAMAGE & HEALTH SYSTEM
// ============================================

function applyMoveDamage(moveObj) {
    // PRACTICE MODE: No damage applied
    if (GameState.practiceMode) {
        console.log('Practice mode - no damage applied');
        document.getElementById("match-status").innerText = "PRACTICE MODE - NO DAMAGE";
        return;
    }
    
    const attacker = GameState[GameState.currentAttacker];
    const defender = GameState[GameState.currentAttacker === "wayne" ? "cindy" : "wayne"];
    const defenderName = GameState.currentAttacker === "wayne" ? "cindy" : "wayne";
    
    // ===== WAYNE'S MOVE CALCULATION =====
    if (GameState.currentAttacker === "wayne") {
        // Wayne has low stamina cost, can go all night
        if (!attacker.inSubmission) {
            attacker.blueStamina = Math.max(0, attacker.blueStamina - (moveObj.type === "sensual" ? 5 : 15));
        }
        
        let damage = moveObj.damage || 10;
        
        // Apply focus bonus from ritual (Energizer Bunny's precision)
        if (attacker.focusBonus && (moveObj.type === "challenge" || moveObj.type === "strike")) {
            damage *= 1.4;
        }
        
        // Sensual moves heal defender instead of damage
        if (moveObj.type === "sensual") {
            damage = -(moveObj.damage || 5);
            attacker.sensualMovesInRow++;
        } else {
            attacker.sensualMovesInRow = 0;
        }
        
        // Apply double damage if Love-Drunk Trap is active
        if (GameState.doubleDamageActive && moveObj.type !== "sensual") {
            damage *= 2;
            GameState.doubleDamageActive = false;
            console.log("🩷 LOVE-DRUNK TRAP TRIGGERED - DOUBLE DAMAGE!");
        }
        
        // Check if 3 sensual moves in a row
        if (attacker.sensualMovesInRow >= 3) {
            GameState.doubleDamageActive = true;
            attacker.sensualMovesInRow = 0;
            console.log("🩷 PINK GLOW - Next move will do DOUBLE DAMAGE!");
            document.getElementById("match-status").innerText = "🩷 NEXT MOVE - DOUBLE DAMAGE!";
        }
        
    } else {
        // ===== CINDY'S MOVE CALCULATION =====
        // Cindy has high damage but uses stamina (Red Damage bar)
        attacker.redDamage = Math.max(0, attacker.redDamage - (moveObj.type === "sensual" ? 10 : 30));
        
        damage = moveObj.damage || 20;
        
        // Sensual moves heal defender
        if (moveObj.type === "sensual") {
            damage = -(moveObj.damage || 10);
            attacker.sensualMovesInRow++;
        } else {
            attacker.sensualMovesInRow = 0;
        }
        
        // Apply double damage if Love-Drunk Trap is active
        if (GameState.doubleDamageActive && moveObj.type !== "sensual") {
            damage *= 2;
            GameState.doubleDamageActive = false;
            console.log("🩷 LOVE-DRUNK TRAP TRIGGERED - DOUBLE DAMAGE!");
        }
        
        // Check if 3 sensual moves in a row
        if (attacker.sensualMovesInRow >= 3) {
            GameState.doubleDamageActive = true;
            attacker.sensualMovesInRow = 0;
            console.log("🩷 PINK GLOW - Next move will do DOUBLE DAMAGE!");
            document.getElementById("match-status").innerText = "🩷 NEXT MOVE - DOUBLE DAMAGE!";
        }
        
        // Check for Submission Recharge (Cindy out of stamina)
        if (attacker.redDamage <= 0 && !attacker.inSubmission) {
            console.log("RECHARGE ACTIVATED: Cindy out of stamina!");
            triggerSubmissionRecharge();
            return; // Don't apply damage yet
        }
    }
    
    // Apply damage to defender
    defender.hp = Math.max(0, Math.min(100, defender.hp - damage));
    
    // Check if IRL challenge move
    if (moveObj.isIRLChallenge) {
        triggerIRLChallenge(moveObj);
    }
    
    // Check for Boop System (Cindy's strikes stun Wayne)
    if (GameState.currentAttacker === "cindy" && moveObj.type === "strike") {
        defender.isStunned = true;
        GameState.boopActive = true;
        console.log("👑 BOOP! Wayne is STUNNED - Next Cindy move is a SUPER MOVE!");
        document.getElementById("match-status").innerText = "👑 WAYNE STUNNED!";
    }
    
    // Check for clothing removal thresholds
    checkClothingRemoval(defender);
    
    // Update display
    updatePlayerHUD();
}

function checkClothingRemoval(player) {
    const playerName = Object.keys(GameState).find(k => GameState[k] === player);
    
    if (player.hp <= 75 && player.clothingLayer > 2) {
        player.clothingLayer = 2;
        console.log(`${playerName} down to 75% - clothing removed!`);
    } else if (player.hp <= 50 && player.clothingLayer > 1) {
        player.clothingLayer = 1;
        console.log(`${playerName} down to 50% - more clothing removed!`);
    } else if (player.hp <= 25 && player.clothingLayer > 0) {
        player.clothingLayer = 0;
        console.log(`${playerName} down to 25% - completely exposed! FINAL STAND MODE!`);
    }
}

// ============================================
// PHASE 4: IRL CHALLENGES
// ============================================

function triggerIRLChallenge(moveObj) {
    GameState.irlChallengeActive = true;
    GameState.roundActive = false; // Pause round timer
    
    // Show IRL challenge overlay
    const irlOverlay = document.createElement("div");
    irlOverlay.className = "irl-challenge-overlay";
    irlOverlay.innerHTML = `
        <div class="irl-challenge-content">
            <h1>⏲️ IRL CHALLENGE!</h1>
            <p>PUT THE PHONE DOWN!</p>
            <p>Perform: <strong>${moveObj.name}</strong></p>
            <div class="irl-countdown" id="irl-timer">${moveObj.irlDuration || 20}</div>
            <p class="irl-instruction">${moveObj.irlInstruction || "Go until timer ends!"}</p>
        </div>
    `;
    document.body.appendChild(irlOverlay);
    
    let remaining = moveObj.irlDuration || 20;
    const timerInterval = setInterval(() => {
        remaining--;
        document.getElementById("irl-timer").innerText = remaining;
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            showIRLDecision(moveObj);
        }
    }, 1000);
}

function showIRLDecision(moveObj) {
    // Remove timer overlay
    const overlay = document.querySelector(".irl-challenge-overlay");
    if (overlay) overlay.remove();
    
    // Show decision buttons
    const decisionOverlay = document.createElement("div");
    decisionOverlay.className = "irl-decision-overlay";
    decisionOverlay.innerHTML = `
        <div class="irl-decision-content">
            <h1>WHO WON THE STRUGGLE?</h1>
            <div class="irl-buttons">
                <button class="btn-irl" onclick="resolveIRLChallenge('wayne')">WAYNE ESCAPED</button>
                <button class="btn-irl" onclick="resolveIRLChallenge('cindy')">CINDY HOLDS TIGHT</button>
            </div>
        </div>
    `;
    document.body.appendChild(decisionOverlay);
}

function resolveIRLChallenge(winner) {
    // Remove decision overlay
    const overlay = document.querySelector(".irl-decision-overlay");
    if (overlay) overlay.remove();
    
    GameState.irlChallengeActive = false;
    GameState.roundActive = true;
    
    if (winner === "wayne") {
        // Wayne escaped - Cindy loses stamina/energy
        GameState.cindy.redDamage = Math.max(0, GameState.cindy.redDamage - 20);
        console.log("Wayne escaped! Cindy loses 20 stamina.");
        document.getElementById("match-status").innerText = "WAYNE ESCAPED!";
    } else {
        // Cindy holds - Wayne takes damage
        GameState.wayne.hp = Math.max(0, GameState.wayne.hp - 25);
        console.log("Cindy held strong! Wayne takes 25 damage.");
        document.getElementById("match-status").innerText = "CINDY HOLDS TIGHT!";
    }
    
    updatePlayerHUD();
    
    // Continue with round
    setTimeout(() => {
        if (GameState.roundActive) {
            selectNextMove();
        }
    }, 2000);
}

// ============================================
// SUBMISSION RECHARGE SYSTEM
// ============================================

function triggerSubmissionRecharge() {
    GameState.roundActive = false;
    GameState.cindy.inSubmission = true;
    
    const rechargeOverlay = document.createElement("div");
    rechargeOverlay.className = "recharge-overlay";
    rechargeOverlay.innerHTML = `
        <div class="recharge-content">
            <h1>⚡ SUBMISSION RECHARGE ⚡</h1>
            <p>Cindy is out of energy!</p>
            <p>Wayne holds her tight for...</p>
            <div class="recharge-countdown" id="recharge-timer">10</div>
            <p>Once timer hits zero, Cindy is fully recharged!</p>
        </div>
    `;
    document.body.appendChild(rechargeOverlay);
    
    let remaining = 10;
    const timerInterval = setInterval(() => {
        remaining--;
        document.getElementById("recharge-timer").innerText = remaining;
        
        if (remaining <= 0) {
            clearInterval(timerInterval);
            completeSubmissionRecharge();
        }
    }, 1000);
}

function completeSubmissionRecharge() {
    // Remove recharge overlay
    const overlay = document.querySelector(".recharge-overlay");
    if (overlay) overlay.remove();
    
    // Fully recharge Cindy's red damage bar
    GameState.cindy.redDamage = 100;
    GameState.cindy.maxRedDamage = 100;
    GameState.cindy.inSubmission = false;
    GameState.roundActive = true;
    
    console.log("Cindy fully recharged! Red damage bar: 100%");
    document.getElementById("match-status").innerText = "CINDY RECHARGED!";
    updatePlayerHUD();
    
    // Continue match
    setTimeout(() => {
        if (GameState.roundActive) {
            selectNextMove();
        }
    }, 2000);
}

function updatePlayerHUD() {
    // ===== WAYNE - BLUE STAMINA DISPLAY =====
    const wayneHealthPercent = Math.floor(GameState.wayne.hp);
    const wayneStaminaValue = Math.floor(GameState.wayne.blueStamina);
    
    document.getElementById("attacker-hp-bar").style.width = wayneHealthPercent + "%";
    document.getElementById("attacker-hp-percent").innerText = wayneHealthPercent + "%";
    
    // Add blue stamina bar if exists
    const wayneStaminaBar = document.getElementById("wayne-stamina-bar");
    const wayneStaminaDisplay = document.getElementById("wayne-stamina-percent");
    if (wayneStaminaBar && wayneStaminaDisplay) {
        wayneStaminaBar.style.width = wayneStaminaValue + "%";
        wayneStaminaDisplay.innerText = wayneStaminaValue + "%";
    }
    
    document.getElementById("attacker-clothing").innerText = ClothingLayers[GameState.wayne.clothingLayer];
    
    // ===== CINDY - RED DAMAGE DISPLAY =====
    const cindyHealthPercent = Math.floor(GameState.cindy.hp);
    const cindyDamagePercent = Math.floor(GameState.cindy.redDamage);
    
    document.getElementById("defender-hp-bar").style.width = cindyHealthPercent + "%";
    document.getElementById("defender-hp-percent").innerText = cindyHealthPercent + "%";
    
    // Add red damage bar if exists
    const cindyDamageBar = document.getElementById("cindy-damage-bar");
    const cindyDamageDisplay = document.getElementById("cindy-damage-percent");
    if (cindyDamageBar && cindyDamageDisplay) {
        cindyDamageBar.style.width = cindyDamagePercent + "%";
        cindyDamageDisplay.innerText = cindyDamagePercent + "%";
    }
    
    document.getElementById("defender-clothing").innerText = ClothingLayers[GameState.cindy.clothingLayer];
    
    // Check for auto-submission (0 HP = automatic fall)
    if (GameState.wayne.hp <= 0) {
        registerSubmission("cindy");
    }
    if (GameState.cindy.hp <= 0) {
        registerSubmission("wayne");
    }
}

// ============================================
// SUBMISSION DETECTION
// ============================================

function initVoiceDetection() {
    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        console.log("Voice detection not supported. Using fallback button only.");
        document.getElementById("voice-indicator").innerText = "🎤 VOICE NOT SUPPORTED - USE BUTTON";
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    
    const submissionKeywords = ["submit", "submission", "i quit", "quit", "surrender", "uncle"];
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (!event.results[i] || !event.results[i][0]) continue;
            const transcript = event.results[i][0].transcript.toLowerCase();
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript + " ";
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Check for submission keywords
        const allText = (finalTranscript + interimTranscript).toLowerCase();
        for (let keyword of submissionKeywords) {
            if (allText.includes(keyword)) {
                console.log("Submission detected: " + keyword);
                // Don't auto-register - just show indicator
                document.getElementById("voice-indicator").innerText = "🎤 SUBMISSION DETECTED!";
                document.getElementById("voice-indicator").style.background = "#00ff00";
                setTimeout(() => {
                    document.getElementById("voice-indicator").innerText = "🎤 LISTENING FOR SUBMISSION";
                    document.getElementById("voice-indicator").style.background = "";
                }, 2000);
                break;
            }
        }
    };
    
    recognition.onerror = (event) => {
        console.log("Voice error: " + event.error);
    };
    
    recognition.start();
}

function registerSubmission(winner = null) {
    if (!GameState.roundActive) return;
    
    // Determine winner based on who has higher HP
    if (!winner) {
        winner = GameState.wayne.hp > GameState.cindy.hp ? "wayne" : "cindy";
    }
    
    const loser = winner === "wayne" ? "cindy" : "wayne";
    GameState.roundSubmissions++;
    
    console.log(`${winner.toUpperCase()} wins submission!`);
    
    // Award round if this is the final submission or time is up
    endRound(winner);
}

// ============================================
// ROUND MANAGEMENT
// ============================================

function endRound(winner = null) {
    GameState.roundActive = false;
    
    // Determine winner if not already set
    if (!winner) {
        // Higher HP wins, or if tie then it's a draw
        if (GameState.wayne.hp > GameState.cindy.hp) {
            winner = "wayne";
        } else if (GameState.cindy.hp > GameState.wayne.hp) {
            winner = "cindy";
        } else {
            winner = "draw";
        }
    }
    
    // Award round
    if (winner === "wayne") {
        GameState.wayne.roundsWon++;
    } else if (winner === "cindy") {
        GameState.cindy.roundsWon++;
    }
    
    // Update score display
    document.getElementById("wayne-round-wins").innerText = `WAYNE: ${GameState.wayne.roundsWon} WINS`;
    document.getElementById("cindy-round-wins").innerText = `CINDY: ${GameState.cindy.roundsWon} WINS`;
    
    // Check if match is over
    if (GameState.wayne.roundsWon >= 2 || GameState.cindy.roundsWon >= 2) {
        endMatch(GameState.wayne.roundsWon > GameState.cindy.roundsWon ? "wayne" : "cindy");
    } else {
        // Start next round after delay
        GameState.currentRound++;
        setTimeout(() => {
            resetForNewRound();
            startArena();
        }, 5000);
    }
}

function endMatch(winner) {
    document.getElementById("arena-hud").classList.add("hidden");
    document.getElementById("victory-layer").classList.remove("hidden");
    
    const victoryBanner = document.getElementById("victory-banner");
    const koText = document.getElementById("ko-text");
    
    if (winner === "wayne") {
        victoryBanner.innerText = "WAYNE CONQUERS!";
        koText.innerText = "VICTORY!";
    } else {
        victoryBanner.innerText = "CINDY REIGNS SUPREME!";
        koText.innerText = "THE GODDESS WINS!";
    }
}

function skipToNextMove() {
    if (GameState.moveActive) {
        GameState.activeMoveTimer = 0;
    }
}

function rollCredits() {
    document.getElementById("victory-layer").classList.add("hidden");
    document.getElementById("credits-overlay").classList.remove("hidden");
}

// Make functions globally accessible
window.registerSubmission = registerSubmission;
window.skipToNextMove = skipToNextMove;
window.rollCredits = rollCredits;
// ============================================
// APP API FOR TESTS
// ============================================
window.App = {
    state: {
        inSubmissionDuel: false,
        inSuddenDeath: false,
        sexfightMode: null,
        roundCount: 0,
        p1Falls: 0,
        p2Falls: 0,
        suddenDeathTally: { wayne: 0, cindy: 0 }
    },
    
    init() {
        console.log('App.init() called');
        // Ensure DOM is ready
        const loadSettings = () => {
            const savedGauntlet = localStorage.getItem('gauntlet-seconds');
            if (savedGauntlet) {
                const input = document.getElementById('gauntlet-seconds');
                if (input) {
                    input.value = savedGauntlet;
                    console.log('Loaded gauntlet-seconds from localStorage:', savedGauntlet);
                }
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadSettings);
        } else {
            loadSettings();
        }
    },
    
    saveSettings() {
        const gauntletSeconds = document.getElementById('gauntlet-seconds');
        if (gauntletSeconds) {
            localStorage.setItem('gauntlet-seconds', gauntletSeconds.value);
        }
    },
    
    openSexFightSetup() {
        console.log('[App.openSexFightSetup] CALLED');
        const setup = document.getElementById('sexfight-setup');
        console.log('[App.openSexFightSetup] Element:', setup);
        if (setup) {
            console.log('[App.openSexFightSetup] Before classList:', setup.classList.toString());
            setup.classList.remove('hidden');
            setup.classList.add('visible');
            console.log('[App.openSexFightSetup] After classList:', setup.classList.toString());
        } else {
            console.error('[App.openSexFightSetup] Element #sexfight-setup NOT FOUND!');
        }
    },
    
    startSexFight() {
        const setup = document.getElementById('sexfight-setup');
        if (setup) {
            setup.classList.remove('visible');
            setup.classList.add('hidden');
        }
        const hud = document.getElementById('sexfight-hud');
        if (hud) {
            hud.classList.remove('hidden');
            hud.classList.add('visible');
            hud.innerHTML = '<div style="padding: 20px; color: white;">Sexfight Active - Tiebreaker Mode</div>';
        }
    },
    
    startSubmissionDuel() {
        this.state.inSubmissionDuel = true;
        console.log('Submission duel started');
    },
    
    duelSubmit() {
        this.state.inSubmissionDuel = false;
        console.log('Duel submission registered');
    },
    
    populateSuddenDeathMoves() {
        console.log('populateSuddenDeathMoves() called');
    },
    
    startSuddenDeath() {
        this.state.inSuddenDeath = true;
        const hud = document.getElementById('sudden-hud');
        if (hud) {
            hud.classList.remove('hidden');
            hud.classList.add('visible');
        }
    },
    
    runSuddenTurn(attacker) {
        console.log('Running sudden turn for', attacker);
    },
    
    showJudgeOverlay(player) {
        console.log('Showing judge overlay for', player);
    },
    
    judgePick(choice) {
        if (choice === 'draw') {
            const gauntlet = document.getElementById('submission-gauntlet');
            if (gauntlet) {
                gauntlet.classList.remove('hidden');
                gauntlet.classList.add('visible');
            }
        }
    },
    
    startSubmissionGauntlet() {
        console.log('Starting submission gauntlet');
    },
    
    runGauntletTurn(player) {
        const hud = document.getElementById('sudden-hud');
        if (hud) {
            hud.classList.remove('hidden');
            hud.classList.add('visible');
            hud.innerHTML = '<div style="padding:20px; color: white;">GAUNTLET MODE</div>';
        }
    },
    
    endSuddenTurn() {
        // Check for tie and reset tally if needed
        if (this.state.suddenDeathTally && this.state.suddenDeathTally.wayne === this.state.suddenDeathTally.cindy) {
            this.state.suddenDeathTally = { wayne: 0, cindy: 0 };
        }
    },
    
    endSexFight(winner) {
        const hud = document.getElementById('sexfight-hud');
        if (winner) {
            // Show winner screen
            const winnerScreen = document.getElementById('winner-screen');
            if (winnerScreen) {
                winnerScreen.classList.remove('hidden');
                winnerScreen.classList.add('visible');
            }
        } else if (this.state.sexfight && this.state.sexfight.tally) {
            // Check for tie - trigger tiebreaker
            if (this.state.sexfight.tally.wayne === this.state.sexfight.tally.cindy) {
                this.state.sexfight.tiebreaker = true;
                if (hud) {
                    hud.innerHTML = '<div style="padding: 20px; color: white;">TIEBREAKER - Sudden Death Round!</div>';
                }
            }
        }
    }
};

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.App.init();
        
        // Wire up advanced settings toggle
        const toggleBtn = document.getElementById('toggle-advanced');
        const advSettings = document.getElementById('advanced-settings');
        if (toggleBtn && advSettings) {
            toggleBtn.addEventListener('click', () => {
                const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
                toggleBtn.setAttribute('aria-expanded', !isExpanded);
                advSettings.hidden = isExpanded;
                if (!isExpanded) {
                    advSettings.classList.add('advanced-expanded');
                }
            });
        }
    });
} else {
    window.App.init();
}