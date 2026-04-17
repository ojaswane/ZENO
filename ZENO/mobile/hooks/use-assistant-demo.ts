import { useCallback, useEffect, useMemo, useState } from 'react';

import { useConnection } from './use-connection';

export type AssistantOrbState = 'idle' | 'thinking' | 'speaking';

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
  const { connected, lastEvent, sendCommand } = useConnection();
  const [orbState, setOrbState] = useState<AssistantOrbState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId('a'),
      role: 'assistant',
      text: 'Connect your phone to the ZENO server, then send a command.',
      createdAt: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');

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

    setOrbState(lastEvent.type === 'assistant-response' ? 'speaking' : 'idle');
  }, [lastEvent]);

  useEffect(() => {
    if (!connected) {
      setOrbState('idle');
    }
  }, [connected]);

  const headerLabel = useMemo(() => {
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
  };
}
