// js/mechanics.js

const App = {
    state: {
        attacker: 'wayne',
        p1Health: 100, p2Health: 100,
        p1Layer: 0, p2Layer: 0,
        p1Falls: 0, p2Falls: 0, 
        stipulation: 'STANDARD',
        timer: null, pinTimer: null,
        currentCard: null, silentMode: false, isFinisher: false,
        wins: { wayne: 0, cindy: 0 },
        roundCount: 0,
        isSetupPhase: false
    },
    
    synth: window.speechSynthesis,

    // --- INITIALIZATION ---
    loadHistory: function() {
        const stored = localStorage.getItem('ubc_history');
        if (stored) this.state.wins = JSON.parse(stored);
        this.updateHUD();
    },

    init: async function() {
        this.state.silentMode = document.getElementById('silent-mode').checked;
        
        // Hide start screen immediately to avoid blocking on mobile when fullscreen/wakeLock prompt appears
        document.getElementById('start-screen').style.display = 'none';
        // Mark that a match is now running so responsive UI can show/hide controls appropriately
        if (typeof document !== 'undefined' && document.body) document.body.classList.add('in-match');
        
        // Samsung/Android Optimizations (don't await; run async and ignore errors so init continues)
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(e => console.log("Fullscreen failed", e));
        }
        if ('wakeLock' in navigator) {
            navigator.wakeLock.request('screen').catch(e => console.log("WakeLock failed", e));
        }
        
        // 1. SELECT STIPULATION
        const keys = Object.keys(STIPULATIONS);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        this.state.stipulation = randomKey;
        const config = STIPULATIONS[randomKey];
        
        document.getElementById('stipulation-banner').innerText = config.name;
        
        // 2. RESET STATE FOR NEW MATCH
        this.state.p1Health = 100; this.state.p2Health = 100;
        this.state.p1Falls = 0; this.state.p2Falls = 0;
        this.state.p1Layer = 0; this.state.p2Layer = 0;
        this.state.roundCount = 0;
        
        // Sudden Death Rule
        if (this.state.stipulation === 'SUDDEN_DEATH') {
            this.state.p1Health = 50; this.state.p2Health = 50;
        }

        // Coin Toss
        this.state.attacker = Math.random() < 0.5 ? 'wayne' : 'cindy';
        this.updateHUD();
        this.updateClothingUI();
        
        this.announce(`Match Type: ${config.name}. ${config.desc}`, 'high');
        
        setTimeout(() => this.nextRound(), 4000);
    },

    // --- GAME LOOP ---
    nextRound: function() {
        this.stopTimer();
        this.state.roundCount++;

        // Rule Checks
        if (this.state.roundCount === 12) this.announce("SUDDEN DEATH! Healing Disabled!", 'high');
        if (this.state.p1Health <= 0 || this.state.p2Health <= 0) { this.triggerEndGame(); return; }
        
        // Secret Trigger (5% chance, disabled in late game)
        if (this.state.roundCount < 12 && Math.random() < 0.05) { 
            this.triggerSecret(); return; 
        }

        this.resetUI();
        const att = this.state.attacker;
        const oppHealth = att === 'wayne' ? this.state.p2Health : this.state.p1Health;
        
        // Deck Selection (Finisher vs General)
        let deck;
        if (oppHealth < 25) {
            deck = DATA[att].finishers;
            this.state.isFinisher = true;
            document.body.style.background = "#200"; // Red background for danger
        } else {
            deck = [...DATA.general, ...DATA[att].moves];
            this.state.isFinisher = false;
            document.body.style.background = "#000000";
        }

        // Pick Card
        const move = deck[Math.floor(Math.random() * deck.length)];
        this.state.currentCard = move;
        const attackerName = att.toUpperCase();
        
        // Update UI Text
        document.getElementById('event-badge').style.display = this.state.isFinisher ? 'block' : 'none';
        document.getElementById('event-badge').innerText = this.state.isFinisher ? 'FINISHER' : 'MOVE';
        
        // Image Loading with Fallback and smooth fade
        const img = document.getElementById('main-image');
        // Reset visibility and handlers
        img.classList.remove('main-visible');
        img.onload = function() {
            // Fade in when the image has loaded
            this.classList.add('main-visible');
        };
        img.onerror = function() {
            // prevent infinite loop if placeholder fails
            this.onerror = null;
            this.src = `https://placehold.co/600x400/111/fff?text=${encodeURIComponent(move.name)}`;
            this.classList.add('main-visible');
        };
        // Set new source (this will trigger onload or onerror)
        img.src = move.img; 

        // --- SETUP PHASE ---
        this.state.isSetupPhase = true;
        document.getElementById('controls-area').style.opacity = '0.5';
        document.getElementById('btn-success').disabled = true;
        
        // Special Audio for Blindfold Match
        let prefix = "";
        if (this.state.stipulation === 'BLINDFOLD') prefix = "Attacker, Cover your eyes. ";
        
        this.announce(`${prefix}${attackerName}, Get Ready... ${move.name}`, 'normal');
        document.getElementById('sub-text').innerText = "Get into position...";
        
        // Yellow Bar Animation (5s)
        const bar = document.getElementById('timer-fill');
        bar.style.transition = 'none'; bar.style.width = '100%'; bar.style.background = 'yellow';
        void bar.offsetWidth; 
        bar.style.transition = `width 5s linear`; bar.style.width = '0%';

        this.state.timer = setTimeout(() => {
            this.state.isSetupPhase = false;
            document.getElementById('controls-area').style.opacity = '1';
            document.getElementById('btn-success').disabled = false;
            
            this.announce("ACTION! HOLD IT!", 'high');
            document.getElementById('sub-text').innerText = move.desc;
            
            const actionTime = this.state.isFinisher ? 15 : 45; 
            this.startActionTimer(actionTime);
        }, 5000);
    },

    startActionTimer: function(seconds) {
        const bar = document.getElementById('timer-fill');
        bar.style.transition = 'none'; bar.style.width = '100%'; 
        bar.style.background = this.state.isFinisher ? 'red' : 'var(--gold)';
        void bar.offsetWidth; 
        bar.style.transition = `width ${seconds}s linear`; bar.style.width = '0%';
        
        this.state.timer = setTimeout(() => {
            this.announce("Break! Reset Position.", 'normal');
            
            // --- TIME LIMIT EXPIRED ---
            // Forced swap on stalemate
            this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
            setTimeout(() => this.nextRound(), 2000);
            
        }, seconds * 1000);
    },

    // --- INTERACTION HANDLERS ---
    handleSuccess: function() {
        this.stopTimer();
        // Visual Juice
        document.body.classList.add('shake-screen');
        setTimeout(() => document.body.classList.remove('shake-screen'), 400);

        if (this.state.isFinisher) {
            // Check Match Type logic
            if (this.state.stipulation === 'SUBMISSION') {
                this.announce("SUBMISSION HOLD APPLIED! MAKE THEM TAP!", 'high');
                this.startPinfall(); 
            } else {
                this.startPinfall();
            }
        } else {
            // Normal Move Logic
            const dmg = 15;
            let target = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
            
            if (target === 'cindy') this.state.p2Health -= dmg;
            else this.state.p1Health -= dmg;
            
            this.updateHUD();
            
            // Check if clothes fall off
            if (this.checkStripCondition(target)) return;
            
            // Heal if both alive
            if (this.state.p1Health > 0 && this.state.p2Health > 0) {
                // Trigger reward (Swap happens inside here now)
                this.triggerSensualReward();
            } else {
                this.nextRound();
            }
        }
    },

    handleTapOut: function() {
        this.stopTimer();
        this.announce("SUBMISSION! HE TAPS!", 'high');
        
        // 2/3 Falls Logic
        if (this.state.stipulation === 'TWO_OF_THREE') {
            this.triggerEndGame(); // This handles counting the fall
            return; 
        }

        // Standard Match Penalty
        if (this.state.attacker === 'wayne') {
             this.state.p2Health -= 25; this.checkStripCondition('cindy');
        } else {
             this.state.p1Health -= 25; this.checkStripCondition('wayne');
        }
        
        // Forced Swap on Tapout
        this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
        
        this.updateHUD();
        setTimeout(() => this.nextRound(), 2000);
    },

    handleReversal: function() {
        this.stopTimer();
        this.announce("REVERSAL!", 'high');
        
        // Penalty for attacker getting reversed
        if (this.state.attacker === 'wayne') this.state.p1Health -= 10; 
        else this.state.p2Health -= 10;
        
        // Switch Roles
        this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
        this.updateHUD();
        
        // Check if damage caused strip
        if (this.checkStripCondition(this.state.attacker === 'wayne' ? 'cindy' : 'wayne')) return;
        
        setTimeout(() => this.nextRound(), 2000);
    },

    // --- STRIP LOGIC ---
    checkStripCondition: function(player) {
        let health = player === 'wayne' ? this.state.p1Health : this.state.p2Health;
        let layer = player === 'wayne' ? this.state.p1Layer : this.state.p2Layer;
        let shouldBeLayer = 0;

        // Thresholds: 75% -> 50% -> 25%
        if (health < 25) shouldBeLayer = 3;
        else if (health < 50) shouldBeLayer = 2;
        else if (health < 75) shouldBeLayer = 1;

        if (shouldBeLayer > layer) {
            const item = WARDROBE[player][layer]; 
            this.triggerStripEvent(player, item);
            
            if (player === 'wayne') this.state.p1Layer++; 
            else this.state.p2Layer++;
            
            this.updateClothingUI();
            return true; // Stop game flow to show overlay
        }
        return false;
    },

    triggerStripEvent: function(player, item) {
        // Keep controls visible; show overlay above arena but beneath sticky controls on mobile
        const ol = document.getElementById('strip-screen');
        ol.style.display = 'flex';
        document.getElementById('strip-player-name').innerText = player.toUpperCase();
        document.getElementById('strip-item-name').innerText = item;
        this.announce(`WARDROBE MALFUNCTION! ${player}, remove your ${item}!`, 'high');
    },

    confirmStrip: function() {
        document.getElementById('strip-screen').style.display = 'none';
        this.announce("Resume Match!", 'normal');
        
        // Forced Swap after Strip Event
        this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
        this.nextRound();
    },

    // --- PINFALL & EVENTS ---
    startPinfall: function() {
        // Keep controls visible; show kickout overlay above arena but beneath sticky controls on mobile
        const overlay = document.getElementById('kickout-overlay');
        overlay.style.display = 'flex';
        
        // UI Text based on Match Type
        if (this.state.stipulation === 'SUBMISSION') {
            document.getElementById('kickout-title').innerText = "LOCKED IN!";
            document.getElementById('btn-kickout').innerText = "RESIST";
            document.getElementById('kickout-sub').innerText = "TAP REPEATEDLY TO ESCAPE";
        } else {
            document.getElementById('kickout-title').innerText = "PINFALL!";
            document.getElementById('btn-kickout').innerText = "KICKOUT!";
            document.getElementById('kickout-sub').innerText = "ONE TAP TO SURVIVE";
        }

        this.announce("ONE!", 'high');

        let count = 1;
        this.state.pinTimer = setInterval(() => {
            count++;
            if (count === 2) this.announce("TWO!", 'high');
            if (count === 3) {
                // Game Over
                clearInterval(this.state.pinTimer);
                this.announce(this.state.stipulation === 'SUBMISSION' ? "TAPPED OUT!" : "THREE!", 'win');
                
                // Kill Health
                if (this.state.attacker === 'wayne') this.state.p2Health = 0;
                else this.state.p1Health = 0;
                this.updateHUD();
                
                setTimeout(() => {
                    document.getElementById('kickout-overlay').style.display = 'none';
                    this.triggerEndGame();
                }, 1000);
            }
        }, 1200); // 1.2 second count cadence
    },

    attemptKickout: function() {
        // Successful Escape
        clearInterval(this.state.pinTimer);
        document.getElementById('kickout-overlay').style.display = 'none';
        
        // Adrenaline Heal
        if (this.state.attacker === 'wayne') this.state.p2Health += 15;
        else this.state.p1Health += 15;
        
        this.updateHUD();
        this.announce("ESCAPED!", 'high');
        
        // Successful kickout resets neutral/swaps
        this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
        
        setTimeout(() => {
            this.nextRound();
        }, 2000);
    },

    triggerSensualReward: function() {
        // Block healing in Sudden Death or late rounds
        if (this.state.stipulation === 'SUDDEN_DEATH' || this.state.roundCount >= 12) {
            this.announce("NO REST! Switching Sides!", 'high');
            this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
            setTimeout(() => this.nextRound(), 2000);
            return;
        }

        const reward = DATA.sensual[Math.floor(Math.random() * DATA.sensual.length)];
        // Keep controls visible but dim during sensual reward
        document.getElementById('controls-area').style.opacity = '0.25'; 
        this.announce(`BONUS: ${reward.name}`);
        document.getElementById('sub-text').innerText = reward.desc;
        document.body.style.background = "#1a0b2e"; // Purple tint
        
        // Heal
        this.state.p1Health = Math.min(100, this.state.p1Health + 10);
        this.state.p2Health = Math.min(100, this.state.p2Health + 10);
        this.updateHUD();
        
        // Reward Timer
        const bar = document.getElementById('timer-fill');
        bar.style.transition = 'none'; bar.style.width = '100%'; bar.style.background = '#9b59b6';
        void bar.offsetWidth; 
        bar.style.transition = `width ${reward.timer}s linear`; bar.style.width = '0%';
        
        this.state.timer = setTimeout(() => {
             document.getElementById('controls-area').style.opacity = '1';
             
             // --- FORCED SWAP AFTER REWARD ---
             this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
             this.announce("Roles Switched! Fight!", 'high');
             
             setTimeout(() => this.nextRound(), 1500);
        }, reward.timer * 1000);
    },

    triggerSecret: function() {
        const secret = DATA.secrets[Math.floor(Math.random() * DATA.secrets.length)];
        document.getElementById('event-badge').style.display = 'block';
        document.getElementById('event-badge').innerText = "SECRET";
        document.body.style.background = "#2c0e36"; 
        this.announce(`SECRET: ${secret.name}`, 'high');
        document.getElementById('sub-text').innerText = secret.desc;
        
        if (secret.name === "HARDCORE MATCH") {
            this.state.p1Layer = 3; this.state.p2Layer = 3;
            this.updateClothingUI();
        }
        if (secret.name === "ROLE SWAP") this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
        
        setTimeout(() => { this.announce("Resume Match", 'normal'); this.nextRound(); }, 5000); 
    },

    // --- ENDGAME & FALLS ---
    triggerEndGame: function() {
        const winner = this.state.p1Health > 0 ? "wayne" : "cindy";
        const loser = winner === "wayne" ? "cindy" : "wayne";
        
        // 2 OUT OF 3 FALLS LOGIC
        if (this.state.stipulation === 'TWO_OF_THREE') {
            if (winner === 'wayne') this.state.p1Falls++;
            else this.state.p2Falls++;
            this.updateHUD();
            
            // If neither has 2 wins yet, restart round
            if (this.state.p1Falls < 2 && this.state.p2Falls < 2) {
                this.announce(`Winner of this fall: ${winner.toUpperCase()}! Resetting!`, 'high');
                this.state.p1Health = 100; this.state.p2Health = 100;
                this.updateHUD();
                
                // Loser of the fall starts the next round
                this.state.attacker = loser;
                
                setTimeout(() => { this.announce("Round 2... FIGHT!", 'high'); this.nextRound(); }, 4000);
                return; 
            }
        }

        // SAVE STATS
        this.state.wins[winner]++;
        localStorage.setItem('ubc_history', JSON.stringify(this.state.wins));
        
        this.announce(`WINNER: ${winner.toUpperCase()}!`, 'win');
        setTimeout(() => {
            // End of match — remove match state so controls hide and start screen/punishment display cleanly
            if (typeof document !== 'undefined' && document.body) document.body.classList.remove('in-match');
            document.getElementById('punishment-screen').style.display = 'flex';
            document.getElementById('punish-msg').innerText = `${loser} lost. Select Punishment.`;
        }, 4000);
    },
    
    resetData: function() {
        if(confirm("Reset all history?")) { localStorage.removeItem('ubc_history'); location.reload(); }
    },

    spinPunishment: function(cat) {
        document.getElementById('punish-options').style.display = 'none';
        const list = DATA.punishments[cat];
        const result = list[Math.floor(Math.random() * list.length)];
        document.getElementById('punish-result').style.display = 'block';
        document.getElementById('punish-title').innerText = cat.toUpperCase();
        document.getElementById('punish-desc').innerText = result;
    },

    // --- UI HELPERS ---
    announce: function(text, priority = 'normal') {
        const titleEl = document.getElementById('instruction-text');
        const subEl = document.getElementById('sub-text');
        if(text.includes(':')) {
            const parts = text.split(':'); titleEl.innerText = parts[0]; subEl.innerText = parts[1];
        } else {
            titleEl.innerText = text; subEl.innerText = "";
        }
        document.body.classList.remove('flash'); void document.body.offsetWidth; document.body.classList.add('flash');

        if (this.state.silentMode) {
            if (navigator.vibrate) {
                if (priority === 'high') navigator.vibrate([100, 50, 100]); else navigator.vibrate(200);
            }
        } else {
            this.synth.cancel();
            // TTS cleanup
            const u = new SpeechSynthesisUtterance(text.replace(':', '. '));
            u.rate = 1.1; u.pitch = 0.9;
            this.synth.speak(u);
        }
    },

    updateHUD: function() {
        // Win Stats
        document.getElementById('p1-stats').innerText = `${this.state.wins.wayne} Wins`;
        document.getElementById('p2-stats').innerText = `${this.state.wins.cindy} Wins`;
        
        // Dot display for Falls match
        if (this.state.stipulation === 'TWO_OF_THREE') {
             document.getElementById('p1-falls').innerText = "●".repeat(this.state.p1Falls);
             document.getElementById('p2-falls').innerText = "●".repeat(this.state.p2Falls);
        } else {
             document.getElementById('p1-falls').innerText = "";
             document.getElementById('p2-falls').innerText = "";
        }
        
        // Champion Logic
        let champ = "VACANT";
        let stats = `Series Tied ${this.state.wins.wayne}-${this.state.wins.cindy}`;
        if (this.state.wins.wayne > this.state.wins.cindy) champ = "WAYNE";
        else if (this.state.wins.cindy > this.state.wins.wayne) champ = "CINDY";
        document.getElementById('champ-name').innerText = champ;
        document.getElementById('champ-stats').innerText = stats;

        // Health Bars
        const p1 = document.getElementById('p1-bar'); const p2 = document.getElementById('p2-bar');
        p1.style.width = Math.max(0, this.state.p1Health) + '%';
        p2.style.width = Math.max(0, this.state.p2Health) + '%';
        
        // Critical Animation
        if (this.state.p1Health < 25) p1.parentElement.classList.add('critical'); else p1.parentElement.classList.remove('critical');
        if (this.state.p2Health < 25) p2.parentElement.classList.add('critical'); else p2.parentElement.classList.remove('critical');
    },

    updateClothingUI: function() {
        const wLabels = ["Fully Clothed", "Shirtless", "Pants Off", "Danger Zone"];
        const cLabels = ["Fully Clothed", "Topless", "Bottoms Off", "Danger Zone"];
        document.getElementById('p1-clothing').innerText = wLabels[Math.min(3, this.state.p1Layer)];
        document.getElementById('p2-clothing').innerText = cLabels[Math.min(3, this.state.p2Layer)];
    },

    resetUI: function() {
        document.getElementById('controls-area').style.opacity = '1';
        document.getElementById('controls-area').style.display = 'flex';
        
        // Hide main image between moves for a cleaner transition (fade-out then remove)
        const _img = document.getElementById('main-image');
        _img.classList.remove('main-visible');
        setTimeout(() => { _img.style.display = 'none'; }, 400);
        
        // --- BUTTON TEXT RESET ---
        document.getElementById('btn-success').innerText = "SUBMITTED";
        // -------------------------
        
        document.getElementById('btn-success').disabled = false;
        document.getElementById('kickout-overlay').style.display = 'none';
        document.getElementById('strip-screen').style.display = 'none';
        
        // Dynamic Colors based on attacker
        const root = document.documentElement;
        
        // Add "Active Turn" Highlight
        const p1Card = document.querySelector('.player-card:first-child');
        const p2Card = document.querySelector('.player-card:last-child');
        
        if (this.state.attacker === 'wayne') {
            root.style.setProperty('--active-color', 'var(--p1-color)');
            p1Card.classList.add('active-turn');
            p2Card.classList.remove('active-turn');
        } else {
            root.style.setProperty('--active-color', 'var(--p2-color)');
            p2Card.classList.add('active-turn');
            p1Card.classList.remove('active-turn');
        }
    },

    stopTimer: function() {
        clearTimeout(this.state.timer);
        const bar = document.getElementById('timer-fill');
        const w = window.getComputedStyle(bar).width;
        bar.style.transition = 'none'; bar.style.width = w;
    }
};

// Ensure `App` is available as a property on `window` so inline handlers (onclick="App...") work
if (typeof window !== 'undefined') window.App = App;