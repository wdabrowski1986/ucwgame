// js/mechanics.js

const App = {
    state: {
        attacker: 'wayne',
        // Increase base health to make matches longer; damage and heals scale relative to maxHealth
        maxHealth: 150,
        p1Health: 150, p2Health: 150,
        // Scalable damage/heal percentages
        baseDamagePercent: 0.12,   // 12% of maxHealth per successful move
        pinHealPercent: 0.08,      // 8% of maxHealth for successful kickout
        sensualHealPercent: 0.07,  // 7% heal during sensual rewards
                // How many seconds of break between the 'Get Ready' and 'ACTION' phase
        setupDelaySeconds: 8,
        // STRIP behavior probabilities (chance for removal when threshold crossed)
        // Key = layer-to-become (1,2,3). For example, 0.5 means 50% chance to remove to that layer.
        stripChance: { 1: 0.45, 2: 0.65, 3: 0.9 },

        // Mini punishment settings (chance to trigger small punishment between moves and duration)
        minPunishChance: 0.28,
        minPunishDuration: 8,

        // Combo / Momentum
        combo: 0,                   // current consecutive successful moves by the attacker
        comboBonusPercent: 0.10,    // 10% extra damage per additional combo step
        comboMaxMultiplier: 2.0,    // maximum damage multiplier (2x)

        p1Layer: 0, p2Layer: 0,
        p1Falls: 0, p2Falls: 0, 
        stipulation: 'STANDARD',
        timer: null, pinTimer: null,
        currentCard: null, silentMode: false, isFinisher: false,
        wins: { wayne: 0, cindy: 0 },
        roundCount: 0,
        isSetupPhase: false,
        // Match intensity preference: SOFT, NORMAL, ROUGH
        intensity: 'NORMAL',
        tapCount: 0,
        skipCount: 0,
        // TWO_OF_THREE: seconds per gauntlet turn (default 10)
        twoOfThreeRoundSeconds: 10,
        advancedOpen: false,
        // Configurable per-round caps and thresholds
        maxSkipsPerRound: 3,
        tapThresholds: { medium: 3, big: 8 },
        // Submission duel state
        inSubmissionDuel: false,
        duelRefusals: 0,
        duelMaxRefusals: 3,
        duelPhrase: null,
        // Count of pressurer exchanges (incremented each time pressurer flips)
        duelExchangeCount: 0,
        // Blindfold peek penalty (fraction of maxHealth) - small
        peekPenaltyPercent: 0.04,
        peeking: false,
        // Player-defined stakes (strings describing what they'll lose/perform on loss)
        stakes: { wayne: '', cindy: '' }
    },


    // Phrases used in Submission Duel
    submissionPhrases: [
        "I submit to you.",
        "I'm yours.",
        "I'm your submissive.",
        "You're my master.",
        "I belong to you."
    ],

    // --- SUDDEN DEATH HELPERS ---
    populateSuddenDeathMoves: function() {
        // Fill move selects with possible moves (general + each player's moves)
        const wayneMoves = [...DATA.general, ...DATA.wayne.moves];
        const cindyMoves = [...DATA.general, ...DATA.cindy.moves];
        const wSel = document.getElementById('sd-move-wayne'); const cSel = document.getElementById('sd-move-cindy');
        if (!wSel || !cSel) return;
        wSel.innerHTML = ''; cSel.innerHTML = '';
        wayneMoves.forEach(m => { const opt = document.createElement('option'); opt.value = m.name; opt.innerText = m.name; wSel.appendChild(opt); });
        cindyMoves.forEach(m => { const opt = document.createElement('option'); opt.value = m.name; opt.innerText = m.name; cSel.appendChild(opt); });
    },

    startSuddenDeath: function() {
        // Read selections and hide setup
        const wSel = document.getElementById('sd-move-wayne'); const cSel = document.getElementById('sd-move-cindy');
        if (!wSel || !cSel) { this.announce('Move selection missing.', 'normal'); return; }
        const wName = wSel.value; const cName = cSel.value;
        // Find move objects
        const allMoves = DATA.general.concat(DATA.wayne.moves).concat(DATA.cindy.moves);
        const wMove = allMoves.find(m => m.name === wName) || allMoves[0];
        const cMove = allMoves.find(m => m.name === cName) || allMoves[0];
        this.state.suddenMoves = { wayne: wMove, cindy: cMove };
        document.getElementById('sudden-death-setup').style.display = 'none'; document.body.classList.remove('overlay-open');
        this.announce('Sudden Death moves locked. Wayne will perform first.', 'high');
        // Initialize tallies
        this.state.suddenDeathTally = { wayne: 0, cindy: 0 };
        // Begin first turn (Wayne first)
        setTimeout(() => { this.runSuddenTurn('wayne'); }, 1200);
    },

    runSuddenTurn: function(actor) {
        // actor performs their chosen move on opponent; opponent taps to escape and those taps count toward actor's tally
        this.state.suddenActor = actor; this.state.inSuddenDeathAction = true;
        const move = (this.state.suddenMoves && this.state.suddenMoves[actor]) ? this.state.suddenMoves[actor] : (DATA.general[0] || {name:'Unknown', desc:''});
        const defender = (actor === 'wayne') ? 'cindy' : 'wayne';
        document.getElementById('instruction-text').innerText = `${actor.toUpperCase()} performs: ${move.name}`;
        document.getElementById('sub-text').innerText = `Defender (${defender.toUpperCase()}) tap to escape — taps recorded.`;
        // Show current tally HUD
        const hud = document.getElementById('sudden-hud'); if (hud) hud.style.display = 'block';
        this.updateSuddenHUD();
        // Action time based on intensity mapping (SOFT 45, NORMAL 60, ROUGH 90)
        const seconds = this.actionTimeForCurrentIntensity();
        this.startActionTimer(seconds);
        // When timer ends, callback will call endSuddenTurn via startActionTimer's timeout
        // We set a small flag so addTap routes to tally
    },

    endSuddenTurn: function() {
        // Called when the current sudden action times out
        const actor = this.state.suddenActor;
        this.state.inSuddenDeathAction = false; this.state.suddenActor = null;
        // Hide HUD briefly
        const hud = document.getElementById('sudden-hud'); if (hud) hud.style.display = 'none';
        // Determine if we need to run the other actor's turn
        if (!this.state._suddenSecondDone) {
            // First turn just completed; run second
            this.state._suddenSecondDone = true;
            const next = (actor === 'wayne') ? 'cindy' : 'wayne';
            this.announce(`${actor.toUpperCase()}'s turn complete. Now ${next.toUpperCase()} performs.`, 'normal');
            setTimeout(() => { this.runSuddenTurn(next); }, 900);
            return;
        }
        // Both turns done: evaluate winner
        const w = this.state.suddenDeathTally.wayne || 0; const c = this.state.suddenDeathTally.cindy || 0;
        if (w === c) {
            this.announce(`Tie (${w} — ${c}). Sudden Death tie-breaker!`, 'high');
            // Reset for another short tie-break: shorter action time
            this.state._suddenSecondDone = false; this.state.suddenDeathTally = { wayne:0, cindy:0 };
            setTimeout(() => { this.runSuddenTurn((Math.random() < 0.5) ? 'wayne' : 'cindy'); }, 1200);
            return;
        }
        const winner = (w > c) ? 'wayne' : 'cindy'; const loser = (winner === 'wayne') ? 'cindy' : 'wayne';
        this.announce(`Sudden Death winner: ${winner.toUpperCase()} (${w} — ${c}). Harsh punishment incoming.`, 'win');
        // Apply BIG punishment to loser
        this.applyPunishmentBySeverity('BIG', loser);
        // Clean-up
        this.state._suddenSecondDone = false; this.state.suddenDeathTally = null;
    },

    updateSuddenHUD: function() {
        const hud = document.getElementById('sudden-hud'); if (!hud) return;
        hud.innerText = `Sudden Death — Wayne: ${this.state.suddenDeathTally.wayne || 0}  •  Cindy: ${this.state.suddenDeathTally.cindy || 0}`;
    },

    // --- ROUND & TAP HELPERS ---
    // Return action time seconds based on intensity mapping
    actionTimeForCurrentIntensity: function() {
        if (this.state.isFinisher) return 15;
        const i = this.state.intensity || 'NORMAL';
        if (i === 'SOFT') return 45; // easy
        if (i === 'ROUGH') return 90; // intense
        return 60; // NORMAL
    },

    // Update skip UI (badge text and disabled state)
    updateSkipUI: function() {
        const btn = document.getElementById('btn-skip');
        if (!btn) return;
        const max = this.state.maxSkipsPerRound || 3;
        const used = this.state.skipCount || 0;
        const remaining = Math.max(0, max - used);
        btn.innerText = `SKIP MOVE (${remaining}/${max})`;
        btn.disabled = remaining <= 0;
    },

    addTap: function() {
        if (this.state.isSetupPhase) return; // cannot tap during setup
        // If we're in Sudden Death action, this tap counts toward the current attacker's tally
        if (this.state.inSuddenDeathAction && this.state.suddenActor) {
            const attacker = this.state.suddenActor;
            this.state.suddenDeathTally = this.state.suddenDeathTally || { wayne:0, cindy:0 };
            this.state.suddenDeathTally[attacker] = (this.state.suddenDeathTally[attacker] || 0) + 1;
            this.updateSuddenHUD();
            this.vibrate([30], true);
            return;
        }
        // Gauntlet taps: defender taps during actor's gauntlet move — count toward actor's tally
        if (this.state.inGauntletAction && this.state.gauntletActor) {
            const attacker = this.state.gauntletActor;
            this.state.gauntletTally = this.state.gauntletTally || { wayne:0, cindy:0 };
            this.state.gauntletTally[attacker] = (this.state.gauntletTally[attacker] || 0) + 1;
            const hud = document.getElementById('sudden-hud'); if (hud) hud.innerText = `Gauntlet — Wayne: ${this.state.gauntletTally.wayne} • Cindy: ${this.state.gauntletTally.cindy}`;
            this.vibrate([30], true);
            return;
        }
        this.state.tapCount = (this.state.tapCount || 0) + 1;
        const el = document.getElementById('tap-count'); if (el) el.innerText = this.state.tapCount;
        this.vibrate([40], true);
    },


    openRoundSummary: function() {
        // Stop timers and show summary
        try { clearTimeout(this.state.timer); } catch(e) {}
        try { this.stopCountdown(); } catch(e) {}
        document.getElementById('round-summary-taps').innerText = this.state.tapCount || 0;
        document.getElementById('round-summary').style.display = 'flex';
        document.body.classList.add('overlay-open');
    },

    confirmRoundResult: function(action) {
        // action: 'punish'|'escaped'|'survived'|'quit'
        document.getElementById('round-summary').style.display = 'none';
        document.body.classList.remove('overlay-open');
        if (action === 'escaped') {
            this.announce('Opponent escaped!', 'normal');
            // swap attacker
            this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
            this.resetCombo();
            setTimeout(() => this.nextRound(), 1200);
            return;
        }
        if (action === 'survived') {
            this.announce('Round ended — survived!', 'normal');
            this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
            this.resetCombo();
            setTimeout(() => this.nextRound(), 1200);
            return;
        }
        if (action === 'quit') {
            // immediate big punishment
            this.announce('Mercy granted — big punishment incoming!', 'high');
            this.applyPunishmentBySeverity('BIG');
            return;
        }
        // 'punish' path: determine severity based on tapCount
        const taps = this.state.tapCount || 0;
        let sev = 'MINI';
        const med = (this.state.tapThresholds && this.state.tapThresholds.medium) ? this.state.tapThresholds.medium : 3;
        const big = (this.state.tapThresholds && this.state.tapThresholds.big) ? this.state.tapThresholds.big : 8;
        if (taps >= big) sev = 'BIG';
        else if (taps >= med) sev = 'MEDIUM';
        this.announce(`Applying ${sev} punishment based on ${taps} submissions.`, 'high');
        // If this is a Submission stipulation, start a Submission Duel instead of immediate punishment
        if (this.state.stipulation === 'SUBMISSION') {
            this.startSubmissionDuel();
            // reset local tap counter (duel will manage further outcomes)
            this.state.tapCount = 0; const tEl = document.getElementById('tap-count'); if (tEl) tEl.innerText = '0';
            return;
        }
        this.applyPunishmentBySeverity(sev);
        // Reset tap counter after applying punishment
        this.state.tapCount = 0; const tEl = document.getElementById('tap-count'); if (tEl) tEl.innerText = '0';
    },

    quitRound: function() {
        // Immediate quit triggers big punishment path
        this.announce('I QUIT ROUND — immediate mercy.', 'high');
        // stop timers
        try { clearTimeout(this.state.timer); } catch(e) {}
        try { this.stopCountdown(); } catch(e) {}
        this.state.tapCount = 999; // sentinel for quit
        this.confirmRoundResult('quit');
    },

    // --- PEEK (BLINDFOLD) ---
    peek: function() {
        if (this.state.stipulation !== 'BLINDFOLD') { this.announce('Peek is only available in Blindfold matches.', 'normal'); return; }
        if (this.state.isSetupPhase) { this.announce('Cannot peek during setup.', 'normal'); return; }
        if (this.state.peeking) return; // already peeking
        this.state.peeking = true;
        // Show image briefly
        const img = document.getElementById('main-image');
        const oldDisplay = img.style.display;
        try { img.style.display = 'block'; } catch(e) {}
        // Apply small self-penalty to attacker (much smaller than normal damage)
        const penalty = Math.round((this.state.peekPenaltyPercent || 0.04) * this.state.maxHealth);
        if (this.state.attacker === 'wayne') this.state.p1Health = Math.max(0, this.state.p1Health - penalty);
        else this.state.p2Health = Math.max(0, this.state.p2Health - penalty);
        this.updateHUD();
        this.announce(`Peek used — ${penalty} HP penalty applied to ${this.state.attacker.toUpperCase()}.`, 'normal');
        // Disable peek button while visible
        try { const pb = document.getElementById('btn-peek'); if (pb) { pb.disabled = true; } } catch(e) {}
        setTimeout(() => {
            try { img.style.display = oldDisplay || 'none'; } catch(e) {}
            try { const pb = document.getElementById('btn-peek'); if (pb) { pb.disabled = false; } } catch(e) {}
            this.state.peeking = false;
            // If penalty killed the player, check endgame
            if (this.state.p1Health <= 0 || this.state.p2Health <= 0) { this.triggerEndGame(); }
        }, 1400);
    },

    // --- SUBMISSION DUEL HANDLERS ---
    startSubmissionDuel: function() {
        // Cancel timers and prepare duel
        try { clearTimeout(this.state.timer); } catch(e) {}
        try { this.stopCountdown(); } catch(e) {}
        this.state.inSubmissionDuel = true;
        this.state.duelRefusals = 0;
        this.state.duelExchangeCount = 0; // reset exchange counter
        // Initial pressurer is current attacker
        this.state.duelPressurer = this.state.attacker;
        const idx = Math.floor(Math.random() * this.submissionPhrases.length);
        this.state.duelPhrase = this.submissionPhrases[idx];
        // Update UI
        const el = document.getElementById('submission-duel'); if (el) el.style.display = 'flex';
        const pEl = document.getElementById('submission-duel-phrase'); if (pEl) pEl.innerText = this.state.duelPhrase;
        const dEl = document.getElementById('duel-refusals'); if (dEl) dEl.innerText = this.state.duelRefusals;
        const mEl = document.getElementById('duel-max'); if (mEl) mEl.innerText = this.state.duelMaxRefusals;
        const pressEl = document.getElementById('duel-pressurer-name'); if (pressEl) pressEl.innerText = this.state.duelPressurer.toUpperCase();
        document.body.classList.add('overlay-open');
        this.announce('Submission Duel started! Pressure the defender to yield.', 'high');
    },

    endSubmissionDuel: function() {
        this.state.inSubmissionDuel = false;
        this.state.duelRefusals = 0; this.state.duelPhrase = null;
        const el = document.getElementById('submission-duel'); if (el) el.style.display = 'none';
        document.body.classList.remove('overlay-open');
    },

    // --- TWO-OF-THREE (NO-HOLDS) HELPERS ---
    showJudgeOverlay: function(presumedWinner) {
        const el = document.getElementById('two-judge'); if (!el) return; el.style.display = 'flex';
        document.body.classList.add('overlay-open');
        const ctx = document.getElementById('judge-context'); if (ctx) ctx.innerText = `Presumed winner: ${presumedWinner.toUpperCase()}. Confirm or select Draw.`;
    },

    judgePick: function(choice) {
        // hide overlay and process choice
        try { document.getElementById('two-judge').style.display = 'none'; document.body.classList.remove('overlay-open'); } catch(e) {}
        // Clear any provisional winner marker
        this.state.pendingFallWinner = null;
        if (choice === 'draw') {
            this.announce('Fall marked as Draw.', 'normal');
            // If match is tied after 3 rounds, start submission gauntlet
            if (this.state.roundCount >= 3 && this.state.p1Falls === this.state.p2Falls) {
                try { document.getElementById('submission-gauntlet').style.display = 'flex'; document.body.classList.add('overlay-open'); } catch(e) {}
                return;
            }
            // otherwise, continue to next round
            this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
            this.resetCombo();
            setTimeout(() => this.nextRound(), 1200);
            return;
        }
        // assign fall to chosen
        if (choice === 'wayne') this.state.p1Falls++; if (choice === 'cindy') this.state.p2Falls++;
        // clear any pending provisional marker
        this.state.pendingFallWinner = null;
        this.updateHUD();
        // If someone has 2 falls, finish match
        if (this.state.p1Falls >= 2 || this.state.p2Falls >= 2) {
            const winner = (this.state.p1Falls >= 2) ? 'wayne' : 'cindy';
            this.endMatchWithWinner(winner);
            return;
        }
        // Otherwise reset health and continue
        this.announce(`Fall awarded to ${choice.toUpperCase()}. Resetting for next fall.`, 'high');
        this.state.p1Health = 100; this.state.p2Health = 100; this.updateHUD();
        // Loser of fall starts next round
        const loser = (choice === 'wayne') ? 'cindy' : 'wayne';
        this.state.attacker = loser; this.resetCombo();
        setTimeout(() => this.nextRound(), 1800);
    },

    endMatchWithWinner: function(winner) {
        const loser = (winner === 'wayne') ? 'cindy' : 'wayne';
        this.state.wins[winner]++;
        localStorage.setItem('ubc_history', JSON.stringify(this.state.wins));
        this.announce(`WINNER: ${winner.toUpperCase()}!`, 'win');
        this.vibrate([300,100,300], true);
        setTimeout(() => {
            if (typeof document !== 'undefined' && document.body) document.body.classList.remove('in-match');
            document.body.classList.add('overlay-open');
            document.getElementById('winner-name').innerText = `${winner.toUpperCase()}`;
            const ws = document.getElementById('winner-screen'); ws.style.display = 'flex'; ws.classList.add('show-belt');
            if (this._autoPunishTimer) clearTimeout(this._autoPunishTimer);
            this._autoPunishTimer = setTimeout(() => { this.openPunishmentSelection(); }, 5000);
        }, 4000);
    },

    // --- SUBMISSION GAUNTLET ---
    startSubmissionGauntlet: function() {
        // small wrapper: pick a random mutual submission move and start gauntlet flow
        const move = DATA.general[Math.floor(Math.random() * DATA.general.length)] || {name:'Submission', desc:''};
        this.state.gauntletMove = move;
        this.state.gauntletTally = { wayne:0, cindy:0 };
        this.state._gauntletSecondDone = false;
        document.getElementById('submission-gauntlet').style.display = 'none'; document.body.classList.remove('overlay-open');
        this.announce(`Gauntlet move: ${move.name}. Wayne begins.`, 'high');
        setTimeout(() => { this.runGauntletTurn('wayne'); }, 900);
    },

    runGauntletTurn: function(actor) {
        // Custom timer flow for gauntlet (do not use standard startActionTimer which advances rounds)
        this.state.gauntletActor = actor; this.state.inGauntletAction = true;
        const move = this.state.gauntletMove; const defender = (actor === 'wayne') ? 'cindy' : 'wayne';
        document.getElementById('instruction-text').innerText = `${actor.toUpperCase()} performs: ${move.name}`;
        document.getElementById('sub-text').innerText = `Defender (${defender.toUpperCase()}) tap to escape — taps recorded.`;
        const hud = document.getElementById('sudden-hud'); if (hud) { hud.style.display = 'block'; hud.innerText = `Gauntlet — Wayne: ${this.state.gauntletTally.wayne} • Cindy: ${this.state.gauntletTally.cindy}`; }
        const seconds = this.state.twoOfThreeRoundSeconds || 10;

        // Visual timer bar
        const bar = document.getElementById('timer-fill');
        bar.style.transition = 'none'; bar.style.width = '100%';
        bar.style.background = 'var(--gold)'; void bar.offsetWidth; bar.style.transition = `width ${seconds}s linear`; bar.style.width = '0%';
        // Numeric countdown
        this.startCountdown(seconds);
        // Use a dedicated timeout so we can call endGauntletTurn when time expires
        try { if (this.state.timer) clearTimeout(this.state.timer); } catch(e) {}
        this.state.timer = setTimeout(() => {
            this.stopCountdown();
            this.endGauntletTurn();
        }, seconds * 1000);
    },

    endGauntletTurn: function() {
        const actor = this.state.gauntletActor; this.state.inGauntletAction = false; this.state.gauntletActor = null;
        if (!this.state._gauntletSecondDone) {
            this.state._gauntletSecondDone = true; const next = (actor === 'wayne') ? 'cindy' : 'wayne'; this.announce(`${actor.toUpperCase()} complete. Now ${next.toUpperCase()} performs.`, 'normal'); setTimeout(()=>this.runGauntletTurn(next), 900); return;
        }
        // resolve
        const w = this.state.gauntletTally.wayne || 0; const c = this.state.gauntletTally.cindy || 0;
        if (w === c) { this.announce(`Gauntlet Tie (${w} — ${c}). Sudden Handshake — rematch!`, 'high'); this.state._gauntletSecondDone = false; this.state.gauntletTally = {wayne:0, cindy:0}; setTimeout(()=>this.runGauntletTurn((Math.random()<0.5)?'wayne':'cindy'),1200); return; }
        const winner = (w>c)?'wayne':'cindy'; const loser = (winner==='wayne')?'cindy':'wayne';
        // Hide gauntlet HUD and reset flags
        const hud = document.getElementById('sudden-hud'); if (hud) { hud.style.display = 'none'; hud.innerText = ''; }
        document.getElementById('instruction-text').innerText = '';
        document.getElementById('sub-text').innerText = '';
        this.announce(`Gauntlet winner: ${winner.toUpperCase()} — stakes apply!`, 'win');
        this.applyPunishmentBySeverity('BIG', loser);
        this.state._gauntletSecondDone = false; this.state.gauntletTally = null;
    },

    // --- ROUND & TAP HELPERS ---
    // Return action time seconds based on intensity mapping

    duelSubmit: function() {
        // Defender submits (or confirms phrase) -> immediate BIG punishment
        // Determine who submitted (defender = opposite of current pressurer)
        const pressurer = this.state.duelPressurer || this.state.attacker;
        const loser = (pressurer === 'wayne') ? 'cindy' : 'wayne';
        this.endSubmissionDuel();
        this.announce(`${loser.toUpperCase()} submitted to ${pressurer.toUpperCase()} — BIG punishment incoming!`, 'high');
        // Pass loser into punishment flow so UI and logic know who to punish
        this.applyPunishmentBySeverity('BIG', loser);
    },


    duelSayPhrase: function() {
        // Prompt to confirm whether phrase was said as part of the duel
        try {
            const phrase = this.state.duelPhrase || this.submissionPhrases[Math.floor(Math.random() * this.submissionPhrases.length)];
            const ok = confirm(`Say aloud: "${phrase}"\n\nDid they say it? (OK = yes, Cancel = no)`);
            if (ok) { this.duelSubmit(); return; }
            this.duelRefuseContinue();
        } catch(e) { console.warn('duelSayPhrase failed', e); this.duelRefuseContinue(); }
    },

    duelRefuseContinue: function() {
        this.state.duelRefusals = (this.state.duelRefusals || 0) + 1;
        const dEl = document.getElementById('duel-refusals'); if (dEl) dEl.innerText = this.state.duelRefusals;
        if (this.state.duelRefusals >= (this.state.duelMaxRefusals || 3)) {
            this.announce('Refusals exceeded — forcing submission!', 'high');
            this.duelSubmit();
            return;
        }
        // Alternate pressurer (back-and-forth)
        this.state.duelPressurer = (this.state.duelPressurer === 'wayne') ? 'cindy' : 'wayne';
        // Make the duel pressurer the current attacker so rerolled moves come from them
        this.state.attacker = this.state.duelPressurer;
        const pressEl = document.getElementById('duel-pressurer-name'); if (pressEl) pressEl.innerText = this.state.duelPressurer.toUpperCase();
        // Count this exchange (each flip counts); after a full back-and-forth (2 flips) remove clothing
        this.state.duelExchangeCount = (this.state.duelExchangeCount || 0) + 1;
        if (this.state.duelExchangeCount % 2 === 0) { try { this.performDuelExchangeClothingRemoval(); } catch(e){ console.warn('performDuelExchangeClothingRemoval failed', e); } }
        this.announce('Refused — pressure switches sides. Re-rolling next submission move.', 'normal');
        this.rerollDuelMove();
    },

    rerollDuelMove: function() {
        // Similar to skip re-roll but avoids consuming skip counters
        const att = this.state.attacker;
        const oppHealth = att === 'wayne' ? this.state.p2Health : this.state.p1Health;
        let deck;
        if (oppHealth < (0.25 * this.state.maxHealth)) {
            deck = DATA[att].finishers; this.state.isFinisher = true; document.body.style.background = "#200";
        } else {
            deck = [...DATA.general, ...DATA[att].moves]; this.state.isFinisher = false; document.body.style.background = "#000000";
        }
        const move = deck[Math.floor(Math.random() * deck.length)];
        this.state.currentCard = move;
        // Update UI image and start a short setup for the duel move
        const img = document.getElementById('main-image');
        const self = this;
        img.onload = function() { this.classList.add('main-visible'); this.onclick = function(e){ e.stopPropagation(); self.toggleImageZoom(); }; };
        img.onerror = function() { this.onerror = null; this.src = `https://placehold.co/600x400/111/fff?text=${encodeURIComponent(move.name)}`; this.classList.add('main-visible'); this.onclick = function(e){ e.stopPropagation(); self.toggleImageZoom(); }; };
        img.src = move.img; img.style.display = 'block';

        this.state.isSetupPhase = true;
        document.getElementById('controls-area').style.opacity = '0.5';
        const setupSec = this.state.setupDelaySeconds || 5;
        const bar2 = document.getElementById('timer-fill');
        bar2.style.transition = 'none'; bar2.style.width = '100%'; bar2.style.background = 'yellow'; void bar2.offsetWidth; bar2.style.transition = `width ${setupSec}s linear`; bar2.style.width = '0%';
        this.startCountdown(setupSec);
        try { clearTimeout(this.state.timer); } catch(e) {}
        this.state.timer = setTimeout(() => {
            this.stopCountdown(); this.state.isSetupPhase = false; document.getElementById('controls-area').style.opacity = '1'; this.announce('Continue Submission Duel — action!', 'high'); document.getElementById('sub-text').innerText = move.desc; const actionTime = this.state.isFinisher ? 15 : this.actionTimeForCurrentIntensity(); this.startActionTimer(actionTime);
        }, setupSec * 1000);
    },

    performDuelExchangeClothingRemoval: function() {
        // Queue the players who still have clothing to remove and show the strip overlay for each in sequence
        const queue = [];
        ['wayne','cindy'].forEach(p => {
            const layer = (p === 'wayne') ? this.state.p1Layer : this.state.p2Layer;
            const item = (WARDROBE && WARDROBE[p]) ? WARDROBE[p][layer] : undefined;
            if (typeof item !== 'undefined') queue.push(p);
        });
        if (!queue.length) { this.announce('No more clothing to remove.', 'normal'); return; }

        // Prepare duel strip queue state
        this.state.duelStripActive = true;
        this.state.duelStripQueue = queue;
        // Show the first player's strip overlay
        const first = this.state.duelStripQueue[0];
        this.state.duelStripCurrent = first;
        const layer = (first === 'wayne') ? this.state.p1Layer : this.state.p2Layer;
        const item = (WARDROBE && WARDROBE[first]) ? WARDROBE[first][layer] : 'clothing';
        // Use a special subtitle for duel-mode removal
        const subtitle = document.querySelector('#strip-screen .strip-subtitle');
        try { if (subtitle) subtitle.innerText = 'DUEL REMOVAL — remove one item, then press DONE'; } catch(e) {}
        this.triggerStripEvent(first, item);
    },

    applyPunishmentBySeverity: function(sev, loser) {
        // Optionally record who the punishment will target (for UI and tracking)
        if (loser) this.state.pendingPunishLoser = loser; else this.state.pendingPunishLoser = null;
        // Map severity to punishment categories (fallback to any allowed category)
        const order = (sev === 'BIG') ? ['domination','erotic','sensual','playful'] : (sev === 'MEDIUM') ? ['sensual','domination','erotic','playful'] : ['playful','sensual','domination','erotic'];
        let chosen = null;
        for (const c of order) { if (this.isCategoryAllowed(c)) { chosen = c; break; } }
        if (!chosen) { this.announce('No permitted punishment categories for current intensity.', 'normal'); setTimeout(() => { this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne'; this.nextRound(); }, 1200); return; }
        // Spin punishment of chosen category
        setTimeout(() => { this.spinPunishment(chosen); }, 700);
    },

    
    synth: window.speechSynthesis,

    // Transient undo snapshot for advanced reset
    _lastAdvancedSnapshot: null,
    _undoToastTimer: null,

    showUndoToast: function(message, durationMs) {
        try {
            const toast = document.getElementById('toast'); const msg = document.getElementById('toast-msg'); const undo = document.getElementById('toast-undo');
            if (!toast || !msg || !undo) return;
            msg.innerText = message || 'Changed';
            toast.classList.add('show'); toast.style.display = 'block';
            // Ensure previous timer cleared
            if (this._undoToastTimer) { clearTimeout(this._undoToastTimer); this._undoToastTimer = null; }
            // Attach undo click once
            const onUndo = () => { try { this.undoResetAdvancedSettings(); } catch(e){} };
            undo.onclick = onUndo;
            // Auto-hide after duration
            const ms = durationMs || 6000;
            this._undoToastTimer = setTimeout(() => { try { toast.classList.remove('show'); setTimeout(()=>{ toast.style.display = 'none'; }, 210); this._lastAdvancedSnapshot = null; this._undoToastTimer = null; } catch(e){} }, ms);
        } catch(e) { console.warn('showUndoToast failed', e); }
    },

    // --- SEXFIGHT OVERLAY HELPERS ---
    showSexOverlay: function() {
        try {
            const wrap = document.getElementById('sexfight-overlay'); if(!wrap) return;
            wrap.style.display = 'flex'; // ensure it's in layout
            // a tick then add visible so transition plays
            requestAnimationFrame(()=>{ wrap.classList.add('visible'); });
        } catch(e) { console.warn('showSexOverlay failed', e); }
    },
    hideSexOverlay: function() {
        try {
            const wrap = document.getElementById('sexfight-overlay'); if(!wrap) return;
            wrap.classList.remove('visible');
            // remove after transition
            setTimeout(()=>{ try { wrap.style.display = 'none'; wrap.classList.remove('urgent'); wrap.classList.remove('tiebreaker-active'); } catch(e){} }, 320);
        } catch(e) { console.warn('hideSexOverlay failed', e); }
    },

    undoResetAdvancedSettings: function() {
        try {
            if (!this._lastAdvancedSnapshot) { this.announce('Nothing to undo.', 'normal'); return; }
            const snap = this._lastAdvancedSnapshot;
            // Restore values to state and DOM
            this.state.twoOfThreeRoundSeconds = snap.twoOfThreeRoundSeconds;
            this.state.maxSkipsPerRound = snap.maxSkipsPerRound;
            this.state.tapThresholds = Object.assign({}, snap.tapThresholds);
            this.state.stakes = Object.assign({}, snap.stakes);
            // Update DOM
            const ga = document.getElementById('gauntlet-seconds'); if (ga) ga.value = this.state.twoOfThreeRoundSeconds;
            const ms = document.getElementById('max-skips'); if (ms) ms.value = this.state.maxSkipsPerRound;
            const tm = document.getElementById('tap-threshold-medium'); if (tm) tm.value = this.state.tapThresholds.medium;
            const tb = document.getElementById('tap-threshold-big'); if (tb) tb.value = this.state.tapThresholds.big;
            const sw = document.getElementById('stake-wayne'); if (sw) sw.value = this.state.stakes.wayne || '';
            const sc = document.getElementById('stake-cindy'); if (sc) sc.value = this.state.stakes.cindy || '';
            // Persist
            this.saveSettings(); try { this.updateSkipUI(); } catch(e){}
            this.updateAdvancedSummary();
            this.announce('Advanced settings restored.', 'normal');
            // Clear snapshot & hide toast
            this._lastAdvancedSnapshot = null;
            try { const toast = document.getElementById('toast'); if (toast) { toast.classList.remove('show'); setTimeout(()=>{ toast.style.display = 'none'; },210); } } catch(e){}
            if (this._undoToastTimer) { clearTimeout(this._undoToastTimer); this._undoToastTimer = null; }
        } catch(e) { console.warn('undoResetAdvancedSettings failed', e); }
    },



    // --- INITIALIZATION ---
    loadHistory: function() {
        const stored = localStorage.getItem('ubc_history');
        if (stored) this.state.wins = JSON.parse(stored);
        this.updateHUD();
        // Load persisted UI settings (break length, silent mode, etc.)
        try { this.loadSettings(); } catch(e) { console.warn('loadSettings failed', e); }
    },

    // --- SETTINGS PERSISTENCE ---
    loadSettings: function() {
        const s = localStorage.getItem('ubc_settings');
        if (!s) return;
        let cfg;
        try { cfg = JSON.parse(s); } catch(e) { console.warn('Corrupt settings', e); return; }
        const breakInput = document.getElementById('break-length');
        if (breakInput && typeof cfg.breakLength !== 'undefined') {
            breakInput.value = cfg.breakLength;
            const valEl = document.getElementById('break-length-val'); if (valEl) valEl.innerText = cfg.breakLength + 's';
            this.state.setupDelaySeconds = parseInt(cfg.breakLength, 10) || this.state.setupDelaySeconds;
        }
        const silentChk = document.getElementById('silent-mode');
        if (silentChk && typeof cfg.silentMode !== 'undefined') { silentChk.checked = !!cfg.silentMode; this.state.silentMode = !!cfg.silentMode; document.body.classList.toggle('quiet-mode', !!cfg.silentMode); }

        // Load intensity preference if present
        if (cfg.intensity) {
            this.state.intensity = cfg.intensity;
            const sel = document.getElementById('match-intensity'); if (sel) sel.value = this.state.intensity;
            // Apply intensity mapping so loaded preferences take effect immediately
            try { this.applyIntensitySettings(); } catch(e) { console.warn('applyIntensitySettings failed', e); }
        }

        // Load maxSkips and tap thresholds if present
        if (typeof cfg.maxSkipsPerRound !== 'undefined') {
            this.state.maxSkipsPerRound = parseInt(cfg.maxSkipsPerRound, 10) || this.state.maxSkipsPerRound;
            const el = document.getElementById('max-skips'); if (el) el.value = this.state.maxSkipsPerRound;
            try { this.updateSkipUI(); } catch(e) {}
        }
        if (cfg.tapThresholds) {
            this.state.tapThresholds = this.state.tapThresholds || {};
            this.state.tapThresholds.medium = parseInt(cfg.tapThresholds.medium, 10) || this.state.tapThresholds.medium;
            this.state.tapThresholds.big = parseInt(cfg.tapThresholds.big, 10) || this.state.tapThresholds.big;
            const m = document.getElementById('tap-threshold-medium'); if (m) m.value = this.state.tapThresholds.medium;
            const b = document.getElementById('tap-threshold-big'); if (b) b.value = this.state.tapThresholds.big;
            try { this.applyIntensitySettings(); } catch(e) {}
        }

        // Load stakes if present
        if (cfg.stakes) {
            this.state.stakes = this.state.stakes || { wayne:'', cindy:'' };
            this.state.stakes.wayne = (cfg.stakes.wayne) ? String(cfg.stakes.wayne).slice(0,240) : this.state.stakes.wayne;
            this.state.stakes.cindy = (cfg.stakes.cindy) ? String(cfg.stakes.cindy).slice(0,240) : this.state.stakes.cindy;
            const sw = document.getElementById('stake-wayne'); if (sw) sw.value = this.state.stakes.wayne;
            const sc = document.getElementById('stake-cindy'); if (sc) sc.value = this.state.stakes.cindy;
        }

        // Load Gauntlet turn length if present
        if (typeof cfg.twoOfThreeRoundSeconds !== 'undefined') {
            this.state.twoOfThreeRoundSeconds = parseInt(cfg.twoOfThreeRoundSeconds, 10) || this.state.twoOfThreeRoundSeconds;
            const gs = document.getElementById('gauntlet-seconds'); if (gs) gs.value = this.state.twoOfThreeRoundSeconds;
        }
        // Load advanced panel open state if present
        if (typeof cfg.advancedOpen !== 'undefined') {
            this.state.advancedOpen = !!cfg.advancedOpen;
            const adv = document.getElementById('advanced-settings'); const tog = document.getElementById('toggle-advanced');
            if (adv) { if (this.state.advancedOpen) { adv.classList.add('advanced-expanded'); adv.classList.remove('advanced-collapsed'); adv.hidden = false; } else { adv.classList.remove('advanced-expanded'); adv.classList.add('advanced-collapsed'); adv.hidden = true; } }
            if (tog) tog.setAttribute('aria-expanded', this.state.advancedOpen ? 'true' : 'false');
        }
        // Update the advanced toggle summary to reflect loaded values
        try { this.updateAdvancedSummary(); } catch(e) { /* ignore */ }
    },

    saveSettings: function() {
        try {
            const breakInput = document.getElementById('break-length');
            const silentChk = document.getElementById('silent-mode');
            const intensitySel = document.getElementById('match-intensity');
            const cfg = {
                breakLength: breakInput ? parseInt(breakInput.value, 10) : this.state.setupDelaySeconds,
                silentMode: silentChk ? !!silentChk.checked : !!this.state.silentMode,
                intensity: intensitySel ? intensitySel.value : this.state.intensity,
                maxSkipsPerRound: (document.getElementById('max-skips') ? parseInt(document.getElementById('max-skips').value, 10) : this.state.maxSkipsPerRound),
                tapThresholds: {
                    medium: (document.getElementById('tap-threshold-medium') ? parseInt(document.getElementById('tap-threshold-medium').value, 10) : this.state.tapThresholds.medium),
                    big: (document.getElementById('tap-threshold-big') ? parseInt(document.getElementById('tap-threshold-big').value, 10) : this.state.tapThresholds.big)
                },
                stakes: {
                    wayne: (document.getElementById('stake-wayne') ? (document.getElementById('stake-wayne').value || '') : (this.state.stakes ? this.state.stakes.wayne : '')),
                    cindy: (document.getElementById('stake-cindy') ? (document.getElementById('stake-cindy').value || '') : (this.state.stakes ? this.state.stakes.cindy : ''))
                },
                twoOfThreeRoundSeconds: (document.getElementById('gauntlet-seconds') ? parseInt(document.getElementById('gauntlet-seconds').value, 10) : this.state.twoOfThreeRoundSeconds),
                advancedOpen: (document.getElementById('advanced-settings') ? !document.getElementById('advanced-settings').hidden : !!this.state.advancedOpen)
            };
            localStorage.setItem('ubc_settings', JSON.stringify(cfg));
        } catch(e) { console.warn('saveSettings failed', e); }
    },





    applyIntensitySettings: function() {
        const i = this.state.intensity || 'NORMAL';
        // Map intensity to gameplay parameters
        if (i === 'SOFT') {
            this.state.baseDamagePercent = 0.08;
            this.state.pinHealPercent = 0.06;
            this.state.sensualHealPercent = 0.12;
            this.state.comboBonusPercent = 0.06;
            this.state.comboMaxMultiplier = 1.5;
            this.state.stripChance = {1:0.25,2:0.45,3:0.65};
            this.state.minPunishChance = 0.12;
            this.state.minPunishDuration = 5;
        } else if (i === 'ROUGH') {
            this.state.baseDamagePercent = 0.18;
            this.state.pinHealPercent = 0.06;
            this.state.sensualHealPercent = 0.03;
            this.state.comboBonusPercent = 0.12;
            this.state.comboMaxMultiplier = 2.5;
            this.state.stripChance = {1:0.6,2:0.85,3:0.98};
            this.state.minPunishChance = 0.45;
            this.state.minPunishDuration = 12;
        } else {
            // NORMAL
            this.state.baseDamagePercent = 0.12;
            this.state.pinHealPercent = 0.08;
            this.state.sensualHealPercent = 0.07;
            this.state.comboBonusPercent = 0.10;
            this.state.comboMaxMultiplier = 2.0;
            this.state.stripChance = {1:0.45,2:0.65,3:0.9};
            this.state.minPunishChance = 0.28;
            this.state.minPunishDuration = 8;
        }
        // Update a small UI hint if present (short description + key params)
        const hint = document.getElementById('intensity-hint');
        if (hint) {
            let desc = 'Balanced: moderate damage, standard strip chance.';
            if (i === 'SOFT') desc = 'Soft: gentler moves, higher heal, lower strip/punish chances.';
            else if (i === 'ROUGH') desc = 'Rough: stronger moves, lower heals, higher strip/punish chances.';
            const dmgPct = Math.round(this.state.baseDamagePercent * 100);
            const stripPct = Math.round((this.state.stripChance && this.state.stripChance[1]) ? this.state.stripChance[1] * 100 : 0);
            const tMed = this.state.tapThresholds ? this.state.tapThresholds.medium : 3;
            const tBig = this.state.tapThresholds ? this.state.tapThresholds.big : 8;
            hint.innerText = `Intensity: ${i} — ${desc} (Damage ~${dmgPct}%, Strip ~${stripPct}% for layer 1). Tap thresholds: MINI 0-${tMed-1}, MEDIUM ${tMed}-${tBig-1}, BIG ${tBig}+.`;
        }
    },

    isCategoryAllowed: function(cat) {
        const i = this.state.intensity || 'NORMAL';
        if (i === 'SOFT') return ['sensual','playful'].includes(cat);
        return true;
    },

    _paused: false,

    activatePause: function() {
        if (this._paused) return;
        this._paused = true;
        try { if (this.synth) this.synth.cancel(); } catch(e){}
        this.vibrate([80,40,80], true);
        document.body.classList.add('overlay-open');
        document.getElementById('safeword-overlay').style.display = 'flex';
        // Stop the timers
        try { this.stopTimer(); if (this.state.pinTimer) { clearInterval(this.state.pinTimer); this.state.pinTimer = null; } } catch(e){}
    },

    deactivatePause: function() {
        if (!this._paused) return;
        this._paused = false;
        document.getElementById('safeword-overlay').style.display = 'none';
        document.body.classList.remove('overlay-open');
        // Resume to next round after a short delay so players can reposition
        this.vibrate([40,20,40], true);
        setTimeout(() => this.nextRound(), 1400);
    },

    togglePause: function() { if (this._paused) this.deactivatePause(); else this.activatePause(); },


    init: async function() {
        // Restore any saved settings from previous sessions
        this.state.silentMode = document.getElementById('silent-mode').checked;
        // Read configured break length if provided on the start screen
        const breakInput = document.getElementById('break-length');
        if (breakInput) {
            this.state.setupDelaySeconds = parseInt(breakInput.value, 10) || this.state.setupDelaySeconds;
            // Ensure visible label updated
            const valEl = document.getElementById('break-length-val'); if (valEl) valEl.innerText = breakInput.value + 's';
            // Save changes when user adjusts them
            breakInput.addEventListener('input', (e) => { if (valEl) valEl.innerText = e.target.value + 's'; this.state.setupDelaySeconds = parseInt(e.target.value, 10) || this.state.setupDelaySeconds; this.saveSettings(); });
        }
        const silentChk = document.getElementById('silent-mode');
        if (silentChk) { silentChk.addEventListener('change', (e) => { this.state.silentMode = !!e.target.checked; document.body.classList.toggle('quiet-mode', !!e.target.checked); this.saveSettings(); }); }
        // Persist loaded or initial settings
        this.saveSettings();
        // Ensure intensity mapping applied at start
        try { this.applyIntensitySettings(); } catch(e) { console.warn('applyIntensitySettings failed', e); }

        // Wire intensity selector changes to persist
        const intensitySel = document.getElementById('match-intensity');
        if (intensitySel) { intensitySel.addEventListener('change', (e) => { this.state.intensity = e.target.value; this.saveSettings(); try { this.applyIntensitySettings(); } catch(e){ console.warn('applyIntensitySettings failed', e); } }); }

        // Wire Max Skips input
        const maxSkipsEl = document.getElementById('max-skips');
        if (maxSkipsEl) { maxSkipsEl.addEventListener('input', (e) => { this.state.maxSkipsPerRound = Math.max(0, parseInt(e.target.value, 10) || 0); this.saveSettings(); try { this.updateSkipUI(); } catch(e){} this.updateAdvancedSummary(); }); }

        // Wire Tap threshold inputs (validate relation between medium < big)
        const tMed = document.getElementById('tap-threshold-medium');
        const tBig = document.getElementById('tap-threshold-big');
        if (tMed) { tMed.addEventListener('input', (e) => {
            let v = Math.max(1, parseInt(e.target.value, 10) || 1);
            this.state.tapThresholds = this.state.tapThresholds || {};
            this.state.tapThresholds.medium = v;
            if (this.state.tapThresholds.big && v >= this.state.tapThresholds.big) { this.state.tapThresholds.big = v + 1; if (tBig) tBig.value = this.state.tapThresholds.big; }
            this.saveSettings(); try { this.applyIntensitySettings(); } catch(e){}
        }); }
        if (tBig) { tBig.addEventListener('input', (e) => {
            let v = Math.max(2, parseInt(e.target.value, 10) || 2);
            this.state.tapThresholds = this.state.tapThresholds || {};
            this.state.tapThresholds.big = v;
            if (this.state.tapThresholds.medium && v <= this.state.tapThresholds.medium) { this.state.tapThresholds.medium = Math.max(1, v - 1); if (tMed) tMed.value = this.state.tapThresholds.medium; }
            this.saveSettings(); try { this.applyIntensitySettings(); } catch(e){}
        }); }

        // Wire stakes inputs
        const stakeW = document.getElementById('stake-wayne');
        const stakeC = document.getElementById('stake-cindy');
        if (stakeW) { stakeW.addEventListener('input', (e) => { this.state.stakes = this.state.stakes || {}; this.state.stakes.wayne = e.target.value.slice(0,240); this.saveSettings(); }); }
        if (stakeC) { stakeC.addEventListener('input', (e) => { this.state.stakes = this.state.stakes || {}; this.state.stakes.cindy = e.target.value.slice(0,240); this.saveSettings(); }); }

        // Wire gauntlet seconds input to state and persist
        const gaunt = document.getElementById('gauntlet-seconds');
        if (gaunt) { gaunt.addEventListener('input', (e) => { this.state.twoOfThreeRoundSeconds = Math.max(3, parseInt(e.target.value, 10) || 10); this.saveSettings(); this.updateAdvancedSummary(); }); }

        // Wire advanced toggle
        const toggleAdvanced = document.getElementById('toggle-advanced');
        const adv = document.getElementById('advanced-settings');
        if (toggleAdvanced && adv) {
            const setAdv = (open) => {
                const willOpen = !!open;
                // idempotent
                if (this.state.advancedOpen === willOpen) return;
                this.state.advancedOpen = willOpen;
                toggleAdvanced.setAttribute('aria-expanded', this.state.advancedOpen ? 'true' : 'false');
                if (this.state.advancedOpen) {
                    // Opening: make visible then add expanded class for transition
                    adv.hidden = false;
                    // allow layout to update then animate
                    requestAnimationFrame(() => {
                        adv.classList.add('advanced-expanded'); adv.classList.remove('advanced-collapsed');
                    });
                } else {
                    // Closing: remove expanded class to trigger transition, then hide after transition completes
                    adv.classList.remove('advanced-expanded'); adv.classList.add('advanced-collapsed');
                    // hide after transition duration (match CSS 320ms)
                    setTimeout(() => { try { adv.hidden = true; } catch(e){} }, 340);
                }
                this.saveSettings();
                this.updateAdvancedSummary();
            };
            // initialize from loaded state (loadSettings() may have set this.state.advancedOpen already)
            setAdv(!!this.state.advancedOpen);
            toggleAdvanced.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); setAdv(!this.state.advancedOpen); });
        }

        // Wire long-press resume button on the safeword overlay to avoid accidental resume
        const resumeBtn = document.getElementById('btn-resume');
        if (resumeBtn) {
            let pressTimer = null;
            const startHold = () => { pressTimer = setTimeout(()=>{ this.deactivatePause(); }, 900); };
            const cancelHold = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };
            resumeBtn.addEventListener('touchstart', startHold, { passive: true }); resumeBtn.addEventListener('mousedown', startHold);
            resumeBtn.addEventListener('touchend', cancelHold, { passive: true }); resumeBtn.addEventListener('mouseup', cancelHold);
        }

        // Mobile improvements: try to lock portrait and wire resume button
        try {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('portrait').catch(e => console.log('Orientation lock failed', e));
            }
        } catch(e) { /* ignore */ }



        // Hide start screen immediately to avoid blocking on mobile when fullscreen/wakeLock prompt appears
        document.getElementById('start-screen').style.display = 'none';
        // Auto-collapse advanced settings when a match starts for a cleaner UX
        try {
            const adv = document.getElementById('advanced-settings');
            const tog = document.getElementById('toggle-advanced');
            if (adv) { adv.hidden = true; adv.classList.remove('advanced-expanded'); adv.classList.add('advanced-collapsed'); }
            if (tog) { tog.setAttribute('aria-expanded', 'false'); tog.innerText = 'Show Advanced ▾'; }
            this.state.advancedOpen = false; this.saveSettings();
        } catch(e) { /* ignore if not present */ }
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
        
        // Pick a referee (the Ref picks the stipulation)
        const REFS = ['Ref Morgan','Ref Quinn','Ref Blake','Ref Taylor','Ref Casey'];
        const ref = REFS[Math.floor(Math.random() * REFS.length)];
        this.state.refName = ref;
        const refEl = document.getElementById('ref-name'); if (refEl) refEl.innerText = `Referee: ${ref}`;
        // Announce referee and match type for drama
        this.announce(`Referee ${ref} selects ${config.name}. ${config.desc}`, 'high');
        document.getElementById('stipulation-banner').innerText = config.name;
        
        // 2. RESET STATE FOR NEW MATCH
        this.state.p1Health = this.state.maxHealth; this.state.p2Health = this.state.maxHealth;
        this.state.p1Falls = 0; this.state.p2Falls = 0;
        this.state.p1Layer = 0; this.state.p2Layer = 0;
        this.state.roundCount = 0;
        
        // Sudden Death Rule (50% of max health)
        if (this.state.stipulation === 'SUDDEN_DEATH') {
            const half = Math.round(this.state.maxHealth / 2);
            this.state.p1Health = half; this.state.p2Health = half;
            // Disable healing for Sudden Death
            this.state.pinHealPercent = 0;
            this.state.sensualHealPercent = 0;
        }

        // Coin Toss
        this.state.attacker = Math.random() < 0.5 ? 'wayne' : 'cindy';
        this.updateHUD();
        this.updateClothingUI();
        
        this.announce(`Match Type: ${config.name}. ${config.desc}`, 'high');

        // If Sudden Death, show move selection modal before first round
        if (this.state.stipulation === 'SUDDEN_DEATH') {
            try { this.populateSuddenDeathMoves(); document.getElementById('sudden-death-setup').style.display = 'flex'; document.body.classList.add('overlay-open'); } catch(e){ console.warn('Failed to show Sudden Death setup', e); setTimeout(() => this.nextRound(), 4000); }
        } else if (this.state.stipulation === 'SEXFIGHT') {
            try { document.getElementById('sexfight-setup').style.display = 'flex'; document.body.classList.add('overlay-open'); } catch(e){ console.warn('Failed to show Sexfight setup', e); setTimeout(() => this.nextRound(), 4000); }
        } else {
            setTimeout(() => this.nextRound(), 4000);
        }

        // --- SEXFIGHT HELPERS ---
    },

    openSexFightSetup: function() {
        try { document.getElementById('sexfight-setup').style.display = 'flex'; document.body.classList.add('overlay-open'); } catch(e) {}
    },

    startSexFight: function() {
        // Read settings
        try { document.getElementById('sexfight-setup').style.display = 'none'; document.body.classList.remove('overlay-open'); } catch(e) {}
        const modeEl = document.querySelector('input[name="sexf-mode"]:checked'); const durEl = document.getElementById('sexfight-duration');
        const mode = modeEl ? modeEl.value : 'MOST'; const dur = durEl ? Math.max(10, parseInt(durEl.value, 10) || 60) : 60;
        this.state.sexfight = { mode: mode, duration: dur, tally: { wayne:0, cindy:0 }, timestamps: { wayne:[], cindy:[] }, started: true, startTime: Date.now(), endTime: Date.now() + dur*1000, tiebreaker: false };
        // Show HUD & enable orgasm buttons
        const hud = document.getElementById('sexfight-hud'); if (hud) { hud.style.display = 'block'; }
        try { document.getElementById('btn-orgasm-wayne').style.display = 'inline-block'; document.getElementById('btn-orgasm-cindy').style.display = 'inline-block'; } catch(e) {}
        this.updateSexFightHUD();
        this.announce(`Sexfight started: ${mode}. ${dur} seconds. Go!`, 'high');
        // Start timer
        try { if (this.state._sexfTimer) clearTimeout(this.state._sexfTimer); } catch(e) {}
        this.state._sexfTimer = setTimeout(() => { this.endSexFight(); }, dur * 1000);
        // show numeric countdown using a dedicated interval
        try { if (this.state._sexfCountdownInterval) clearInterval(this.state._sexfCountdownInterval); } catch(e) {}
        this.state._sexfCountdownInterval = setInterval(() => {
            try {
                if (!this.state.sexfight || !this.state.sexfight.endTime) return;
                const rem = Math.max(0, Math.ceil((this.state.sexfight.endTime - Date.now()) / 1000));
                const el = document.getElementById('sexfight-countdown'); if (el) el.innerText = rem + 's';
                // Also update centered overlay
                const overlay = document.getElementById('sexfight-overlay-count'); if (overlay) overlay.innerText = rem + 's';
                const overlayWrap = document.getElementById('sexfight-overlay'); if (overlayWrap) { if (!overlayWrap.classList.contains('visible')) this.showSexOverlay(); if (rem <= 10) overlay.classList.add('urgent'); else overlay.classList.remove('urgent'); }
                if (rem <= 0) {
                    clearInterval(this.state._sexfCountdownInterval); this.state._sexfCountdownInterval = null;
                    // hide overlay once the timed session has ended (unless tiebreaker is activated separately)
                    try { this.hideSexOverlay(); } catch(e) {}
                }
            } catch(e) { }
        }, 250);
        // show numeric countdown on standard countdown too
        try { this.startCountdown(dur); } catch(e) {}
    },

    orgasm: function(player) {
        if (!this.state.sexfight || !this.state.sexfight.started) { this.announce('Not in Sexfight mode.', 'normal'); return; }
        // record event
        const now = Date.now();
        this.state.sexfight.tally[player] = (this.state.sexfight.tally[player] || 0) + 1;
        this.state.sexfight.timestamps[player] = this.state.sexfight.timestamps[player] || [];
        this.state.sexfight.timestamps[player].push(now);
        this.updateSexFightHUD();
        this.vibrate([40], true);
        // Tiebreaker immediate win: if currently in tiebreaker, next orgasm wins
        if (this.state.sexfight.tiebreaker) { this.endSexFight(player); return; }
        // Mode-specific immediate resolutions
        if (this.state.sexfight.mode === 'FIRST') {
            // First orgasm wins immediately
            this.endSexFight(player);
            return;
        }
        if (this.state.sexfight.mode === 'LAST') {
            // If both have orgasmed, compare last timestamp
            const wts = this.state.sexfight.timestamps.wayne || [];
            const cts = this.state.sexfight.timestamps.cindy || [];
            if (wts.length > 0 && cts.length > 0) {
                const wLast = wts[wts.length-1]; const cLast = cts[cts.length-1];
                if (wLast === cLast) {
                    // Simultaneous; start tiebreaker sudden-death
                    this.announce('Simultaneous orgasm — Tiebreaker: next orgasm wins (no time limit).', 'high');
                    this.state.sexfight.tiebreaker = true;
                    // Disable any timers and keep buttons active
                    try { if (this.state._sexfTimer) { clearTimeout(this.state._sexfTimer); this.state._sexfTimer = null; } } catch(e) {}
                    try { this.stopCountdown(); } catch(e) {}
                    try { if (this.state._sexfCountdownInterval) { clearInterval(this.state._sexfCountdownInterval); this.state._sexfCountdownInterval = null; } } catch(e) {}
                    const hud = document.getElementById('sexfight-hud'); if (hud) { hud.innerText = `TIEBREAKER — Next orgasm wins (no time limit)`; hud.classList.add('tiebreaker-active'); }
                    // Hide the centered overlay with a fade
                    try { this.hideSexOverlay(); } catch(e) {}
                    return;
                }
                const winner = (wLast > cLast) ? 'wayne' : 'cindy'; this.endSexFight(winner); return;
            }
        }
    },

    updateSexFightHUD: function() {
        try { const hud = document.getElementById('sexfight-hud'); if (!hud || !this.state.sexfight) return; const t = this.state.sexfight.tally || {wayne:0,cindy:0}; const mode = this.state.sexfight.mode; hud.innerText = `${mode} — Time ${this.state.sexfight.duration}s — Wayne: ${t.wayne} • Cindy: ${t.cindy}`; } catch(e) { }
    },

    endSexFight: function(winner) {
        // If winner provided, immediate; otherwise evaluate based on mode
        try { if (this.state._sexfTimer) { clearTimeout(this.state._sexfTimer); this.state._sexfTimer = null; } } catch(e) {}
        try { this.stopCountdown(); } catch(e) {}
        const s = this.state.sexfight || {};
        let resolvedWinner = winner || null;
        if (!resolvedWinner) {
            if (s.mode === 'MOST') {
                const w = (s.tally && s.tally.wayne) || 0; const c = (s.tally && s.tally.cindy) || 0;
                if (w === c) { this.announce(`Sexfight tied ${w}—${c}. Draw.`, 'normal'); resolvedWinner = null; }
                else resolvedWinner = (w>c)?'wayne':'cindy';
            } else if (s.mode === 'LAST') {
                // if nobody orgasmed, draw; otherwise whoever orgasmed last
                const wts = (s.timestamps && s.timestamps.wayne && s.timestamps.wayne.slice()) || [];
                const cts = (s.timestamps && s.timestamps.cindy && s.timestamps.cindy.slice()) || [];
                if (!wts.length && !cts.length) { this.announce('No orgasms — draw!', 'normal'); resolvedWinner = null; }
                else if (!wts.length) resolvedWinner = 'cindy'; else if (!cts.length) resolvedWinner = 'wayne'; else { const wLast = wts[wts.length-1]; const cLast = cts[cts.length-1]; resolvedWinner = (wLast > cLast) ? 'wayne' : 'cindy'; }
            }
        }
        // Cleanup UI
        try { const hudEl = document.getElementById('sexfight-hud'); if (hudEl) { hudEl.classList.remove('tiebreaker-active'); hudEl.style.display = 'none'; } document.getElementById('btn-orgasm-wayne').style.display = 'none'; document.getElementById('btn-orgasm-cindy').style.display = 'none'; } catch(e) {}
        try { if (this.state._sexfCountdownInterval) { clearInterval(this.state._sexfCountdownInterval); this.state._sexfCountdownInterval = null; } } catch(e) {}
        this.state.sexfight = null;
        if (!resolvedWinner) {
            // Tie -> start sudden-death tiebreaker: next orgasm wins (no time limit)
            if (s && !s.tiebreaker) {
                this.announce('Sexfight tied — Tiebreaker: next orgasm wins (no time limit).', 'high');
                s.tiebreaker = true;
                // Ensure no active timers
                try { if (this.state._sexfTimer) { clearTimeout(this.state._sexfTimer); this.state._sexfTimer = null; } } catch(e) {}
                try { this.stopCountdown(); } catch(e) {}
                try { const hud = document.getElementById('sexfight-hud'); if (hud) { hud.innerText = `TIEBREAKER — Next orgasm wins (no time limit)`; hud.classList.add('tiebreaker-active'); } } catch(e) {}
                // Keep orgasm buttons visible and wait
                try { document.getElementById('btn-orgasm-wayne').style.display = 'inline-block'; document.getElementById('btn-orgasm-cindy').style.display = 'inline-block'; } catch(e) {}
                return;
            }
            this.announce('Sexfight ended in a draw.', 'normal'); return;
        }
        try { const hudEl = document.getElementById('sexfight-hud'); if (hudEl) hudEl.classList.remove('tiebreaker-active'); } catch(e) {}
        this.announce(`Sexfight winner: ${resolvedWinner.toUpperCase()}! Stakes apply.`, 'win');
        const loser = (resolvedWinner === 'wayne') ? 'cindy' : 'wayne';
        // Apply BIG punishment to loser and end match
        this.applyPunishmentBySeverity('BIG', loser);
        // Also mark match finished (call endMatchWithWinner for full winner flow)
        setTimeout(() => { this.endMatchWithWinner(resolvedWinner); }, 1200);
    },

    // --- GAME LOOP ---
    nextRound: function() {
        this.stopTimer();
        this.state.roundCount++;
        // Reset per-round skip counter (max skips configurable)
        this.state.skipCount = 0;
        // Update skip UI
        try { this.updateSkipUI(); } catch(e) {}

        // Rule Checks
        if (this.state.roundCount === 12) this.announce("SUDDEN DEATH! Healing Disabled!", 'high');
        if (this.state.p1Health <= 0 || this.state.p2Health <= 0) { this.triggerEndGame(); return; }
        
        // Secret Trigger (5% chance, disabled in late game)
        if (this.state.roundCount < 12 && Math.random() < 0.05) { 
            this.triggerSecret(); return; 
        }

        this.resetUI();
        // Reset tap counter for the upcoming action
        this.state.tapCount = 0; const tEl = document.getElementById('tap-count'); if (tEl) tEl.innerText = '0';
        const att = this.state.attacker;
        const oppHealth = att === 'wayne' ? this.state.p2Health : this.state.p1Health;
        
        // Deck Selection (Finisher vs General) - use percentage threshold based on maxHealth
        let deck;
        if (oppHealth < (0.25 * this.state.maxHealth)) {
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
            // Ensure skip counter exists
            if (typeof this.state.skipCount === 'undefined') this.state.skipCount = 0;
        document.getElementById('event-badge').innerText = this.state.isFinisher ? 'FINISHER' : 'MOVE';
        
        // Image Loading with Fallback and smooth fade
        const img = document.getElementById('main-image');
        // Reset visibility and handlers
        img.classList.remove('main-visible');
        const self = this;
        img.onload = function() {
            // Fade in when the image has loaded
            this.classList.add('main-visible');
            // Ensure clicking/tapping the image toggles the zoom overlay
            this.onclick = function(e) { e.stopPropagation(); self.toggleImageZoom(); };
        };
        img.onerror = function() {
            // prevent infinite loop if placeholder fails
            this.onerror = null;
            this.src = `https://placehold.co/600x400/111/fff?text=${encodeURIComponent(move.name)}`;
            this.classList.add('main-visible');
            this.onclick = function(e) { e.stopPropagation(); self.toggleImageZoom(); };
        };
        // Set new source (this will trigger onload or onerror)
        img.src = move.img; 
        // Prevent clicks on image during setup hiding phase from accidentally toggling
        img.addEventListener('touchstart', function(e){ e.stopPropagation(); });

        // --- SETUP PHASE ---
        this.state.isSetupPhase = true;
        document.getElementById('controls-area').style.opacity = '0.5';
        // Clear any pending hide timers so the upcoming image stays visible
        if (this.state.imageHideTimer) { clearTimeout(this.state.imageHideTimer); this.state.imageHideTimer = null; }
        
        // Special Audio for Blindfold Match
        let prefix = "";
        if (this.state.stipulation === 'BLINDFOLD') prefix = "Attacker, Cover your eyes. ";
        
        // Announce without revealing move name if blindfolded
        if (this.state.stipulation === 'BLINDFOLD') {
            this.announce(`${prefix}${attackerName}, Get Ready... (Blindfold)`, 'normal');
            // Hide the image for blindfold rounds (attacker should not see it)
            img.style.display = 'none';
        } else {
            this.announce(`${prefix}${attackerName}, Get Ready... ${move.name}`, 'normal');
            img.style.display = 'block';
        }
        document.getElementById('sub-text').innerText = "Get into position...";
        
        // Yellow Bar Animation (configurable)
        const bar = document.getElementById('timer-fill');
        const setupSec = this.state.setupDelaySeconds || 5;
        bar.style.transition = 'none'; bar.style.width = '100%'; bar.style.background = 'yellow';
        void bar.offsetWidth; 
        bar.style.transition = `width ${setupSec}s linear`; bar.style.width = '0%';

        // Show numeric countdown during setup
        this.startCountdown(setupSec);

        this.state.timer = setTimeout(() => {
            this.stopCountdown();
            this.state.isSetupPhase = false;
            document.getElementById('controls-area').style.opacity = '1';
            // Enable skip once move is available
            try { document.getElementById('btn-skip').disabled = false; } catch(e) {}

            // BLINDFOLD: hide description and enable PEEK button (small cost)
            if (this.state.stipulation === 'BLINDFOLD') {
                document.getElementById('sub-text').innerText = 'Blindfold active — attacker must close eyes. Use PEEK to view (small penalty).';
                try { const pb = document.getElementById('btn-peek'); if (pb) { pb.style.display = 'inline-block'; pb.disabled = false; pb.innerText = `PEEK (-${Math.round(this.state.peekPenaltyPercent*100)}%)`; } } catch(e) {}
            } else {
                document.getElementById('sub-text').innerText = move.desc;
                try { const pb = document.getElementById('btn-peek'); if (pb) { pb.style.display = 'none'; pb.disabled = true; } } catch(e) {}
            }
            
            const actionTime = this.state.isFinisher ? 15 : 45; 
            this.startActionTimer(actionTime);
        }, setupSec * 1000);
    },

    startActionTimer: function(seconds) {
        const bar = document.getElementById('timer-fill');
        bar.style.transition = 'none'; bar.style.width = '100%'; 
        bar.style.background = this.state.isFinisher ? 'red' : 'var(--gold)';
        void bar.offsetWidth; 
        bar.style.transition = `width ${seconds}s linear`; bar.style.width = '0%';
        
        // Start numeric countdown for action phase
        this.startCountdown(seconds);

        this.state.timer = setTimeout(() => {
            this.stopCountdown();
            this.announce("Break! Reset Position.", 'normal');
            
            // --- TIME LIMIT EXPIRED ---
            // Forced swap on stalemate
            this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
            // reset combo momentum on swap
            this.resetCombo();
            setTimeout(() => this.nextRound(), 2000);
            
        }, seconds * 1000);
    },

    // Countdown helpers (numeric display)
    startCountdown: function(seconds) {
        this.stopCountdown();
        const el = document.getElementById('countdown');
        if(!el) return;
        let remaining = Math.ceil(seconds);
        el.innerText = remaining + 's';
        el.style.display = 'inline-block';
        el.classList.add('fuse');
        const self = this;
        this.state._countdownInterval = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                self.stopCountdown();
            } else {
                el.innerText = remaining + 's';
                // Vibrate quietly on the last three seconds for silent play
                if (self.state.silentMode && 'vibrate' in navigator && remaining <= 3) {
                    if (remaining === 3) self.vibrate(100);
                    else if (remaining === 2) self.vibrate([100, 40, 100]);
                    else if (remaining === 1) self.vibrate([200, 60, 200]);
                }
            }
        }, 1000);
    },

    stopCountdown: function() {
        const el = document.getElementById('countdown');
        if (this.state._countdownInterval) { clearInterval(this.state._countdownInterval); this.state._countdownInterval = null; }
        if(el){ el.style.display = 'none'; el.classList.remove('fuse'); el.innerText = ''; }
    },

    // --- COMBO / MOMENTUM HELPERS ---
    incrementCombo: function() {
        this.state.combo = (this.state.combo || 0) + 1;
        if (this.state.combo < 1) this.state.combo = 1;
        this.updateComboUI();
        // Announce notable combo milestones
        if (this.state.combo >= 2) {
            this.announce(`COMBO x${this.state.combo}!`, 'normal');
            // subtle vibrate on combo milestones (stronger for bigger combos)
            if (this.state.silentMode) {
                const pattern = this.state.combo >= 4 ? [140, 40, 140] : [90, 20, 90];
                this.vibrate(pattern);
            }
        }
    },

    resetCombo: function() {
        this.state.combo = 0;
        this.updateComboUI();
    },

    updateComboUI: function() {
        const el = document.getElementById('combo-display');
        const cnt = document.getElementById('combo-count');
        if (!el || !cnt) return;
        if (this.state.combo >= 2) {
            cnt.innerText = this.state.combo;
            el.style.display = 'inline-block';
            el.classList.add('burst');
            setTimeout(() => el.classList.remove('burst'), 650);
        } else {
            el.style.display = 'none';
        }
    },


    // --- IMAGE ZOOM HANDLERS ---
    showImageZoom: function(src) {
        const overlay = document.getElementById('image-zoom');
        const img = document.getElementById('image-zoom-img');
        img.src = src || document.getElementById('main-image').src;
        overlay.style.display = 'flex';
        document.body.classList.add('overlay-open');
        // apply visible class a tick later to trigger transition
        setTimeout(() => { overlay.classList.add('image-visible'); }, 10);
        // Clicking the overlay hides it
        overlay.onclick = (e) => { e.stopPropagation(); this.hideImageZoom(); };
    },

    hideImageZoom: function() {
        const overlay = document.getElementById('image-zoom');
        overlay.classList.remove('image-visible');
        setTimeout(() => { overlay.style.display = 'none'; document.body.classList.remove('overlay-open'); }, 220);
    },

    toggleImageZoom: function() {
        const overlay = document.getElementById('image-zoom');
        if (overlay.style.display === 'flex') this.hideImageZoom(); else this.showImageZoom();
    },

    // --- INTERACTION HANDLERS ---
    handleSuccess: function() {
        this.stopTimer();
        // Visual Juice
        document.body.classList.add('shake-screen');
        setTimeout(() => document.body.classList.remove('shake-screen'), 400);

        // increment combo for successful move
        this.incrementCombo();
    },

    skipMove: function() {
        // Allow up to configured skips per round to avoid abuse
        const maxSkips = this.state.maxSkipsPerRound || 3;
        this.state.skipCount = this.state.skipCount || 0;
        if (this.state.skipCount >= maxSkips) { this.announce('No skips remaining this round.', 'normal'); return; }

        if (!this.state.currentCard) { this.announce('No active move to skip.', 'normal'); return; }

        this.state.skipCount++;
        this.announce(`Move skipped (${this.state.skipCount}/${maxSkips})`, 'normal');
        try { this.updateSkipUI(); } catch(e) {}

        // Clear current timers and UI timers
        try { clearTimeout(this.state.timer); } catch(e) {}
        try { this.stopCountdown(); } catch(e) {}
        try { if (this.state.pinTimer) { clearInterval(this.state.pinTimer); this.state.pinTimer = null; } } catch(e) {}

        // Reset timer bar temporarily
        const bar = document.getElementById('timer-fill'); if (bar) { bar.style.transition = 'none'; bar.style.width = '100%'; }

        // Re-roll a new move for the same attacker (do not increment roundCount)
        const att = this.state.attacker;
        const oppHealth = att === 'wayne' ? this.state.p2Health : this.state.p1Health;
        let deck;
        if (oppHealth < (0.25 * this.state.maxHealth)) {
            deck = DATA[att].finishers; this.state.isFinisher = true; document.body.style.background = "#200";
        } else {
            deck = [...DATA.general, ...DATA[att].moves]; this.state.isFinisher = false; document.body.style.background = "#000000";
        }

        const move = deck[Math.floor(Math.random() * deck.length)];
        this.state.currentCard = move;

        // Update UI with new move
        const img = document.getElementById('main-image');
        const self = this;
        img.onload = function() { this.classList.add('main-visible'); this.onclick = function(e){ e.stopPropagation(); self.toggleImageZoom(); }; };
        img.onerror = function() { this.onerror = null; this.src = `https://placehold.co/600x400/111/fff?text=${encodeURIComponent(move.name)}`; this.classList.add('main-visible'); this.onclick = function(e){ e.stopPropagation(); self.toggleImageZoom(); }; };
        img.src = move.img;
        img.style.display = 'block';

        // Setup phase for the rerolled move (same as nextRound but without incrementing)
        this.state.isSetupPhase = true;
        document.getElementById('controls-area').style.opacity = '0.5';
        try { document.getElementById('btn-skip').disabled = false; } catch(e) {}

        const setupSec = this.state.setupDelaySeconds || 5;
        const bar2 = document.getElementById('timer-fill');
        bar2.style.transition = 'none'; bar2.style.width = '100%'; bar2.style.background = 'yellow'; void bar2.offsetWidth; bar2.style.transition = `width ${setupSec}s linear`; bar2.style.width = '0%';
        this.startCountdown(setupSec);

        this.state.timer = setTimeout(() => {
            this.stopCountdown();
            this.state.isSetupPhase = false;
            document.getElementById('controls-area').style.opacity = '1';
            try { document.getElementById('btn-skip').disabled = false; } catch(e) {}
            this.announce('ACTION! HOLD IT!', 'high');
            document.getElementById('sub-text').innerText = move.desc;
            const actionTime = this.state.isFinisher ? 15 : 45; this.startActionTimer(actionTime);
        }, setupSec * 1000);

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
            // Damage scales with configured maxHealth and combo multiplier
            const base = Math.round(this.state.baseDamagePercent * this.state.maxHealth);
            const mult = 1 + Math.min((this.state.combo - 1) * this.state.comboBonusPercent, this.state.comboMaxMultiplier - 1);
            const dmg = Math.round(base * mult);

            let target = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
            
            if (target === 'cindy') this.state.p2Health -= dmg;
            else this.state.p1Health -= dmg;
            
            this.updateHUD();
            
            // Check if clothes fall off
            if (this.checkStripCondition(target)) return;
            
            // Heal if both alive
            if (this.state.p1Health > 0 && this.state.p2Health > 0) {
                // Chance to trigger a small playful punishment between moves
                if (this.state.stipulation !== 'SUDDEN_DEATH' && Math.random() < this.state.minPunishChance) {
                    this.triggerMiniPunishment();
                } else {
                    // Trigger reward (Swap happens inside here now)
                    this.triggerSensualReward();
                }
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
        // reset combo momentum on swap
        this.resetCombo();
        
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
        // reset combo momentum when attacker changes
        this.resetCombo();
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

        // Thresholds relative to maxHealth: 75% -> 50% -> 25%
        if (health < (0.25 * this.state.maxHealth)) shouldBeLayer = 3;
        else if (health < (0.50 * this.state.maxHealth)) shouldBeLayer = 2;
        else if (health < (0.75 * this.state.maxHealth)) shouldBeLayer = 1;

        if (shouldBeLayer > layer) {
            // Try removing one layer; the removal happens probabilistically based on stripChance configuration
            const nextLayer = layer + 1; // this is the layer we'd advance to
            const chance = (this.state.stripChance && this.state.stripChance[nextLayer]) ? this.state.stripChance[nextLayer] : 1;

            if (Math.random() < chance) {
                const item = WARDROBE[player][layer];
                this.triggerStripEvent(player, item);

                if (player === 'wayne') this.state.p1Layer++; 
                else this.state.p2Layer++;

                this.updateClothingUI();
                return true; // Stop game flow to show overlay
            } else {
                // No strip this time; give a brief notification and continue normally
                this.announce("Clothes held this time! Keep fighting.", 'normal');
                return false;
            }
        }
        return false;
    },


    triggerStripEvent: function(player, item) {
        // Show overlay and mark overlay-open to hide the controls
        const ol = document.getElementById('strip-screen');
        ol.style.display = 'flex';
        document.body.classList.add('overlay-open');
        document.getElementById('strip-player-name').innerText = player.toUpperCase();
        document.getElementById('strip-item-name').innerText = item;
        // If this is part of duel-driven removal, set subtitle accordingly
        const subtitle = document.querySelector('#strip-screen .strip-subtitle');
        if (this.state && this.state.duelStripActive) {
            if (subtitle) subtitle.innerText = 'DUEL REMOVAL — remove one item, then press DONE';
        } else {
            if (subtitle) subtitle.innerText = 'WARDROBE MALFUNCTION';
        }
        this.announce(`WARDROBE MALFUNCTION! ${player}, remove your ${item}!`, 'high');
    },

    confirmStrip: function() {
        // If we're in a duel-driven clothing removal sequence, process queue items and continue the duel
        if (this.state.duelStripActive) {
            const player = this.state.duelStripCurrent;
            if (player === 'wayne') this.state.p1Layer++; else this.state.p2Layer++;
            this.updateClothingUI();

            // Show transient confirmation and briefly disable Done button to avoid accidental double-press
            const subtitle = document.querySelector('#strip-screen .strip-subtitle');
            const doneBtn = document.querySelector('#strip-screen .btn-menu');
            if (subtitle) { subtitle.classList.add('strip-confirm'); subtitle.innerText = 'Removed — continuing...'; }
            if (doneBtn) { doneBtn.disabled = true; }

            setTimeout(() => {
                // advance queue
                this.state.duelStripQueue = this.state.duelStripQueue || [];
                this.state.duelStripQueue.shift();
                if (this.state.duelStripQueue.length > 0) {
                    // show next player's strip prompt
                    const next = this.state.duelStripQueue[0];
                    this.state.duelStripCurrent = next;
                    const layer = (next === 'wayne') ? this.state.p1Layer : this.state.p2Layer;
                    const item = (WARDROBE && WARDROBE[next]) ? WARDROBE[next][layer] : 'clothing';
                    // restore subtitle
                    if (subtitle) { subtitle.classList.remove('strip-confirm'); subtitle.innerText = 'DUEL REMOVAL — remove one item, then press DONE'; }
                    this.triggerStripEvent(next, item);
                    if (doneBtn) { doneBtn.disabled = false; }
                    return;
                }
                // Finished duel strip sequence
                this.state.duelStripActive = false; this.state.duelStripCurrent = null; this.state.duelStripQueue = null;
                if (subtitle) { subtitle.classList.remove('strip-confirm'); subtitle.innerText = 'WARDROBE MALFUNCTION'; }
                document.getElementById('strip-screen').style.display = 'none';
                document.body.classList.remove('overlay-open');
                this.announce('Both players removed one item — duel resumes!', 'normal');
                // Continue duel by re-rolling a duel move
                try { this.rerollDuelMove(); } catch(e) { console.warn('Failed to resume duel', e); }
            }, 900);
            return;
        }

        // Default behavior (non-duel strip)
        document.getElementById('strip-screen').style.display = 'none';
        // Remove overlay marker so controls can reappear
        document.body.classList.remove('overlay-open');
        this.announce("Resume Match!", 'normal');
        
        // Forced Swap after Strip Event
        this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
        // reset combo on swap
        this.resetCombo();
        this.nextRound();
    },

    // --- PINFALL & EVENTS ---
    startPinfall: function() {
        // Show kickout overlay and hide controls
        const overlay = document.getElementById('kickout-overlay');
        overlay.style.display = 'flex';
        document.body.classList.add('overlay-open');
        
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
                    document.getElementById('kickout-overlay').style.display = 'none';                    // remove overlay marker; punishment screen will add it again if needed
                    document.body.classList.remove('overlay-open');                    this.triggerEndGame();
                }, 1000);
            }
        }, 1200); // 1.2 second count cadence
    },

    attemptKickout: function() {
        // Successful Escape
        clearInterval(this.state.pinTimer);
        document.getElementById('kickout-overlay').style.display = 'none';        // Remove overlay-open so controls return
        document.body.classList.remove('overlay-open');        
        // Adrenaline Heal (scale with maxHealth)
        const heal = Math.round(this.state.pinHealPercent * this.state.maxHealth);
        if (this.state.attacker === 'wayne') this.state.p2Health += heal;
        else this.state.p1Health += heal;
        
        this.updateHUD();
        this.announce("ESCAPED!", 'high');
        
        // Successful kickout resets neutral/swaps
        this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
        // reset combo on swap
        this.resetCombo();
        setTimeout(() => {
            this.nextRound();
        }, 2000);
    },

    triggerSensualReward: function() {
        // Respect intensity rules: skip sensual rewards if not allowed
        if (!this.isCategoryAllowed('sensual')) {
            this.announce('Sensual reward unavailable at current intensity.', 'normal');
            this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
            setTimeout(() => this.nextRound(), 1200);
            return;
        }

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
        
        // Heal (scale with maxHealth)
        const healAmt = Math.round(this.state.sensualHealPercent * this.state.maxHealth);
        this.state.p1Health = Math.min(this.state.maxHealth, this.state.p1Health + healAmt);
        this.state.p2Health = Math.min(this.state.maxHealth, this.state.p2Health + healAmt);
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
             // reset combo on swap
             this.resetCombo();
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
        // Hide controls while secret displays
        document.body.classList.add('overlay-open');
        
        if (secret.name === "ROLE SWAP") { this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne'; this.resetCombo(); }
        
        setTimeout(() => { this.announce("Resume Match", 'normal'); document.body.classList.remove('overlay-open'); this.nextRound(); }, 5000); 
    },


    // --- MINI PUNISHMENT (quick, between-move penalties) ---
    triggerMiniPunishment: function() {
        // Respect intensity rules: if playful category not allowed, skip
        if (!this.isCategoryAllowed('playful')) {
            this.announce('Mini punishment unavailable at current intensity.', 'normal');
            setTimeout(() => { this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne'; this.resetCombo(); this.nextRound(); }, 1400);
            return;
        }

        // Pick a playful punishment from the list (supports structured entries)
        const list = DATA.punishments.playful || [{name: "Mini Tickle", duration: 10}];
        const item = list[Math.floor(Math.random() * list.length)];
        const overlay = document.getElementById('mini-punish');
        const descText = (typeof item === 'string') ? item : (item.name + (item.duration ? ` (${item.duration}s)` : ''));
        document.getElementById('mini-desc').innerText = descText;
        overlay.style.display = 'flex';
        document.body.classList.add('overlay-open');

        // Fill timer bar animation (use item.duration if available, else fallback to configured default)
        const fill = document.getElementById('mini-timer-fill');
        const dur = (item && item.duration) ? item.duration : (this.state.minPunishDuration || 8);
        fill.style.transition = 'none'; fill.style.width = '100%'; void fill.offsetWidth;
        fill.style.transition = `width ${dur}s linear`; fill.style.width = '0%';

        this.announce('Mini Punishment: ' + descText, 'normal');

        setTimeout(() => {
            overlay.style.display = 'none';
            document.body.classList.remove('overlay-open');
            // After mini punishment, forced swap and next round
            this.state.attacker = this.state.attacker === 'wayne' ? 'cindy' : 'wayne';
            // reset combo on swap
            this.resetCombo();
            this.nextRound();
        }, dur * 1000);
    },

    // --- ENDGAME & FALLS ---
    triggerEndGame: function() {
        const winner = this.state.p1Health > 0 ? "wayne" : "cindy";
        const loser = winner === "wayne" ? "cindy" : "wayne";
        
        // 2 OUT OF 3 FALLS LOGIC
        if (this.state.stipulation === 'TWO_OF_THREE') {
            // Instead of auto-awarding, present to the judges to confirm (Wayne/Cindy/Draw)
            this.state.pendingFallWinner = winner; // hold for judge's confirmation
            this.updateHUD();
            this.announce(`Fall to ${winner.toUpperCase()} — awaiting judge confirmation.`, 'normal');
            // Show the judge overlay and wait for App.judgePick(...) to be called by UI
            try { this.showJudgeOverlay(winner); } catch(e) { console.warn('showJudgeOverlay failed', e); }
            return;
        }

        // SAVE STATS
        this.state.wins[winner]++;
        localStorage.setItem('ubc_history', JSON.stringify(this.state.wins));
        
        this.announce(`WINNER: ${winner.toUpperCase()}!`, 'win');
        // Provide haptic celebration for quiet play (force so players notice the win)
        this.vibrate([300,100,300], true);
        setTimeout(() => {
            // End of match — remove match state and show winner screen first (controls hidden)
            if (typeof document !== 'undefined' && document.body) document.body.classList.remove('in-match');
            document.body.classList.add('overlay-open');
            // Populate winner overlay and show it
            document.getElementById('winner-name').innerText = `${winner.toUpperCase()}`;
            const ws = document.getElementById('winner-screen');
            ws.style.display = 'flex';
            // animate belt in
            ws.classList.add('show-belt');
            // Auto-advance to punishment after delay (optional) - 5s
            if (this._autoPunishTimer) clearTimeout(this._autoPunishTimer);
            this._autoPunishTimer = setTimeout(() => { this.openPunishmentSelection(); }, 5000);
        }, 4000);
    },
    
    resetData: function() {
        if(confirm("Reset all history?")) { localStorage.removeItem('ubc_history'); location.reload(); }
    },

    // Open punishment selection (hide winner screen and show punishment screen)
    openPunishmentSelection: function() {
        // clear auto timer if present
        if (this._autoPunishTimer) { clearTimeout(this._autoPunishTimer); this._autoPunishTimer = null; }
        document.getElementById('winner-screen').style.display = 'none';
        // show punishment overlay
        document.getElementById('punish-result').style.display = 'none';
        document.getElementById('punishment-screen').style.display = 'flex';

        // Show only categories allowed by match intensity
        const options = document.querySelectorAll('#punish-options button[data-cat]');
        let anyVisible = false;
        options.forEach(btn => {
            const cat = btn.getAttribute('data-cat');
            if (!this.isCategoryAllowed(cat)) { btn.style.display = 'none'; } else { btn.style.display = 'block'; anyVisible = true; }
        });
        if (!anyVisible) {
            document.getElementById('punish-msg').innerText = `No permitted punishment categories for current intensity.`;
            document.getElementById('punish-options').style.display = 'none';
        } else {
            document.getElementById('punish-msg').innerText = `Select Punishment.`;
            document.getElementById('punish-options').style.display = 'flex';
        }

        // If we have a pending punish loser, show it
        if (this.state.pendingPunishLoser) {
            const who = this.state.pendingPunishLoser.toUpperCase();
            document.getElementById('punish-msg').innerText = `Punishment will apply to: ${who}`;
        }

        document.getElementById('punishment-screen').style.display = 'flex';
        // body.overlay-open remains set
    },

    spinPunishment: function(cat) {
        // Validate against match intensity
        if (!this.isCategoryAllowed(cat)) {
            document.getElementById('punish-options').style.display = 'none';
            document.getElementById('punish-result').style.display = 'block';
            document.getElementById('punish-title').innerText = 'UNAVAILABLE';
            document.getElementById('punish-desc').innerText = 'This punishment category is not permitted at the current match intensity.';
            return;
        }

        // If a stake exists for the loser, show that instead of random punishment
        if (this.state.pendingPunishLoser && this.state.stakes && this.state.stakes[this.state.pendingPunishLoser] && this.state.stakes[this.state.pendingPunishLoser].trim().length) {
            document.getElementById('punish-options').style.display = 'none';
            document.getElementById('punish-result').style.display = 'block';
            document.getElementById('punish-title').innerText = 'STAKE';
            document.getElementById('punish-desc').innerText = this.state.stakes[this.state.pendingPunishLoser];
            const who = this.state.pendingPunishLoser.toUpperCase();
            const note = document.createElement('div'); note.style.marginTop = '8px'; note.style.color = '#ffd'; note.style.fontWeight = '700'; note.innerText = `For: ${who}`;
            const parent = document.getElementById('punish-result'); if (parent) parent.appendChild(note);
            this.state.pendingPunishLoser = null; // clear
            return;
        }

        document.getElementById('punish-options').style.display = 'none';
        const list = DATA.punishments[cat];
        const result = list[Math.floor(Math.random() * list.length)];
        document.getElementById('punish-result').style.display = 'block';
        document.getElementById('punish-title').innerText = cat.toUpperCase();
        // Support both string and structured punishment entries
        if (typeof result === 'string') {
            document.getElementById('punish-desc').innerText = result;
        } else {
            document.getElementById('punish-desc').innerText = result.name + (result.duration ? ` (${result.duration}s)` : '');
        }
        // Show who the punishment will target if available
        if (this.state.pendingPunishLoser) {
            const who = this.state.pendingPunishLoser.toUpperCase();
            const note = document.createElement('div'); note.style.marginTop = '8px'; note.style.color = '#ffd'; note.style.fontWeight = '700'; note.innerText = `For: ${who}`;
            const parent = document.getElementById('punish-result'); if (parent) parent.appendChild(note);
        }
        // Clear pending pointer (handled)
        this.state.pendingPunishLoser = null;
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
        // Gentle visual cue for all players
        document.body.classList.remove('flash'); void document.body.offsetWidth; document.body.classList.add('flash');

        if (this.state.silentMode) {
            // Vibrate patterns tuned for discrete feedback
            const patterns = {
                high: [150, 50, 150],
                normal: [100],
                win: [300, 100, 300]
            };
            this.vibrate(patterns[priority] || patterns.normal);
        } else {
            this.synth.cancel();
            // TTS cleanup
            const u = new SpeechSynthesisUtterance(text.replace(':', '. '));
            u.rate = 1.1; u.pitch = 0.9;
            this.synth.speak(u);
        }
    },

    // Small helper for vibration usage - respects silentMode unless `force` is true
    vibrate: function(pattern, force = false) {
        if (!('vibrate' in navigator)) return;
        if (!force && !this.state.silentMode) return;
        try { navigator.vibrate(pattern); } catch(e) { /* ignore */ }
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

        // Health Bars (width is percentage of maxHealth)
        const p1 = document.getElementById('p1-bar'); const p2 = document.getElementById('p2-bar');
        const p1Pct = Math.max(0, Math.round((this.state.p1Health / this.state.maxHealth) * 100));
        const p2Pct = Math.max(0, Math.round((this.state.p2Health / this.state.maxHealth) * 100));
        p1.style.width = p1Pct + '%';
        p2.style.width = p2Pct + '%';
        
        // Critical Animation (use percentage threshold)
        if (this.state.p1Health < (0.25 * this.state.maxHealth)) p1.parentElement.classList.add('critical'); else p1.parentElement.classList.remove('critical');
        if (this.state.p2Health < (0.25 * this.state.maxHealth)) p2.parentElement.classList.add('critical'); else p2.parentElement.classList.remove('critical');
    },

    // Update the small summary shown on the Advanced toggle (Gauntlet seconds and skips)
    updateAdvancedSummary: function() {
        try {
            const tog = document.getElementById('toggle-advanced'); if (!tog) return;
            const gauntEl = document.getElementById('gauntlet-seconds'); const skipsEl = document.getElementById('max-skips');
            const g = gauntEl ? (parseInt(gauntEl.value, 10) || this.state.twoOfThreeRoundSeconds) : this.state.twoOfThreeRoundSeconds || 10;
            const s = skipsEl ? (parseInt(skipsEl.value, 10) || this.state.maxSkipsPerRound) : this.state.maxSkipsPerRound || 3;
            // Include tap thresholds and a very short stake summary
            const tMedEl = document.getElementById('tap-threshold-medium'); const tBigEl = document.getElementById('tap-threshold-big');
            const tm = tMedEl ? (parseInt(tMedEl.value, 10) || (this.state.tapThresholds ? this.state.tapThresholds.medium : 3)) : (this.state.tapThresholds ? this.state.tapThresholds.medium : 3);
            const tb = tBigEl ? (parseInt(tBigEl.value, 10) || (this.state.tapThresholds ? this.state.tapThresholds.big : 8)) : (this.state.tapThresholds ? this.state.tapThresholds.big : 8);
            const sw = document.getElementById('stake-wayne'); const sc = document.getElementById('stake-cindy');
            const stakeParts = [];
            if (sw && sw.value && sw.value.trim()) stakeParts.push(`W:${(sw.value.trim().slice(0,16))}${sw.value.trim().length>16? '…':''}`);
            if (sc && sc.value && sc.value.trim()) stakeParts.push(`C:${(sc.value.trim().slice(0,16))}${sc.value.trim().length>16? '…':''}`);
            const stakeSummary = stakeParts.length ? ` • Stake ${stakeParts.join(' / ')}` : '';
            const base = `Gauntlet ${g}s • Skips ${s} • Taps ${tm}/${tb}${stakeSummary}`;
            if (this.state.advancedOpen) tog.innerText = `Hide Advanced ▴ — ${base}`; else tog.innerText = `Show Advanced ▾ — ${base}`;
        } catch(e) { /* ignore */ }
    },

    resetAdvancedSettings: function() {
        if (!confirm('Reset advanced settings to defaults?')) return;
        // snapshot current settings so user can undo
        this._lastAdvancedSnapshot = {
            twoOfThreeRoundSeconds: this.state.twoOfThreeRoundSeconds,
            maxSkipsPerRound: this.state.maxSkipsPerRound,
            tapThresholds: Object.assign({}, this.state.tapThresholds || {}),
            stakes: Object.assign({}, this.state.stakes || {})
        };
        // Defaults
        const defaults = { twoOfThreeRoundSeconds: 10, maxSkipsPerRound: 3, tapMedium: 3, tapBig: 8, stakes: { wayne: '', cindy: '' } };
        try {
            this.state.twoOfThreeRoundSeconds = defaults.twoOfThreeRoundSeconds;
            this.state.maxSkipsPerRound = defaults.maxSkipsPerRound;
            this.state.tapThresholds = this.state.tapThresholds || {};
            this.state.tapThresholds.medium = defaults.tapMedium; this.state.tapThresholds.big = defaults.tapBig;
            this.state.stakes = this.state.stakes || {}; this.state.stakes.wayne = ''; this.state.stakes.cindy = '';
            // Update DOM
            const ga = document.getElementById('gauntlet-seconds'); if (ga) ga.value = this.state.twoOfThreeRoundSeconds;
            const ms = document.getElementById('max-skips'); if (ms) ms.value = this.state.maxSkipsPerRound;
            const tm = document.getElementById('tap-threshold-medium'); if (tm) tm.value = this.state.tapThresholds.medium;
            const tb = document.getElementById('tap-threshold-big'); if (tb) tb.value = this.state.tapThresholds.big;
            const sw = document.getElementById('stake-wayne'); if (sw) sw.value = '';
            const sc = document.getElementById('stake-cindy'); if (sc) sc.value = '';
            // Persist and refresh
            this.saveSettings(); try { this.updateSkipUI(); } catch(e) {}
            this.updateAdvancedSummary();
            this.announce('Advanced settings reset to defaults. (Undo available)', 'normal');
            // Show undo toast for a short window
            this.showUndoToast('Advanced settings reset. Undo?', 6000);
        } catch(e) { console.warn('resetAdvancedSettings failed', e); }
    },

    updateClothingUI: function() {
        const wLabels = ["Fully Clothed", "Shirtless", "Pants Off", "Danger Zone"];
        const cLabels = ["Fully Clothed", "Topless", "Bottoms Off", "Danger Zone"];
        document.getElementById('p1-clothing').innerText = wLabels[Math.min(3, this.state.p1Layer)];
        document.getElementById('p2-clothing').innerText = cLabels[Math.min(3, this.state.p2Layer)];
    },

    resetUI: function() {
        // Ensure any overlay markers are cleared so controls can show
        if (typeof document !== 'undefined' && document.body) {
            document.body.classList.remove('overlay-open');
            // Also hide image zoom if it somehow remained open
            try { if (typeof this.hideImageZoom === 'function') this.hideImageZoom(); } catch(e) {}
        }

        // Reset combo display when UI resets between rounds
        this.resetCombo();

        document.getElementById('controls-area').style.opacity = '1';
        document.getElementById('controls-area').style.display = 'flex';
        
        // Hide main image between moves for a cleaner transition (fade-out then remove)
        const _img = document.getElementById('main-image');
        _img.classList.remove('main-visible');
        // Clear any previous hide timer
        if (this.state.imageHideTimer) clearTimeout(this.state.imageHideTimer);
        this.state.imageHideTimer = setTimeout(() => { _img.style.display = 'none'; this.state.imageHideTimer = null; }, 400);
        
        // --- BUTTON TEXT RESET ---
        // (removed legacy submit button)
        // -------------------------
        // Hide/disable peek by default
        try { const pb = document.getElementById('btn-peek'); if (pb) { pb.style.display = 'none'; pb.disabled = true; } } catch(e) {}
        // Ensure skip is disabled/reset by default until a move is active
        try { document.getElementById('btn-skip').disabled = true; } catch(e) {}
        try { this.updateSkipUI(); } catch(e) {}
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
        this.stopCountdown();
    }
};

// Ensure `App` is available as a property on `window` so inline handlers (onclick="App...") work
if (typeof window !== 'undefined') window.App = App;