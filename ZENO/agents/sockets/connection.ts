// temp data base

interface Session {
    host: string,
    client: string | null,
}

const sessions: Record<string, Session> = {};

module.exports = function (socket: any, io: any) {
    console.log(" Device connected:", socket.id);

    // CREATE SESSION (Laptop)
    socket.on("create-session", () => {
        const sessionId = Math.random().toString(36).substring(2, 8);

        sessions[sessionId] = {
            host: socket.id,
            client: null,
        };

        socket.join(sessionId);

        socket.emit("session-created", sessionId);
    });

    // JOIN SESSION (Mobile)
    socket.on("join-session", (sessionId: string) => {
        if (sessions[sessionId]) {
            sessions[sessionId].client = socket.id;

            socket.join(sessionId);

            io.to(sessionId).emit("session-joined", {
                message: "Connected successfully ",
            });
        } else {
            socket.emit("error", "Session not found");
        }
    });

    // SEND COMMAND (Mobile → Laptop)
    socket.on("command", ({ sessionId, data }: { sessionId: string, data: any }) => {
        const session = sessions[sessionId];
        if (session) {
            io.to(session.host).emit("execute-command", data);
        }
    });

    socket.on("disconnect", () => {
        console.log(" Disconnected:", socket.id);
    });
};