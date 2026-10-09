# Copilot's built-in BYOK instead of this extension

VS Code's built-in Copilot Chat connects your own models without any extension:
**Manage Language Models** (gear icon in the model picker) → **Add Models** → **Custom Endpoint**.
VS Code then opens `chatLanguageModels.json`, validates it against `vscode://schemas/language-models`,
and keeps the API key in secret storage. Per the VS Code docs, BYOK needs neither a GitHub sign-in nor
a Copilot plan. Reference: <https://code.visualstudio.com/docs/agent-customization/language-models>

File location: `%APPDATA%\Code\User\chatLanguageModels.json` (Windows),
`~/Library/Application Support/Code/User/chatLanguageModels.json` (macOS),
`~/.config/Code/User/chatLanguageModels.json` (Linux), or `<user dir>/profiles/<profile>/` for profiles.

## Templates

Mirrors of this extension's presets. Notes: `url` is the full endpoint; `apiType` is
`chat-completions`; MiMo authenticates with a model-level `api-key` header (`requestHeaders`);
keys use `${input:...}`; `modelOptions` makes DeepSeek/MiMo return reasoning content.

```jsonc
[
  {
    "name": "DeepSeek",
    "vendor": "customendpoint",
    "apiKey": "${input:deepseekApiKey}",
    "apiType": "chat-completions",
    "models": [
      { "id": "deepseek-flash", "name": "DeepSeek V4.1 Flash", "url": "https://api.deepseek.com/chat/completions", "toolCalling": true, "vision": true, "maxInputTokens": 1048576, "maxOutputTokens": 393216, "modelOptions": { "thinking": { "type": "enabled" } } },
      { "id": "deepseek-v4-pro", "name": "DeepSeek V4 Pro", "url": "https://api.deepseek.com/chat/completions", "toolCalling": true, "vision": false, "maxInputTokens": 1048576, "maxOutputTokens": 393216, "modelOptions": { "thinking": { "type": "enabled" } } }
    ]
  },
  {
    "name": "MiMo",
    "vendor": "customendpoint",
    "apiKey": "${input:mimoApiKey}",
    "apiType": "chat-completions",
    "models": [
      { "id": "mimo-v2.6-pro", "name": "MiMo V2.6 Pro", "url": "https://token-plan-cn.xiaomimimo.com/v1/chat/completions", "toolCalling": true, "vision": true, "maxInputTokens": 1000000, "maxOutputTokens": 128000, "requestHeaders": { "api-key": "${apiKey}" }, "modelOptions": { "thinking": { "type": "enabled" } } },
      { "id": "mimo-v2.6-flash", "name": "MiMo V2.6 Flash", "url": "https://token-plan-cn.xiaomimimo.com/v1/chat/completions", "toolCalling": true, "vision": true, "maxInputTokens": 1000000, "maxOutputTokens": 128000, "requestHeaders": { "api-key": "${apiKey}" }, "modelOptions": { "thinking": { "type": "enabled" } } },
      { "id": "mimo-v2.6-pro-ultraspeed", "name": "MiMo V2.6 Pro Ultraspeed", "url": "https://token-plan-cn.xiaomimimo.com/v1/chat/completions", "toolCalling": true, "vision": true, "maxInputTokens": 1000000, "maxOutputTokens": 128000, "requestHeaders": { "api-key": "${apiKey}" }, "modelOptions": { "thinking": { "type": "enabled" } } }
    ]
  },
  {
    "name": "Qwen",
    "vendor": "customendpoint",
    "apiKey": "${input:qwenApiKey}",
    "apiType": "chat-completions",
    "models": [
      { "id": "qwen-max", "name": "Qwen Max", "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", "toolCalling": true, "vision": false, "maxInputTokens": 32000, "maxOutputTokens": 8192 },
      { "id": "qwen-plus", "name": "Qwen Plus", "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", "toolCalling": true, "vision": false, "maxInputTokens": 131072, "maxOutputTokens": 8192 },
      { "id": "qwen-turbo", "name": "Qwen Turbo", "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", "toolCalling": true, "vision": false, "maxInputTokens": 131072, "maxOutputTokens": 8192 },
      { "id": "qwen-vl-max", "name": "Qwen VL Max", "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", "toolCalling": true, "vision": true, "maxInputTokens": 32000, "maxOutputTokens": 4096 },
      { "id": "qwen-vl-plus", "name": "Qwen VL Plus", "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", "toolCalling": true, "vision": true, "maxInputTokens": 131072, "maxOutputTokens": 4096 },
      { "id": "qwen-vl-turbo", "name": "Qwen VL Turbo", "url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", "toolCalling": true, "vision": true, "maxInputTokens": 131072, "maxOutputTokens": 4096 }
    ]
  }
]
```

Restart VS Code if the models do not appear in the picker.

## What this extension still adds

One-command key setup and presets (no JSON), images for models without native vision (vision proxy),
peak/off-peak pricing with CNY/USD cost and DeepSeek balance, status-bar token speed,
`${conversationId}` header templating, and per-provider `thinking` handling.
