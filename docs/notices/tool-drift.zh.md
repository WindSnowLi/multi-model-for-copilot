# 工具列表不稳定

本轮对话的 Tools 列表与上一轮不一致。`experimental.stabilizeToolList` 会预激活 VS Code 的 `activate_*` 工具，让 DeepSeek 的 `tools` 数组跨轮次稳定（缓存命中更好），但每次请求包含更多函数定义、input tokens 可能增加；工具数少于约 64 时通常无需开启。

1. 运行 `workbench.action.chat.configureTools`，关闭不用的工具。
2. 关闭该设置。
3. 或接受较低的缓存命中率。

讨论：[issue #56](https://github.com/WindSnowLi/multi-model-for-copilot/issues/56)。
