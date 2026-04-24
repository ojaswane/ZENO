const { io: socketClient } = require("socket.io-client");
const socket = socketClient("http://localhost:4000");

socket.on("connect", () => {
    console.log(" Connected:", socket.id);

    // STEP 1: create session (simulate laptop)
    socket.emit("create-session");

    socket.on("session-created", ({ sessionId, qrCode }: { sessionId: string, qrCode: string }) => {
        console.log("Session ID:", sessionId);
        console.log("QR Code generated (base64 length):", qrCode ? qrCode.length : 0);

        // STEP 2: send command (simulate mobile)
        socket.emit("user-command", {
            sessionId,
            data: "open chrome"
        });
    });
});

// listen for execution
socket.on("execute-command", (data: any) => {
    console.log("Command received:", data);
});
