<h1 align="center">Multi-Model for Copilot Chat</h1>

<p align="center">
  <!-- marketplace-readme:remove-start -->
  <a href="https://marketplace.visualstudio.com/items?itemName=Vizards.multi-model-for-copilot"><img src="https://img.shields.io/badge/VS%20Code%20Marketplace-Install-007ACC?logo=visualstudiocode&logoColor=white&style=for-the-badge" alt="从 VS Code Marketplace 安装"></a>
  <a href="https://open-vsx.org/extension/WindSnowLi/multi-model-for-copilot"><img src="https://img.shields.io/badge/Open%20VSX-Install-6A4FB6?style=for-the-badge" alt="从 Open VSX 安装"></a>
  <br/>
  <!-- marketplace-readme:remove-end -->
  <img src="https://img.shields.io/github/v/release/WindSnowLi/multi-model-for-copilot?style=for-the-badge&label=Version" alt="版本" />
  <img src="https://vsmarketplacebadges.dev/installs-short/Vizards.multi-model-for-copilot.svg?style=for-the-badge" alt="安装量" />
</p>

<p align="center">
  <a href="https://github.com/WindSnowLi/multi-model-for-copilot/blob/main/README.md">English</a> |
  简体中文
</p>

**将 DeepSeek、MiMo 及任意 OpenAI 兼容模型接入 GitHub Copilot Chat —— 支持视觉、思考模式、Agent 工具，使用你自己的 API Key。**

<p align="center">
  <img src="resources/screenshots/01-picker.png" alt="DeepSeek V4 Pro 和 Flash 出现在 Copilot Chat 模型选择器中，带有可按模型独立设置的思考深度下拉菜单（停用 / 标准 / 深度）" width="800">
</p>

喜欢 DeepSeek 和 MiMo 的性价比，但不想放弃 GitHub Copilot 的 Agent 模式、工具调用和成熟的交互体验？本扩展将 **DeepSeek V4** 和 **MiMo V2.5** 直接接入 Copilot Chat 模型选择器，并支持**任意 OpenAI 兼容端点**。

## 为什么选这个扩展？

- **不是替换 Copilot，而是增强它。** 没有新的侧边栏，没有新的聊天界面。只是在模型选择器中多了更多选项。
- **Agent 模式、工具调用、Instructions、MCP、Skills——全部正常运作。** Copilot 的完整能力栈，现在可以跑在 DeepSeek、MiMo 或任意自定义模型上。
- **视觉支持。** MiMo V2.5 原生支持图片输入；DeepSeek V4 通过视觉代理间接支持。
- **模型发现。** 一键从任意 `/v1/models` 端点发现并添加可用模型。
- **BYOK。** 你的 API Key，你的账单。存储在 OS 钥匙串中。
- **需自行提供 API Key，直接向 DeepSeek 付费。** 你的 API Key，你的账单，你的速率限制。密钥存储在操作系统密钥链中，不会以明文形式写入磁盘。

## 功能特性

### DeepSeek V4 Pro & Flash 出现在模型选择器中
两个模型与 GPT-4o、Claude 等并列在 Copilot Chat 的模型选择器中。均支持 1M Token 上下文。可在对话中途切换模型，不丢失聊天历史。

### 透明视觉代理
DeepSeek V4 是纯文本模型。将截图拖入聊天，本扩展会自动将图片交给你已安装的其他 Copilot 模型（Claude、GPT-4o 等）进行描述，再将描述结果反馈给 DeepSeek。**零配置**——只需选择一次你偏好的视觉代理模型即可。

此代理为兼容性桥接方案；如果 DeepSeek 后续支持原生视觉能力，本扩展将向更统一的视觉路径迁移。

<p align="center">
  <img src="resources/screenshots/03-vision.png" alt="将图片拖入 Copilot Chat，DeepSeek 通过视觉代理响应" width="800">
</p>

### 思考模式与推理深度控制
完整支持 DeepSeek V4 的 `reasoning_content`。通过 Copilot Chat 模型选择器的菜单选择 `停用`、`标准`（均衡，默认）或 `深度`（适用于复杂 Agent 任务）。

### 继承全部 Copilot 能力
由于本扩展接入的是 Copilot 的原生 provider API，你免费获得完整能力栈：
- **Agent 模式**——自主执行多步骤任务
- **工具调用**——文件编辑、终端操作、工作区搜索、Git、测试
- **Instructions & Skills**——你的 `.instructions.md`、`AGENTS.md` 和各项 Skills 开箱即用
- **Prompt 缓存统计**——在输出通道中记录 DeepSeek 缓存命中率，直观看到成本节省

<p align="center">
  <img src="resources/screenshots/04-agent.png" alt="DeepSeek V4 Pro 运行 Copilot 的 Agent 模式，执行工具调用" width="800">
</p>

### 安全优先
API Key 存储在 VS Code 的 `SecretStorage` 中（macOS 钥匙串 / Windows 凭据管理器 / Linux 密钥环）。绝不会出现在 `settings.json` 中，也不会被提交到 Git 历史。

### 零运行时依赖
纯 VS Code API + Node.js 内置模块。无需 Python、Docker 或本地代理进程。

## 快速开始

### 前置条件

- **VS Code 1.116+** 及 **GitHub Copilot** 订阅（Free / Pro / Enterprise）
- 至少一个提供商的 API Key：
  - DeepSeek：[platform.deepseek.com](https://platform.deepseek.com)（`sk-...`）
  - MiMo：[platform.xiaomimimo.com](https://platform.xiaomimimo.com)（`tp-...`）
  - 任意 OpenAI 兼容端点

### 安装方式

1. **VS Code** — 从 [Marketplace](https://marketplace.visualstudio.com/items?itemName=Vizards.multi-model-for-copilot) 安装
2. **其他编辑器** — 从 [Open VSX](https://open-vsx.org/extension/WindSnowLi/multi-model-for-copilot) 安装

### 快速上手

```
Ctrl+Shift+P → Multi-Model: 设置 API Key → 粘贴 Key → 在 Copilot Chat 选择模型
```

MiMo：`Multi-Model: 设置 MiMo API Key` → 粘贴 `tp-...` Key。

自定义模型：`Multi-Model: 发现可用模型` → 选择端点 → 选择模型。

## 模型

| 模型 | 提供商 | 上下文 | 最大输出 | 视觉 | 思考 | 工具 |
|---|---|---|---|---|---|---|
| **DeepSeek V4 Flash** | DeepSeek | 1M | 384K | 代理 | 支持 | 128 |
| **DeepSeek V4 Pro** | DeepSeek | 1M | 384K | 代理 | 支持 | 128 |
| **MiMo V2.5** | 小米 MiMo | 1M | 128K | 原生 | 支持 | 支持 |
| **MiMo V2.5 Pro** | 小米 MiMo | 1M | 128K | 不支持 | 支持 | 支持 |

## 自定义模型

通过 `settings.json` 添加任意 OpenAI 兼容模型：

```json
{
  "multi-model-for-copilot.customModels": [
    {
      "id": "gpt-4o",
      "name": "GPT-4o（自定义）",
      "baseUrl": "https://api.openai.com/v1",
      "modelId": "gpt-4o",
      "toolCalling": true,
      "imageInput": true,
      "useMaxCompletionTokens": true
    }
  ]
}
```

| 字段 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| `id` | 是 | — | 唯一标识符 |
| `name` | 是 | — | 显示名称 |
| `baseUrl` | 是 | — | API 端点 |
| `modelId` | 是 | — | 请求体中的模型 ID |
| `authHeader` | 否 | `Authorization` | 认证头名称 |
| `authPrefix` | 否 | `Bearer ` | Key 前缀 |
| `maxInputTokens` | 否 | 128000 | 最大输入 |
| `maxOutputTokens` | 否 | 8192 | 最大输出 |
| `toolCalling` | 否 | false | 工具调用 |
| `imageInput` | 否 | false | 原生图片 |
| `thinking` | 否 | false | 思考模式 |
| `useMaxCompletionTokens` | 否 | false | 使用 `max_completion_tokens` |

## 命令

| 命令 | 说明 |
|---|---|
| `Multi-Model: 设置 API Key` | 设置 DeepSeek Key |
| `Multi-Model: 设置 MiMo API Key` | 设置 MiMo Key |
| `Multi-Model: 清除 API Key` | 移除 DeepSeek Key |
| `Multi-Model: 清除 MiMo API Key` | 移除 MiMo Key |
| `Multi-Model: 发现可用模型` | 自动发现模型 |
| `Multi-Model: 添加自定义模型` | 手动添加 |
| `Multi-Model: 移除自定义模型` | 移除自定义模型 |
| `Multi-Model: 配置视觉代理` | 配置图片代理 |
| `Multi-Model: 打开设置` | 打开设置 |
| `Multi-Model: 显示日志` | 显示日志 |

## 设置项

| 设置项 | 默认值 | 说明 |
|---|---|---|
| `baseUrl` | `https://api.deepseek.com` | DeepSeek API 端点 |
| `mimoBaseUrl` | `https://token-plan-cn.xiaomimimo.com/v1` | MiMo API 端点 |
| `maxTokens` | `0` | 全局最大输出（0 = 不限制） |
| `customModels` | `[]` | 自定义模型定义 |
| `modelIdOverrides` | 官方 ID | 覆盖内置模型 ID |
| `debugMode` | `minimal` | 诊断级别 |
| `visionModel` | 自动 | 视觉代理模型 |
| `visionPrompt` | 内置 | 图片描述提示词 |

## 方案对比

| 特性 | 本扩展 | 本地代理 | 独立扩展 |
|---|---|---|---|
| 在 Copilot Chat 中 | ✅ | ✅ | ❌ |
| 多提供商 | ✅ | ✅ | ❌ |
| 自定义模型 | ✅ | ✅ | ❌ |
| 模型发现 | ✅ | ❌ | ❌ |
| 原生视觉 | ✅ | ❌ | ❌ |
| 无需额外进程 | ✅ | ❌ | ✅ |
| 一键安装 | ✅ | ❌ | ✅ |
| Key 存钥匙串 | ✅ | ❌ | ⚠️ |

## 许可证

[MIT](LICENSE)
