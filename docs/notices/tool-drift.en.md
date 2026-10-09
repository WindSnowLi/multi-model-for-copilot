# Unstable tools list

The chat's Tools list changed between turns. `experimental.stabilizeToolList` pre-activates VS Code `activate_*` tools so DeepSeek's `tools` array stays stable (better cache hits), but each request then carries more function definitions and can cost more input tokens; below ~64 tools it is usually unnecessary.

1. Run `workbench.action.chat.configureTools` and disable unused tools.
2. Turn the setting off.
3. Or accept a lower cache hit rate.

Discussion: [issue #56](https://github.com/WindSnowLi/multi-model-for-copilot/issues/56).
