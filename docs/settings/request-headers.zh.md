# 自定义请求头

`multi-model-for-copilot.requestHeaders` 用于为发送到已配置的服务商基础 URL（`multi-model-for-copilot.baseUrl`、`multi-model-for-copilot.mimoBaseUrl`、`multi-model-for-copilot.qwenBaseUrl`）的聊天补全请求添加或覆盖请求头，默认值为 `{}`。

## 配置方式

在 VS Code 原生 Settings 编辑器中添加请求头名称和字符串值，或编辑 `settings.json`。

以 OpenAI 兼容网关为例：

```json
{
  "multi-model-for-copilot.baseUrl": "https://gateway.example.com/v1",
  "multi-model-for-copilot.requestHeaders": {
    "User-Agent": "multi-model-for-copilot",
    "x-session-id": "${conversationId}"
  }
}
```

- 请求头名称不区分大小写，配置值会覆盖已有值，包括 `Authorization` 和 `Content-Type`。
- 所有服务商（DeepSeek、MiMo、千问）都会应用这些请求头。
- 扩展默认不额外添加 `User-Agent`，有需要时可在此配置。
- 请求头的值保存在 VS Code 设置中。

## 变量

可以在请求头值的任意位置使用 `${变量名}`。每个变量在同一次 Provider 调用内只解析一次，所有变量替换和 HTTP 请求尝试均复用该值。未知占位符保持原样。

| 变量 | 取值 | 缺失时的兜底顺序 |
|---|---|---|
| `${conversationId}` | 上游提供的对话 ID | 工作区 ID（`workspace-<workspaceId>`）→ Copilot 请求 ID（`request-<requestId>`）→ 新生成的 UUID（`request-<uuid>`） |
