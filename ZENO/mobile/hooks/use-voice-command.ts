import { useCallback, useEffect, useMemo, useState } from 'react';
import { requireOptionalNativeModule } from 'expo-modules-core';

type SpeechPermission = {
  granted: boolean;
};

type SpeechErrorEvent = {
  error?: string;
  message?: string;
};

type SpeechResultEvent = {
  results?: Array<{ transcript?: string }>;
};

type SpeechModule = {
  requestMicrophonePermissionsAsync: () => Promise<SpeechPermission>;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  abort: () => void;
  addListener: (eventName: string, listener: (event?: any) => void) => SpeechSubscription;
  isRecognitionAvailable?: () => boolean;
  supportsOnDeviceRecognition?: () => boolean;
};

type SpeechSubscription = {
  remove: () => void;
};

type SpeechApi = {
  module: SpeechModule | null;
};

function loadSpeechApi(): SpeechApi {
  return {
    module: requireOptionalNativeModule<SpeechModule>('ExpoSpeechRecognition'),
  };
}

export function useVoiceCommand() {
  const speechApi = useMemo(loadSpeechApi, []);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);

  useEffect(() => {
    if (!speechApi.module) {
      return;
    }

    const subscriptions = [
      speechApi.module.addListener('start', () => {
        setIsListening(true);
        setSpeechError(null);
        setTranscript('');
      }),
      speechApi.module.addListener('end', () => {
        setIsListening(false);
      }),
      speechApi.module.addListener('result', (event?: SpeechResultEvent) => {
        const nextTranscript = event?.results?.[0]?.transcript ?? '';
        if (nextTranscript) {
          setTranscript(nextTranscript);
        }
      }),
      speechApi.module.addListener('error', (event?: SpeechErrorEvent) => {
        setIsListening(false);
        if (event?.error === 'no-speech') {
          setSpeechError('I did not catch that. Try speaking a bit closer to the mic.');
          return;
        }
        setSpeechError(event?.message || 'Speech recognition failed on this device.');
      }),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [speechApi]);

  const startListening = useCallback(async () => {
    setSpeechError(null);

    if (!speechApi.module) {
      setSpeechError('Voice recognition needs a development build. Expo Go will not load this native module.');
      return false;
    }

    if (speechApi.module.isRecognitionAvailable && !speechApi.module.isRecognitionAvailable()) {
      setSpeechError('Speech recognition is not available on this device or build.');
      return false;
    }

    if (
      speechApi.module.supportsOnDeviceRecognition &&
      !speechApi.module.supportsOnDeviceRecognition()
    ) {
      setSpeechError('This device does not currently support on-device speech recognition.');
      return false;
    }

    const permission = await speechApi.module.requestMicrophonePermissionsAsync();
    if (!permission.granted) {
      setSpeechError('Microphone permission is required for voice control.');
      return false;
    }

    speechApi.module.start({
      lang: 'en-US',
      interimResults: true,
      maxAlternatives: 1,
      continuous: false,
      requiresOnDeviceRecognition: true,
      addsPunctuation: true,
    });

    return true;
  }, [speechApi]);

  const stopListening = useCallback(() => {
    speechApi.module?.stop();
  }, [speechApi]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      speechApi.module?.abort();
    };
  }, [speechApi]);

  return {
    isListening,
    transcript,
    speechError,
    startListening,
    stopListening,
    clearTranscript,
    voiceAvailable: Boolean(speechApi.module),
  };
}
