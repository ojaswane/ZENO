import type { Action } from "../types/actions";
import type { AiCommand } from "../types/ai";
import { isAllowedApp } from "../types/apps";

type GeminiConfig = {
  apiKey: string;
  model: string;
};

const SYSTEM_PROMPT = `
You are ZENO, a smart AI assistant like Jarvis.

You must BOTH:
1. Talk naturally with the user
2. Return structured actions when needed

---

RESPONSE FORMAT (ALWAYS JSON):

{
  "speech": string,
  "action": {
    "type": "open_app" | "search_web" | "open_with_query" | "system_control" | "list_bluetooth" | "bluetooth_connect" | "send_whatsapp_message" | "assistant_message",
    ...fields
  }
}

---

RULES:

- ALWAYS include "speech" (this is what user hears)
- Use "assistant_message" when just chatting
- Use "system_control" for sleep/lock/shutdown/restart
- Use "list_bluetooth" to show paired Bluetooth devices
- Use "bluetooth_connect" to connect/disconnect a Bluetooth device
- Use "send_whatsapp_message" for WhatsApp messages (requires confirm: false - user must verify first)
- Use "open_app" or "search_web" or "open_with_query" for app/web actions
- NEVER return raw text outside JSON

---

PERSONALITY:

- Calm, intelligent, Jarvis-like
- Address user as "sir"
- Slightly futuristic tone
- Keep it short and smooth

---

EXAMPLES:

User: "how are you"

{
  "speech": "I'm functioning perfectly, sir. How can I assist you today?",
  "action": {
    "type": "assistant_message",
    "text": "I'm functioning perfectly, sir. How can I assist you today?"
  }
}

User: "open chrome"

{
  "speech": "Opening Chrome for you, sir.",
  "action": {
    "type": "open_app",
    "app_name": "chrome"
  }
}

User: "play despacito on spotify"

{
  "speech": "Playing Despacito on Spotify, sir.",
  "action": {
    "type": "open_with_query",
    "app_name": "spotify",
    "query": "despacito"
  }
}

User: "search for react hooks on youtube"

{
  "speech": "Searching for React Hooks on YouTube, sir.",
  "action": {
    "type": "open_with_query",
    "app_name": "youtube",
    "query": "react hooks"
  }
}

User: "search latest news on chrome"

{
  "speech": "Searching latest news on Chrome, sir.",
  "action": {
    "type": "open_with_query",
    "app_name": "chrome",
    "query": "latest news"
  }
}

User: "put the system to sleep"

{
  "speech": "Putting the system to sleep, sir.",
  "action": {
    "type": "system_control",
    "action": "sleep"
  }
}

User: "lock the system"

{
  "speech": "Locking the system, sir.",
  "action": {
    "type": "system_control",
    "action": "lock"
  }
}

User: "show available bluetooth devices"

{
  "speech": "Listing paired Bluetooth devices, sir.",
  "action": {
    "type": "list_bluetooth"
  }
}

User: "disconnect my bluetooth speaker"

{
  "speech": "Disconnecting your Bluetooth speaker, sir.",
  "action": {
    "type": "bluetooth_connect",
    "device_name": "Speaker",
    "connect": false
  }
}

User: "message Thanvisha that hey my app is working"

{
  "speech": "I'll prepare that WhatsApp message for Thanvisha. Please confirm before sending.",
  "action": {
    "type": "send_whatsapp_message",
    "contact_name": "Thanvisha",
    "message": "hey my app is working",
    "confirm": false
  }
}
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

  if (type === "open_with_query") {
    const appName = (action as { app_name?: unknown }).app_name;
    const query = (action as { query?: unknown }).query;
    const appLower = typeof appName === "string" ? appName.toLowerCase() : "";
    const queryStr = typeof query === "string" ? query.trim() : "";
    if (!appLower || !["spotify", "youtube", "chrome"].includes(appLower)) {
      return {
        speech: "That app isn't supported for search.",
        action: {
          type: "assistant_message",
          text: "Supported apps for query search: spotify, youtube, chrome.",
        },
      };
    }
    if (!queryStr) {
      return {
        speech: `What do you want to search on ${appName}?`,
        action: { type: "assistant_message", text: "Missing search query." },
      };
    }
    return { speech, action: { type: "open_with_query", app_name: appLower as "spotify" | "youtube" | "chrome", query: queryStr } };
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

  if (type === "system_control") {
    const sysAction = (action as { action?: unknown }).action;
    if (!["sleep", "lock", "shutdown", "restart"].includes(sysAction as string)) {
      return {
        speech: "Unknown system action.",
        action: { type: "assistant_message", text: "Supported system actions: sleep, lock, shutdown, restart." },
      };
    }
    return { speech, action: { type: "system_control", action: sysAction as "sleep" | "lock" | "shutdown" | "restart" } };
  }

  if (type === "list_bluetooth") {
    return { speech, action: { type: "list_bluetooth" } };
  }

  if (type === "bluetooth_connect") {
    const deviceName = (action as { device_name?: unknown }).device_name;
    const connect = (action as { connect?: unknown }).connect;
    if (!deviceName || typeof deviceName !== "string") {
      return {
        speech: "Which device should I connect to?",
        action: { type: "assistant_message", text: "Missing device name." },
      };
    }
    return {
      speech,
      action: { type: "bluetooth_connect", device_name: deviceName, connect: !!connect },
    };
  }

  if (type === "send_whatsapp_message") {
    const contactName = (action as { contact_name?: unknown }).contact_name;
    const message = (action as { message?: unknown }).message;
    if (!contactName || typeof contactName !== "string") {
      return {
        speech: "Which contact should I message?",
        action: { type: "assistant_message", text: "Missing contact name." },
      };
    }
    if (!message || typeof message !== "string") {
      return {
        speech: "What message should I send?",
        action: { type: "assistant_message", text: "Missing message text." },
      };
    }
    return {
      speech,
      action: { type: "send_whatsapp_message", contact_name: contactName, message, confirm: false },
    };
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

  try {
    const raw = await callGemini({ apiKey: env.geminiApiKey, model: env.geminiModel }, trimmed);
    const parsed = extractJson(raw);
    return toSafeCommand(parsed);
  } catch {
    // Safe fallback: search for the original text.
    return {
      speech: "Searching that for you, sir.",
      action: { type: "search_web", query: trimmed },
    };
  }
}
