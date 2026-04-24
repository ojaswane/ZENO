import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ServerError,
} from "./events";
import type { SessionStore } from "../sessions/store";
import { generateQrDataUrl } from "../qr/qr";
import { getLocalIpv4 } from "../net/localIp";
import { generateCommandFromText } from "../ai/gemini";
import { executeAction } from "../executor/executor";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export type SocketHandlersDeps = {
  io: TypedServer;
  socket: TypedSocket;
  sessions: SessionStore;
  port: number;
  serverUrlOverride: string | undefined;
  geminiApiKey: string | undefined;
  geminiModel: string;
};

function emitError(socket: TypedSocket, error: ServerError): void {
  socket.emit("error", error);
}

function computeServerUrl(port: number, override?: string): string {
  if (override) return override;
  const ip = getLocalIpv4() ?? "localhost";
  return `http://${ip}:${port}`;
}

export function registerSocketHandlers(deps: SocketHandlersDeps): void {
  const { io, socket, sessions, port, serverUrlOverride, geminiApiKey, geminiModel } = deps;

  socket.on("create-session", async () => {
    try {
      socket.data.role = "host";
      const session = sessions.create(socket.id);
      socket.join(session.id);

      const serverUrl = computeServerUrl(port, serverUrlOverride);
      const qrCodeDataUrl = await generateQrDataUrl({ sessionId: session.id, serverUrl });

      socket.emit("session-created", { sessionId: session.id, serverUrl, qrCodeDataUrl });
      io.to(session.id).emit("session-joined", { sessionId: session.id, role: "host" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create session";
      emitError(socket, { code: "INVALID_PAYLOAD", message });
    }
  });

  socket.on("join-session", (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) {
      emitError(socket, { code: "SESSION_NOT_FOUND", message: "Session not found" });
      return;
    }

    socket.data.role = "client";
    sessions.joinClient(sessionId, socket.id);
    socket.join(sessionId);

    io.to(sessionId).emit("session-joined", { sessionId, role: "client" });
  });

  socket.on("user-command", async (payload) => {
    const sessionId = payload.sessionId;
    const text = "text" in payload ? payload.text : payload.data;
    const session = sessions.get(sessionId);
    if (!session) {
      emitError(socket, { code: "SESSION_NOT_FOUND", message: "Session not found" });
      return;
    }

    sessions.touch(sessionId);

    try {
      const command = await generateCommandFromText(text, { geminiApiKey, geminiModel });
      io.to(sessionId).emit("assistant-response", { sessionId, command });

      io.to(sessionId).emit("execute-command", { sessionId, action: command.action });
      const result = await executeAction(command.action);
      io.to(sessionId).emit("command-result", { sessionId, ...result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI processing failed";
      emitError(socket, { code: "AI_FAILED", message });
    }
  });

  socket.on("disconnect", () => {
    sessions.deleteByHostSocket(socket.id);
    sessions.deleteByClientSocket(socket.id);
  });
}
