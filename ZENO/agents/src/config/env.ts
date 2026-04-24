import path from "node:path";
import dotenv from "dotenv";

export type Env = {
  port: number;
  serverUrlOverride: string | undefined;
  anthropicApiKey: string | undefined;
};

export function loadEnv(): Env {
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

  const portRaw = process.env.PORT ?? "4000";
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT: ${portRaw}`);
  }

  const serverUrlOverride = process.env.SERVER_URL?.trim() || undefined;
  const anthropicApiKey =
    process.env.ANTHROPIC_API_KEY?.trim() ||
    process.env.CLAUDE_API_KEY?.trim() ||
    undefined;

  return { port, serverUrlOverride, anthropicApiKey };
}
