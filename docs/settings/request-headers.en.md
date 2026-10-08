# Request Headers

`multi-model-for-copilot.requestHeaders` adds or overrides headers for chat completion requests sent to the configured provider base URLs (`multi-model-for-copilot.baseUrl`, `multi-model-for-copilot.mimoBaseUrl`, `multi-model-for-copilot.qwenBaseUrl`, and any custom model endpoint). Its default value is `{}`.

## Configuration

Add header names and string values in the native VS Code Settings editor, or edit `settings.json`.

Example configuration for an OpenAI-compatible gateway:

```json
{
  "multi-model-for-copilot.baseUrl": "https://gateway.example.com/v1",
  "multi-model-for-copilot.requestHeaders": {
    "User-Agent": "multi-model-for-copilot",
    "x-session-id": "${conversationId}"
  }
}
```

- Header names are case-insensitive. Configured values override existing headers, including `Authorization` and `Content-Type`.
- The same headers are applied to every provider (DeepSeek, MiMo, Qwen and custom models).
- The extension adds no custom `User-Agent` by default; you can set one here if needed.
- Header values are stored in VS Code settings.

## Variables

Use `${name}` anywhere in a header value. Each variable is resolved once per provider call and reused for all occurrences and HTTP attempts. Unknown placeholders are passed through unchanged.

| Variable | Value | Fallback order |
|---|---|---|
| `${conversationId}` | Upstream conversation ID | Workspace ID (`workspace-<workspaceId>`) → Copilot request ID (`request-<requestId>`) → generated UUID (`request-<uuid>`) |
