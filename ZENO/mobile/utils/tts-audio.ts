import * as FileSystem from 'expo-file-system/legacy';
import { createAudioPlayer } from 'expo-audio';

type PlayResult = { ok: true } | { ok: false; error: string };

type AudioPlayerType = ReturnType<typeof createAudioPlayer>;
let currentPlayer: AudioPlayerType | null = null;
let currentSubscription: { remove: () => void } | null = null;

async function stopCurrent(): Promise<void> {
  try {
    if (currentSubscription) {
      currentSubscription.remove();
      currentSubscription = null;
    }
  } catch {
    // ignore
  }
  try {
    if (currentPlayer) {
      currentPlayer.remove();
      currentPlayer = null;
    }
  } catch {
    // ignore
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

    const cacheDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
    const uri = `${cacheDir}zeno_tts_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(uri, trimmed, { encoding: FileSystem.EncodingType.Base64 });

    // Use createAudioPlayer factory
    const player = createAudioPlayer({ uri });
    currentPlayer = player;

    // Set up callback using addListener
    const subscription = player.addListener('playbackStatusUpdate', (status: any) => {
      console.log('[TTS] Status update:', JSON.stringify({
        isLoaded: status?.isLoaded,
        playing: status?.playing,
        currentTime: status?.currentTime,
        duration: status?.duration,
        didJustFinish: status?.didJustFinish,
      }));

      if (!status?.isLoaded) return;

      if (status.didJustFinish) {
        console.log('[TTS] Playback finished');
        subscription.remove();
        currentSubscription = null;
        player.remove();
        currentPlayer = null;
        void FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
        options?.onDone?.();
      }
    });
    currentSubscription = subscription;

    console.log('[TTS] Starting playback');
    player.play();
    console.log('[TTS] Play() called');

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown audio error';
    console.log('[TTS] Error:', message);
    return { ok: false, error: message };
  }
}