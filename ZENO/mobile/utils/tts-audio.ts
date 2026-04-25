import * as FileSystem from 'expo-file-system/legacy';
import { Audio } from 'expo-av';

type PlayResult = { ok: true } | { ok: false; error: string };

let currentSound: Audio.Sound | null = null;

async function stopCurrent(): Promise<void> {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    }
  } catch {
    // ignore
  } finally {
    currentSound = null;
  }
}

export async function playMp3Base64(
  base64: string,
  options?: { onDone?: () => void }
): Promise<PlayResult> {
  const trimmed = base64.trim();
  if (!trimmed) return { ok: false, error: 'Empty audio.' };

  try {
    await stopCurrent();

    const uri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? ''}zeno_tts_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(uri, trimmed, { encoding: FileSystem.EncodingType.Base64 });

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, volume: 1.0 },
    );

    currentSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        void stopCurrent();
        void FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
        options?.onDone?.();
      }
    });

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown audio error';
    return { ok: false, error: message };
  }
}
