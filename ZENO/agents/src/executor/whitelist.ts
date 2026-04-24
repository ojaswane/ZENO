import type { AllowedApp } from "../types/apps";

export type ExecSpec = {
  file: string;
  args: string[];
};

function windowsStart(args: string[]): ExecSpec {
  return { file: "cmd.exe", args: ["/c", "start", "", ...args] };
}

export function appToExecSpec(app: AllowedApp): ExecSpec {
  switch (process.platform) {
    case "win32": {
      if (app === "chrome") return windowsStart(["chrome"]);
      if (app === "vscode") return { file: "cmd.exe", args: ["/c", "code"] };
      if (app === "spotify") return windowsStart(["https://open.spotify.com/"]);
      const _never: never = app;
      return _never;
    }
    case "darwin": {
      if (app === "chrome") return { file: "open", args: ["-a", "Google Chrome"] };
      if (app === "vscode") return { file: "open", args: ["-a", "Visual Studio Code"] };
      if (app === "spotify") return { file: "open", args: ["-a", "Spotify"] };
      const _never: never = app;
      return _never;
    }
    default: {
      if (app === "chrome") return { file: "xdg-open", args: ["https://www.google.com/chrome/"] };
      if (app === "vscode") return { file: "xdg-open", args: ["vscode://"] };
      if (app === "spotify") return { file: "xdg-open", args: ["https://open.spotify.com/"] };
      const _never: never = app;
      return _never;
    }
  }
}
