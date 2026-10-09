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

This extension brings **DeepSeek, MiMo, and Qwen presets** into GitHub Copilot Chat's model picker — with your own API keys (BYOK). For any other endpoint, use Copilot's built-in **Custom Endpoint** provider (see below).

**Don't replace Copilot — power it up.** No new sidebar, no new chat UI. Just more models in the picker you already use.

## Key Features

### Multi-Provider Model Support

| Provider | Models | Auth | API Key |
|---|---|---|---|
| **DeepSeek** | V4.1 Flash, V4 Pro | `Authorization: Bearer` | `sk-...` |
| **Xiaomi MiMo** | V2.6 Pro, V2.6 Flash, V2.6 Pro Ultraspeed | `api-key` header | `tp-...` (Token Plan) |
| **Qwen (千问)** | Max, Plus, Turbo, VL Max, VL Plus, VL Turbo | `Authorization: Bearer` | `sk-...` |

Presets include full pricing, capabilities, and context limits. The provider-specific quirks — MiMo's
`api-key` header, Qwen's `reasoning_effort` shape, DeepSeek's `thinking` switch — are handled for you.

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

For any other endpoint (OpenAI, Azure, a gateway, Ollama, …), use Copilot's built-in **Custom Endpoint** provider — see [docs/official-byok.en.md](docs/official-byok.en.md).

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
serves those requests from V4.1 Flash, so this extension no longer offers them as presets.

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

For endpoints this extension has no preset for, the built-in Custom Endpoint provider is the
supported path; this extension deliberately keeps no custom-model editor of its own.

## Commands

| Command | Description |
|---|---|
| `Multi-Model: Set API Key` | Set DeepSeek API key |
| `Multi-Model: Set MiMo API Key` | Set MiMo API key |
| `Multi-Model: Clear API Key` | Remove DeepSeek key |
| `Multi-Model: Clear MiMo API Key` | Remove MiMo key |
| `Multi-Model: Configure Vision Proxy` | Configure image proxy |
| `Multi-Model: Open Settings` | Open settings |
| `Multi-Model: Show Logs` | Show diagnostics |

## Settings

| Setting | Default | Description |
|---|---|---|
| `requestHeaders` | `{}` | Extra headers for chat completion requests; supports `${conversationId}` ([docs](docs/settings/request-headers.en.md)) |
| `maxTokens` | `0` | Global max output tokens (0 = no limit) |
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
| Any OpenAI-compatible endpoint | No — use the built-in provider | Yes | Yes |
| Model discovery | No — use the built-in provider | Yes (provider-level `url`) | No |
| Native vision | Yes | Yes | No |
| Images for models without native vision | Yes (vision proxy) | No | No |
| Pricing / balance visibility | Yes | No | No |
| Token speed in status bar | Yes | No | No |
| `${conversationId}` header templating | Yes | No | Varies |
| API key in OS keychain | Yes | Yes (secret storage) | Varies |

See [docs/official-byok.en.md](docs/official-byok.en.md) for the built-in configuration templates.

## License

[MIT](LICENSE)
