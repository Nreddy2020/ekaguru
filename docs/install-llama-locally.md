# Installing Llama Locally — Step-by-Step Guide
> So your bot has a free, local AI brain with no API fees

**Tool:** Ollama — the standard way to run open-source LLMs locally  
**Model:** Llama 3 (Meta's latest, best free model)  
**Your setup:** Windows 11 + WSL Ubuntu-24.04

---

## What Is Ollama?

Ollama is a tool that:
- Downloads and manages LLM model files for you
- Runs models locally on your CPU or GPU
- Exposes a **REST API at `http://localhost:11434`** — same format as OpenAI
- Works on Windows, macOS, and Linux
- Is completely **free, no account needed**

Your bot will talk to Ollama exactly like it would talk to OpenAI — just a different URL.

---

## Step 0 — Check Your Hardware First

Before choosing a model, know your specs. Open PowerShell and run:

```powershell
# Check RAM
(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1GB

# Check GPU (if you have Nvidia)
nvidia-smi

# Check CPU cores
(Get-CimInstance Win32_Processor).NumberOfCores
```

Then match your hardware to a model:

| Your RAM | Your GPU VRAM | Recommended Model | Speed |
|---|---|---|---|
| 8 GB | No GPU | `llama3.2:1b` | Slow but works |
| 8 GB | 4GB VRAM | `llama3.2:3b` | OK |
| 16 GB | No GPU / 6GB VRAM | `llama3.2:3b` | Good |
| 16 GB | 8GB VRAM | `llama3.1:8b` | Fast & smart |
| 32 GB | 12GB+ VRAM | `llama3.1:8b` | Very fast |
| 32 GB | 16GB+ VRAM | `llama3.3:70b` | Excellent |

> **Recommendation for most people:** Start with `llama3.2:3b` (2GB download) — fast enough and quite capable.

---

## Step 1 — Install Ollama on Windows (Native)

**Why Windows native and not inside WSL?**  
Because Windows native Ollama can use your GPU and is accessible from both Windows AND from inside WSL.

### 1.1 Download Ollama

Go to: **https://ollama.com/download**  
Click **Download for Windows** → downloads `OllamaSetup.exe`

### 1.2 Run the Installer

Double-click `OllamaSetup.exe` → click through the installer.

Ollama installs as a **background Windows service** that starts automatically.  
You'll see the 🦙 llama icon in your system tray (bottom right).

### 1.3 Verify Installation

Open a new PowerShell window:

```powershell
ollama --version
```

Expected output: something like `ollama version 0.6.x`

```powershell
# Also check the service is running
ollama list
```

Expected output: `(empty list)` — no models downloaded yet, that's fine.

---

## Step 2 — Download Llama 3

Open PowerShell and run:

```powershell
# Option A: Small model (2GB) — recommended to start
ollama pull llama3.2:3b

# Option B: Medium model (4.7GB) — better quality
ollama pull llama3.1:8b

# Option C: Tiny model (1.3GB) — if you have very little RAM
ollama pull llama3.2:1b
```

> **Note:** The download may take 5–30 minutes depending on your internet speed.  
> Models are stored in `C:\Users\<you>\.ollama\models`

Watch the download progress:
```
pulling manifest
pulling 966de95ca8a6... 100% ▕████████████████▏ 2.0 GB
pulling 1cf6ec7... 100% ▕████████████████▏  1.7 KB
verifying sha256 digest
writing manifest
success
```

---

## Step 3 — Test Llama Works

### 3.1 Quick Chat Test (PowerShell)

```powershell
ollama run llama3.2:3b
```

You'll enter an interactive chat. Type something:
```
>>> Hello! Can you help me with a coding question?
```

Llama should respond. Press `Ctrl+D` or type `/bye` to exit.

### 3.2 Test the REST API

This is how your bot will actually talk to Ollama — via HTTP.

Open PowerShell and run:

```powershell
# Test the API endpoint
Invoke-RestMethod -Uri "http://localhost:11434/api/generate" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"model": "llama3.2:3b", "prompt": "Say hello in one sentence.", "stream": false}'
```

Or in PowerShell using curl syntax:
```powershell
curl.exe -s http://localhost:11434/api/generate `
  -d '{\"model\": \"llama3.2:3b\", \"prompt\": \"Say hello!\", \"stream\": false}'
```

You should get back a JSON response:
```json
{
  "model": "llama3.2:3b",
  "response": "Hello! It's great to meet you — how can I help you today?",
  "done": true
}
```

✅ **Ollama is working if you see a response.**

### 3.3 Test from WSL (Important)

Since your bot runs in WSL, test that WSL can reach Ollama on Windows:

```bash
# Open WSL
wsl

# From inside WSL, call Windows Ollama
curl http://host.docker.internal:11434/api/generate \
  -d '{"model": "llama3.2:3b", "prompt": "Say hello!", "stream": false}'
```

> `host.docker.internal` is a special hostname in WSL that points to Windows.  
> Alternatively use the Windows IP: `172.x.x.x` (from `ip route show default` inside WSL)

---

## Step 4 — Make Ollama Accessible from WSL (If Needed)

If the WSL test in Step 3.3 doesn't work, do this:

### 4.1 Set Ollama to Listen on All Interfaces

Open PowerShell as **Administrator**:

```powershell
# Tell Ollama to accept connections from any interface (including WSL)
[System.Environment]::SetEnvironmentVariable('OLLAMA_HOST', '0.0.0.0:11434', 'User')
```

### 4.2 Fully Restart Ollama

1. Right-click the 🦙 llama icon in system tray
2. Click **Quit Ollama**
3. Search Windows Start menu → open **Ollama** again

### 4.3 Get Your Windows IP from WSL

```bash
# Inside WSL, run:
ip route show default | awk '{print $3}'
```

This gives you the Windows host IP (e.g., `172.20.0.1`). Use this IP in your bot config instead of `localhost`.

### 4.4 Test Again from WSL

```bash
# Replace 172.20.0.1 with your actual IP from above
curl http://172.20.0.1:11434/api/generate \
  -d '{"model": "llama3.2:3b", "prompt": "Hello!", "stream": false}'
```

---

## Step 5 — Connect Ollama to Your Bot

### 5.1 The Ollama API is OpenAI-Compatible

Ollama speaks the OpenAI API format. At `http://localhost:11434/v1/`:

```bash
# List available models
curl http://localhost:11434/v1/models

# Chat completion (OpenAI format)
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:3b",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "What is 2+2?"}
    ]
  }'
```

### 5.2 Your Bot Config

When we build the Ollama provider extension (Phase 4 in the gateway plan), this is what the config will look like:

```json
{
  "providers": {
    "ollama": {
      "enabled": true,
      "baseUrl": "http://localhost:11434",
      "defaultModel": "llama3.2:3b"
    }
  },
  "agents": {
    "default": {
      "model": "ollama/llama3.2:3b",
      "systemPrompt": "You are a helpful assistant for the EkaGuru project."
    }
  }
}
```

### 5.3 Quick Node.js Test

Create a test file to verify your bot can call Ollama:

```javascript
// test-ollama.mjs
const response = await fetch('http://localhost:11434/v1/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama3.2:3b',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say hello in one sentence.' }
    ]
  })
})

const data = await response.json()
console.log('Bot reply:', data.choices[0].message.content)
```

Run it:
```bash
node test-ollama.mjs
```

Expected output:
```
Bot reply: Hello! I'm here and ready to help you with whatever you need.
```

---

## Step 6 — (Optional) Install a Web Chat UI

If you want a **ChatGPT-like interface** to chat with Llama in your browser, install **Open WebUI**:

```bash
# Inside WSL, using Docker:
docker run -d \
  -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  --restart always \
  ghcr.io/open-webui/open-webui:main
```

Then open **http://localhost:3000** in your browser.  
You get a full ChatGPT-like UI powered by your local Llama. No API key, no cloud.

---

## Step 7 — Useful Ollama Commands

```powershell
# List downloaded models
ollama list

# Download a model
ollama pull llama3.2:3b
ollama pull llama3.1:8b
ollama pull mistral       # Another good free model
ollama pull gemma3:4b     # Google's Gemma 3 (very good)
ollama pull phi4          # Microsoft's Phi-4 (small but smart)

# Delete a model (free up disk space)
ollama rm llama3.2:1b

# Chat with a model in terminal
ollama run llama3.2:3b

# Check Ollama server is running
curl http://localhost:11434/

# See running models
ollama ps

# Stop a running model (free up VRAM)
ollama stop llama3.2:3b
```

---

## Troubleshooting

### Problem: `ollama: command not found` in PowerShell
**Fix:** Close and reopen PowerShell after installing Ollama. The PATH needs to refresh.

### Problem: Model download is very slow
**Fix:** This is normal — models are 2–8GB. Let it run overnight if needed.

### Problem: Ollama responds but very slowly
**Cause:** Running on CPU only (no GPU acceleration)  
**Fix:** 
- Make sure your Nvidia GPU drivers are updated
- Check `nvidia-smi` runs without error in PowerShell
- Ollama auto-detects GPU if drivers are correct

### Problem: WSL can't reach `localhost:11434`
**Fix:** Use `http://host.docker.internal:11434` or set `OLLAMA_HOST=0.0.0.0` (see Step 4)

### Problem: `model not found` error
**Fix:** Make sure you've downloaded the model: `ollama pull llama3.2:3b`

### Problem: Out of memory / crash
**Fix:** Use a smaller model:
```powershell
ollama pull llama3.2:1b   # Smallest Llama 3 (1.3GB)
```

---

## Model Recommendations Summary

| Model | Size | Best For | Command |
|---|---|---|---|
| `llama3.2:1b` | 1.3 GB | Very limited RAM | `ollama pull llama3.2:1b` |
| `llama3.2:3b` | 2.0 GB | **Start here** — good balance | `ollama pull llama3.2:3b` |
| `llama3.1:8b` | 4.7 GB | Better quality, needs 16GB RAM | `ollama pull llama3.1:8b` |
| `gemma3:4b` | 3.3 GB | Very smart for its size | `ollama pull gemma3:4b` |
| `phi4` | 9.1 GB | Microsoft model, excellent reasoning | `ollama pull phi4` |
| `mistral` | 4.1 GB | Fast & capable | `ollama pull mistral` |
| `llama3.3:70b` | 43 GB | Best quality, needs 64GB+ RAM | `ollama pull llama3.3:70b` |

---

## How This Connects to Your Bot Plan

In the EkaGuru Gateway plan (`openclaw-gateway-plan.md`), **Phase 4** covers building the Ollama provider extension. Once you've completed Steps 1-5 above, your bot can:

1. Receive a message on Telegram or WhatsApp
2. Send it to `http://localhost:11434/v1/chat/completions`
3. Get Llama's reply
4. Send the reply back to the user

The Ollama extension for the bot will look like this:

```typescript
// extensions/ollama/src/index.ts
export const plugin: ProviderPlugin = {
  id: 'ollama',
  name: 'Ollama (Local)',
  models: ['llama3.2:3b', 'llama3.1:8b', 'gemma3:4b'],

  async complete({ messages, model }) {
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages })
    })
    const data = await response.json()
    return { text: data.choices[0].message.content }
  }
}
```

---

## Next Steps After This

1. ✅ Install Ollama (this guide)
2. ✅ Confirm `curl http://localhost:11434/api/generate` works
3. ✅ Confirm WSL can reach Ollama
4. → Start **Phase 1** of the gateway plan (build the core server)
5. → Build **Phase 4** (Ollama provider extension)
6. → Connect a channel (Telegram) — your bot comes alive

---

*No API keys. No monthly bills. Your own AI running on your own machine.*
