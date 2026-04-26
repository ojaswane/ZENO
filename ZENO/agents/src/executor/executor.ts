import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Action } from "../types/actions";
import { appToExecSpec } from "./whitelist";

const execFileAsync = promisify(execFile);

export type ExecutionResult = {
  success: boolean;
  message: string;
};

export async function executeAction(action: Action): Promise<ExecutionResult> {
  if (action.type === "assistant_message") {
    return { success: true, message: action.text };
  }

  if (action.type === "open_app") {
    const spec = appToExecSpec(action.app_name);
    try {
      await execFileAsync(spec.file, spec.args, { windowsHide: true });
      return { success: true, message: `Opening ${action.app_name}` };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { success: false, message: `Failed to open ${action.app_name}: ${message}` };
    }
  }

  if (action.type === "open_with_query") {
    const { app_name, query } = action;
    let url: string;

    if (app_name === "spotify") {
      url = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
    } else if (app_name === "youtube") {
      url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    } else if (app_name === "chrome") {
      url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    } else {
      return { success: false, message: `App ${app_name} does not support query-based opening.` };
    }

    try {
      if (process.platform === "win32") {
        await execFileAsync("cmd.exe", ["/c", "start", "", url], { windowsHide: true });
      } else if (process.platform === "darwin") {
        await execFileAsync("open", [url]);
      } else {
        await execFileAsync("xdg-open", [url]);
      }
      return { success: true, message: `Opening ${app_name} with query: ${query}` };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { success: false, message: `Failed to open ${app_name}: ${message}` };
    }
  }

  if (action.type === "search_web") {
    const url = `https://www.google.com/search?q=${encodeURIComponent(action.query)}`;
    try {
      if (process.platform === "win32") {
        await execFileAsync("cmd.exe", ["/c", "start", "", url], { windowsHide: true });
      } else if (process.platform === "darwin") {
        await execFileAsync("open", [url]);
      } else {
        await execFileAsync("xdg-open", [url]);
      }
      return { success: true, message: `Searching: ${action.query}` };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { success: false, message: `Failed to open browser: ${message}` };
    }
  }

  const _exhaustive: never = action;
  return _exhaustive;
}
