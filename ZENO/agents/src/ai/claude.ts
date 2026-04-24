import type { AllowedApp } from "../types/apps";
import { isAllowedApp } from "../types/apps";
import type { AiCommand } from "../types/ai";

function normalize(input: string): string {
  return input.trim().toLowerCase();
}

function guessOpenApp(text: string): AllowedApp | undefined {
  const t = normalize(text);
  const tokens = t.split(/\s+/);
  const last = tokens[tokens.length - 1] ?? "";
  if (isAllowedApp(last)) return last;

  if (t.includes("chrome")) return "chrome";
  if (t.includes("vs code") || t.includes("vscode")) return "vscode";
  if (t.includes("spotify")) return "spotify";
  return undefined;
}

/**
 * Claude API placeholder.
 * Swap implementation with a real Anthropic SDK call when you're ready.
 */
export async function generateCommandFromText(userText: string): Promise<AiCommand> {
  const app = guessOpenApp(userText);
  if (app) {
    return {
      speech: `Opening ${app} for you.`,
      action: { type: "open_app", app_name: app },
    };
  }

  const trimmed = userText.trim();
  if (!trimmed) {
    return {
      speech: "Say a command like “open chrome”.",
      action: { type: "assistant_message", text: "No command received." },
    };
  }

  return {
    speech: "I can open Chrome, VS Code, or Spotify. Which one should I open?",
    action: { type: "assistant_message", text: "Supported apps: chrome, vscode, spotify." },
  };
}

