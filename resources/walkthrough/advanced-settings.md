## Stabilize tool list (experimental)

[Configure Tools](command:workbench.action.chat.configureTools) first and check how many chat tools are enabled. With 64 or fewer there is usually no need to enable this; with many tools, disable the ones you rarely use.

The setting pre-activates tools so DeepSeek's `tools` array stays stable across turns (better cache hits), at the cost of more input tokens per request.

[Open setting](command:workbench.action.openSettings?%5B%22%40id%3Amulti-model-for-copilot.experimental.stabilizeToolList%22%5D)

## Tool search

With many enabled tools the chat host trims the tool list before the request reaches the model. Tool search instead sends only the tools that matter for the current conversation plus one `multi_model_tool_search` entry point; the model searches for anything else.

[Open setting](command:workbench.action.openSettings?%5B%22%40id%3Amulti-model-for-copilot.toolSearch.mode%22%5D)
