import os from "node:os";
import process from "node:process";
import { spawn } from "node:child_process";

interface CliOptions {
  host?: string;
  apiPort: number;
  localhost: boolean;
  printOnly: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    apiPort: 3000,
    localhost: false,
    printOnly: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--") {
      // Common when forwarding args through `pnpm run <script> -- ...`.
      continue;
    }

    if (arg === "--localhost") {
      options.localhost = true;
      continue;
    }

    if (arg === "--print-only") {
      options.printOnly = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg.startsWith("--host=")) {
      const host = arg.slice("--host=".length).trim();
      if (host.length > 0) {
        options.host = host;
      }
      continue;
    }

    if (arg.startsWith("--api-port=")) {
      const rawPort = arg.slice("--api-port=".length).trim();
      const parsed = Number(rawPort);
      if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
        throw new Error(`Invalid --api-port value: ${rawPort}`);
      }
      options.apiPort = parsed;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 10 ||
    (a === 172 && typeof b === "number" && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function scoreInterfaceName(name: string): number {
  const lower = name.toLowerCase();
  let score = 0;

  if (/(wi-?fi|wireless|wlan|ethernet|local area)/.test(lower)) {
    score += 20;
  }

  if (/(vethernet|hyper-v|virtual|vmware|loopback|wsl|docker|bluetooth|hamachi)/.test(lower)) {
    score -= 25;
  }

  return score;
}

function pickBestLanIpv4(): string | null {
  const interfaces = os.networkInterfaces();

  const candidates: Array<{ ip: string; score: number; name: string }> = [];

  for (const [name, infos] of Object.entries(interfaces)) {
    if (!infos) continue;

    for (const info of infos) {
      if (info.family !== "IPv4" || info.internal) continue;
      if (info.address.startsWith("127.")) continue;
      if (info.address.startsWith("169.254.")) continue;

      let score = 0;
      if (isPrivateIpv4(info.address)) score += 30;
      if (info.address.startsWith("192.168.")) score += 15;
      if (info.address.startsWith("10.")) score += 10;
      score += scoreInterfaceName(name);

      candidates.push({ ip: info.address, score, name });
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.ip ?? null;
}

function printUsage(): void {
  console.log("Usage: pnpm run dev:mobile:autoip -- [options]");
  console.log("");
  console.log("Options:");
  console.log("  --localhost            Use localhost instead of auto-detected LAN IP");
  console.log("  --host=<ip-or-host>    Use a specific host value");
  console.log("  --api-port=<port>      API port to use (default: 3000)");
  console.log("  --print-only           Print resolved API URL and exit");
  console.log("  --help, -h             Show this help message");
}

async function main(): Promise<void> {
  let options: CliOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(
      `[mobile:autoip] ${error instanceof Error ? error.message : String(error)}`,
    );
    printUsage();
    process.exit(1);
    return;
  }

  if (options.help) {
    printUsage();
    process.exit(0);
    return;
  }

  const host = options.host
    ? options.host
    : options.localhost
      ? "localhost"
      : pickBestLanIpv4();

  if (!host) {
    console.error(
      "[mobile:autoip] Could not detect a LAN IPv4 address. Pass --host=<ip> or use --localhost.",
    );
    process.exit(1);
    return;
  }

  const apiUrl = `http://${host}:${options.apiPort}`;
  console.log(`[mobile:autoip] Using EXPO_PUBLIC_API_URL=${apiUrl}`);

  if (options.printOnly) {
    process.exit(0);
    return;
  }

  const useShell = process.platform === "win32";
  const child = spawn(
    "pnpm",
    ["--filter", "@workspace/mobile", "exec", "expo", "start", "-c"],
    {
      stdio: "inherit",
      shell: useShell,
      env: {
        ...process.env,
        EXPO_PUBLIC_API_URL: apiUrl,
      },
    },
  );

  child.on("error", (error) => {
    console.error(`[mobile:autoip] Failed to start Expo: ${error.message}`);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (typeof code === "number") {
      process.exit(code);
      return;
    }

    if (signal) {
      console.error(`[mobile:autoip] Expo exited due to signal: ${signal}`);
      process.exit(1);
      return;
    }

    process.exit(0);
  });
}

void main();
