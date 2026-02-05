// ============================================
// GAME MODES SYSTEM
// ============================================

const GameModes = {
    currentMode: null,
    
    modes: {
        quickMatch: {
            name: "Quick Match",
            icon: "⚡",
            description: "Single round, 3 minutes, fast and intense",
            settings: {
                rounds: 1,
                roundDuration: 180,
                startingHP: 100,
                clothingEnabled: true
            }
        },
        
        bestOf3: {
            name: "Best of 3",
            icon: "🏆",
            description: "Classic format, 5-minute rounds, first to 2 wins",
            settings: {
                rounds: 3,
                roundDuration: 300,
                startingHP: 100,
                clothingEnabled: true
            }
        },
        
        endurance: {
            name: "Endurance Match",
            icon: "💪",
            description: "One long 10-minute round, last wrestler standing",
            settings: {
                rounds: 1,
                roundDuration: 600,
                startingHP: 150,
                clothingEnabled: true
            }
        },
        
        ironWoman: {
            name: "Iron Woman",
            icon: "⚔️",
            description: "5 rounds, 3 minutes each, most wins takes all",
            settings: {
                rounds: 5,
                roundDuration: 180,
                startingHP: 100,
                clothingEnabled: true
            }
        },
        
        sudden: {
            name: "Sudden Death",
            icon: "💀",
            description: "Single round, first submission wins, no time limit",
            settings: {
                rounds: 1,
                roundDuration: 9999,
                startingHP: 50,
                clothingEnabled: true,
                suddenDeath: true
            }
        },
        
        practice: {
            name: "Practice Mode",
            icon: "🎯",
            description: "No damage, just practice moves and timing",
            settings: {
                rounds: 1,
                roundDuration: 300,
                startingHP: 100,
                clothingEnabled: false,
                practiceMode: true
            }
        }
    },
    
    showModeSelector() {
        // Create mode selector overlay
        const overlay = document.createElement('div');
        overlay.id = 'mode-selector-overlay';
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <div class="content">
                <h1 class="glow-text">SELECT GAME MODE</h1>
                <div class="mode-selector" id="mode-grid"></div>
                <button class="btn-remote" onclick="GameModes.showCustomSettings()">
                    ⚙️ CUSTOM SETTINGS
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Populate mode cards
        const modeGrid = document.getElementById('mode-grid');
        
        for (const [key, mode] of Object.entries(this.modes)) {
            const card = document.createElement('div');
            card.className = 'mode-card';
            card.onclick = () => this.selectMode(key);
            
            card.innerHTML = `
                <div class="mode-icon">${mode.icon}</div>
                <h3>${mode.name}</h3>
                <p>${mode.description}</p>
                <div style="margin-top: 15px; font-size: 0.9em; color: #ff1493;">
                    ${mode.settings.rounds} Round${mode.settings.rounds > 1 ? 's' : ''} • 
                    ${Math.floor(mode.settings.roundDuration / 60)}:${(mode.settings.roundDuration % 60).toString().padStart(2, '0')} each
                </div>
            `;
            
            modeGrid.appendChild(card);
        }
    },
    
    selectMode(modeKey) {
        this.currentMode = modeKey;
        const mode = this.modes[modeKey];
        
        console.log('Selected mode:', mode.name);
        
        // Apply settings to GameState
        if (typeof GameState !== 'undefined') {
            GameState.maxRounds = mode.settings.rounds;
            GameState.roundTimer = mode.settings.roundDuration;
            GameState.wayne.maxHP = mode.settings.startingHP;
            GameState.cindy.maxHP = mode.settings.startingHP;
            GameState.practiceMode = mode.settings.practiceMode || false;
            GameState.suddenDeath = mode.settings.suddenDeath || false;
        }
        
        // Remove mode selector
        const overlay = document.getElementById('mode-selector-overlay');
        if (overlay) overlay.remove();
        
        // Don't show arena-hud yet - it will be shown by startArena()
        // Just ensure controls-area is visible for tests
        const controlsArea = document.getElementById('controls-area');
        if (controlsArea) {
            controlsArea.classList.remove('hidden');
            controlsArea.style.display = 'block';
        }
        
        // Show intro or ritual based on mode
        if (mode.settings.practiceMode) {
            // Skip ritual in practice mode
            document.getElementById('intro-overlay').classList.add('hidden');
            if (typeof startArena === 'function') {
                startArena();
            }
        } else {
            // Normal flow - go to ritual
            document.getElementById('intro-overlay').classList.add('hidden');
            if (typeof initGame === 'function') {
                initGame();
            }
        }
    },
    
    showCustomSettings() {
        const overlay = document.createElement('div');
        overlay.id = 'custom-settings-overlay';
        overlay.className = 'overlay';
        overlay.innerHTML = `
            <div class="content" style="max-width: 600px;">
                <h1 class="glow-text">CUSTOM SETTINGS</h1>
                
                <div style="text-align: left; color: white; padding: 20px;">
                    <label style="display: block; margin: 20px 0;">
                        <h3>Number of Rounds</h3>
                        <input type="number" id="custom-rounds" min="1" max="10" value="3" 
                               style="width: 100%; padding: 10px; font-size: 1.2em;">
                    </label>
                    
                    <label style="display: block; margin: 20px 0;">
                        <h3>Round Duration (minutes)</h3>
                        <input type="number" id="custom-duration" min="1" max="30" value="5" 
                               style="width: 100%; padding: 10px; font-size: 1.2em;">
                    </label>
                    
                    <label style="display: block; margin: 20px 0;">
                        <h3>Starting HP</h3>
                        <input type="number" id="custom-hp" min="50" max="200" value="100" 
                               style="width: 100%; padding: 10px; font-size: 1.2em;">
                    </label>
                    
                    <label style="display: block; margin: 20px 0;">
                        <h3>
                            <input type="checkbox" id="custom-clothing" checked> 
                            Enable Clothing Removal
                        </h3>
                    </label>
                    
                    <label style="display: block; margin: 20px 0;">
                        <h3>
                            <input type="checkbox" id="custom-practice"> 
                            Practice Mode (No Damage)
                        </h3>
                    </label>
                </div>
                
                <button class="btn-remote" onclick="GameModes.applyCustomSettings()">
                    START CUSTOM MATCH
                </button>
                <button class="btn-remote" onclick="document.getElementById('custom-settings-overlay').remove(); GameModes.showModeSelector();" 
                        style="background: #666; margin-top: 10px;">
                    BACK
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Remove mode selector
        const modeSelector = document.getElementById('mode-selector-overlay');
        if (modeSelector) modeSelector.remove();
    },
    
    applyCustomSettings() {
        const rounds = parseInt(document.getElementById('custom-rounds').value);
        const duration = parseInt(document.getElementById('custom-duration').value) * 60;
        const hp = parseInt(document.getElementById('custom-hp').value);
        const clothingEnabled = document.getElementById('custom-clothing').checked;
        const practiceMode = document.getElementById('custom-practice').checked;
        
        // Apply to GameState
        if (typeof GameState !== 'undefined') {
            GameState.maxRounds = rounds;
            GameState.roundTimer = duration;
            GameState.wayne.maxHP = hp;
            GameState.cindy.maxHP = hp;
            GameState.wayne.hp = hp;
            GameState.cindy.hp = hp;
            GameState.clothingEnabled = clothingEnabled;
            GameState.practiceMode = practiceMode;
        }
        
        console.log('Custom settings applied:', { rounds, duration, hp, clothingEnabled, practiceMode });
        
        // Remove overlay and start
        document.getElementById('custom-settings-overlay').remove();
        const startScreen = document.getElementById('start-screen');
        if (startScreen) startScreen.classList.add('hidden');
        const introOverlay = document.getElementById('intro-overlay');
        if (introOverlay) introOverlay.classList.add('hidden');
        
        if (practiceMode && typeof startArena === 'function') {
            startArena();
        } else if (typeof initGame === 'function') {
            initGame();
        }
    }
};

// Modify the original startGame to show mode selector first
const originalStartGame = window.startGame;
window.startGame = function() {
    // Hide start screen
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.classList.add('hidden');
    const introOverlay = document.getElementById('intro-overlay');
    if (introOverlay) introOverlay.classList.add('hidden');
    
    // Show mode selector instead of going straight to ritual
    // (arena-hud will be shown later by startArena())
    GameModes.showModeSelector();
};

// Make globally accessible
window.GameModes = GameModes;
