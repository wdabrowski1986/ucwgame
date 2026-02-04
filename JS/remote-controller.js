// ============================================
// REMOTE CONTROLLER & DEVICE LINKING SYSTEM
// ============================================

const RemoteController = {
    isHost: false,
    isRemote: false,
    connectionId: null,
    channel: null,
    
    init() {
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.get('mode') === 'remote') {
            this.setupRemoteMode(urlParams.get('id'));
        } else {
            this.setupHostMode();
        }
    },
    
    setupHostMode() {
        this.isHost = true;
        this.connectionId = this.generateConnectionId();
        
        // Use BroadcastChannel for same-device communication
        try {
            this.channel = new BroadcastChannel('ucw-game-' + this.connectionId);
            this.channel.onmessage = (event) => this.handleRemoteMessage(event.data);
            console.log('Host mode: Waiting for remote controller');
        } catch (e) {
            console.log('BroadcastChannel not supported, using fallback');
            this.setupFallbackCommunication();
        }
        
        // Show connection info
        this.displayConnectionInfo();
    },
    
    setupRemoteMode(connectionId) {
        this.isRemote = true;
        this.connectionId = connectionId;
        
        // Hide game UI, show only remote controller
        document.body.innerHTML = '';
        document.body.className = 'remote-controller-mode';
        
        const container = document.createElement('div');
        container.className = 'controller-container';
        container.innerHTML = `
            <h1 class="glow-text">UCW REMOTE CONTROLLER</h1>
            <button class="giant-submit-btn" id="remote-submit-btn">
                SUBMIT
            </button>
            <div class="connection-status" id="remote-status">
                Connecting...
            </div>
        `;
        document.body.appendChild(container);
        
        // Setup communication
        try {
            this.channel = new BroadcastChannel('ucw-game-' + connectionId);
            document.getElementById('remote-status').textContent = 'Connected!';
            
            document.getElementById('remote-submit-btn').addEventListener('click', () => {
                this.sendSubmission();
            });
        } catch (e) {
            document.getElementById('remote-status').textContent = 'Connection failed - using fallback';
            this.setupFallbackCommunication();
        }
    },
    
    setupFallbackCommunication() {
        // Fallback: Use localStorage events for cross-tab communication
        this.channel = {
            postMessage: (data) => {
                localStorage.setItem('ucw-message-' + this.connectionId, JSON.stringify({
                    data: data,
                    timestamp: Date.now()
                }));
            }
        };
        
        window.addEventListener('storage', (e) => {
            if (e.key === 'ucw-message-' + this.connectionId && this.isHost) {
                const message = JSON.parse(e.newValue);
                this.handleRemoteMessage(message.data);
            }
        });
    },
    
    generateConnectionId() {
        return Math.random().toString(36).substring(2, 10);
    },
    
    displayConnectionInfo() {
        // Create a button to show QR code / link
        const infoButton = document.createElement('button');
        infoButton.className = 'connection-info-btn';
        infoButton.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(255, 20, 147, 0.9);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 10000;
            font-size: 1em;
        `;
        infoButton.textContent = '📱 Connect Remote';
        infoButton.onclick = () => this.showConnectionModal();
        document.body.appendChild(infoButton);
    },
    
    showConnectionModal() {
        const modal = document.createElement('div');
        modal.className = 'connection-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;
        
        const remoteUrl = window.location.origin + window.location.pathname + 
                         `?mode=remote&id=${this.connectionId}`;
        
        modal.innerHTML = `
            <div style="background: #1a0033; padding: 40px; border-radius: 15px; border: 2px solid #ff1493; text-align: center; max-width: 500px;">
                <h2 style="color: #ff1493; margin-bottom: 20px;">Connect Remote Controller</h2>
                <p style="color: white; margin-bottom: 20px;">
                    Open this URL on another phone/tablet:
                </p>
                <div style="background: white; padding: 10px; border-radius: 5px; margin-bottom: 20px; word-break: break-all;">
                    <code style="color: #000;">${remoteUrl}</code>
                </div>
                <button onclick="navigator.clipboard.writeText('${remoteUrl}')" 
                        style="background: #ff1493; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin: 10px;">
                    📋 Copy Link
                </button>
                <div id="qr-container" class="qr-code-container" style="margin: 20px auto;">
                    <div style="background: white; padding: 20px; border-radius: 10px;">
                        <p style="color: #000; margin-bottom: 10px;">Scan with phone camera:</p>
                        <canvas id="qr-canvas"></canvas>
                    </div>
                </div>
                <button onclick="this.closest('.connection-modal').remove()" 
                        style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Generate QR code
        this.generateQRCode(remoteUrl);
    },
    
    generateQRCode(url) {
        // Simple QR code generation using a library or manual generation
        // For now, using a placeholder - you can integrate qrcode.js or similar
        const canvas = document.getElementById('qr-canvas');
        if (canvas && typeof QRCode !== 'undefined') {
            QRCode.toCanvas(canvas, url, { width: 200 });
        } else {
            // Fallback: Show text
            const container = document.getElementById('qr-container');
            container.innerHTML = `<p style="color: #000;">QR Code library not loaded. Use the link above.</p>`;
        }
    },
    
    sendSubmission() {
        if (this.channel) {
            this.channel.postMessage({
                type: 'submission',
                timestamp: Date.now()
            });
            
            // Visual feedback
            const btn = document.getElementById('remote-submit-btn');
            if (btn) {
                btn.style.background = '#00ff00';
                btn.textContent = 'SUBMITTED!';
                setTimeout(() => {
                    btn.style.background = '';
                    btn.textContent = 'SUBMIT';
                }, 1000);
            }
        }
    },
    
    handleRemoteMessage(data) {
        if (data.type === 'submission') {
            console.log('Remote submission received!');
            // Trigger the game's submission handler
            if (typeof registerSubmission === 'function') {
                registerSubmission();
            }
            
            // Visual feedback on host
            const status = document.getElementById('submission-status');
            if (status) {
                status.textContent = '📱 REMOTE SUBMISSION RECEIVED!';
                status.style.color = '#00ff00';
                setTimeout(() => {
                    status.textContent = 'Ready for submission...';
                    status.style.color = '';
                }, 2000);
            }
        }
    }
};

// ============================================
// DEVICE DETECTION
// ============================================

const DeviceDetection = {
    isMobile: false,
    isTablet: false,
    isTV: false,
    
    detect() {
        const ua = navigator.userAgent;
        const width = window.innerWidth;
        
        // Detect mobile
        this.isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) 
                       || width < 768;
        
        // Detect tablet
        this.isTablet = /iPad|Android/i.test(ua) && width >= 768 && width < 1024;
        
        // Detect TV (cast mode or large screen)
        this.isTV = width >= 1024 || this.isCastMode();
        
        // Apply classes to body
        if (this.isMobile) document.body.classList.add('mobile-device');
        if (this.isTablet) document.body.classList.add('tablet-device');
        if (this.isTV) document.body.classList.add('tv-device');
        
        console.log('Device detected:', {
            mobile: this.isMobile,
            tablet: this.isTablet,
            tv: this.isTV
        });
    },
    
    isCastMode() {
        // Check if running in Chromecast or similar
        return window.navigator.userAgent.includes('CrKey');
    }
};

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    DeviceDetection.detect();
    RemoteController.init();
});

// Make globally accessible
window.RemoteController = RemoteController;
window.DeviceDetection = DeviceDetection;
