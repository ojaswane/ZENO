import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useConnection } from './use-connection';
import { useVoiceCommand } from './use-voice-command';
import { playMp3Base64 } from '@/utils/tts-audio';

export type AssistantOrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: number;
};

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function useAssistantDemo() {
  const { connected, lastAssistantAudio, lastEvent, sendCommand } = useConnection();
  const {
    isListening,
    transcript,
    speechError,
    startListening,
    stopListening,
    clearTranscript,
  } = useVoiceCommand();
  const [orbState, setOrbState] = useState<AssistantOrbState>('idle');
  const pendingUtteranceIdRef = useRef<string | null>(null);
  const pendingTextRef = useRef<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId('a'),
      role: 'assistant',
      text: 'Connect your phone to the ZENO server, then send a command.',
      createdAt: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');

  const markDone = useCallback(() => {
    setOrbState((prev) => (prev === 'speaking' ? 'idle' : prev));
  }, []);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = {
        id: createId('u'),
        role: 'user',
        text: trimmed,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setOrbState('thinking');

      const sent = sendCommand(trimmed);
      if (!sent) {
        setMessages((prev) => [
          ...prev,
          {
            id: createId('a'),
            role: 'assistant',
            text: 'Connection is not ready yet. Link the app to your PC first.',
            createdAt: Date.now(),
          },
        ]);
        setOrbState('idle');
      }
    },
    [sendCommand]
  );

  useEffect(() => {
    if (!lastEvent) return;

    setMessages((prev) => [
      ...prev,
      {
        id: lastEvent.id,
        role: 'assistant',
        text: lastEvent.text,
        createdAt: Date.now(),
      },
    ]);

    if (lastEvent.type === 'assistant-response') {
      setOrbState('speaking');

      // Wait for ElevenLabs audio (same utteranceId).
      pendingUtteranceIdRef.current = lastEvent.utteranceId ?? null;
      pendingTextRef.current = lastEvent.text;
    } else {
      setOrbState('idle');
    }
  }, [lastEvent]);

  useEffect(() => {
    if (isListening) {
      setOrbState('listening');
      return;
    }

    if (!connected) {
      setOrbState('idle');
    }
  }, [connected, isListening]);

  useEffect(() => {
    if (!speechError) return;

    setMessages((prev) => [
      ...prev,
      {
        id: createId('a'),
        role: 'assistant',
        text: speechError,
        createdAt: Date.now(),
      },
    ]);
  }, [speechError]);

  useEffect(() => {
    if (!lastAssistantAudio?.utteranceId || !lastAssistantAudio?.audioBase64) return;
    const pendingId = pendingUtteranceIdRef.current;
    if (!pendingId || lastAssistantAudio.utteranceId !== pendingId) return;

    setOrbState('speaking');
    void playMp3Base64(lastAssistantAudio.audioBase64, {
      onDone: markDone,
    }).then((r) => {
      if (!r.ok) markDone();
    });
  }, [connected, lastAssistantAudio, markDone]);

  useEffect(() => {
    if (!isListening && transcript.trim()) {
      send(transcript);
      clearTranscript();
    }
  }, [clearTranscript, isListening, send, transcript]);

  const headerLabel = useMemo(() => {
    if (orbState === 'listening') return 'Listening';
    if (orbState === 'thinking') return 'Processing';
    if (orbState === 'speaking') return 'Speaking';
    return 'Ready';
  }, [orbState]);

  return {
    orbState,
    headerLabel,
    messages,
    input,
    setInput,
    send,
    isListening,
    transcript,
    startListening,
    stopListening,
  };
}
