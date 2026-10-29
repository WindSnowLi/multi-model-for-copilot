# Tool search (`toolSearch.*`)

A chat with many enabled tools cannot hand all of them to the model: Copilot caps the tool list (the **The model only supports 128 tools** warning) and every function definition still costs input tokens. Tool search sends only the tools that matter for the current conversation plus one search entry point, `multi_model_tool_search`. When the model needs anything else it searches, reads the returned schema, and calls the tool directly.

## Settings

| Setting | Default | Description |
|---|---|---|
| `toolSearch.mode` | `auto` | `auto` narrows the list once more tools are enabled than `toolSearch.maxTools`; `off` always sends every enabled tool |
| `toolSearch.maxTools` | `24` | Tools kept in one request; the search entry point does not count towards this limit |

## Behaviour

- Tools whose names or descriptions match the recent user messages are kept first; the remaining slots are filled in host order so consecutive turns stay close to each other and the prompt prefix stays cacheable.
- Tools returned by an earlier `multi_model_tool_search` call are sent again for the rest of the conversation.
- Tools the host trimmed from the prompt but that are still registered in VS Code remain searchable and callable.
- When `experimental.stabilizeToolList` is also enabled, requests handled by tool search skip pre-activation: expanding every `activate_*` group would only inflate the list again.

## Limits

- The host's own tool cap (for example the 128 tools mentioned by **Configure Tools**) is controlled by Copilot and cannot be raised by this extension. Keeping the request well below it means no tool is ever dropped.
- The search entry point stays available even when the host trimmed it from the tool list, as long as the extension registered it. Turning `toolSearch.mode` to `off` is the supported way to send all tools again.
