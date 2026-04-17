import { useCallback, useEffect, useState } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

export function useVoiceCommand() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setSpeechError(null);
    setTranscript('');
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const nextTranscript = event.results?.[0]?.transcript ?? '';
    if (nextTranscript) {
      setTranscript(nextTranscript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    if (event.error === 'no-speech') {
      setSpeechError('I did not catch that. Try speaking a bit closer to the mic.');
      return;
    }
    setSpeechError(event.message || 'Speech recognition failed on this device.');
  });

  const startListening = useCallback(async () => {
    setSpeechError(null);
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      setSpeechError('Microphone and speech permissions are required for voice control.');
      return false;
    }

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
      requiresOnDeviceRecognition: true,
      addsPunctuation: true,
    });

    return true;
  }, []);

  const stopListening = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  return {
    isListening,
    transcript,
    speechError,
    startListening,
    stopListening,
    clearTranscript,
  };
}
