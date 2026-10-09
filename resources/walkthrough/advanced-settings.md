## Stabilize tool list (experimental)

[Configure Tools](command:workbench.action.chat.configureTools) first and check how many chat tools are enabled. With 64 or fewer there is usually no need to enable this; with many tools, disable the ones you rarely use.

The setting pre-activates tools so DeepSeek's `tools` array stays stable across turns (better cache hits), at the cost of more input tokens per request.

[Open setting](command:workbench.action.openSettings?%5B%22%40id%3Amulti-model-for-copilot.experimental.stabilizeToolList%22%5D)
