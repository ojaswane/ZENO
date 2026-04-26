import React, { PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { io, type Socket } from 'socket.io-client';

type ServerErrorPayload = string | { message?: unknown; code?: unknown } | null | undefined;

function toErrorText(payload: ServerErrorPayload): string {
  if (typeof payload === 'string') return payload;
  if (payload && typeof payload === 'object') {
    const maybeMessage = (payload as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage;
  }
  return 'Something went wrong while talking to the backend.';
}

type ConnectionEvent =
  | { id: string; type: 'session-created'; text: string }
  | { id: string; type: 'assistant-response'; text: string; payload?: unknown; utteranceId?: string }
  | { id: string; type: 'command-result'; text: string; success: boolean; payload?: unknown }
  | { id: string; type: 'error'; text: string };

type ConnectionContextValue = {
  connected: boolean;
  connecting: boolean;
  serverUrl: string;
  sessionId: string | null;
  lastError: string | null;
  lastEvent: ConnectionEvent | null;
  lastAssistantAudio: { utteranceId: string; mime: string; audioBase64: string } | null;
  qrCode: string | null;
  pendingConfirm: { contactName: string; message: string } | null;
  setServerUrl: (serverUrl: string) => void;
  connect: () => void;
  joinSession: (sessionId: string, serverUrl?: string) => void;
  disconnect: () => void;
  sendCommand: (text: string) => boolean;
  confirmPendingAction: (confirmed: boolean) => void;
};

const ConnectionContext = React.createContext<ConnectionContextValue | null>(null);
const DEFAULT_SERVER_URL = process.env.EXPO_PUBLIC_ZENO_SERVER_URL ?? 'http://localhost:4001';

function createEventId(type: string) {
  return `${type}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function ConnectionProvider({ children }: PropsWithChildren) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ contactName: string; message: string } | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<ConnectionEvent | null>(null);
  const [lastAssistantAudio, setLastAssistantAudio] = useState<ConnectionContextValue['lastAssistantAudio']>(null);
  const socketRef = useRef<Socket | null>(null);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
    setConnecting(false);
    setSessionId(null);
    setQrCode(null);
    setLastAssistantAudio(null);
  }, []);

  const connect = useCallback(() => {
    const trimmedUrl = serverUrl.trim();
    if (!trimmedUrl) {
      const text = 'Enter your PC server URL first.';
      setLastError(text);
      setLastEvent({ id: createEventId('error'), type: 'error', text });
      return;
    }

    socketRef.current?.disconnect();
    setConnecting(true);
    setLastError(null);

    const socket = io(trimmedUrl, {
      timeout: 8000,
      reconnectionAttempts: 2,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setConnecting(false);
      setLastError(null);
      socket.emit('create-session');
    });

    socket.on('session-created', (payload: { sessionId: string; qrCodeDataUrl?: string; qrCode?: string }) => {
      setSessionId(payload.sessionId);
      setQrCode(payload.qrCodeDataUrl ?? payload.qrCode ?? null);
      setLastEvent({
        id: createEventId('session-created'),
        type: 'session-created',
        text: `Linked to your PC. Session ${payload.sessionId.toUpperCase()} is ready.`,
      });
    });

    socket.on('assistant-response', (payload: { utteranceId?: string; text?: string; payload?: unknown; command?: { speech?: string; action?: unknown } }) => {
      const text = payload?.text ?? payload?.command?.speech;
      const nextPayload = payload?.payload ?? payload?.command?.action;
      if (!text) return;

      setLastEvent({
        id: createEventId('assistant-response'),
        type: 'assistant-response',
        text,
        payload: nextPayload,
        utteranceId: payload?.utteranceId,
      });
    });

    socket.on('assistant-audio', (payload: { utteranceId: string; mime: string; audioBase64: string }) => {
      if (!payload?.utteranceId || !payload?.audioBase64) return;
      setLastAssistantAudio(payload);
    });

    socket.on('execute-command', (payload: { sessionId: string; status?: string; action?: { type?: string; contact_name?: string; message?: string } }) => {
      if (payload?.status === 'pending' && payload?.action?.type === 'send_whatsapp_message') {
        setPendingConfirm({
          contactName: payload.action.contact_name ?? 'Unknown',
          message: payload.action.message ?? '',
        });
      }
    });

    socket.on('command-result', (payload: { message?: string; success?: boolean; data?: unknown; requiresConfirmation?: boolean; confirmPrompt?: string }) => {
      setLastEvent({
        id: createEventId('command-result'),
        type: 'command-result',
        text: payload?.message ?? 'Command finished.',
        success: Boolean(payload?.success),
        payload: payload?.data,
      });
    });

    socket.on('error', (message: ServerErrorPayload) => {
      const text = toErrorText(message);
      setLastError(text);
      setLastEvent({ id: createEventId('error'), type: 'error', text });
    });

    socket.on('connect_error', (error: Error) => {
      const isLocalhostOnDevice =
        Platform.OS !== 'web' &&
        /(localhost|127\.0\.0\.1)/i.test(trimmedUrl);

      const text = isLocalhostOnDevice
        ? 'Could not connect. On a real phone, use your PC local IP like http://192.168.x.x:4000 instead of localhost.'
        : error.message || 'Could not connect to the backend.';
      setLastError(text);
      setConnected(false);
      setConnecting(false);
      setLastEvent({ id: createEventId('error'), type: 'error', text });
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setConnecting(false);
    });
  }, [serverUrl]);

  const joinSession = useCallback((targetSessionId: string, targetServerUrl?: string) => {
    const urlToUse = (targetServerUrl || serverUrl).trim();
    if (!urlToUse) {
      const text = 'Enter your PC server URL first.';
      setLastError(text);
      setLastEvent({ id: createEventId('error'), type: 'error', text });
      return;
    }

    socketRef.current?.disconnect();
    setConnecting(true);
    setLastError(null);

    const socket = io(urlToUse, {
      timeout: 8000,
      reconnectionAttempts: 2,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setConnecting(false);
      setLastError(null);
      socket.emit('join-session', targetSessionId);
    });

    socket.on('session-joined', (payload?: { sessionId?: string }) => {
      setSessionId(payload?.sessionId ?? targetSessionId);
      setLastEvent({
        id: createEventId('session-joined'),
        type: 'session-created',
        text: `Joined session ${targetSessionId.toUpperCase()}.`,
      });
    });

    socket.on('assistant-response', (payload: { utteranceId?: string; text?: string; payload?: unknown; command?: { speech?: string; action?: unknown } }) => {
      const text = payload?.text ?? payload?.command?.speech;
      const nextPayload = payload?.payload ?? payload?.command?.action;
      if (!text) return;

      setLastEvent({
        id: createEventId('assistant-response'),
        type: 'assistant-response',
        text,
        payload: nextPayload,
        utteranceId: payload?.utteranceId,
      });
    });

    socket.on('assistant-audio', (payload: { utteranceId: string; mime: string; audioBase64: string }) => {
      if (!payload?.utteranceId || !payload?.audioBase64) return;
      setLastAssistantAudio(payload);
    });

    socket.on('execute-command', (payload: { sessionId: string; status?: string; action?: { type?: string; contact_name?: string; message?: string } }) => {
      if (payload?.status === 'pending' && payload?.action?.type === 'send_whatsapp_message') {
        setPendingConfirm({
          contactName: payload.action.contact_name ?? 'Unknown',
          message: payload.action.message ?? '',
        });
      }
    });

    socket.on('command-result', (payload: { message?: string; success?: boolean; data?: unknown; requiresConfirmation?: boolean; confirmPrompt?: string }) => {
      setLastEvent({
        id: createEventId('command-result'),
        type: 'command-result',
        text: payload?.message ?? 'Command finished.',
        success: Boolean(payload?.success),
        payload: payload?.data,
      });
    });

    socket.on('error', (message: ServerErrorPayload) => {
      const text = toErrorText(message);
      setLastError(text);
      setLastEvent({ id: createEventId('error'), type: 'error', text });
    });

    socket.on('connect_error', (error: Error) => {
      setLastError(error.message || 'Could not connect.');
      setConnected(false);
      setConnecting(false);
    });

    socket.on('disconnect', () => {
      setConnected(false);
      setConnecting(false);
    });
  }, [serverUrl]);

  const sendCommand = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !socketRef.current || !sessionId) {
      return false;
    }

    socketRef.current.emit('user-command', {
      sessionId,
      text: trimmed,
    });

    return true;
  }, [sessionId]);

  const confirmPendingAction = useCallback((confirmed: boolean) => {
    if (!socketRef.current || !sessionId) return;
    setPendingConfirm(null);
    socketRef.current.emit('confirm-action', { sessionId, confirmed });
  }, [sessionId]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const value = useMemo(
    () => ({
      connected,
      connecting,
      serverUrl,
      sessionId,
      lastError,
      lastEvent,
      lastAssistantAudio,
      qrCode,
      pendingConfirm,
      setServerUrl,
      connect,
      joinSession,
      disconnect,
      sendCommand,
      confirmPendingAction,
    }),
    [connected, connecting, serverUrl, sessionId, lastError, lastEvent, lastAssistantAudio, qrCode, pendingConfirm, connect, joinSession, disconnect, sendCommand, confirmPendingAction]
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection() {
  const value = useContext(ConnectionContext);
  if (!value) {
    throw new Error('useConnection must be used within ConnectionProvider');
  }
  return value;
}
