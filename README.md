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
| **DeepSeek** | V4 Flash, V4 Pro | `Authorization: Bearer` | `sk-...` |
| **Xiaomi MiMo** | V2.5, V2.5 Pro | `api-key` header | `tp-...` (Token Plan) |
| **Custom** | Any OpenAI-compatible | Configurable | Any |

Built-in presets include full pricing, capabilities, and context limits. Custom models are added via settings or interactive commands.

### Model Discovery

Run **`Multi-Model: Discover Available Models`** to auto-detect available models:

1. Pick a source: **DeepSeek**, **MiMo**, or **custom endpoint**
2. Extension calls `GET /v1/models` and lists all available models
3. Multi-select the ones you want — added to config instantly

### Vision Support

| Model | Image Support | Method |
|---|---|---|
| **MiMo V2.5** | Native | Images sent directly via OpenAI `image_url` format |
| **DeepSeek V4 Flash/Pro** | Proxy | Images described by another model, text sent to DeepSeek |
| **Custom models** | Configurable | Set `imageInput: true` for native support |

Supports JPEG, PNG, GIF, WebP, BMP (up to 50MB per image). Multi-image input supported.

### Thinking Mode

Use Copilot Chat's model picker to choose reasoning effort: `none` (off), `high` (default), or `max` (deep reasoning). Works across DeepSeek, MiMo, and custom models.

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
| **DeepSeek V4 Flash** | DeepSeek | 1M | 384K | Proxy | Yes | 128 |
| **DeepSeek V4 Pro** | DeepSeek | 1M | 384K | Proxy | Yes | 128 |
| **MiMo V2.5** | Xiaomi MiMo | 1M | 128K | Native | Yes | Yes |
| **MiMo V2.5 Pro** | Xiaomi MiMo | 1M | 128K | No | Yes | Yes |

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
| `imageInput` | No | false | Native image input |
| `thinking` | No | false | Thinking mode |
| `requiresThinkingParam` | No | false | Send thinking wrapper |
| `useMaxCompletionTokens` | No | false | Use `max_completion_tokens` |

## Commands

| Command | Description |
|---|---|
| `Multi-Model: Set API Key` | Set DeepSeek API key |
| `Multi-Model: Set MiMo API Key` | Set MiMo API key |
| `Multi-Model: Clear API Key` | Remove DeepSeek key |
| `Multi-Model: Clear MiMo API Key` | Remove MiMo key |
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
| `maxTokens` | `0` | Global max output tokens (0 = no limit) |
| `customModels` | `[]` | Custom model definitions |
| `modelIdOverrides` | official IDs | Override built-in model IDs |
| `debugMode` | `minimal` | Diagnostic level |
| `visionModel` | auto | Vision proxy model |
| `visionPrompt` | built-in | Image description prompt |

## Compared to Alternatives

| Feature | This Extension | Local Proxy | Standalone Extensions |
|---|---|---|---|
| Inside Copilot Chat | Yes | Yes | No |
| Multiple providers | Yes | Yes | No |
| Custom models | Yes | Yes | No |
| Model discovery | Yes | No | No |
| Native vision | Yes | No | No |
| No extra process | Yes | No | Yes |
| One-click install | Yes | No | Yes |
| API key in keychain | Yes | No | Varies |

## License

[MIT](LICENSE)
