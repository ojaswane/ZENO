export const allowedApps = ["chrome", "vscode", "spotify"] as const;

export type AllowedApp = (typeof allowedApps)[number];

export function isAllowedApp(value: string): value is AllowedApp {
  return (allowedApps as readonly string[]).includes(value);
}

