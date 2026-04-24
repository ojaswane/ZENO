const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });
const QRCode = require("qrcode");

const handleSocketConnection = require("./sockets/connection");
const { initSessions } = require("./sockets/connection");
const app = express();
app.use(cors());

// Shared sessions store - used by both HTTP endpoint and socket handlers
interface Session {
    host: string;
    client: string | null;
}
const sessions: Record<string, Session> = {};

// Initialize sessions in socket handler
initSessions(sessions);

function createSessionWithQR() {
    const sessionId = Math.random().toString(36).substring(2, 8);
    const serverUrl = process.env.SERVER_URL || "http://192.168.105.96:4000";

    // Store session so mobile can join it
    sessions[sessionId] = { host: 'pending', client: null };

    const qrData = JSON.stringify({ sessionId, serverUrl });
    const qrCode = QRCode.toDataURLSync(qrData);

    return { sessionId, qrCode, serverUrl };
}

// Export sessions for socket handler
module.exports = { sessions };

// Serve QR code page at /qr endpoint
app.get("/qr", async (req: any, res: any) => {
    try {
        const { sessionId, qrCode } = createSessionWithQR();

        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>ZENO - Scan to Connect</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
        }
        .container { text-align: center; padding: 40px; }
        h1 {
            font-size: 48px;
            font-weight: 800;
            letter-spacing: 4px;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #c084fc, #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle { color: rgba(255,255,255,0.6); font-size: 16px; margin-bottom: 40px; }
        .qr-box {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(192,132,252,0.3);
            border-radius: 24px;
            padding: 30px;
            display: inline-block;
        }
        img { width: 280px; height: 280px; border-radius: 12px; }
        .session-id { margin-top: 20px; font-size: 14px; color: rgba(255,255,255,0.5); letter-spacing: 2px; }
        .status { margin-top: 30px; font-size: 14px; color: #f59e0b; }
    </style>
</head>
<body>
    <div class="container">
        <h1>ZENO</h1>
        <p class="subtitle">Scan with your phone to connect</p>
        <div class="qr-box">
            <img src="${qrCode}" alt="QR Code" />
            <p class="session-id">Session: ${sessionId}</p>
        </div>
        <p class="status" id="status">Waiting for mobile to scan...</p>
    </div>
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        socket.on('session-joined', () => {
            document.getElementById('status').textContent = 'Mobile connected!';
            document.getElementById('status').style.color = '#22c55e';
        });
    </script>
</body>
</html>
        `);
    } catch (err: unknown) {
        res.status(500).send("Error generating QR: " + (err as Error).message);
    }
});

// creating the server
const server = http.createServer(app);

// creating the socket server
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// socket logic
io.on("connection", (socket : any) => {
    handleSocketConnection(socket, io);
}
);

server.listen(4000, () => {
    console.log("ZENO server running on port 4000");
    console.log("QR Code page: http://localhost:4000/qr");
});