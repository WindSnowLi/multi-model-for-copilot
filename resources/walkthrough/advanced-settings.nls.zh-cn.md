## 稳定工具列表（实验性）

先[配置 Tools](command:workbench.action.chat.configureTools)，查看聊天启用了多少工具。64 个以内通常无需开启；工具较多时建议先禁用不常用的。

开启后扩展会预激活工具，让 DeepSeek 的 `tools` 数组跨轮次保持稳定（缓存命中更好），代价是每次请求的 input tokens 增加。

[打开设置](command:workbench.action.openSettings?%5B%22%40id%3Amulti-model-for-copilot.experimental.stabilizeToolList%22%5D)

## 工具搜索

已启用工具较多时，聊天宿主会在请求到达模型前截断工具列表。工具搜索只发送与当前对话相关的工具，外加一个 `multi_model_tool_search` 搜索入口；模型需要其他工具时自行搜索。

[打开设置](command:workbench.action.openSettings?%5B%22%40id%3Amulti-model-for-copilot.toolSearch.mode%22%5D)
