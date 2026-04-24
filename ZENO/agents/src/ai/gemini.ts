import type { Action } from "../types/actions";
import type { AiCommand } from "../types/ai";
import { isAllowedApp } from "../types/apps";

type GeminiConfig = {
  apiKey: string;
  model: string;
};

const SYSTEM_PROMPT = `
You are ZENO, a real-time AI assistant that converts a user's natural language into safe, structured commands.

You MUST output valid JSON only (no markdown, no code fences).

Return this shape exactly:
{
  "speech": string,
  "action": {
    "type": "open_app" | "search_web" | "assistant_message",
    ...fields
  }
}

Rules:
- Only use "open_app" for apps in: chrome, vscode, spotify
- If unsupported or unclear, use "assistant_message" with a helpful response
`.trim();

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found in model output");
  }
  const payload = trimmed.slice(first, last + 1);
  return JSON.parse(payload) as unknown;
}

function toSafeCommand(obj: unknown): AiCommand {
  if (typeof obj !== "object" || obj === null) {
    return {
      speech: "I couldn't understand that command.",
      action: { type: "assistant_message", text: "Invalid AI response." },
    };
  }

  const speech = (obj as { speech?: unknown }).speech;
  const action = (obj as { action?: unknown }).action;
  if (typeof speech !== "string" || typeof action !== "object" || action === null) {
    return {
      speech: "I couldn't understand that command.",
      action: { type: "assistant_message", text: "Invalid AI response shape." },
    };
  }

  const type = (action as { type?: unknown }).type;
  if (type === "assistant_message") {
    const text = (action as { text?: unknown }).text;
    return {
      speech,
      action: { type: "assistant_message", text: typeof text === "string" ? text : speech },
    };
  }

  if (type === "open_app") {
    const appName = (action as { app_name?: unknown }).app_name;
    const appLower = typeof appName === "string" ? appName.toLowerCase() : "";
    if (!appLower || !isAllowedApp(appLower)) {
      return {
        speech: "That app isn't allowed.",
        action: {
          type: "assistant_message",
          text: "Allowed apps: chrome, vscode, spotify.",
        },
      };
    }
    return { speech, action: { type: "open_app", app_name: appLower } };
  }

  if (type === "search_web") {
    const query = (action as { query?: unknown }).query;
    if (typeof query !== "string" || !query.trim()) {
      return {
        speech: "What should I search for?",
        action: { type: "assistant_message", text: "Missing search query." },
      };
    }
    return { speech, action: { type: "search_web", query } };
  }

  return {
    speech: "I can't run that action.",
    action: { type: "assistant_message", text: "Unsupported action type." },
  };
}

async function callGemini(config: GeminiConfig, userText: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    config.model
  )}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
    }),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Gemini API error ${resp.status}: ${errorText}`);
  }

  const result = (await resp.json()) as unknown;
  const candidates = (result as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return "";
  }

  const first = candidates[0] as { content?: { parts?: Array<{ text?: string }> } };
  const parts = first.content?.parts ?? [];
  const text = parts.map((p) => (typeof p.text === "string" ? p.text : "")).join("").trim();
  return text;
}

export async function generateCommandFromText(
  userText: string,
  env: { geminiApiKey: string | undefined; geminiModel: string }
): Promise<AiCommand> {
  const trimmed = userText.trim();
  if (!trimmed) {
    return {
      speech: "Say a command like “open chrome”.",
      action: { type: "assistant_message", text: "No command received." },
    };
  }

  // If no API key provided, fall back to a safe deterministic response.
  if (!env.geminiApiKey) {
    return {
      speech: "Gemini API key is missing. Set GEMINI_API_KEY in .env.local.",
      action: { type: "assistant_message", text: "Missing GEMINI_API_KEY." },
    };
  }

  const raw = await callGemini({ apiKey: env.geminiApiKey, model: env.geminiModel }, trimmed);
  const parsed = extractJson(raw);
  return toSafeCommand(parsed);
}
