# Request headers

`multi-model-for-copilot.requestHeaders` adds or overrides headers on every chat completion request
sent to the official DeepSeek / MiMo / Qwen endpoints. Default: `{}`.

```json
{
  "multi-model-for-copilot.requestHeaders": {
    "User-Agent": "multi-model-for-copilot",
    "x-session-id": "${conversationId}"
  }
}
```

- Header names are case-insensitive; configured values override existing headers, including
  `Authorization` and `Content-Type`. The extension sends no custom `User-Agent` by default.
- `${name}` placeholders are resolved once per request. Unknown placeholders pass through unchanged.

| Variable | Value | Fallback order |
|---|---|---|
| `${conversationId}` | Upstream conversation ID | Workspace ID (`workspace-<id>`) → Copilot request ID (`request-<id>`) → generated UUID |
