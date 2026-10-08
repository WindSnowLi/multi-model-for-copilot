## Stabilize Tool List (Experimental)

First, open VS Code's Tools configuration and check how many tools are enabled for chat.

[Configure Tools](command:workbench.action.chat.configureTools)

- 64 or fewer enabled tools: there is usually no need to turn this on unless the tool list still changes across turns.
- Many enabled tools: disable the ones you rarely use first. Every enabled tool adds function definitions to each request, so the tool list is more likely to change across turns.

This setting may improve cache hits by making the DeepSeek API `tools` parameter more complete and stable across turns. It may also increase input tokens because more function definitions can be included in each request.

[Open DeepSeek setting](command:workbench.action.openSettings?%5B%22%40id%3Amulti-model-for-copilot.experimental.stabilizeToolList%22%5D)
