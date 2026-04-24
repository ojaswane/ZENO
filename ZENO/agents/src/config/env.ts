import path from "node:path";
import dotenv from "dotenv";

export type Env = {
  port: number;
  serverUrlOverride: string | undefined;
  geminiApiKey: string | undefined;
  geminiModel: string;
};

export function loadEnv(): Env {
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

  const portRaw = process.env.PORT ?? "4000";
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT: ${portRaw}`);
  }

  const serverUrlOverride = process.env.SERVER_URL?.trim() || undefined;
  const geminiApiKey =
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || undefined;
  const geminiModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  return { port, serverUrlOverride, geminiApiKey, geminiModel };
}
