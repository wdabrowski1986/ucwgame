// Simple WebSocket server for remote submission button
const http = require('http');
const fs = require('fs');
const path = require('path');

// Store connected clients
const clients = new Set();
let gameClient = null;

// Create HTTP server
const server = http.createServer((req, res) => {
    // Serve static files
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// WebSocket upgrade handler
server.on('upgrade', (request, socket, head) => {
    // Parse the URL to determine client type
    const url = new URL(request.url, `http://${request.headers.host}`);
    const clientType = url.searchParams.get('type') || 'remote';
    
    // Simple WebSocket handshake
    const key = request.headers['sec-websocket-key'];
    const acceptKey = require('crypto')
        .createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');
    
    socket.write(
        'HTTP/1.1 101 Switching Protocols\r\n' +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${acceptKey}\r\n\r\n`
    );
    
    const client = {
        socket,
        type: clientType,
        send: (data) => {
            const payload = JSON.stringify(data);
            const length = Buffer.byteLength(payload);
            const buffer = Buffer.allocUnsafe(2 + length);
            buffer[0] = 0x81; // Text frame
            buffer[1] = length;
            buffer.write(payload, 2);
            socket.write(buffer);
        }
    };
    
    if (clientType === 'game') {
        gameClient = client;
        console.log('Game client connected');
    } else {
        clients.add(client);
        console.log(`Remote button connected. Total remotes: ${clients.size}`);
    }
    
    // Handle incoming messages
    socket.on('data', (buffer) => {
        // Simple frame parsing (assumes small messages)
        const masked = (buffer[1] & 0x80) === 0x80;
        let length = buffer[1] & 0x7f;
        let maskStart = 2;
        
        if (length === 126) {
            length = buffer.readUInt16BE(2);
            maskStart = 4;
        } else if (length === 127) {
            length = buffer.readUInt32BE(6);
            maskStart = 10;
        }
        
        let payload;
        if (masked) {
            const mask = buffer.slice(maskStart, maskStart + 4);
            const data = buffer.slice(maskStart + 4, maskStart + 4 + length);
            payload = Buffer.allocUnsafe(length);
            for (let i = 0; i < length; i++) {
                payload[i] = data[i] ^ mask[i % 4];
            }
        } else {
            payload = buffer.slice(maskStart, maskStart + length);
        }
        
        try {
            const message = JSON.parse(payload.toString());
            
            if (message.type === 'submission' && gameClient) {
                // Forward submission to game client
                gameClient.send({ type: 'submission' });
                console.log('Submission forwarded to game');
            } else if (message.type === 'ping') {
                client.send({ type: 'pong' });
            }
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    });
    
    socket.on('close', () => {
        if (client === gameClient) {
            gameClient = null;
            console.log('Game client disconnected');
        } else {
            clients.delete(client);
            console.log(`Remote button disconnected. Total remotes: ${clients.size}`);
        }
    });
    
    socket.on('error', (err) => {
        console.error('Socket error:', err);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🎮 UCW Game Server Running!`);
    console.log(`\n📱 Main Game: http://localhost:${PORT}`);
    console.log(`📱 Remote Button: http://localhost:${PORT}/remote.html`);
    console.log(`\nTo connect from other devices, use your local IP address`);
    console.log(`(Run 'ipconfig' on Windows or 'ifconfig' on Mac/Linux to find it)\n`);
});
