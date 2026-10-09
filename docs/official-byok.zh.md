# 用 Copilot 内置的 BYOK 替代本扩展

VS Code 内置的 Copilot Chat 不装扩展也能接入自己的模型：**管理语言模型**（模型选择器里的齿轮图标）→
**Add Models** → **Custom Endpoint**。随后 VS Code 会打开 `chatLanguageModels.json`，用
`vscode://schemas/language-models` 校验，并把 API Key 存入密钥存储。按官方文档，BYOK 无需登录 GitHub
账号、也无需 Copilot 订阅。参考：<https://code.visualstudio.com/docs/agent-customization/language-models>

文件位置：Windows 为 `%APPDATA%\Code\User\chatLanguageModels.json`，macOS 为
`~/Library/Application Support/Code/User/chatLanguageModels.json`，Linux 为
`~/.config/Code/User/chatLanguageModels.json`，Profile 为 `<用户目录>/profiles/<profile>/`。

## 配置模板

对应本扩展的内置预设。注意：`url` 是完整端点；`apiType` 为 `chat-completions`；MiMo 用**模型级**
的 `api-key` 头（`requestHeaders`）；Key 用 `${input:...}`；`modelOptions` 让 DeepSeek/MiMo 返回思考内容。

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

若模型没有出现在选择器中，重启 VS Code。

## 本扩展仍然提供

一条命令配置 Key 与内置预设（无需写 JSON）、非原生视觉模型的图片支持（视觉代理）、峰谷计价与
人民币/美元成本及 DeepSeek 余额、状态栏 token 速度、`${conversationId}` 请求头模板，以及按服务商
正确处理 `thinking` 参数。
