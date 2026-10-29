# Unstable tools list

The chat's Tools list changed between turns. `experimental.stabilizeToolList` pre-activates VS Code `activate_*` tools so DeepSeek's `tools` array stays stable (better cache hits), but each request then carries more function definitions and can cost more input tokens; below ~64 tools it is usually unnecessary.

1. Run `workbench.action.chat.configureTools` and disable unused tools.
2. Turn the setting off.
3. Or accept a lower cache hit rate.

Many enabled tools also hit the host's own tool cap (for example the "The model only supports 128 tools" warning). [Tool search](https://github.com/WindSnowLi/multi-model-for-copilot/blob/main/docs/settings/tool-search.en.md) sends only the relevant tools plus one search entry point instead, and skips pre-activation.

Discussion: [issue #56](https://github.com/WindSnowLi/multi-model-for-copilot/issues/56).
