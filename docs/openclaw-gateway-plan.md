# Building Your Own OpenClaw — EkaGuru Gateway Implementation Plan

> Inspired by: https://github.com/openclaw/openclaw (357k ⭐)
> Author: Nreddy / EkaGuru Project
> Created: 2026-04-15

---

## What Is OpenClaw?

OpenClaw is a **local-first personal AI gateway** that:
- Runs as a persistent **daemon** on your machine
- Connects to **20+ messaging platforms** (WhatsApp, Telegram, Discord, Slack, Signal, iMessage, etc.)
- Routes messages to **AI agents** (OpenAI, Anthropic, Gemini, Ollama, etc.)
- Supports **voice**, **memory**, **browser automation**, **media generation**, and **MCP tools**
- Uses a **plugin architecture** — every channel, provider, and tool is a plugin

---

## Repository Architecture Analysis

### Tech Stack (from official openclaw repo)

| Layer | Technology |
|---|---|
| Language | TypeScript (ESM), strict typing |
| Runtime | Node.js 22+ (Bun for dev) |
| Package Manager | pnpm (monorepo) |
| Build | tsdown / rolldown |
| Test | Vitest (V8 coverage) |
| Lint/Format | Oxlint + Oxfmt |
| Web UI | React (Vite), in `ui/` |
| Config | Zod schemas, JSON files |
| Persistence | SQLite (via sqlite-vec), JSON flat files |

### Official Monorepo Structure (openclaw)

```
openclaw/
├── src/                  ← Core gateway (TypeScript)
│   ├── gateway/          ← HTTP/WS control plane, protocol
│   ├── channels/         ← Core channel engine
│   ├── agents/           ← Agent harness, session management
│   ├── plugins/          ← Plugin loader, registry, manifest
│   ├── plugin-sdk/       ← Public SDK contract (what plugins import)
│   ├── cli/              ← CLI wiring (commands, flags, progress)
│   ├── commands/         ← Individual commands (gateway, agent, onboard...)
│   ├── config/           ← Config schema, loading, migration
│   ├── sessions/         ← Conversation session store
│   ├── routing/          ← Multi-agent message routing
│   ├── tts/              ← Text-to-speech pipeline
│   ├── media/            ← Media pipeline (images, video, audio)
│   ├── memory-host-sdk/  ← Memory plugin slot
│   ├── mcp/              ← MCP (Model Context Protocol) support
│   └── web/              ← WhatsApp Web integration
├── extensions/           ← All channel/provider plugins (~100 plugins)
│   ├── telegram/         ← Telegram bot
│   ├── discord/          ← Discord bot
│   ├── whatsapp/         ← WhatsApp (Baileys library)
│   ├── slack/            ← Slack bot
│   ├── anthropic/        ← Claude provider
│   ├── openai/           ← OpenAI provider
│   ├── google/           ← Gemini provider
│   ├── ollama/           ← Local Ollama provider
│   ├── memory-core/      ← Memory engine
│   ├── browser/          ← Browser automation (CDP)
│   ├── elevenlabs/       ← TTS
│   └── ...               ← 90+ more
├── ui/                   ← React control panel web UI
├── packages/             ← Shared internal packages
│   ├── plugin-sdk/       ← Public plugin SDK types
│   ├── plugin-package-contract/
│   └── memory-host-sdk/
├── apps/                 ← Native companion apps
│   ├── macos/            ← macOS menu bar app (Swift/SwiftUI)
│   ├── ios/              ← iOS app
│   └── android/          ← Android app
└── skills/               ← Bundled agent skills (YAML/JS)
```

### Core Concepts

1. **Gateway** — HTTP/WebSocket server (`~/.openclaw/`) that receives messages, routes to agents, and manages channels. The single control plane.

2. **Channels** — Plugin-based adapters. Each messaging platform is a channel plugin (Telegram, Discord, WhatsApp, etc.) that implements `channel-contract.ts`.

3. **Providers** — AI model plugins (OpenAI, Anthropic, Ollama, etc.) that implement the provider entry contract.

4. **Agents** — AI agents with sessions. Each agent has a system prompt, model config, tools, and memory. Messages route to agents, agents reply through channels.

5. **Plugin SDK** — `openclaw/plugin-sdk/*` is the only public boundary. Plugins import from here; never from core `src/**`.

6. **Pairing** — Security model: unknown senders get a pairing code. You approve them; they're allowlisted. DM policy can be `pairing` (default) or `open`.

7. **Memory** — Single active memory plugin slot (LanceDB, Wiki, or custom). Memory is per-agent and persists across sessions.

8. **Skills** — Bundled JavaScript tools the agent can call (web search, browser, file ops, etc.)

---

## Our Build Plan — "EkaGuru Assistant Gateway"

> Build our own OpenClaw-inspired gateway tailored for the Ekaguru project, running on Ubuntu WSL Ubuntu-24.04 with our existing Node.js stack.

### Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Base approach | Build from scratch (inspired by, not forked) | Full control, no license friction |
| Language | TypeScript (ESM) | Same as openclaw, type safety |
| Runtime | Node.js 22 (already in our stack) | Compatible with WSL |
| Package manager | pnpm | Fast, monorepo support, same as openclaw |
| Config schema | Zod | Runtime type safety |
| Persistence | SQLite + JSON files | Lightweight, no extra server needed |
| First channels | Telegram + WhatsApp + Web chat | High-impact, well-documented APIs |
| First providers | OpenAI + Anthropic + Ollama | Most popular + local option |
| Memory | SQLite + embeddings (simple vector search) | No LanceDB complexity initially |
| Voice | ElevenLabs TTS (optional phase) | Best quality |

---

## Our Project Structure (Target)

```
ekaguru-gateway/           ← Our project root (new repo or subfolder)
├── package.json           ← Root package (CLI entry)
├── pnpm-workspace.yaml    ← Monorepo workspace config
├── tsconfig.json          ← TypeScript config
├── src/                   ← Core gateway
│   ├── entry.ts           ← CLI bootstrap + respawn handler
│   ├── gateway/
│   │   ├── server.ts      ← Hono HTTP + WebSocket server
│   │   └── protocol/      ← Message envelope types
│   ├── channels/
│   │   └── registry.ts    ← Channel plugin registry
│   ├── providers/
│   │   └── registry.ts    ← Provider plugin registry
│   ├── agents/
│   │   └── runner.ts      ← Agent loop (receive → LLM → reply)
│   ├── sessions/
│   │   └── store.ts       ← SQLite-backed conversation store
│   ├── config/
│   │   ├── schema.ts      ← Zod config schema
│   │   └── loader.ts      ← Load ~/.ekaguru-gateway/config.json
│   ├── plugin-sdk/        ← Public contract for plugins
│   │   ├── channel-contract.ts
│   │   └── provider-contract.ts
│   ├── cli/
│   │   └── index.ts       ← Commander.js CLI setup
│   ├── commands/          ← Individual CLI commands
│   │   ├── gateway.ts     ← `gateway` command
│   │   ├── onboard.ts     ← `onboard` wizard
│   │   ├── status.ts      ← `status` command
│   │   ├── agent.ts       ← `agent` command
│   │   └── doctor.ts      ← `doctor` diagnostics
│   └── logger/
│       └── index.ts       ← Structured logging
├── extensions/            ← Channel + provider plugins
│   ├── telegram/          ← Phase 2
│   ├── whatsapp/          ← Phase 3
│   ├── discord/           ← Phase 10
│   ├── openai/            ← Phase 4
│   ├── anthropic/         ← Phase 4
│   ├── ollama/            ← Phase 4
│   ├── google/            ← Phase 4
│   ├── memory-core/       ← Phase 5
│   └── browser/           ← Phase 9
├── ui/                    ← React control panel (Phase 6)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── Channels.tsx
│       │   ├── Providers.tsx
│       │   ├── Agents.tsx
│       │   ├── Sessions.tsx
│       │   └── Settings.tsx
│       └── components/
├── skills/                ← Agent skills (YAML + JS)
└── docs/                  ← Documentation
```

---

## Key Dependencies

### Root package.json

```json
{
  "name": "ekaguru-gateway",
  "type": "module",
  "bin": { "ekaguru-gateway": "dist/entry.js" },
  "dependencies": {
    "hono": "^4.x",
    "@hono/node-server": "^1.x",
    "zod": "^3.x",
    "commander": "^12.x",
    "better-sqlite3": "^11.x",
    "@clack/prompts": "^0.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tsx": "^4.x",
    "tsdown": "^0.x",
    "vitest": "^2.x",
    "@types/node": "^22.x",
    "@types/better-sqlite3": "^7.x"
  }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - .
  - ui
  - extensions/*
```

---

## Phased Implementation Roadmap

### Phase 1 — Core Gateway (Week 1-2)
**Goal:** Working local HTTP/WebSocket daemon with config loading and agent runner.

**Files to build:**
- `src/entry.ts` — CLI bootstrap
- `src/gateway/server.ts` — Hono HTTP + WebSocket server
- `src/gateway/protocol/` — InboundEnvelope, OutboundReply types
- `src/config/schema.ts` — Full Zod config schema
- `src/config/loader.ts` — Load `~/.ekaguru-gateway/config.json`
- `src/sessions/store.ts` — SQLite conversation history
- `src/agents/runner.ts` — Agent loop
- `src/channels/registry.ts` — Dynamic channel plugin loader
- `src/providers/registry.ts` — Dynamic provider plugin loader
- `src/plugin-sdk/channel-contract.ts` — Channel plugin interface
- `src/plugin-sdk/provider-contract.ts` — Provider plugin interface

**Key code patterns:**

```typescript
// src/config/schema.ts
import { z } from 'zod'

export const ConfigSchema = z.object({
  gateway: z.object({
    port: z.number().default(18789),
    bind: z.enum(['loopback', 'local', 'any']).default('loopback'),
  }),
  agents: z.record(z.object({
    model: z.string(),
    systemPrompt: z.string().optional(),
    channels: z.array(z.string()).optional(),
  })).default({}),
  channels: z.record(z.unknown()).default({}),
  providers: z.record(z.unknown()).default({}),
})
```

```typescript
// src/gateway/server.ts
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()
app.post('/api/message', handleInboundMessage)
app.get('/api/status', handleStatus)
app.get('/api/channels', listChannels)
app.get('/ws', upgradeWebSocket(handleWsConnection))

serve({ fetch: app.fetch, port: config.gateway.port })
```

```typescript
// src/agents/runner.ts
async function runAgent(envelope: InboundEnvelope): Promise<void> {
  const session = await sessions.get(envelope.agentId, envelope.conversationId)
  const provider = providers.get(agentConfig.model)
  const messages = [...session.history, { role: 'user', content: envelope.text }]
  const reply = await provider.complete({ messages, tools: agent.tools })
  await sessions.append(session, reply)
  await channels.dispatch(envelope.channelId, envelope.conversationId, reply)
}
```

**Acceptance gate:**
- `pnpm build` succeeds
- `ekaguru-gateway gateway --port 18789` starts without error
- `curl http://localhost:18789/api/status` returns `{ "status": "ok" }`

---

### Phase 2 — Telegram Channel (Week 3)
**Goal:** Telegram bot connected to the gateway. Messages flow in, AI replies flow out.

**Install command:**
```bash
cd extensions/telegram && pnpm add grammy
```

**Files to build:**
```
extensions/telegram/
├── package.json
└── src/
    ├── index.ts      ← Plugin entry + manifest
    ├── bot.ts        ← grammy Bot setup
    ├── inbound.ts    ← Parse Telegram updates → InboundEnvelope
    ├── outbound.ts   ← Send replies back to Telegram
    └── pairing.ts    ← Pairing code security flow
```

**Plugin contract:**
```typescript
// extensions/telegram/src/index.ts
import type { ChannelPlugin } from '../../src/plugin-sdk/channel-contract.js'

export const plugin: ChannelPlugin = {
  id: 'telegram',
  name: 'Telegram',
  async setup(config, gateway) {
    const bot = new Bot(config.token)
    bot.on('message', async (ctx) => {
      await gateway.inbound({
        channelId: 'telegram',
        senderId: String(ctx.from.id),
        conversationId: String(ctx.chat.id),
        text: ctx.message.text ?? '',
      })
    })
    await bot.start()
  },
  async send(target, reply) {
    await bot.api.sendMessage(target.conversationId, reply.text)
  }
}
```

**Acceptance gate:**
- Telegram bot responds to `/start`
- Pairing flow works (unknown user gets pairing code)
- Agent replies flow back to Telegram < 5s

---

### Phase 3 — WhatsApp Channel (Week 4)
**Goal:** WhatsApp integration using Baileys (unofficial WhatsApp Web API).

**Install command:**
```bash
cd extensions/whatsapp && pnpm add @whiskeysockets/baileys
```

**Files to build:**
```
extensions/whatsapp/
├── package.json
└── src/
    ├── index.ts      ← Plugin entry
    ├── client.ts     ← Baileys session + QR pairing
    ├── inbound.ts    ← Parse WA messages → InboundEnvelope
    └── outbound.ts   ← Send replies back to WhatsApp
```

> **Note:** WhatsApp requires a QR code scan on first run. The gateway must display the QR code in terminal or the web UI.

**Acceptance gate:**
- QR code displays on first run
- WhatsApp messages reach agent and get replies

---

### Phase 4 — AI Providers (Week 4-5)
**Goal:** Multiple AI providers selectable per agent.

**Provider contract:**
```typescript
// src/plugin-sdk/provider-contract.ts
export interface ProviderPlugin {
  id: string
  name: string
  models: string[]
  complete(params: CompletionParams): Promise<CompletionResult>
  stream?(params: CompletionParams): AsyncIterable<CompletionChunk>
}
```

**Build order:**

| Priority | Provider | Library | Notes |
|---|---|---|---|
| 1 | **OpenAI** | `openai` | Standard, well-documented |
| 2 | **Anthropic** | `@anthropic-ai/sdk` | Claude models |
| 3 | **Ollama** | HTTP fetch | Local models, no API key needed |
| 4 | **Google** | `@google/generative-ai` | Gemini models |
| 5 | **OpenRouter** | OpenAI-compatible | 100+ models via one API |

```
extensions/openai/
extensions/anthropic/
extensions/ollama/
extensions/google/
extensions/openrouter/
```

**Acceptance gate:**
- `ekaguru-gateway agent --message "Hello" --provider openai` returns response
- Same test with `--provider ollama` works (with Ollama running locally)

---

### Phase 5 — Memory System (Week 5-6)
**Goal:** Agents remember facts across conversations.

**Memory contract:**
```typescript
// src/plugin-sdk/memory-contract.ts
export interface MemoryPlugin {
  id: string
  recall(agentId: string, query: string, limit?: number): Promise<MemoryEntry[]>
  remember(agentId: string, content: string, metadata?: Record<string, unknown>): Promise<void>
  forget(agentId: string, entryId: string): Promise<void>
}
```

**Two phases:**

**Phase 5a — Simple SQLite memory** (start here):
- Store memories as text blobs in SQLite
- Keyword-based recall (simple but functional)

**Phase 5b — Vector memory** (upgrade when needed):
- Use `sqlite-vec` for embeddings
- Semantic similarity search
- Embed using OpenAI `text-embedding-3-small` or local Ollama

```
extensions/memory-core/     ← Phase 5a: simple SQLite recall
extensions/memory-lancedb/  ← Phase 5b: vector search upgrade
```

**Acceptance gate:**
- Agent told "My name is Nirwa" remembers it in next conversation
- Memory persists across gateway restarts

---

### Phase 6 — Web Control Panel UI (Week 6-7)
**Goal:** Browser-based dashboard to manage the gateway.

**Scaffold:**
```bash
cd ui
pnpm create vite . --template react-ts
pnpm add @tanstack/react-query axios recharts
```

**Pages to build:**
```
ui/src/pages/
├── Dashboard.tsx    ← Status overview (channels connected, messages today)
├── Channels.tsx     ← Channel status + step-by-step setup
├── Providers.tsx    ← Model provider config + health check
├── Agents.tsx       ← Agent config (system prompt, model, channels)
├── Sessions.tsx     ← Conversation history browser
└── Settings.tsx     ← Full config editor
```

**Features:**
- Real-time status via WebSocket
- Channel setup wizard (step-by-step Telegram/WhatsApp setup)
- Conversation thread viewer
- One-click channel enable/disable
- Provider health checks

**Acceptance gate:**
- Web UI loads at `http://localhost:18789/ui`
- Dashboard shows live channel status
- Conversation history visible in Sessions page

---

### Phase 7 — CLI Onboarding Wizard (Week 7-8)
**Goal:** Friendly terminal-first setup, like `openclaw onboard`.

**CLI commands to build:**
```bash
ekaguru-gateway onboard          # Interactive setup wizard
ekaguru-gateway gateway          # Start the daemon
ekaguru-gateway status           # Show channel/provider status
ekaguru-gateway agent --message "Hello"  # Send message directly
ekaguru-gateway channels list    # List connected channels
ekaguru-gateway channels status  # Deep channel health check
ekaguru-gateway config set key value     # Set config value
ekaguru-gateway doctor           # Diagnose config issues
ekaguru-gateway pairing approve telegram <code>  # Approve a pairing
```

**Using Commander.js:**
```typescript
// src/cli/index.ts
import { Command } from 'commander'

const program = new Command('ekaguru-gateway')
  .description('EkaGuru personal AI gateway')
  .version('1.0.0')

program.addCommand(gatewayCommand)
program.addCommand(onboardCommand)
program.addCommand(statusCommand)
program.addCommand(agentCommand)
program.addCommand(doctorCommand)
program.addCommand(configCommand)
program.addCommand(pairingCommand)

program.parse()
```

**Onboard wizard flow:**
1. Welcome + explain what the gateway does
2. Choose AI provider + enter API key
3. Choose first channel (Telegram recommended)
4. Enter channel credentials (bot token, etc.)
5. Name your first agent + set system prompt
6. Start the gateway

---

### Phase 8 — Voice (Week 8-9, Optional)
**Goal:** Agent can reply with voice notes via TTS.

**TTS pipeline:**
1. LLM generates text reply
2. TTS converts to audio file (WAV/OGG)
3. Send audio file to messaging channel (WhatsApp/Telegram support voice)

```
extensions/elevenlabs/    ← High-quality TTS (ElevenLabs API)
extensions/speech-core/   ← TTS pipeline abstraction
```

**Install:**
```bash
cd extensions/elevenlabs && pnpm add elevenlabs
```

**Acceptance gate:**
- `/voice on` command in Telegram switches agent to voice reply mode
- Voice notes arrive in Telegram < 8s after message

---

### Phase 9 — Browser & Tools (Week 9-10)
**Goal:** Agent can use the web — browse, search, take screenshots.

```
extensions/browser/       ← CDP browser automation (Playwright)
extensions/duckduckgo/    ← Web search tool (no API key needed)
extensions/webhooks/      ← Inbound webhook triggers
```

**Tools exposed to agent:**
```typescript
const tools = {
  browser_navigate: async (url: string) => { ... },
  browser_screenshot: async () => { ... },   // Returns base64 image
  web_search: async (query: string) => { ... },
  run_command: async (cmd: string) => { ... }, // Sandboxed shell
}
```

---

### Phase 10 — Additional Channels (Week 10+)
Expand based on priority:

| Channel | Library | Priority |
|---|---|---|
| **Discord** | `discord.js` | High — large dev community |
| **Slack** | `@slack/bolt` | Medium — business use |
| **Signal** | `signal-cli` wrapper | Medium — privacy-focused |
| **Built-in Web Chat** | WebSocket (built-in) | High — for Ekaguru UI |
| **Matrix** | `matrix-js-sdk` | Low |
| **IRC** | `irc` npm | Low |

---

## Security Model

```typescript
// Pairing flow — enabled by default for all DMs
const dmPolicy = config.channels.telegram?.dmPolicy ?? 'pairing'

if (dmPolicy === 'pairing') {
  if (!allowlist.has(senderId)) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    await pairingStore.set(senderId, code)
    await channel.send(sender, [
      `Hello! I'm a private assistant.`,
      `To pair with me, run:`,
      `  ekaguru-gateway pairing approve telegram ${code}`,
    ].join('\n'))
    return // Don't process unapproved senders
  }
}
```

---

## Integration with Existing EkaGuru Backend

The gateway can call our existing FastAPI backend as a **tool**, letting the agent answer questions about Ekaguru's knowledge base:

```typescript
// extensions/ekaguru-tool/src/index.ts
const ekaGuruTool = {
  name: 'search_ekaguru',
  description: 'Search the EkaGuru knowledge base for information',
  parameters: z.object({
    query: z.string().describe('The search query'),
    limit: z.number().optional().default(5),
  }),
  async execute({ query, limit }) {
    const response = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(query)}&limit=${limit}`)
    const data = await response.json()
    return data.results
  }
}
```

---

## Build Order Summary

```
Week 1-2:  Phase 1  → Core Gateway (server + config + agent runner)
Week 3:    Phase 2  → Telegram channel
Week 4:    Phase 3  → WhatsApp channel
Week 4-5:  Phase 4  → AI Providers (OpenAI, Anthropic, Ollama)
Week 5-6:  Phase 5  → Memory system
Week 6-7:  Phase 6  → Web Control Panel UI
Week 7-8:  Phase 7  → CLI onboarding wizard
Week 8-9:  Phase 8  → Voice (optional)
Week 9-10: Phase 9  → Browser tools
Week 10+:  Phase 10 → More channels (Discord, Slack, etc.)
```

---

## Open Questions (Decide Before Starting)

1. **Which channels first?**  
   Telegram is easiest to start. WhatsApp is most popular for India. Discord is good for communities.

2. **What's the primary use case?**  
   - Personal assistant (answer your messages)
   - EkaGuru knowledge engine integration (answer questions about EkaGuru's content)
   - Both?

3. **Which AI providers first?**  
   - Cloud only (OpenAI/Anthropic/Gemini)
   - Local models via Ollama (no API costs, privacy)
   - Both

4. **Integrate with existing EkaGuru backend?**  
   Our FastAPI + MongoDB stack could be exposed as a tool to the agent.

---

## References

- Official OpenClaw repo: https://github.com/openclaw/openclaw
- OpenClaw docs: https://docs.openclaw.ai
- Hono framework: https://hono.dev
- grammy (Telegram): https://grammy.dev
- Baileys (WhatsApp): https://github.com/WhiskeySockets/Baileys
- sqlite-vec: https://github.com/asg017/sqlite-vec
- ElevenLabs: https://elevenlabs.io/docs
