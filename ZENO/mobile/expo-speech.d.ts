declare module 'expo-speech' {
  export type SpeakOptions = {
    language?: string;
    pitch?: number;
    rate?: number;
    voice?: string;
    volume?: number;
    onDone?: () => void;
    onStopped?: () => void;
    onError?: (error: unknown) => void;
  };

  export function speak(text: string, options?: SpeakOptions): void;
  export function stop(): void;
}
