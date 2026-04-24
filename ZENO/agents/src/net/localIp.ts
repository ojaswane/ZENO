import os from "node:os";

function isPrivateIpv4(ip: string): boolean {
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  const m = /^172\.(\d+)\./.exec(ip);
  if (!m) return false;
  const second = Number(m[1]);
  return second >= 16 && second <= 31;
}

export function getLocalIpv4(): string | undefined {
  const ifaces = os.networkInterfaces();
  const candidates: string[] = [];

  for (const entries of Object.values(ifaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family !== "IPv4") continue;
      if (entry.internal) continue;
      candidates.push(entry.address);
    }
  }

  const privateOnes = candidates.filter(isPrivateIpv4);
  return privateOnes[0] ?? candidates[0];
}

