import { loadEnv } from "./config/env";
import { startServer } from "./server";

const env = loadEnv();
startServer({
  port: env.port,
  serverUrlOverride: env.serverUrlOverride,
  geminiApiKey: env.geminiApiKey,
  geminiModel: env.geminiModel,
  elevenLabsApiKey: env.elevenLabsApiKey,
  elevenLabsVoiceId: env.elevenLabsVoiceId,
  elevenLabsVoiceName: env.elevenLabsVoiceName,
  elevenLabsModelId: env.elevenLabsModelId,
});
