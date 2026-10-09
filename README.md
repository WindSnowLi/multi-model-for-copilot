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

**DeepSeek, MiMo, and Qwen presets in GitHub Copilot Chat's model picker — with your own API keys.**

## Why this extension

Copilot's built-in Custom Endpoint provider already connects [any endpoint](docs/official-byok.en.md).
These presets add what it does not, for DeepSeek / MiMo / Qwen:

- Per-provider auth and request shape (MiMo's `api-key` header, Qwen's `reasoning_effort`, DeepSeek's `thinking` switch)
- Images for models **without** native image input: the vision proxy describes the image and forwards text
- Peak/off-peak pricing, CNY/USD cost display, live DeepSeek balance
- Status-bar token speed and `${conversationId}` request-header templating

## Quick start

`Ctrl+Shift+P` → `Multi-Model: Set API Key` → pick a model in Copilot Chat.

| Provider | Models | Auth | Key |
|---|---|---|---|
| DeepSeek | V4.1 Flash (`deepseek-flash`), V4 Pro | `Authorization: Bearer` | `sk-...` |
| Xiaomi MiMo | V2.6 Pro, V2.6 Flash, V2.6 Pro Ultraspeed | `api-key` | `tp-...` |
| Qwen | Max, Plus, Turbo, VL Max, VL Plus, VL Turbo | `Authorization: Bearer` | `sk-...` |
| Anything else | any OpenAI-compatible endpoint | — | Copilot's built-in **Custom Endpoint** |

Context windows: 1M for DeepSeek and MiMo (384K / 128K max output), 32K–131K for Qwen.
DeepSeek V4 Pro and the text-only Qwen models reach images through the vision proxy.
Requires VS Code 1.116+ and GitHub Copilot (Free / Pro / Enterprise); BYOK needs no Copilot plan.

## Commands

| Command | Description |
|---|---|
| `Multi-Model: Set API Key` | Set the DeepSeek key (also `Set MiMo API Key`, `Set Qwen API Key`) |
| `Multi-Model: Clear API Key` | Remove a key (also the MiMo / Qwen variants) |
| `Multi-Model: Get API Key` | Open the DeepSeek key page |
| `Multi-Model: Configure Vision Proxy` | Choose the model that describes images |
| `Multi-Model: Refresh Balance` | Refresh the DeepSeek balance |
| `Multi-Model: Show Logs` | Open the diagnostic log |
| `Multi-Model: Open Settings` | Open this extension's settings |

## Settings

| Setting | Default | Description |
|---|---|---|
| `requestHeaders` | `{}` | Extra request headers; supports `${conversationId}` ([docs](docs/settings/request-headers.en.md)) |
| `maxTokens` | `0` | Global max output tokens (0 = provider default) |
| `debugMode` | `minimal` | Diagnostic level: `minimal` or `metadata` |
| `visionModel` | auto | Model used by the vision proxy |
| `visionPrompt` | built-in | Prompt used by the vision proxy |
| `statusBar.balance` | `true` | DeepSeek balance in the status bar |
| `statusBar.tokenSpeed` | `true` | Token speed in the status bar |
| `showPricingNotice` | `true` | Peak/off-peak pricing notice in the picker |
| `experimental.stabilizeToolList` | `false` | Pre-activate tools for a more stable `tools` array ([notice](docs/notices/tool-drift.en.md)) |

## License

[MIT](LICENSE)
