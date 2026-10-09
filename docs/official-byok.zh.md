# 用 Copilot 内置的 BYOK 替代本扩展

VS Code 内置的 **GitHub Copilot Chat** 不装任何扩展也能接入你自己的模型：

1. 打开语言模型编辑器 —— 模型选择器里的 **管理语言模型**（齿轮图标），或命令 `Chat: Manage Language Models`。
2. **Add Models** → **Custom Endpoint**。
3. 填入 API Key 和分组名后，VS Code 会打开 `chatLanguageModels.json` 让你补全并保存。

VS Code 会用 `vscode://schemas/language-models` 校验该文件，API Key 存入密钥存储；按官方文档，
**BYOK 模型无需登录 GitHub 账号、也无需 Copilot 订阅**。

官方参考：<https://code.visualstudio.com/docs/agent-customization/language-models>

## 文件位置

| 平台 | 路径 |
|---|---|
| Windows | `%APPDATA%\Code\User\chatLanguageModels.json` |
| macOS | `~/Library/Application Support/Code/User/chatLanguageModels.json` |
| Linux | `~/.config/Code/User/chatLanguageModels.json` |
| 任意 Profile | `<用户目录>/profiles/<profile 名称>/chatLanguageModels.json` |

## 可直接复制的模板

以下配置对应本扩展内置的预设，包含扩展平时替你处理的鉴权细节：

- `url` 必须是**完整端点**（仅当 URL 不含 API 路径时，VS Code 才自动补 `/v1/<path>`）。
- 三家的 `apiType` 都是 `chat-completions`。
- **MiMo** 使用 `api-key` 头而非 `Authorization`，而 `requestHeaders` 是**模型级**属性 —— 所以下面每个 MiMo 模型都要写一遍。
- Key 用 `${input:...}`，由 VS Code 弹窗询问并安全保存，避免写进仓库。
- `modelOptions` 是可选字段；这里用于让 DeepSeek/MiMo 返回思考内容（`thinking: { "type": "enabled" }`，与本扩展发送的参数一致）。

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

如果模型没有出现在选择器里，重启一次 VS Code。

## 本扩展额外提供什么

官方 Custom Endpoint 已经覆盖了"接入模型"这件事，下面这些能力仍需要本扩展。本扩展刻意不再自带
自定义端点编辑器 —— 没有预置的端点请使用上面的官方 provider。

| 能力 | 本扩展 |
|---|---|
| 每个 provider 一条命令设置 Key + 内置预设，无需手写 JSON | ✅ |
| **不具备原生视觉**的模型也能传图 —— 由视觉代理描述后以文本转发（如 DeepSeek V4 Pro） | ✅ |
| 峰谷计价、人民币/美元成本展示、DeepSeek 实时余额 | ✅ |
| 状态栏实时 token 生成速度 | ✅ |
| 请求头 `${conversationId}` 模板 | ✅ |
| 按 provider 正确映射 `thinking` 参数（例如 MiMo 接口拒绝 `reasoning_effort: max`） | ✅ |
| 请求/响应诊断（`Multi-Model: Show Logs`） | ✅ |
