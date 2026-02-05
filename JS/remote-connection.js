// WebSocket Remote Connection Manager
// Connects the main game to remote submission buttons

class RemoteConnectionManager {
    constructor() {
        this.ws = null;
        this.remoteConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.onSubmissionCallback = null;
    }

    // Initialize connection
    init(onSubmissionCallback) {
        this.onSubmissionCallback = onSubmissionCallback;
        this.connect();
        this.createConnectionUI();
    }

    // Connect to WebSocket server
    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}?type=game`;
            
            console.log('Connecting to WebSocket server...');
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('✅ Connected to remote button server');
                this.remoteConnected = true;
                this.reconnectAttempts = 0;
                this.updateConnectionUI(true);
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    
                    if (message.type === 'submission') {
                        console.log('📱 Remote submission received!');
                        if (this.onSubmissionCallback) {
                            this.onSubmissionCallback();
                        }
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            };

            this.ws.onclose = () => {
                console.log('❌ Disconnected from remote button server');
                this.remoteConnected = false;
                this.updateConnectionUI(false);
                
                // Try to reconnect
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    setTimeout(() => {
                        console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                        this.connect();
                    }, this.reconnectDelay);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

        } catch (e) {
            console.error('Failed to connect to WebSocket:', e);
            this.updateConnectionUI(false);
        }
    }

    // Send message to server
    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    // Create UI for connection status and QR code
    createConnectionUI() {
        const panel = document.createElement('div');
        panel.id = 'connection-panel';
        panel.className = 'connection-panel';
        panel.innerHTML = `
            <h3>📱 Remote Button</h3>
            <div class="connection-status">
                <span class="status-indicator disconnected"></span>
                <span class="status-text">Waiting...</span>
            </div>
            <div class="connection-details">
                <p style="margin-top: 10px;">Connect a second phone/tablet:</p>
                <div class="url-display" id="remote-url">Loading...</div>
                <div class="qr-code" id="qr-code-container"></div>
                <button class="toggle-btn" onclick="remoteManager.togglePanel()">Minimize</button>
            </div>
        `;
        document.body.appendChild(panel);

        // Generate QR code and URL
        this.updateRemoteURL();
    }

    // Update the remote URL and QR code
    updateRemoteURL() {
        const protocol = window.location.protocol;
        const host = window.location.host;
        const pathname = window.location.pathname;
        // Get the directory path (remove index.html or trailing filename if present)
        const basePath = pathname.substring(0, pathname.lastIndexOf('/') + 1);
        const remoteUrl = `${protocol}//${host}${basePath}remote.html`;
        
        const urlDisplay = document.getElementById('remote-url');
        if (urlDisplay) {
            urlDisplay.textContent = remoteUrl;
        }

        // Generate simple QR code using a library or service
        this.generateQRCode(remoteUrl);
    }

    // Generate QR code (using qrcode.js library or API)
    generateQRCode(url) {
        const container = document.getElementById('qr-code-container');
        if (!container) return;

        // Use a QR code generation service
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
        container.innerHTML = `<img src="${qrApiUrl}" alt="QR Code" style="display: block; width: 150px; height: 150px;">`;
    }

    // Update connection UI status
    updateConnectionUI(connected) {
        const indicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.status-text');
        
        if (indicator) {
            indicator.className = connected ? 'status-indicator connected' : 'status-indicator disconnected';
        }
        
        if (statusText) {
            statusText.textContent = connected ? 'Connected' : 'Disconnected';
        }
    }

    // Toggle panel visibility
    togglePanel() {
        const panel = document.getElementById('connection-panel');
        const details = panel.querySelector('.connection-details');
        const btn = panel.querySelector('.toggle-btn');
        
        if (panel.classList.contains('minimized')) {
            panel.classList.remove('minimized');
            details.style.display = 'block';
            btn.textContent = 'Minimize';
        } else {
            panel.classList.add('minimized');
            details.style.display = 'none';
            btn.textContent = 'Show';
        }
    }

    // Disconnect
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Create global instance
const remoteManager = new RemoteConnectionManager();

// Make it available globally
window.remoteManager = remoteManager;
