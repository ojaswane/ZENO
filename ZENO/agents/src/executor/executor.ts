import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Action } from "../types/actions";
import { appToExecSpec } from "./whitelist";

const execFileAsync = promisify(execFile);

export type ExecutionResult = {
  success: boolean;
  message: string;
  requiresConfirmation?: boolean;
  confirmPrompt?: string;
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

  if (action.type === "system_control") {
    const { action: sysAction } = action;
    try {
      if (process.platform === "win32") {
        if (sysAction === "sleep") {
          await execFileAsync("rundll32.exe", ["powrprof.dll,SetSuspendState", "0", "1", "0"], { windowsHide: true });
        } else if (sysAction === "lock") {
          await execFileAsync("rundll32.exe", ["user32.dll,LockWorkStation"], { windowsHide: true });
        } else if (sysAction === "shutdown") {
          await execFileAsync("shutdown.exe", ["/s", "/t", "0"], { windowsHide: true });
        } else if (sysAction === "restart") {
          await execFileAsync("shutdown.exe", ["/r", "/t", "0"], { windowsHide: true });
        }
      } else if (process.platform === "darwin") {
        if (sysAction === "sleep") {
          await execFileAsync("pmset", ["sleep"]);
        } else if (sysAction === "lock") {
          await execFileAsync("pmset", ["displaysleepnow"]);
        } else if (sysAction === "shutdown") {
          await execFileAsync("osascript", ["-e", "tell app \"System Events\" to shut down"]);
        } else if (sysAction === "restart") {
          await execFileAsync("osascript", ["-e", "tell app \"System Events\" to restart"]);
        }
      } else {
        return { success: false, message: `System control not supported on this platform.` };
      }
      return { success: true, message: `System ${sysAction} triggered.` };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { success: false, message: `Failed to ${sysAction}: ${message}` };
    }
  }

  if (action.type === "list_bluetooth") {
    try {
      if (process.platform === "win32") {
        const { stdout } = await execFileAsync("powershell.exe", [
          "-Command",
          `Get-PairedBluetoothDevices | ForEach-Object { $_.DeviceName + '|' + $_.ConnectedStatus } | ConvertTo-Json -Compress`,
        ]);
        const devices = stdout.trim().split("\n").filter(Boolean);
        const parsed = devices.map((line) => {
          const [name, connected] = line.split("|");
          return { name: (name ?? "").trim(), connected: (connected ?? "").trim() === "1" };
        });
        return { success: true, message: JSON.stringify(parsed) };
      } else if (process.platform === "darwin") {
        const { stdout } = await execFileAsync("system_profiler", ["SPBluetoothDataType", "-json"]);
        const data = JSON.parse(stdout);
        const devices = data.SPBluetoothDataType?.device_ul || [];
        return {
          success: true,
          message: JSON.stringify(
            devices.map((d: { device_name?: string; device_address?: string; "device-connected"?: string }) => ({
              name: d.device_name || "Unknown",
              connected: d["device-connected"] === "attributed-string",
            }))
          ),
        };
      } else {
        const { stdout } = await execFileAsync("bluetoothctl", ["--list"]);
        return { success: true, message: stdout };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { success: false, message: `Failed to list Bluetooth devices: ${message}` };
    }
  }

  if (action.type === "bluetooth_connect") {
    const { device_name, connect } = action;
    try {
      if (process.platform === "win32") {
        const verb = connect ? "Connect" : "Disconnect";
        await execFileAsync("powershell.exe", [
          "-Command",
          `${verb}-BluetoothDevice -Name '${device_name}'`,
        ]);
      } else if (process.platform === "darwin") {
        const verb = connect ? "connect" : "disconnect";
        await execFileAsync("blueutil", [`--${verb}`, device_name]);
      } else {
        await execFileAsync("bluetoothctl", [connect ? "connect" : "disconnect", device_name]);
      }
      return { success: true, message: `${connect ? "Connected" : "Disconnected"} ${device_name}` };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { success: false, message: `Bluetooth ${connect ? "connect" : "disconnect"} failed: ${message}` };
    }
  }

  if (action.type === "send_whatsapp_message") {
    const { contact_name, message, confirm } = action;
    if (!confirm) {
      return {
        success: true,
        message: `Send to ${contact_name}: "${message}"`,
        requiresConfirmation: true,
        confirmPrompt: `Send this message to ${contact_name}? "${message}"`,
      };
    }

    // WhatsApp sending handled in handlers.ts via whatsapp-web.js client
    // This just returns the action details for the handler to pick up
    return {
      success: true,
      message: `Sending WhatsApp message to ${contact_name}: "${message}"`,
    };
  }

  const _exhaustive: never = action;
  return _exhaustive;
}
