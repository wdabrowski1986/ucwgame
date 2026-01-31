// js/moves.js
const DATA = {
    general: [
        { name: "Domination Mount", desc: "Straddle the chest. Pin the wrists. Make them beg for their next breath.", img: "images/full-mount-control.png" },
        { name: "Possessive Body Lock", desc: "Wrap legs tight around waist. Squeeze until heart rates synchronize.", img: "images/body-lock.png" },
        { name: "The Bulldozer", desc: "Drive shoulder into chest, pin them flat. Total impact.", img: "images/the-bulldozer.png" },
        { name: "69 Lockdown", desc: "Pin their arms with thighs. Give them a view they can't touch. Mutual torture.", img: "images/69-pin.png" },
        { name: "Grapevine Exposure", desc: "Weave legs inside theirs. Spread them wide open. They are yours to look at.", img: "images/grapevine-hold.png" },
        { name: "The Display", desc: "Sit on chest facing feet. Pin the legs. You are the only thing they can see.", img: "images/the-display.png" }
    ],
    cindy: {
        moves: [
            { name: "Amazon Straddle", desc: "The view from the top. Sit high on his chest, pinning arms with shins.", img: "images/amazon-straddle.png" },
            { name: "Sole Worship", desc: "Press your sole to his chin. He stays there until he kisses the arch.", img: "images/sole-priority.png" },
            { name: "Suffocation by Curves", desc: "Push his face deep into your chest. Let him struggle for air in paradise.", img: "images/breast-smother.png" },
            { name: "Goddess Scissors", desc: "Wrap thighs around his neck. Squeeze slowly. Watch his eyes flutter.", img: "images/goddess-scissors.png" },
            { name: "Ball Breaker", desc: "Grip him firmly. A slow, rhythmic pulse to remind him who owns him.", type: "pulse", img: "images/ball-breaker.png" },
            { name: "Queen's Throne", desc: "Full weight face sit. Smother him completely until he taps in desperation.", img: "images/queens-throne.png" }
        ],
        finishers: [
            { name: "THE MATRIARCH", desc: "FINISHER! High mount. Smother his face with your chest until he surrenders completely.", img: "images/the-matriarch.png" },
            { name: "THE BLACK WIDOW", desc: "FINISHER! Legs around neck. Squeeze with devastating force. Feel him fade.", img: "images/the-black-widow.png" },
            { name: "ABSOLUTE ZERO", desc: "FINISHER! Full weight face sit. He cannot see, cannot breathe, can only submit.", img: "images/absolute-zero.png" },
            { name: "THE VENUS TRAP", desc: "FINISHER! Wrap your entire body around his head. Total engulfment.", img: "images/the-venus-trap.png" }
        ]
    },
    wayne: {
        moves: [
            { name: "The Stockade", desc: "Lock wrists above her head. She is helpless and at your mercy.", img: "images/the-stockade.png" },
            { name: "Thigh Spread Pin", desc: "Force her thighs wide apart and pin them with your legs. Total exposure.", img: "images/thigh-spread-pin.png" },
            { name: "The Lockdown", desc: "Complete immobilization. Not a single part of her moves without permission.", img: "images/the-lockdown.png" },
            { name: "Vice Grip", desc: "Squeeze her breasts firmly together. Remind her who they belong to.", img: "images/vice-grip.png" },
            { name: "The Crucifix", desc: "Pin her arms using only your legs. Your hands are free to torment her torso.", img: "images/the-crucifix.png" },
            { name: "Jaw Clamp", desc: "Grip her jaw firmly. Force your kisses on her. Make her submit breathless.", img: "images/jaw-clamp.png" }
        ],
        finishers: [
            { name: "THE MONOLITH", desc: "FINISHER! Lay your full weight flat on top. Spread wide. She cannot move an inch.", img: "images/the-monolith.png" },
            { name: "THE ANACONDA", desc: "FINISHER! Wrap from the side. Crush the air from her lungs slowly.", img: "images/the-anaconda.png" },
            { name: "THE PILLAGER", desc: "FINISHER! Pin wrists, force legs, and destroy her torso until she cries out.", img: "images/the-pillager.png" },
            { name: "THE CRUSHER", desc: "FINISHER! Full weight body pin with intense grinding. Constriction and pressure.", img: "images/the-crusher.png" }
        ]
    },
    sensual: [
        { name: "Deep Kiss", desc: "Stop everything. Kiss deeply and passionately for 60 seconds. No hands.", timer: 60 },
        { name: "The Tease", desc: "Trace your fingers along lips, neck, and chest. They must stay perfectly still.", timer: 45 },
        { name: "Body Worship", desc: "Slowly kiss and worship your opponent's body. Take time to appreciate the prize.", timer: 45 },
        { name: "Heartbeat Check", desc: "Lay your head on their chest. Listen to their racing heart for one intimate minute.", timer: 60 }
    ]
};