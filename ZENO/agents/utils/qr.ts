const QRCode = require("qrcode");

interface Session {
    host: string,
    client: string | null,
}

// GLOBAL (outside function)
const sessions: Record<string, Session> = {};

socket.on("create-session", async () => {
    const sessionId = Math.random().toString(36).substring(2, 8);

    sessions[sessionId] = {
        host: socket.id,
        client: null,
    };

    socket.join(sessionId);


    const qrData = JSON.stringify({
        sessionId,
        serverUrl: "http://192.168.105.96:4000" // replace with your IP
    });

    const qrCode = await QRCode.toDataURL(qrData);

    socket.emit("session-created", {
        sessionId,
        qrCode
    });
});