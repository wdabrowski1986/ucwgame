# QUICK START & TESTING GUIDE

## Start the Game

### Option 1: Local Testing
```bash
cd c:\Users\doomt\OneDrive\Documents\Projects\TopSecret
python -m http.server 8000
```
Then open: `http://localhost:8000` in Chrome

### Option 2: Chromecast Broadcasting  
1. Get your PC's IP: `ipconfig` (look for IPv4)
2. Open Chrome, click Cast icon
3. Select your Chromecast device
4. Navigate to: `http://[YOUR-IP]:8000`

---

## Game Controls

### Intro Screen
- Click **BEGIN** to start

### Ritual Screen (3 Steps)
- Read ritual instructions
- Click **TRIBUTE PERFORMED** to advance through each step
- After 3 steps, arena automatically starts

### Arena (Main Gameplay)
- **5-Minute Timer** counts down in top right
- **Voice Submission**: Say "submit", "quit", "surrender", or "uncle"
- **Button Fallback**: Click giant red **SUBMIT** button
- **Auto-Actions**: Moves happen automatically

### Victory Screen
- Shows match winner
- Option to view credits

---

## Game Mechanics At-A-Glance

### Health & Clothing
| HP | Clothing |
|----|----------|
| 100-76% | 👗 Fully Dressed |
| 75-51% | 🎀 Partially Undressed |
| 50-26% | 👙 Underwear Only |
| 25-0% | 💋 Exposed |

### Move Types & Timers
- **Strike** (20 sec): Physical impact
- **Smother** (20 sec): Overpowering
- **Physical** (30 sec): Holds/positioning
- **Challenge** (15 sec): Escape tests
- **Sensual** (45 sec): Healing moves (restore HP!)

### Scoring
- **Round Winner**: Higher HP at round end
- **Match Winner**: First to win 2 rounds (Best of 3)

---

## What's Happening In Each Scene

### Scene 1: Intro
- Shows: "ENTER THE ULTIMATE COUPLE WRESTLING RING"
- Background: Ring image
- Button: BEGIN

### Scene 2: Ritual (3-Step Ceremony)
1. **THE OFFERING** - Wayne massages Cindy's foot, compliments her
2. **THE GODDESS'S MARK** - Cindy marks Wayne with kiss/nibble
3. **THE SEAL OF THE MATCH** - Deep 30-second kiss to lock in the match

### Scene 3: Arena (5-Minute Rounds)
- **Header**: Round display, 5-minute timer, match status
- **Left Panel**: Current move, attacker name, image, description, move timer
- **Right Panel**: Wayne & Cindy HP bars, clothing status
- **Bottom**: Voice detection indicator, giant submit button, score

---

## Testing Checklist

### Basic Functionality
- [ ] Intro screen appears
- [ ] BEGIN button works
- [ ] Ritual 3 steps display correctly
- [ ] TRIBUTE PERFORMED advances each step
- [ ] Arena loads after ritual

### Display/UI
- [ ] Round number shows (ROUND 1 of 3)
- [ ] 5-minute timer visible and counting
- [ ] Move names appear
- [ ] Player health bars fill/empty
- [ ] Clothing status updates when HP changes
- [ ] Score updates after each round

### Game Logic
- [ ] Wayne and Cindy alternate as attacker
- [ ] Moves display for correct duration (20-45 seconds)
- [ ] Damage applies to defender's HP
- [ ] At 75% HP: clothing changes
- [ ] At 50% HP: clothing changes again
- [ ] At 25% HP: final clothing change
- [ ] Round ends when timer hits 0:00
- [ ] Higher HP player wins the round
- [ ] Best of 3: Match ends after 2 round wins

### Submission System
- [ ] Voice indicator appears
- [ ] Microphone icon shows listening
- [ ] Submit button is prominently displayed
- [ ] Can manually trigger submission

### Multi-Round
- [ ] After round 1 ends, round 2 starts
- [ ] Clothing layers PRESERVE between rounds
- [ ] HP resets to 100 for next round
- [ ] Score updates show cumulative wins

### Victory
- [ ] After 2 round wins, match ends
- [ ] Victory screen shows winner name
- [ ] Credits can be viewed

---

## Common Issues & Fixes

### Game Won't Load
**Problem**: White screen, no content
**Solution**: 
- Refresh page (`Ctrl+F5` for hard refresh)
- Check browser console for errors (`F12` → Console tab)
- Ensure HTTP server is running

### Timer Not Showing
**Problem**: No visible countdown
**Solution**:
- Check `#timer-display` element exists in HTML
- Verify `style-broadcast.css` is linked
- CSS might be hiding it - check console

### No Voice Detection
**Problem**: Microphone button doesn't respond
**Solution**:
- Chrome required (best support)
- Check browser permissions (allow microphone)
- Use fallback button instead
- Check console for Speech API errors

### Moves Not Appearing
**Problem**: No move display in arena
**Solution**:
- Ensure `moves.js` loads before `mechanics.js`
- Check `getMovesByAttacker()` in console
- Verify moves array is populated
- Check image paths

### Health Not Updating
**Problem**: HP bar doesn't change
**Solution**:
- Verify `applyMoveDamage()` is called
- Check `updatePlayerHUD()` runs after damage
- Look for JS errors in console

---

## Console Debug Commands

Open browser console (`F12` → Console) and try:

```javascript
// Check game state
GameState

// Check current round
GameState.currentRound

// Check player HP
GameState.wayne.hp
GameState.cindy.hp

// Check attacker
GameState.currentAttacker

// Manually trigger submission
registerSubmission("wayne")

// Check available moves
moves.length  // Should be 50+

// Get Wayne's moves
moves.filter(m => m.attacker === "wayne")

// Check clothing layers
ClothingLayers
```

---

## Performance Tips

### For TV Display
- Maximize browser window (F11 for fullscreen)
- Use Chrome for best compatibility
- Ensure good WiFi for Chromecast
- Test lighting visibility

### For Voice Detection
- Quiet environment recommended
- Microphone should face direction of player
- Speak clearly and loudly
- Test words beforehand

---

## File References

| File | Purpose |
|------|---------|
| `index.html` | Main HTML structure with broadcast layout |
| `style.css` | Dark goddess styling (original) |
| `style-broadcast.css` | New TV broadcast styles |
| `JS/mechanics.js` | Game logic (COMPLETELY NEW) |
| `JS/moves.js` | 50+ move database |
| `images/` | Move image assets |

---

## Support

**Issues?** Check:
1. Browser console for errors (`F12`)
2. Server is running (`python -m http.server 8000`)
3. All files are in correct directories
4. CSS files are linked in HTML
5. JavaScript files load in correct order (moves.js before mechanics.js)

**Questions about implementation?** Reference:
- [REDESIGN_DOCUMENTATION.md](REDESIGN_DOCUMENTATION.md) - Full technical details
- [README.md](README.md) - Original project info
- Game state in console: `GameState`

---

**Last Updated**: February 3, 2026  
**Version**: 2.0 - Multi-Round Referee System
