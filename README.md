<h1 align="center">Multi-Model for Copilot Chat</h1>

<p align="center">
  <!-- marketplace-readme:remove-start -->
  <a href="https://marketplace.visualstudio.com/items?itemName=Vizards.multi-model-for-copilot"><img src="https://img.shields.io/badge/VS%20Code%20Marketplace-Install-007ACC?logo=visualstudiocode&logoColor=white&style=for-the-badge" alt="Install from VS Code Marketplace"></a>
  <a href="https://open-vsx.org/extension/WindSnowLi/multi-model-for-copilot"><img src="https://img.shields.io/badge/Open%20VSX-Install-6A4FB6?style=for-the-badge" alt="Install from Open VSX"></a>
  <br/>
  <!-- marketplace-readme:remove-end -->
  <img src="https://img.shields.io/github/v/release/WindSnowLi/multi-model-for-copilot?style=for-the-badge&label=Version" alt="Version" />
</p>

<p align="center">
  English |
  <a href="https://github.com/WindSnowLi/multi-model-for-copilot/blob/main/README.zh-cn.md">简体中文</a>
</p>

**Connect DeepSeek, MiMo, and any OpenAI-compatible model to GitHub Copilot Chat — with vision, thinking mode, agent tools, and your own API keys.**

<p align="center">
  <img src="resources/screenshots/01-picker.png" alt="Multiple models in the Copilot Chat model picker" width="800">
</p>

## What is this?

This extension brings **multiple AI model providers** into GitHub Copilot Chat's model picker. Use built-in presets for **DeepSeek** and **MiMo**, or connect **any OpenAI-compatible API endpoint** — all with your own API keys (BYOK).

**Don't replace Copilot — power it up.** No new sidebar, no new chat UI. Just more models in the picker you already use.

## Key Features

### Multi-Provider Model Support

| Provider | Models | Auth | API Key |
|---|---|---|---|
| **DeepSeek** | V4.1 Flash, V4 Pro | `Authorization: Bearer` | `sk-...` |
| **Xiaomi MiMo** | V2.6 Pro, V2.6 Flash, V2.6 Pro Ultraspeed | `api-key` header | `tp-...` (Token Plan) |
| **Qwen (千问)** | Max, Plus, Turbo, VL Max, VL Plus, VL Turbo | `Authorization: Bearer` | `sk-...` |
| **Custom** | Any OpenAI-compatible | Configurable | Any |

Built-in presets include full pricing, capabilities, and context limits. Custom models are added via settings or interactive commands.

### Model Discovery

Run **`Multi-Model: Discover Available Models`** to auto-detect available models:

1. Pick a source: **DeepSeek**, **MiMo**, **Qwen**, or **custom endpoint**
2. Extension calls `GET /v1/models` and lists all available models
3. Multi-select the ones you want — added to config instantly

### Vision Support

Images are routed per model capability — models that accept image input natively forward them
as OpenAI `image_url` blocks; models that don't describe them through the configurable vision
proxy and forward the description as text.

| Model | Image Support | Method |
|---|---|---|
| **DeepSeek V4.1 Flash** | Native | Images sent directly via OpenAI `image_url` format |
| **MiMo V2.6 Pro / Flash / Pro Ultraspeed** | Native | Images sent directly via OpenAI `image_url` format |
| **Qwen VL Max/Plus/Turbo** | Native | Images sent directly via OpenAI `image_url` format |
| **DeepSeek V4 Pro** | Proxy | Images described by another model, text sent to DeepSeek |
| **Custom models** | Configurable | Set `imageInput: true` for native support |

Supports JPEG, PNG, GIF, WebP, BMP (up to 50MB per image). Multi-image input supported.

### Thinking Mode

Use Copilot Chat's model picker to choose reasoning effort. DeepSeek models support `none`,
`low`, `high` (default), and `max` (deep reasoning). MiMo models support `none`, `low`, and
`high` — the MiMo API rejects `reasoning_effort: max`. Other providers show the default tiers
(`none`, `high`, `max`).

### Full Copilot Stack

Agent mode, tool calling, instructions, skills, MCP servers — all work because this plugs into Copilot's native provider API. Prompt cache hit rate logged in output channel.

### Secure by Default

API keys in OS keychain (SecretStorage). Per-provider separation. Zero runtime dependencies.

## Getting Started

### Prerequisites

- **VS Code 1.116+** with **GitHub Copilot** subscription (Free / Pro / Enterprise)
- An API key from at least one provider:
  - DeepSeek: [platform.deepseek.com](https://platform.deepseek.com) (`sk-...`)
  - MiMo: [platform.xiaomimimo.com](https://platform.xiaomimimo.com) (`tp-...` for Token Plan)
  - Qwen: [platform.qianwenai.com](https://platform.qianwenai.com) (`sk-...`)
  - Any OpenAI-compatible endpoint

### Quick Start

```
Ctrl+Shift+P → Multi-Model: Set API Key → paste your key → pick a model in Copilot Chat
```

For MiMo: `Multi-Model: Set MiMo API Key` → paste `tp-...` key.

For custom models: `Multi-Model: Discover Available Models` → pick endpoint → select models.

## Built-in Models

| Model | Provider | Context | Max Output | Vision | Thinking | Tools |
|---|---|---|---|---|---|---|
| **DeepSeek V4.1 Flash** | DeepSeek | 1M | 384K | Native | Yes | Yes |
| **DeepSeek V4 Pro** | DeepSeek | 1M | 384K | Proxy | Yes | Yes |
| **MiMo V2.6 Pro** | Xiaomi MiMo | 1M | 128K | Native | Yes | Yes |
| **MiMo V2.6 Flash** | Xiaomi MiMo | 1M | 128K | Native | Yes | Yes |
| **MiMo V2.6 Pro Ultraspeed** | Xiaomi MiMo | 1M | 128K | Native | Yes | Yes |

**DeepSeek V4.1 Flash** is the current flagship and is sent to the `deepseek-flash` model name.
The older `deepseek-v4-flash` and `deepseek-v4-flash-vision-exp` names are retired: DeepSeek
serves those requests from V4.1 Flash, so this extension no longer offers them as presets. If a
third-party endpoint still exposes the old names, map them through `modelIdOverrides`.

**DeepSeek V4 Pro** (`deepseek-v4-pro`) is the previous-generation model, which DeepSeek
[decided to keep serving](https://api-docs.deepseek.com/updates) after the V4.1 Flash release.

## Official alternative: no extension required

VS Code's built-in Copilot Chat can also connect these providers on its own: **Manage Language
Models** (gear icon in the model picker) → **Add Models** → **Custom Endpoint**, which VS Code saves
to `chatLanguageModels.json`. Per the VS Code docs, BYOK models need neither a GitHub sign-in nor a
Copilot plan.

If you only need the models in the picker, that path may already be enough — copy-paste templates for
DeepSeek, MiMo, and Qwen (including the auth headers this extension handles for you) are in
[docs/official-byok.en.md](docs/official-byok.en.md).

What stays unique to this extension: images for models **without** native vision (vision proxy),
peak/off-peak pricing and balance, status-bar token speed, `${conversationId}` header templating, and
one-command API key setup — see the same page for the full comparison.

## Custom Models

Add any OpenAI-compatible model via `settings.json`:

```json
{
  "multi-model-for-copilot.customModels": [
    {
      "id": "gpt-4o",
      "name": "GPT-4o (Custom)",
      "baseUrl": "https://api.openai.com/v1",
      "modelId": "gpt-4o",
      "toolCalling": true,
      "imageInput": true,
      "useMaxCompletionTokens": true
    }
  ]
}
```

| Field | Required | Default | Description |
|---|---|---|---|
| `id` | Yes | — | Unique identifier |
| `name` | Yes | — | Display name |
| `baseUrl` | Yes | — | API endpoint URL |
| `modelId` | Yes | — | Model ID in request body |
| `authHeader` | No | `Authorization` | HTTP auth header name |
| `authPrefix` | No | `Bearer ` | Prefix before API key |
| `maxInputTokens` | No | 128000 | Max input context |
| `maxOutputTokens` | No | 8192 | Max output tokens |
| `toolCalling` | No | false | Tool calling support |
| `imageInput` | No | false | Allow attaching images (picker capability) |
| `nativeImageInput` | No | `imageInput` | API accepts images natively (`image_url`) |
| `thinking` | No | false | Thinking mode |
| `thinkingEfforts` | No | none/high/max | Ordered reasoning efforts (add `low` if supported) |
| `requiresThinkingParam` | No | false | Send thinking wrapper |
| `useMaxCompletionTokens` | No | false | Use `max_completion_tokens` |

## Commands

| Command | Description |
|---|---|
| `Multi-Model: Set API Key` | Set DeepSeek API key |
| `Multi-Model: Set MiMo API Key` | Set MiMo API key |
| `Multi-Model: Clear API Key` | Remove DeepSeek key |
| `Multi-Model: Clear MiMo API Key` | Remove MiMo key |
| `Multi-Model: Reset API Base URL` | Reset a provider base URL to its default (choose scope) |
| `Multi-Model: Discover Available Models` | Auto-discover from any provider |
| `Multi-Model: Add Custom Model` | Manually add custom model |
| `Multi-Model: Remove Custom Model` | Remove custom model |
| `Multi-Model: Configure Vision Proxy` | Configure image proxy |
| `Multi-Model: Open Settings` | Open settings |
| `Multi-Model: Show Logs` | Show diagnostics |

## Settings

| Setting | Default | Description |
|---|---|---|
| `baseUrl` | `https://api.deepseek.com` | DeepSeek API endpoint |
| `mimoBaseUrl` | `https://token-plan-cn.xiaomimimo.com/v1` | MiMo API endpoint |
| `qwenBaseUrl` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | Qwen (DashScope) API endpoint |
| `requestHeaders` | `{}` | Extra headers for chat completion requests; supports `${conversationId}` ([docs](docs/settings/request-headers.en.md)) |
| `maxTokens` | `0` | Global max output tokens (0 = no limit) |
| `customModels` | `[]` | Custom model definitions |
| `modelIdOverrides` | official IDs | Override built-in model IDs |
| `debugMode` | `minimal` | Diagnostic level |
| `visionModel` | auto | Vision proxy model |
| `visionPrompt` | built-in | Image description prompt |
| `statusBar.balance` | `true` | Show live account balance in the status bar (DeepSeek; click to refresh) |
| `statusBar.tokenSpeed` | `true` | Show live token generation speed (tokens/s) in the status bar while streaming |
| `showPricingNotice` | `true` | Show peak/off-peak pricing notice in the model picker (DeepSeek; off-peak is half of peak) |

## Compared to Alternatives

| Feature | This Extension | Copilot Custom Endpoint (built-in) | Local Proxy |
|---|---|---|---|
| Inside Copilot Chat | Yes | Yes | Yes |
| No extra process | Yes | Yes | No |
| Setup | Install extension, pick provider | Edit `chatLanguageModels.json` | Run a proxy process |
| DeepSeek / MiMo / Qwen presets + auth headers | Yes | Manual JSON | No |
| Any OpenAI-compatible endpoint | Yes | Yes | Yes |
| Model discovery | Yes | Yes (provider-level `url`) | No |
| Native vision | Yes | Yes | No |
| Images for models without native vision | Yes (vision proxy) | No | No |
| Pricing / balance visibility | Yes | No | No |
| Token speed in status bar | Yes | No | No |
| `${conversationId}` header templating | Yes | No | Varies |
| API key in OS keychain | Yes | Yes (secret storage) | Varies |

See [docs/official-byok.en.md](docs/official-byok.en.md) for the built-in configuration templates.

## License

[MIT](LICENSE)
