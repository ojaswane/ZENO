import type { Env } from "../config/env";

type ElevenLabsVoice = { voice_id: string; name: string };
type VoicesResponse = { voices: ElevenLabsVoice[] };

export type TtsAudio = {
  mime: "audio/mpeg";
  base64: string;
};

let cachedVoiceId: string | undefined;

async function resolveVoiceId(env: Env): Promise<string | undefined> {
  if (cachedVoiceId) return cachedVoiceId;
  if (env.elevenLabsVoiceId) {
    cachedVoiceId = env.elevenLabsVoiceId;
    return cachedVoiceId;
  }
  if (!env.elevenLabsApiKey) return undefined;

  const resp = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": env.elevenLabsApiKey },
  });
  if (!resp.ok) return undefined;

  const data = (await resp.json()) as VoicesResponse;
  const match = data.voices.find(
    (v) => v.name.trim().toLowerCase() === env.elevenLabsVoiceName.trim().toLowerCase()
  );
  cachedVoiceId = match?.voice_id;
  return cachedVoiceId;
}

export async function synthesizeElevenLabs(text: string, env: Env): Promise<TtsAudio | null> {
  if (!env.elevenLabsApiKey) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  const voiceId = await resolveVoiceId(env);
  if (!voiceId) return null;

  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": env.elevenLabsApiKey,
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: trimmed,
      model_id: env.elevenLabsModelId,
    }),
  });

  if (!resp.ok) return null;

  const arrayBuf = await resp.arrayBuffer();
  const base64 = Buffer.from(arrayBuf).toString("base64");
  return { mime: "audio/mpeg", base64 };
}

