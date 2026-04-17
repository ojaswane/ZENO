// temp data base

// This is how the Ai will send data:
/* socket.emit("command", {
  sessionId: "abc123",
  data: {
    action: "open_app",
    app: "chrome",
  },
}); */

interface Session {
    host: string,
    client: string | null,
}

const sessions: Record<string, Session> = {};
const GetAiRes = require("../Ai/Generate_output").default;
import executeCommand from "../utils/execute";

function parseAiResponse(response: string) {
    const trimmed = response.trim();
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    const payload = jsonMatch ? jsonMatch[0] : trimmed;

    try {
        return { ok: true, data: JSON.parse(payload) };
    } catch (error) {
        return {
            ok: false,
            data: {
                action: "assistant_message",
                text: trimmed,
            },
            error,
        };
    }
}

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

        // this will basically shown by qr
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

    // HANDLE USER COMMANNDS
    socket.on("user-command", async ({ sessionId, data }: { sessionId: string, data: any }) => {
        const session = sessions[sessionId];
        if (!session) {
            socket.emit("error", "Session not found");
            return;
        }

        try {
            const res = await GetAiRes(data);
            const parsed = parseAiResponse(res);

            if (!parsed.ok) {
                console.warn("AI response was not valid JSON:", res);
            }

            io.to(session.host).emit("execute-command", parsed.data);
        } catch (error) {
            console.error("Failed to process user command:", error);
            socket.emit("error", "Failed to process command");
        }
    });

    socket.on("execute-command", (data: any) => {
        executeCommand(data);
    });

    socket.on("disconnect", () => {
        console.log(" Disconnected:", socket.id);
    });
};