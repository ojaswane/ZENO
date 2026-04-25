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
import { synthesizeElevenLabs } from "../tts/elevenlabs";
import crypto from "node:crypto";

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
  elevenLabsApiKey: string | undefined;
  elevenLabsVoiceId: string | undefined;
  elevenLabsVoiceName: string;
  elevenLabsModelId: string;
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

    // Greeting to the joining client (best-effort TTS).
    void (async () => {
      const utteranceId = crypto.randomUUID();
      const greeting = "Hello sir, want me to open your favorite song?";
      const command = {
        speech: greeting,
        action: { type: "assistant_message", text: greeting } as const,
      };

      socket.emit("assistant-response", { sessionId, utteranceId, command });

      try {
        const audio = await synthesizeElevenLabs(greeting, {
          port,
          serverUrlOverride,
          geminiApiKey,
          geminiModel,
          elevenLabsApiKey: deps.elevenLabsApiKey,
          elevenLabsVoiceId: deps.elevenLabsVoiceId,
          elevenLabsVoiceName: deps.elevenLabsVoiceName,
          elevenLabsModelId: deps.elevenLabsModelId,
        });
        if (audio) {
          socket.emit("assistant-audio", {
            sessionId,
            utteranceId,
            mime: audio.mime,
            audioBase64: audio.base64,
          });
        }
      } catch {
        // ignore
      }
    })();
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
      const utteranceId = crypto.randomUUID();
      io.to(sessionId).emit("assistant-response", { sessionId, utteranceId, command });

      // Optional TTS (ElevenLabs) — best-effort.
      try {
        const audio = await synthesizeElevenLabs(command.speech, {
          port,
          serverUrlOverride,
          geminiApiKey,
          geminiModel,
          elevenLabsApiKey: deps.elevenLabsApiKey,
          elevenLabsVoiceId: deps.elevenLabsVoiceId,
          elevenLabsVoiceName: deps.elevenLabsVoiceName,
          elevenLabsModelId: deps.elevenLabsModelId,
        });
        if (audio) {
          io.to(sessionId).emit("assistant-audio", {
            sessionId,
            utteranceId,
            mime: audio.mime,
            audioBase64: audio.base64,
          });
        }
      } catch {
        // ignore
      }

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
