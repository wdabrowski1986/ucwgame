# 📱 Mobile & Remote Button Setup Guide

## New Features Added

### ✅ Mobile Responsive Design
- Play on phones and tablets
- Optimized touch controls
- Auto-scaling UI elements
- Portrait and landscape support

### ✅ Remote Submission Button
- Connect a second phone/tablet as a dedicated submission button
- Works alongside voice detection
- Perfect backup when audio doesn't work
- Real-time WebSocket connection

---

## 🚀 Quick Start

### Option 1: Play on Computer (Original Method)

```bash
# Navigate to project folder
cd ucwgame-main

# Start the new Node.js server
node server.js

# Or use npm start (if package.json configured)
npm start
```

Then visit: `http://localhost:8080`

### Option 2: Play on Mobile/Tablet

1. Start the server on your computer:
   ```bash
   node server.js
   ```

2. Find your computer's local IP address:
   - **Windows**: Open CMD and type `ipconfig` (look for IPv4 Address)
   - **Mac/Linux**: Open Terminal and type `ifconfig` or `ip addr`

3. On your phone/tablet browser, visit:
   ```
   http://[YOUR-IP]:8080
   ```
   Example: `http://192.168.1.100:8080`

---

## 📱 Remote Submission Button Setup

### Method 1: QR Code (Easiest)

1. Start the game on your main device (computer, phone, or tablet)

2. Look for the "Remote Button" panel in the top-right corner

3. On your second phone/tablet:
   - Open the camera app
   - Point at the QR code displayed
   - Tap the notification to open the remote button page

4. You'll see a giant SUBMIT button - you're connected!

### Method 2: Manual URL

1. Note the URL shown in the "Remote Button" panel, for example:
   ```
   http://192.168.1.100:8080/remote.html
   ```

2. Type this URL into your second phone/tablet's browser

3. The giant SUBMIT button will appear when connected

### Using the Remote Button

- **Green status** = Connected and ready
- **Red status** = Disconnected (check network or refresh)
- Press the giant button anytime to submit/quit the round
- The button works alongside voice detection
- Haptic feedback confirms your press (vibration on supported devices)

---

## 🎮 Complete Gameplay Flow

### Setup Phase

1. **Main Device** (Computer/Phone/Tablet):
   - Start server: `node server.js`
   - Open browser: `http://localhost:8080` or `http://[YOUR-IP]:8080`
   - Click BEGIN
   - Complete the 3-step ritual

2. **Optional Remote Button** (Second Phone/Tablet):
   - Scan QR code or visit `/remote.html`
   - Wait for green "CONNECTED" status
   - Keep nearby during gameplay

### During Gameplay

- Main screen shows moves, timers, and stats
- Say "submit" or "quit" for voice detection
- **OR** press the giant button on remote device
- **OR** tap the on-screen submit button

### Casting to TV

1. Start server on computer
2. Cast browser tab to Chromecast
3. Use phone as remote button for submissions
4. Best of both worlds!

---

## 🔧 Technical Details

### Server Requirements

- **Node.js** (v14 or higher)
- No additional dependencies (uses built-in modules)
- Ports: 8080 (can be changed via PORT environment variable)

### Network Requirements

- All devices must be on the **same WiFi network**
- Firewall may need to allow port 8080
- Some corporate/public WiFi blocks WebSocket connections

### Browser Compatibility

| Browser | Main Game | Remote Button | Voice Detection |
|---------|-----------|---------------|-----------------|
| Chrome (Mobile) | ✅ Excellent | ✅ Perfect | ✅ Yes |
| Safari (iOS) | ✅ Good | ✅ Perfect | ⚠️ Limited |
| Firefox (Mobile) | ✅ Good | ✅ Perfect | ⚠️ Limited |
| Samsung Internet | ✅ Good | ✅ Perfect | ⚠️ Limited |

**Recommendation**: Use Chrome on Android or Safari on iOS for best experience.

---

## 🎨 Mobile UI Features

### Responsive Design
- Touch-optimized buttons (minimum 48px)
- Scalable text (clamp function)
- Vertical stacking on small screens
- Horizontal layout on tablets

### Touch Enhancements
- No accidental double-tap zoom
- Haptic feedback on button press
- Visual feedback on all interactions
- Swipe prevention during gameplay

### Orientation Support
- **Portrait**: Optimized for one-handed play
- **Landscape**: Wider layout, better visibility
- Auto-adjusts when device rotates

---

## 🐛 Troubleshooting

### Remote Button Won't Connect

**Problem**: Shows "DISCONNECTED" or "CONNECTING..."

**Solutions**:
1. Check both devices are on same WiFi
2. Verify server is running (`node server.js`)
3. Try refreshing the remote button page
4. Check firewall isn't blocking port 8080
5. Make sure you're using the correct IP address

### Voice Detection Not Working

**Problem**: Voice commands not recognized

**Solutions**:
1. Use Chrome browser (best voice support)
2. Grant microphone permissions when prompted
3. Speak clearly: "submit", "quit", "surrender"
4. **Use the remote button instead** (that's why we built it!)

### UI Elements Too Small on Phone

**Problem**: Text or buttons hard to see/tap

**Solutions**:
1. Make sure `style-mobile.css` is loaded
2. Try landscape orientation
3. Zoom in browser (pinch gesture)
4. Use tablet for bigger screen

### Can't Find IP Address

**Problem**: Don't know what IP to use

**Windows**:
```cmd
ipconfig
```
Look for "IPv4 Address" (usually starts with 192.168 or 10.)

**Mac/Linux**:
```bash
ifconfig | grep "inet "
```
or
```bash
hostname -I
```

### Connection Drops During Game

**Problem**: Remote button disconnects randomly

**Solutions**:
1. Stay closer to WiFi router
2. Disable battery saver on remote device
3. Keep remote device screen on
4. Check for WiFi interference
5. Server auto-reconnects - just wait

---

## 📊 Feature Comparison

| Feature | Computer Only | Computer + Cast | Mobile Only | Mobile + Remote |
|---------|--------------|-----------------|-------------|-----------------|
| Full Gameplay | ✅ | ✅ | ✅ | ✅ |
| Large Display | ❌ | ✅ | ⚠️ Small | ⚠️ Small |
| Voice Submission | ✅ | ✅ | ⚠️ Limited | ⚠️ Limited |
| Button Submission | ✅ | ✅ | ✅ | ✅✅ Dedicated |
| Portability | ❌ | ❌ | ✅ | ✅ |
| Multi-Device | ❌ | ⚠️ Cast only | ❌ | ✅✅ |

**Best Setup**: Computer/tablet casting to TV + phone as remote button

---

## 🎯 Use Cases

### Couch Gaming
- Main game on TV via Chromecast
- Each player has phone as remote button
- No need to pass controller

### Bedroom Play
- Tablet between you showing game
- Both phones as submission buttons
- Voice backup if buttons fail

### Travel/Hotel
- Phone or tablet as main device
- Partner's phone as remote
- Portable setup anywhere

### Party Mode
- Large TV showing game
- Multiple phones can connect as remotes
- Spectator-friendly

---

## 🔐 Privacy & Security

- All connections are **local network only**
- No internet connection required (except for QR code image)
- No data sent to external servers
- WebSocket connection is unencrypted (use VPN if concerned)

---

## 🚀 Future Enhancements

Potential features for next version:

- [ ] Encrypted WebSocket connections (WSS)
- [ ] Multiple remote buttons with player assignment
- [ ] Remote control for move selection (not just submission)
- [ ] Vibration patterns for different game events
- [ ] Stats display on remote device
- [ ] PWA support (install as app)
- [ ] Offline mode with service workers

---

## 📝 Package.json Configuration

Add this to your `package.json` for easy startup:

```json
{
  "name": "ucw-game",
  "version": "2.1.0",
  "description": "Ultimate Couple Wrestling Game with Mobile & Remote Support",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "keywords": ["game", "wrestling", "mobile", "websocket"],
  "author": "Your Name",
  "license": "Private"
}
```

Then just run: `npm start`

---

## ✅ Testing Checklist

Before starting a game session, verify:

- [ ] Server is running (`node server.js`)
- [ ] Main game loads on primary device
- [ ] Can complete ritual phase
- [ ] Arena displays correctly
- [ ] Timer counts down
- [ ] Remote button page loads on second device
- [ ] Remote shows "CONNECTED" status
- [ ] Pressing remote button triggers submission
- [ ] Voice detection works (if desired)
- [ ] UI scales properly on mobile

---

## 📞 Support

If you encounter issues:

1. Check console for errors (F12 → Console tab)
2. Verify WebSocket connection in Network tab
3. Test on different browsers
4. Restart server and refresh all pages
5. Check this guide's troubleshooting section

---

**Last Updated**: February 4, 2026  
**Version**: 2.1 - Mobile & Remote Button Support  
**Server**: Node.js WebSocket Server

Enjoy your enhanced UCW experience! 🎮👑
