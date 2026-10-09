# Using Copilot's built-in BYOK instead of this extension

VS Code's built-in **GitHub Copilot Chat** can connect your own models without any extension:

1. Open the Language Models editor — **Manage Language Models** (gear icon in the model picker) or the
   `Chat: Manage Language Models` command.
2. **Add Models** → **Custom Endpoint**.
3. Enter the API key and group name; VS Code opens `chatLanguageModels.json` for you to finish and save.

VS Code validates that file against the `vscode://schemas/language-models` schema, keeps the API key
in secret storage, and — per the VS Code documentation — **BYOK models work without signing into a
GitHub account and without a Copilot plan**.

Reference: <https://code.visualstudio.com/docs/agent-customization/language-models>

## Where the file lives

| Platform | Path |
|---|---|
| Windows | `%APPDATA%\Code\User\chatLanguageModels.json` |
| macOS | `~/Library/Application Support/Code/User/chatLanguageModels.json` |
| Linux | `~/.config/Code/User/chatLanguageModels.json` |
| Any profile | `<user dir>/profiles/<profile name>/chatLanguageModels.json` |

## Copy-paste templates

These mirror the presets this extension ships, including the provider-specific authentication the
extension otherwise handles for you:

- `url` must be the **full endpoint** (VS Code appends `/v1/<path>` only when the URL has no API path).
- `apiType` is `chat-completions` for all three providers.
- **MiMo** authenticates with an `api-key` header instead of `Authorization`, and `requestHeaders` is a
  **model-level** property — that is why it is repeated on each MiMo model below.
- Keys use `${input:...}` so they are prompted for and stored securely instead of being committed.
- `modelOptions` is optional; here it makes DeepSeek/MiMo return reasoning content
  (`thinking: { "type": "enabled" }`, the same parameter this extension sends).

```jsonc
[
  {
    "name": "DeepSeek",
    "vendor": "customendpoint",
    "apiKey": "${input:deepseekApiKey}",
    "apiType": "chat-completions",
    "models": [
      {
        "id": "deepseek-flash",
        "name": "DeepSeek V4.1 Flash",
        "url": "https://api.deepseek.com/chat/completions",
        "toolCalling": true,
        "vision": true,
        "maxInputTokens": 1048576,
        "maxOutputTokens": 393216,
        "modelOptions": { "thinking": { "type": "enabled" } }
      },
      {
        "id": "deepseek-v4-pro",
        "name": "DeepSeek V4 Pro",
        "url": "https://api.deepseek.com/chat/completions",
        "toolCalling": true,
        "vision": false,
        "maxInputTokens": 1048576,
        "maxOutputTokens": 393216,
        "modelOptions": { "thinking": { "type": "enabled" } }
      }
    ]
  },
  {
    "name": "MiMo",
    "vendor": "customendpoint",
    "apiKey": "${input:mimoApiKey}",
    "apiType": "chat-completions",
    "models": [
      {
        "id": "mimo-v2.6-pro",
        "name": "MiMo V2.6 Pro",
        "url": "https://token-plan-cn.xiaomimimo.com/v1/chat/completions",
        "toolCalling": true,
        "vision": true,
        "maxInputTokens": 1000000,
        "maxOutputTokens": 128000,
        "requestHeaders": { "api-key": "${apiKey}" },
        "modelOptions": { "thinking": { "type": "enabled" } }
      },
      {
        "id": "mimo-v2.6-flash",
        "name": "MiMo V2.6 Flash",
        "url": "https://token-plan-cn.xiaomimimo.com/v1/chat/completions",
        "toolCalling": true,
        "vision": true,
        "maxInputTokens": 1000000,
        "maxOutputTokens": 128000,
        "requestHeaders": { "api-key": "${apiKey}" },
        "modelOptions": { "thinking": { "type": "enabled" } }
      },
      {
        "id": "mimo-v2.6-pro-ultraspeed",
        "name": "MiMo V2.6 Pro Ultraspeed",
        "url": "https://token-plan-cn.xiaomimimo.com/v1/chat/completions",
        "toolCalling": true,
        "vision": true,
        "maxInputTokens": 1000000,
        "maxOutputTokens": 128000,
        "requestHeaders": { "api-key": "${apiKey}" },
        "modelOptions": { "thinking": { "type": "enabled" } }
      }
    ]
  },
  {
    "name": "Qwen",
    "vendor": "customendpoint",
    "apiKey": "${input:qwenApiKey}",
    "apiType": "chat-completions",
    "models": [
      {
        "id": "qwen-max",
        "name": "Qwen Max",
        "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        "toolCalling": true,
        "vision": false,
        "maxInputTokens": 32000,
        "maxOutputTokens": 8192
      },
      {
        "id": "qwen-plus",
        "name": "Qwen Plus",
        "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        "toolCalling": true,
        "vision": false,
        "maxInputTokens": 131072,
        "maxOutputTokens": 8192
      },
      {
        "id": "qwen-turbo",
        "name": "Qwen Turbo",
        "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        "toolCalling": true,
        "vision": false,
        "maxInputTokens": 131072,
        "maxOutputTokens": 8192
      },
      {
        "id": "qwen-vl-max",
        "name": "Qwen VL Max",
        "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        "toolCalling": true,
        "vision": true,
        "maxInputTokens": 32000,
        "maxOutputTokens": 4096
      },
      {
        "id": "qwen-vl-plus",
        "name": "Qwen VL Plus",
        "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        "toolCalling": true,
        "vision": true,
        "maxInputTokens": 131072,
        "maxOutputTokens": 4096
      },
      {
        "id": "qwen-vl-turbo",
        "name": "Qwen VL Turbo",
        "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        "toolCalling": true,
        "vision": true,
        "maxInputTokens": 131072,
        "maxOutputTokens": 4096
      }
    ]
  }
]
```

If the models do not show up in the picker, restart VS Code.

## What this extension adds on top

The built-in Custom Endpoint provider covers model access; these are the parts that still require this
extension:

| Capability | This extension |
|---|---|
| One-command API key setup and presets per provider, no JSON editing | ✅ |
| Images for models **without** native vision — described by the vision proxy and forwarded as text (e.g. DeepSeek V4 Pro) | ✅ |
| Peak/off-peak pricing, CNY/USD cost display, live account balance (DeepSeek) | ✅ |
| Live token-generation speed in the status bar | ✅ |
| `${conversationId}` templating in request headers | ✅ |
| Per-provider `thinking` parameter mapping (e.g. the MiMo API rejects `reasoning_effort: max`) | ✅ |
| Request/response diagnostics via `Multi-Model: Show Logs` | ✅ |
