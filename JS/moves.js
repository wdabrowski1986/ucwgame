const moves = [
    // --- GENERAL MOVES (Available to Both) ---
    { name: "Domination Mount", attacker: null, type: "physical", damage: 20, staminaCost: 15, accuracy: 85, img: "images/full-mount-control.png", instruction: "Straddle the chest. Pin the wrists. Make them beg for their next breath." },
    { name: "Possessive Body Lock", attacker: null, type: "challenge", damage: 25, staminaCost: 20, accuracy: 80, timeLimit: 15, img: "images/body-lock.png", instruction: "Wrap legs tight around waist. Squeeze until heart rates synchronize." },
    { name: "The Bulldozer", attacker: null, type: "strike", damage: 15, staminaCost: 10, accuracy: 90, img: "images/the-bulldozer.png", instruction: "Drive shoulder into chest, pin them flat. Total impact." },
    { name: "69 Lockdown", attacker: null, type: "physical", damage: 30, staminaCost: 25, accuracy: 75, isIRLChallenge: true, irlDuration: 20, irlInstruction: "Hold this position for 20 seconds!", img: "images/69-Pin.png", instruction: "Pin their arms with thighs. Give them a view they can't touch." },
    { name: "Grapevine Exposure", attacker: null, type: "physical", damage: 15, staminaCost: 15, accuracy: 90, img: "images/grapevine-hold.png", instruction: "Weave legs inside theirs. Spread them wide open." },
    { name: "The Display", attacker: null, type: "sensual", damage: 10, staminaCost: 5, accuracy: 95, img: "images/the-display.png", instruction: "Sit on chest facing feet. Pin the legs. You are the only thing they can see." },

    // --- CINDY'S GODDESS ARSENAL ---
    { name: "Amazon Straddle", attacker: "Cindy", type: "strike", damage: 25, staminaCost: 20, accuracy: 90, img: "images/amazon-straddle.png", instruction: "The view from the top. Sit high on his chest, pinning arms with shins." },
    { name: "Sole Worship", attacker: "Cindy", type: "sensual", damage: 10, staminaCost: 5, accuracy: 100, img: "images/sole-priority.png", instruction: "Press your sole to his chin. He stays there until he kisses the arch." },
    { name: "Suffocation by Curves", attacker: "Cindy", type: "smother", damage: 35, staminaCost: 30, accuracy: 85, isIRLChallenge: true, irlDuration: 20, irlInstruction: "Hold the smother for 20 seconds!", img: "images/breast-smother.png", instruction: "Push his face deep into your chest. Let him struggle for air in paradise." },
    { name: "Goddess Scissors", attacker: "Cindy", type: "challenge", damage: 40, staminaCost: 35, accuracy: 80, timeLimit: 15, isIRLChallenge: true, irlDuration: 15, irlInstruction: "Scissors hold - try to escape or submit!", img: "images/goddess-scissors.png", instruction: "Wrap thighs around his neck. Squeeze slowly. Watch his eyes flutter." },
    { name: "Ball Breaker", attacker: "Cindy", type: "strike", damage: 20, staminaCost: 20, accuracy: 90, img: "images/ball-breaker.png", instruction: "Grip him firmly. A slow, rhythmic pulse." },
    { name: "Queen's Throne", attacker: "Cindy", type: "smother", damage: 45, staminaCost: 40, accuracy: 75, isIRLChallenge: true, irlDuration: 20, irlInstruction: "Face sit - try to break free!", img: "images/queens-throne.png", instruction: "Full weight face sit. Smother him completely until he taps." },

    // --- CINDY'S FINISHERS (Sudden Death Only) ---
    { name: "THE MATRIARCH", attacker: "Cindy", type: "finisher", damage: 100, img: "images/the-matriarch.png", instruction: "High mount. Smother his face with your chest until he surrenders completely." },
    { name: "THE BLACK WIDOW", attacker: "Cindy", type: "finisher", damage: 100, img: "images/the-black-widow.png", instruction: "Legs around neck. Squeeze with devastating force. Feel him fade." },
    { name: "ABSOLUTE ZERO", attacker: "Cindy", type: "finisher", damage: 100, img: "images/absolute-zero.png", instruction: "Full weight face sit. He cannot see, cannot breathe, can only submit." },
    { name: "THE VENUS TRAP", attacker: "Cindy", type: "finisher", damage: 100, img: "images/the-venus-trap.png", instruction: "Wrap your entire body around his head. Total engulfment." },
    { name: "THE GRAVITY WELL", attacker: "Cindy", type: "finisher", damage: 100, img: "images/the-gravity-well.png", instruction: "An inescapable pull into depths of pleasure and submission. He is drawn to you completely." },
    { name: "THE SERPENT'S COIL", attacker: "Cindy", type: "finisher", damage: 100, img: "images/the-serpents-coil.png", instruction: "Wrap around him with sinuous control. Squeeze and coil until complete surrender." },
    { name: "THE THRONE OF THORNS", attacker: "Cindy", type: "finisher", damage: 100, img: "images/the-throne-of-thorns.png", instruction: "Sit on his face with all your power as your nails rake fire across his chest. He's drowning in you, pleasure and exquisite pain intertwined as he surrenders completely." },

    // --- WAYNE'S TECHNICAL ARSENAL ---
    { name: "The Stockade", attacker: "Wayne", type: "challenge", damage: 23, staminaCost: 15, accuracy: 85, timeLimit: 20, isIRLChallenge: true, irlDuration: 20, irlInstruction: "Hold the pin for 20 seconds!", img: "images/the-stockade.png", instruction: "Lock wrists above her head. She is helpless and at your mercy." },
    { name: "Thigh Spread Pin", attacker: "Wayne", type: "physical", damage: 30, staminaCost: 15, accuracy: 90, isIRLChallenge: true, irlDuration: 20, irlInstruction: "Hold the position - she tries to close her thighs!", img: "images/thigh-spread-pin.png", instruction: "Force her thighs wide apart and pin them with your legs." },
    { name: "The Lockdown", attacker: "Wayne", type: "physical", damage: 16, staminaCost: 10, accuracy: 95, img: "images/the-lockdown.png", instruction: "Complete immobilization. Not a single part of her moves." },
    { name: "Vice Grip", attacker: "Wayne", type: "strike", damage: 23, staminaCost: 10, accuracy: 90, img: "images/vice-grip.png", instruction: "Squeeze her breasts firmly together. Remind her who they belong to." },
    { name: "The Crucifix", attacker: "Wayne", type: "challenge", damage: 30, staminaCost: 25, accuracy: 80, timeLimit: 15, isIRLChallenge: true, irlDuration: 15, irlInstruction: "Arm pin - try to break free!", img: "images/the-crucifix.png", instruction: "Pin her arms using only your legs. Hands are free to torment her." },
    { name: "Jaw Clamp", attacker: "Wayne", type: "strike", damage: 16, staminaCost: 5, accuracy: 95, img: "images/jaw-clamp.png", instruction: "Grip her jaw firmly. Force your kisses on her." },
    { name: "Atlas Hold", attacker: "Wayne", type: "physical", damage: 38, staminaCost: 20, accuracy: 85, isIRLChallenge: true, irlDuration: 20, irlInstruction: "Hold her pinned for 20 seconds!", img: "images/atlas-hold.png", instruction: "She's yours, pinned and breathless. Your arms crush her lower spine as she writhes against you, completely dominated by your strength." },
    { name: "The Conqueror's Claim", attacker: "Wayne", type: "sensual", damage: 10, staminaCost: 10, accuracy: 95, img: "images/the-conquerers-claim.png", instruction: "From behind, your hands claim her hips. She's helpless to your possession, moaning as you grind against her, marking every inch as yours." },

    // --- WAYNE'S FINISHERS (Sudden Death Only) ---
    { name: "THE MONOLITH", attacker: "Wayne", type: "finisher", damage: 100, img: "images/the-monolith.png", instruction: "Lay your full weight flat on top. Spread wide. She cannot move an inch." },
    { name: "THE ANACONDA", attacker: "Wayne", type: "finisher", damage: 100, img: "images/the-anaconda.png", instruction: "Wrap from the side. Crush the air from her lungs slowly." },
    { name: "THE PILLAGER", attacker: "Wayne", type: "finisher", damage: 100, img: "images/the-pillager.png", instruction: "Pin wrists, force legs, and destroy her torso until she cries out." },
    { name: "THE CRUSHER", attacker: "Wayne", type: "finisher", damage: 100, img: "images/the-crusher.png", instruction: "Full weight body pin with intense grinding. Constriction and pressure." },
    { name: "THE CRUCIBLE", attacker: "Wayne", type: "finisher", damage: 100, img: "images/the-crucible.png", instruction: "She dangles helpless from the bed as your fists rain down on her perfect torso. Each stinging blow makes her gasp, begging for more as her breasts bounce with impact." },

    // --- SENSUAL RELAXATION ---
    { name: "Deep Kiss", type: "sensual", damage: 5, staminaCost: -10, timer: 60, instruction: "Stop everything. Kiss deeply and passionately for 60 seconds." },
    { name: "The Tease", type: "sensual", damage: 5, staminaCost: -5, timer: 45, instruction: "Trace your fingers along lips, neck, and chest. They must stay perfectly still." },
    { name: "Body Worship", type: "sensual", damage: 10, staminaCost: -15, timer: 45, instruction: "Slowly kiss and worship your opponent's body. Appreciate the prize." },
    { name: "Heartbeat Check", type: "sensual", damage: 0, staminaCost: -20, timer: 60, instruction: "Lay your head on their chest. Listen to their racing heart for one minute." },
    
    // --- MECHANICS ---
    { name: "Submission Recharge", attacker: "Cindy", type: "recharge", timeLimit: 10, instruction: "Cindy picks a hold, and Wayne must trap her for 10s to refill her energy." }
];
