# AI Interior Design Workspace

Monorepo for an AI-powered interior design app.

## Packages

- `artifacts/api-server`: Express API that calls Gemini for room analysis, redesign, and chat.
- `artifacts/mobile`: Expo React Native app.
- `lib/api-spec`: OpenAPI spec and codegen config.
- `lib/api-client-react`: Generated React Query API client.
- `lib/api-zod`: Generated Zod schemas.
- `lib/db`: Drizzle database package (schema scaffolding in place).

## Prerequisites

- Node.js 24.x
- pnpm
- A Gemini API key

## 1) Install dependencies

From the workspace root:

```powershell
pnpm install
```

## 2) Start API server (PowerShell)

Open terminal 1 at workspace root:

```powershell
$env:PORT = "3000"
$env:GEMINI_API_KEY = "<YOUR_GEMINI_API_KEY>"
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

### Start API server (Command Prompt / cmd)

Open terminal 1 at workspace root:

```cmd
set PORT=3000
set GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

Quick health check:

```powershell
Invoke-RestMethod http://localhost:3000/api/healthz
```

Expected response:

```json
{"status":"ok"}
```

## Deploy API server to Render

Create a new Web Service and connect this repo.

Build command:

```bash
corepack enable
pnpm install
pnpm --filter @workspace/api-server run build
```

Start command:

```bash
pnpm --filter @workspace/api-server run start
```

Environment variables (Render dashboard):

- `GEMINI_API_KEY`: your Gemini key (do not commit it)
- `PORT`: optional; Render sets it automatically

Health check:

```text
https://YOUR-RENDER-URL/api/healthz
```

## 3) Start mobile app (PowerShell)

Open terminal 2 at workspace root.

Recommended: auto-detect LAN IP and start mobile in one command (works in PowerShell and cmd):

```cmd
pnpm run dev:mobile:autoip
```

Optional flags:

```cmd
pnpm run dev:mobile:autoip -- --print-only
pnpm run dev:mobile:autoip -- --localhost
pnpm run dev:mobile:autoip -- --host=192.168.1.20
pnpm run dev:mobile:autoip -- --api-port=3000
```

Manual way (if you prefer explicit env vars):

Set API URL:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://localhost:3000"
```

Command Prompt equivalent:

```cmd
set EXPO_PUBLIC_API_URL=http://localhost:3000
```

If testing on a physical phone, use your machine LAN IP instead of localhost:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://192.168.1.20:3000"
```

Command Prompt equivalent:

```cmd
set EXPO_PUBLIC_API_URL=http://192.168.1.20:3000
```

Start Expo:

```powershell
pnpm --filter @workspace/mobile exec expo start
```

Command Prompt equivalent:

```cmd
pnpm --filter @workspace/mobile exec expo start
```

Then open the app via Expo Go, Android emulator, iOS simulator, or web.

## Optional environment variables

- `EXPO_PUBLIC_REVENUECAT_SDK_KEY`: Enables subscriptions/paywall purchasing.
- `LOG_LEVEL`: API server logging level (default is `info`).

## Useful commands

```powershell
# Full workspace typecheck
pnpm run typecheck

# Full workspace build
pnpm run build

# Regenerate API client + Zod from OpenAPI
pnpm --filter @workspace/api-spec run codegen
```

## Notes

- The API server `dev` script uses POSIX `export`, so on Windows PowerShell use the `build` + `start` commands shown above.
- In PowerShell use `$env:NAME = "value"`, and in Command Prompt use `set NAME=value`.
- If mobile cannot reach API:
  - Verify API server is running on `PORT`.
  - Verify `EXPO_PUBLIC_API_URL` points to the correct host and port.
  - On physical devices, do not use `localhost`; use your machine IP.

## Common errors

- `missing_key` from API calls:
  - Set `GEMINI_API_KEY` before starting `api-server`.
- `rate_limited` from chat/render/analyze:
  - Wait and retry after the returned interval.
