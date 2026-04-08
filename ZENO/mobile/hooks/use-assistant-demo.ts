import { useCallback, useMemo, useRef, useState } from 'react';

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
  const [orbState, setOrbState] = useState<AssistantOrbState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId('a'),
      role: 'assistant',
      text: 'Connected. How can I help?',
      createdAt: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (pendingTimer.current) {
      clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
    }

    const userMessage: ChatMessage = {
      id: createId('u'),
      role: 'user',
      text: trimmed,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setOrbState('thinking');

    pendingTimer.current = setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: createId('a'),
        role: 'assistant',
        text: `Acknowledged: “${trimmed}”. (Demo response)`,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setOrbState('speaking');

      pendingTimer.current = setTimeout(() => {
        setOrbState('idle');
        pendingTimer.current = null;
      }, 1600);
    }, 950);
  }, []);

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

