# 自定义请求头

`multi-model-for-copilot.requestHeaders` 会为发往官方 DeepSeek / MiMo / 千问端点的每次聊天补全请求
添加或覆盖请求头。默认值：`{}`。

```json
{
  "multi-model-for-copilot.requestHeaders": {
    "User-Agent": "multi-model-for-copilot",
    "x-session-id": "${conversationId}"
  }
}
```

- 请求头名称不区分大小写；配置值会覆盖已有值，包括 `Authorization` 与 `Content-Type`。扩展默认不
  发送自定义 `User-Agent`。
- `${name}` 占位符每次请求解析一次；未知占位符原样保留。

| 变量 | 取值 | 回退顺序 |
|---|---|---|
| `${conversationId}` | 上游会话 ID | 工作区 ID（`workspace-<id>`）→ Copilot 请求 ID（`request-<id>`）→ 随机 UUID |
