import type { AiCommand } from "../types/ai";
import type { Action } from "../types/actions";

export type CreateSessionResponse = {
  sessionId: string;
  serverUrl: string;
  qrCodeDataUrl: string;
};

export type SessionJoined = {
  sessionId: string;
  role: "host" | "client";
};

export type AssistantResponse = {
  sessionId: string;
  utteranceId: string;
  command: AiCommand;
};

export type AssistantAudio = {
  sessionId: string;
  utteranceId: string;
  mime: "audio/mpeg";
  audioBase64: string;
};

export type ExecuteCommand = {
  sessionId: string;
  action: Action;
  status?: "ready" | "pending";
};

export type CommandResult = {
  sessionId: string;
  success: boolean;
  message: string;
  requiresConfirmation?: boolean;
  confirmPrompt?: string;
};

export type ServerError = {
  code:
    | "SESSION_NOT_FOUND"
    | "SESSION_EXPIRED"
    | "INVALID_PAYLOAD"
    | "AI_FAILED"
    | "EXECUTION_BLOCKED"
    | "EXECUTION_FAILED";
  message: string;
};

export type ClientToServerEvents = {
  "create-session": () => void;
  "join-session": (sessionId: string) => void;
  "user-command": (payload: { sessionId: string; text: string } | { sessionId: string; data: string }) => void;
  "confirm-action": (payload: { sessionId: string; confirmed: boolean }) => void;
};

export type ServerToClientEvents = {
  "session-created": (payload: CreateSessionResponse) => void;
  "session-joined": (payload: SessionJoined) => void;
  "assistant-response": (payload: AssistantResponse) => void;
  "assistant-audio": (payload: AssistantAudio) => void;
  "execute-command": (payload: ExecuteCommand) => void;
  "command-result": (payload: CommandResult) => void;
  error: (payload: ServerError) => void;
};

export type InterServerEvents = Record<string, never>;
export type SocketData = { role?: "host" | "client" };
