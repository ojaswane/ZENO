const { io: socketClient } = require("socket.io-client");
const socket = socketClient("http://localhost:5000"); // your port

socket.on("connect", () => {
    console.log(" Connected:", socket.id);

    // STEP 1: create session (simulate laptop)
    socket.emit("create-session");

    socket.on("session-created", (sessionId: string) => {
        console.log("Session ID:", sessionId);

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