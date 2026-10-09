<h1 align="center">Multi-Model for Copilot Chat</h1>

<p align="center">
  <!-- marketplace-readme:remove-start -->
  <a href="https://marketplace.visualstudio.com/items?itemName=Vizards.multi-model-for-copilot"><img src="https://img.shields.io/badge/VS%20Code%20Marketplace-Install-007ACC?logo=visualstudiocode&logoColor=white&style=for-the-badge" alt="安装 VS Code Marketplace 版本"></a>
  <a href="https://open-vsx.org/extension/WindSnowLi/multi-model-for-copilot"><img src="https://img.shields.io/badge/Open%20VSX-Install-6A4FB6?style=for-the-badge" alt="安装 Open VSX 版本"></a>
  <br/>
  <!-- marketplace-readme:remove-end -->
  <img src="https://img.shields.io/github/v/release/WindSnowLi/multi-model-for-copilot?style=for-the-badge&label=Version" alt="Version" />
</p>

<p align="center">
  <a href="https://github.com/WindSnowLi/multi-model-for-copilot/blob/main/README.md">English</a> |
  简体中文
</p>

**在 GitHub Copilot Chat 的模型选择器里使用 DeepSeek、MiMo、千问预设 —— 使用你自己的 API Key。**

## 为什么用它

Copilot 内置的 Custom Endpoint 已能接入[任意端点](docs/official-byok.zh.md)；本扩展为 DeepSeek / MiMo / 千问补充官方没有的部分：

- 各服务商的鉴权与请求形态（MiMo 的 `api-key` 头、千问的 `reasoning_effort`、DeepSeek 的 `thinking` 开关）
- **不具备原生视觉**的模型也能传图：视觉代理先描述图片，再以文本转发
- 峰谷计价、人民币/美元成本展示、DeepSeek 实时余额
- 状态栏 token 速度与 `${conversationId}` 请求头模板

## 快速开始

`Ctrl+Shift+P` → `Multi-Model: 设置 API Key` → 在 Copilot Chat 中选择模型。

| 服务商 | 模型 | 鉴权 | Key |
|---|---|---|---|
| DeepSeek | V4.1 Flash（`deepseek-flash`）、V4 Pro | `Authorization: Bearer` | `sk-...` |
| 小米 MiMo | V2.6 Pro、V2.6 Flash、V2.6 Pro Ultraspeed | `api-key` | `tp-...` |
| 千问 | Max、Plus、Turbo、VL Max、VL Plus、VL Turbo | `Authorization: Bearer` | `sk-...` |
| 其他 | 任意 OpenAI 兼容端点 | — | 用 Copilot 内置的 **Custom Endpoint** |

上下文：DeepSeek 与 MiMo 为 1M（最大输出 384K / 128K），千问为 32K–131K。
DeepSeek V4 Pro 与纯文本千问模型通过视觉代理支持图片。
需要 VS Code 1.116+ 与 GitHub Copilot（Free / Pro / Enterprise）；BYOK 无需 Copilot 订阅。

## 命令

| 命令 | 说明 |
|---|---|
| `Multi-Model: 设置 API Key` | 设置 DeepSeek Key（另有 `设置 MiMo API Key`、`设置 Qwen API Key`） |
| `Multi-Model: 清除 API Key` | 移除 Key（同样有 MiMo / 千问版本） |
| `Multi-Model: 获取 API Key` | 打开 DeepSeek 密钥页面 |
| `Multi-Model: 配置视觉代理` | 选择用于描述图片的模型 |
| `Multi-Model: 刷新余额` | 刷新 DeepSeek 余额 |
| `Multi-Model: 显示日志` | 打开诊断日志 |
| `Multi-Model: 打开设置` | 打开本扩展设置 |

## 设置项

| 设置 | 默认值 | 说明 |
|---|---|---|
| `requestHeaders` | `{}` | 额外请求头，支持 `${conversationId}`（[文档](docs/settings/request-headers.zh.md)） |
| `maxTokens` | `0` | 全局最大输出（0 = 由服务商决定） |
| `debugMode` | `minimal` | 诊断级别：`minimal` 或 `metadata` |
| `visionModel` | 自动 | 视觉代理使用的模型 |
| `visionPrompt` | 内置 | 视觉代理使用的提示词 |
| `statusBar.balance` | `true` | 状态栏显示 DeepSeek 余额 |
| `statusBar.tokenSpeed` | `true` | 状态栏显示 token 速度 |
| `showPricingNotice` | `true` | 选择器中显示峰谷计费提示 |
| `experimental.stabilizeToolList` | `false` | 预激活工具以获得更稳定的 `tools` 数组（[说明](docs/notices/tool-drift.zh.md)） |

## 许可证

[MIT](LICENSE)
