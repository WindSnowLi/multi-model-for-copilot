## 稳定工具列表（实验性）

先打开 VS Code 的 Tools 配置，查看当前聊天启用了多少个工具。

[配置 Tools](command:workbench.action.chat.configureTools)

- 64 个或更少已启用工具：通常无需开启，除非工具列表仍在跨轮次变化。
- 已启用工具较多时：建议先禁用不常用的工具。每个已启用工具都会为每次请求增加函数定义，工具列表也更容易跨轮次变化。

这个设置可能通过让 DeepSeek API 的 `tools` 参数在多轮对话中更完整、更稳定来提高缓存命中率。代价是每次请求可能包含更多函数工具定义，因此 input tokens 可能增加。

[打开插件设置](command:workbench.action.openSettings?%5B%22%40id%3Amulti-model-for-copilot.experimental.stabilizeToolList%22%5D)
