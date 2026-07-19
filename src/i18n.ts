import vscode from 'vscode';

/**
 * Lightweight i18n module — zero dependencies, follows VS Code display language.
 *
 *  - en / en-US / en-*      → English (default)
 *  - zh-cn                  → Simplified Chinese
 *  - all other locales      → English until translated
 */

function isZh(): boolean {
	const lang = vscode.env.language.toLowerCase();
	return lang === 'zh-cn';
}

// ---- Translation dictionaries ----

type Translations = Record<string, string>;

const zh: Translations = {
	// Model descriptions
	'model.deepseek.flash.detail': '快速高效',
	'model.deepseek.pro.detail': '深度推理',
	'model.deepseek.flash.tooltip': '快速高效的 DeepSeek V4 模型，推理能力接近 V4 Pro，API 定价更经济。',
	'model.deepseek.pro.tooltip': 'DeepSeek V4 模型，面向 Agent 编程、广泛世界知识和高阶推理任务。',

	// MiMo model descriptions
	'model.mimo.pro.detail': '旗舰推理模型，支持深度思考',
	'model.mimo.standard.detail': '全模态理解模型，支持视觉与思考',
	'model.mimo.pro.tooltip': 'MiMo V2.5 Pro 旗舰模型，专为复杂推理、深度分析和长文档处理设计。',
	'model.mimo.standard.tooltip': 'MiMo V2.5 全模态模型，支持图片、音频、视频内容理解，同时具备深度思考能力。',

	// Qwen model descriptions
	'model.qwen.max.detail': '旗舰模型，最强大的能力',
	'model.qwen.plus.detail': '高性价比模型',
	'model.qwen.turbo.detail': '快速响应模型',
	'model.qwen.vl.max.detail': '视觉理解旗舰模型',
	'model.qwen.vl.plus.detail': '高性价比视觉模型',
	'model.qwen.vl.turbo.detail': '快速视觉模型',
	'model.qwen.max.tooltip': '千问 AI 平台旗舰模型，具备最强推理能力和知识储备。',
	'model.qwen.plus.tooltip': '千问 AI 平台高性价比模型，平衡性能与成本。',
	'model.qwen.turbo.tooltip': '千问 AI 平台快速响应模型，适合简单任务和高并发场景。',
	'model.qwen.vl.max.tooltip': '千问 AI 平台视觉理解旗舰模型，支持图片、视频内容理解。',
	'model.qwen.vl.plus.tooltip': '千问 AI 平台高性价比视觉模型，支持图片理解。',
	'model.qwen.vl.turbo.tooltip': '千问 AI 平台快速视觉模型，适合简单图像识别任务。',

	// API Key
	'auth.apiKeyRequiredDetail': '请先配置 API Key',
	'auth.prompt': '请输入 DeepSeek API Key 或兼容服务令牌。官方 DeepSeek Key 通常以 "sk-" 开头。',
	'auth.placeholder': 'sk-... 或服务商令牌',
	'auth.mimoPrompt': '请输入 MiMo Token Plan API Key。官方 MiMo Key 格式为 "tp-xxxxx"。',
	'auth.mimoPlaceholder': 'tp-...',
	'auth.qwenPrompt': '请输入千问 AI 平台 API Key。官方千问 Key 通常以 "sk-" 开头。',
	'auth.qwenPlaceholder': 'sk-...',
	'auth.emptyValidation': 'API Key 不能为空',
	'auth.saved': 'API Key 已安全保存。',
	'auth.removed': 'API Key 已移除。',
	'auth.notConfigured': 'API Key 未配置，请在命令面板运行 "Multi-Model: 设置 API Key"。',
	'auth.notConfiguredForModel': '模型 "{0}" 的 API Key 未配置，请在命令面板运行 "Multi-Model: 设置 API Key"。',

	// Custom Model
	'customModel.prompt.id': '输入模型唯一标识（英文、数字、连字符）',
	'customModel.prompt.name': '输入模型显示名称',
	'customModel.prompt.baseUrl': '输入 API Base URL（OpenAI 兼容格式）',
	'customModel.prompt.modelId': '输入 API 请求中的模型 ID',
	'customModel.prompt.toolCalling': '是否支持工具调用（function calling）',
	'customModel.prompt.imageInput': '是否支持图片输入',
	'customModel.prompt.thinking': '是否支持思考/推理模式',
	'customModel.prompt.apiKey': '输入该模型的 API Key（可跳过）',
	'customModel.prompt.remove': '选择要移除的自定义模型',
	'customModel.toolCalling.true': '支持工具调用',
	'customModel.toolCalling.false': '不支持',
	'customModel.imageInput.true': '支持图片',
	'customModel.imageInput.false': '不支持',
	'customModel.thinking.true': '支持思考模式',
	'customModel.thinking.false': '不支持',
	'customModel.added': '自定义模型 "{0}" 已添加。',
	'customModel.removed': '自定义模型 "{0}" 已移除。',
	'customModel.none': '暂无自定义模型。',
	'customModel.error.duplicateId': '模型 ID "{0}" 已存在，请使用不同的 ID。',

	// Discover Models
	'customModel.discover.pickSource': '选择模型发现来源',
	'customModel.discover.customUrl': '自定义 API 端点',
	'customModel.discover.enterUrl': '输入 API Base URL（OpenAI 兼容格式）',
	'customModel.discover.enterKey': '输入该端点的 API Key',
	'customModel.discover.noKey': '请先配置 {0} 的 API Key。',
	'customModel.discover.failed': '模型发现失败：{0}',
	'customModel.discover.empty': '未发现任何可用模型。',
	'customModel.discover.allExist': '所有发现的模型已存在。',
	'customModel.discover.selectModels': '选择要添加的模型（可多选）',
	'customModel.discover.added': '已添加 {0} 个模型。',

	// Thinking Effort — short labels for model picker dropdown
	'status.thinking': '思考模式',
	'thinking.none': '停用',
	'thinking.none.desc': '停用思考，响应更快',
	'thinking.high': '标准',
	'thinking.high.desc': '推荐日常使用',
	'thinking.max': '深度',
	'thinking.max.desc': '深度推理，适合复杂任务',

	// Vision
	'vision.proxyUsing': '视觉代理：{0}',
	'vision.notFound': '未找到视觉模型 "{0}"',
	'vision.unavailable': '无可用视觉模型，图片已忽略。',
	'vision.proxyError': '视觉代理异常：',
	'vision.action.configureProxy': '配置视觉代理',
	'vision.panel.title': '多模型视觉代理',
	'vision.panel.description':
		'配置一个支持图片输入的模型，用来先把图片转换成文字描述，再把描述随消息发送给目标模型。图片本身不会发送给目标模型。',
	'vision.panel.source.vscodeLm': 'VS Code 模型',
	'vision.panel.source.apiEndpoint': 'API 端点',
	'vision.panel.field.source': '视觉代理来源',
	'vision.panel.field.visionModel': '视觉模型',
	'vision.panel.field.endpointType': '端点类型',
	'vision.panel.field.endpointUrl': '端点 URL',
	'vision.panel.field.apiKey': 'API Key',
	'vision.panel.field.modelId': '模型 ID',
	'vision.panel.field.customHeaders': '自定义 headers JSON',
	'vision.panel.field.extraBody': '额外请求体 JSON',
	'vision.panel.hint.customHeaders':
		'Header 会随配置保存。建议尽量把服务商 token 放在 API Key 输入框中。',
	'vision.panel.hint.extraBody': '会合并进请求体，不能覆盖 model、messages、input 或 stream。',
	'vision.panel.placeholder.openaiEndpoint': 'https://api.example.com/v1/chat/completions',
	'vision.panel.placeholder.openaiResponsesEndpoint': 'https://api.example.com/v1/responses',
	'vision.panel.placeholder.anthropicEndpoint': 'https://api.example.com/v1/messages',
	'vision.panel.placeholder.endpointType': '选择端点类型',
	'vision.panel.placeholder.enterApiKey': '输入 API Key',
	'vision.panel.endpointType.openaiChatCompletions': 'OpenAI 兼容 Chat Completions',
	'vision.panel.endpointType.openaiResponses': 'OpenAI 兼容 Responses',
	'vision.panel.endpointType.anthropicMessages': 'Anthropic 兼容 Messages',
	'vision.panel.hint.endpointTypeEmpty': '输入端点 URL 后会尝试自动识别端点类型。',
	'vision.panel.hint.endpointTypeInferred': '已根据 URL 自动识别为 {0}。',
	'vision.panel.hint.endpointTypeManual': '无法根据 URL 自动识别，请手动选择端点类型。',
	'vision.panel.hint.endpointTypeSelected': '使用手动选择的端点类型：{0}。',
	'vision.panel.hint.apiKeySet': '已保存 API Key。输入新 key 可替换当前 key。',
	'vision.panel.hint.apiKeyUnset': 'API Key 将保存在 VS Code SecretStorage 中。',
	'vision.panel.cost.tokenCost': '费用：{0} credits / 100 万 tokens',
	'vision.panel.cost.longContextTokenCost': '长上下文：{0} credits / 100 万 tokens',
	'vision.panel.cost.input': '输入 {0}',
	'vision.panel.cost.cachedInput': '缓存输入 {0}',
	'vision.panel.cost.output': '输出 {0}',
	'vision.panel.cost.pricing': '费用：{0}',
	'vision.panel.cost.category.low': '低费用',
	'vision.panel.cost.category.medium': '中等费用',
	'vision.panel.cost.category.high': '高费用',
	'vision.panel.cost.category.veryHigh': '很高费用',
	'vision.panel.cost.category.named': '{0} 费用',
	'vision.panel.status.vscodeLmSelected': '已选择 VS Code 语言模型。',
	'vision.panel.status.apiKeySet': '已设置 API Key。',
	'vision.panel.status.apiKeyNotSet': '未设置 API Key。',
	'vision.panel.status.testing': '正在测试视觉代理...',
	'vision.panel.status.vscodeLmNoHttpTest': 'VS Code 语言模型无需 HTTP 测试。',
	'vision.panel.status.testSucceeded': '已收到视觉代理响应，请查看下方样例。',
	'vision.panel.status.vscodeLmSaved': 'VS Code 语言模型已启用。',
	'vision.panel.status.endpointSavedWithKey': 'API 端点和 API Key 已保存，并已启用 API 端点。',
	'vision.panel.status.endpointSaved': 'API 端点已保存，并已启用 API 端点。',
	'vision.panel.status.apiKeyCleared': '已清除保存的 API Key。',
	'vision.panel.summary.noVSCodeVision.title': '当前：没有 VS Code 视觉模型',
	'vision.panel.summary.noVSCodeVision.detail': '请配置 API 端点，或安装支持图片输入的模型提供方。',
	'vision.panel.summary.vscodeLm.title': '当前：VS Code 语言模型',
	'vision.panel.summary.vscodeLm.detail': '{0} · {1} · 支持图片输入',
	'vision.panel.summary.apiNotConfigured.title': '当前：API 端点未配置',
	'vision.panel.summary.apiNotConfigured.detail': '填写端点 URL、端点类型和模型 ID 后保存。',
	'vision.panel.summary.apiEndpoint.title': '当前：API 端点',
	'vision.panel.summary.apiEndpoint.detail': '{0} · {1} · {2} · {3}',
	'vision.panel.summary.apiKeySet': '已设置 API Key',
	'vision.panel.summary.apiKeyNotSet': '未设置 API Key',
	'vision.panel.action.save': '保存',
	'vision.panel.action.test': '测试',
	'vision.panel.action.clearApiKey': '清除已保存的 API Key',
	'vision.panel.test.image': '测试图片',
	'vision.panel.test.response': '模型回答',
	'vision.panel.error.required': '{0} 必填',
	'vision.panel.error.invalidJson': '{0} 必须是有效的 JSON。',
	'vision.proxy.error.configurationInvalid': '视觉代理配置无效。',
	'vision.proxy.error.providerFamilyInvalid': '视觉代理提供方类型无效。',
	'vision.proxy.error.apiTypeInvalid': '视觉代理 API 类型无效。',
	'vision.proxy.error.fieldRequired': '{0} 必填。',
	'vision.proxy.error.extraBodyObject': '额外请求体 JSON 必须是一个对象。',
	'vision.proxy.error.extraBodyProtectedKey': '额外请求体不能覆盖 "{0}"。',
	'vision.proxy.error.customHeadersObject': '自定义 headers 必须是一个对象。',
	'vision.proxy.error.customHeaderNameEmpty': '自定义 header 名不能为空。',
	'vision.proxy.error.customHeaderNameInvalid': '自定义 header "{0}" 无效。',
	'vision.proxy.error.customHeaderValueString': '自定义 header "{0}" 的值必须是字符串。',
	'vision.proxy.error.customHeaderValueInvalid': '自定义 header "{0}" 的值无效。',
	'vision.proxy.error.invalidUrl': '视觉代理端点 URL 无效。',
	'vision.proxy.error.invalidUrlProtocol': '视觉代理端点 URL 必须使用 http:// 或 https://。',
	'vision.proxy.error.auth': '视觉代理认证失败 ({0})。',
	'vision.proxy.error.notFound': '视觉代理端点或模型不存在：{0}。',
	'vision.proxy.error.payloadTooLarge': '视觉代理图片请求体过大 ({0})。',
	'vision.proxy.error.rateLimited': '视觉代理触发速率限制 ({0})。',
	'vision.proxy.error.providerUnavailable': '视觉代理服务不可用 ({0})。',
	'vision.proxy.error.requestFailed': '视觉代理请求失败 ({0})。',
	'vision.proxy.error.cancelled': '视觉代理请求已取消。',
	'vision.proxy.error.timeout': '视觉代理请求超时。',
	'vision.proxy.error.network.dns': '视觉代理 DNS 解析失败 ({0})。',
	'vision.proxy.error.network.unreachable': '视觉代理端点不可达或拒绝连接 ({0})。',
	'vision.proxy.error.network.interrupted': '视觉代理连接被中断 ({0})。',
	'vision.proxy.error.network.timeout': '视觉代理网络连接超时 ({0})。',
	'vision.proxy.error.network.tls': '视觉代理 TLS/证书校验失败 ({0})。',
	'vision.proxy.error.network.aborted': '视觉代理请求已中止 ({0})。',
	'vision.proxy.error.network.protocol': '视觉代理 HTTP 连接或响应解析失败 ({0})。',
	'vision.proxy.error.network.configuration': '视觉代理请求配置无效 ({0})。',
	'vision.proxy.error.network.generic': '视觉代理网络请求失败 ({0})。',
	'vision.proxy.error.emptyResponse': '视觉代理返回了空响应。',
	'vision.proxy.error.unsupportedAnthropicResponse': 'Anthropic-compatible 视觉响应格式不受支持。',
	'vision.proxy.error.unsupportedOpenAIResponse': 'OpenAI-compatible 视觉响应格式不受支持。',
	'vision.proxy.error.unsupportedOpenAIContent': 'OpenAI-compatible 视觉响应内容格式不受支持。',
	'vision.proxy.error.testFailed': '视觉代理测试失败。',
	'vision.proxy.error.unknown': '未知错误',

	// Request
	'request.toolsLimitExceeded':
		'当前模型单次 tools 请求最多支持 {0} 个 functions，当前请求包含 {1} 个。请先用 VS Code 的 Configure Tools 关闭不常用的工具；如果正在使用实验性稳定工具列表设置，请关闭它。',
	'request.preflightRoundLimitExceeded':
		'实验性稳定工具列表设置已尝试 {0} 轮，仍无法得到稳定的已启用工具列表。请关闭该实验性设置，或先用 VS Code 的 Configure Tools 关闭不常用的工具。',
	'notice.visionProxyMissing': '⚠️ 视觉代理不可用，目标模型无法看到图片。[配置视觉代理]({0})',
	'notice.visionProxyFailure': '**⚠️ {0}**\\\n\\\n**{1} · {2}**',
	'notice.toolDrift':
		'⚠️ 工具列表不稳定，缓存命中率可能下降。[了解更多](https://github.com/WindSnowLi/multi-model-for-copilot/blob/main/docs/notices/tool-drift.zh.md)',

	// Errors
	'error.http.400': '[{0}] 请求体格式错误。请根据错误信息提示修改请求体。',
	'error.http.401':
		'[{0}] API Key 错误，认证失败。请检查您的 API Key 是否正确。如没有 API key，请先创建 API Key。',
	'error.http.401.withCreateApiKeyLink':
		'[{0}] API Key 错误，认证失败。请检查您的 API Key 是否正确。如没有 API key，请先[创建 API Key]({1})。',
	'error.http.402': '[{0}] 账号余额不足。请确认账户余额，并前往充值页面进行充值。',
	'error.http.404': '[{0}] 模型不存在或端点路径错误。请检查模型 ID 和 API Base URL 是否正确。',
	'error.http.422': '[{0}] 请求体参数错误。请根据错误信息提示修改相关参数。',
	'error.http.429': '[{0}] 请求速率（TPM 或 RPM）达到上限。请合理规划您的请求速率。',
	'error.http.500': '[{0}] 服务器内部故障。请等待后重试。',
	'error.http.503': '[{0}] 服务器负载过高。请稍后重试您的请求。',
	'error.http.generic': '[{0}] 服务返回错误响应。',
	'error.action.setApiKey': '设置 API Key',
	'error.action.createApiKey': '创建 API Key',
	'error.action.viewUsage': '用量',
	'error.action.checkDeepSeekStatus': '查看服务状态',
	'error.action.checkMiMoStatus': '查看 MiMo 状态',
	'error.action.checkStatus': '查看服务状态',
	'error.action.viewDetails': '错误详情',
	'error.network.dns': '[{0}] DNS 解析失败。请检查网络连接、防火墙或代理设置，以及自定义 baseUrl。',
	'error.network.unreachable':
		'[{0}] 目标不可达或拒绝连接。请检查自定义 baseUrl、代理服务、网络连接或防火墙设置。',
	'error.network.interrupted': '[{0}] 连接被中断。请检查网络连接、防火墙或代理设置，或稍后重试。',
	'error.network.timeout': '[{0}] 连接超时。请稍后重试，或检查网络连接、防火墙或代理设置。',
	'error.network.tls': '[{0}] TLS/证书校验失败。请检查代理、证书配置或自定义 baseUrl。',
	'error.network.aborted':
		'[{0}] 请求已中止。如果不是主动取消，请检查网络连接或代理设置，或稍后重试。',
	'error.network.protocol':
		'[{0}] HTTP 连接或响应解析失败。请检查代理设置、自定义 baseUrl 或服务响应。',
	'error.network.configuration': '[{0}] 请求配置无效。请检查自定义 baseUrl 或扩展设置。',
	'error.network.generic':
		'[{0}] 网络请求失败。请检查网络连接、防火墙或代理设置，以及自定义 baseUrl。',
	'error.unknown': '模型请求失败：{0}',

	// Extension
	'extension.activateFailed': '扩展激活失败，请运行 "Multi-Model: 显示日志" 查看详情。',
	'extension.deactivateFailed': '扩展停用异常',
	'extension.welcomeFailed': '欢迎引导加载异常',
	'extension.openRequestDumpsFolderFailed':
		'打开请求 dump 目录失败，请运行 "Multi-Model: 显示日志" 查看详情。',
};

const en: Translations = {
	// Model descriptions
	'model.deepseek.flash.detail': 'Fast, general-purpose model',
	'model.deepseek.pro.detail': 'Most capable reasoning model',
	'model.deepseek.flash.tooltip':
		'Fast, efficient DeepSeek V4 model with reasoning close to V4 Pro and economical API pricing.',
	'model.deepseek.pro.tooltip':
		'DeepSeek V4 model for agentic coding, broad world knowledge, and high-end reasoning.',

	// MiMo model descriptions
	'model.mimo.pro.detail': 'Flagship reasoning model with deep thinking',
	'model.mimo.standard.detail': 'Omni-modal model with vision and thinking',
	'model.mimo.pro.tooltip':
		'MiMo V2.5 Pro flagship model, designed for complex reasoning, deep analysis, and long-document processing.',
	'model.mimo.standard.tooltip':
		'MiMo V2.5 omni-modal model with image, audio, and video understanding plus deep thinking.',

	// Qwen model descriptions
	'model.qwen.max.detail': 'Flagship model with the strongest capabilities',
	'model.qwen.plus.detail': 'High cost-performance ratio model',
	'model.qwen.turbo.detail': 'Fast response model',
	'model.qwen.vl.max.detail': 'Flagship vision understanding model',
	'model.qwen.vl.plus.detail': 'High cost-performance vision model',
	'model.qwen.vl.turbo.detail': 'Fast vision model',
	'model.qwen.max.tooltip': 'Qwen AI Platform flagship model with the strongest reasoning and knowledge capabilities.',
	'model.qwen.plus.tooltip': 'Qwen AI Platform high cost-performance model, balancing performance and cost.',
	'model.qwen.turbo.tooltip': 'Qwen AI Platform fast response model, suitable for simple tasks and high-concurrency scenarios.',
	'model.qwen.vl.max.tooltip': 'Qwen AI Platform flagship vision understanding model, supporting image and video content understanding.',
	'model.qwen.vl.plus.tooltip': 'Qwen AI Platform high cost-performance vision model, supporting image understanding.',
	'model.qwen.vl.turbo.tooltip': 'Qwen AI Platform fast vision model, suitable for simple image recognition tasks.',

	// API Key
	'auth.apiKeyRequiredDetail': 'Please run Multi-Model: Set API Key to configure.',
	'auth.prompt':
		'Enter your DeepSeek API key or compatible provider token. Official DeepSeek keys usually start with "sk-". For MiMo, use a Token Plan key (tp-xxxxx).',
	'auth.placeholder': 'sk-... or provider token',
	'auth.mimoPrompt':
		'Enter your MiMo Token Plan API key. Official MiMo keys use the format "tp-xxxxx".',
	'auth.mimoPlaceholder': 'tp-...',
	'auth.qwenPrompt':
		'Enter your Qwen AI Platform API key. Official Qwen keys usually start with "sk-".',
	'auth.qwenPlaceholder': 'sk-...',
	'auth.emptyValidation': 'API key cannot be empty',
	'auth.saved': 'API key saved.',
	'auth.removed': 'API key removed.',
	'auth.notConfigured':
		'API key not configured. Run "Multi-Model: Set API Key" from the Command Palette.',
	'auth.notConfiguredForModel':
		'API key for model "{0}" is not configured. Run "Multi-Model: Set API Key" from the Command Palette.',

	// Custom Model
	'customModel.prompt.id': 'Enter a unique model identifier (letters, numbers, hyphens)',
	'customModel.prompt.name': 'Enter a display name for the model',
	'customModel.prompt.baseUrl': 'Enter the API Base URL (OpenAI-compatible)',
	'customModel.prompt.modelId': 'Enter the model ID to send in the API request',
	'customModel.prompt.toolCalling': 'Does this model support tool calling (function calling)?',
	'customModel.prompt.imageInput': 'Does this model support image input?',
	'customModel.prompt.thinking': 'Does this model support thinking/reasoning mode?',
	'customModel.prompt.apiKey': 'Enter API Key for this model (optional, can skip)',
	'customModel.prompt.remove': 'Select a custom model to remove',
	'customModel.toolCalling.true': 'Supports tool calling',
	'customModel.toolCalling.false': 'Not supported',
	'customModel.imageInput.true': 'Supports images',
	'customModel.imageInput.false': 'Not supported',
	'customModel.thinking.true': 'Supports thinking',
	'customModel.thinking.false': 'Not supported',
	'customModel.added': 'Custom model "{0}" added.',
	'customModel.removed': 'Custom model "{0}" removed.',
	'customModel.none': 'No custom models configured.',
	'customModel.error.duplicateId': 'Model ID "{0}" already exists. Please use a different ID.',

	// Discover Models
	'customModel.discover.pickSource': 'Select model discovery source',
	'customModel.discover.customUrl': 'Custom API endpoint',
	'customModel.discover.enterUrl': 'Enter the API Base URL (OpenAI-compatible)',
	'customModel.discover.enterKey': 'Enter the API Key for this endpoint',
	'customModel.discover.noKey': 'Please configure a {0} API key first.',
	'customModel.discover.failed': 'Model discovery failed: {0}',
	'customModel.discover.empty': 'No models discovered.',
	'customModel.discover.allExist': 'All discovered models already exist.',
	'customModel.discover.selectModels': 'Select models to add (multi-select)',
	'customModel.discover.added': 'Added {0} model(s).',

	// Thinking Effort
	'status.thinking': 'Thinking Effort',
	'thinking.none': 'None',
	'thinking.none.desc': 'Disable thinking for faster responses',
	'thinking.high': 'High',
	'thinking.high.desc': 'Recommended for most tasks',
	'thinking.max': 'Max',
	'thinking.max.desc': 'Maximum reasoning depth for complex agent tasks',

	// Vision
	// NOTE: vision.unableToDescribe has been moved to consts.ts as
	// IMAGE_DESCRIPTION_UNAVAILABLE — it is prompt content, not UI text.
	'vision.proxyUsing': 'Vision proxy: {0}',
	'vision.notFound': 'Vision model "{0}" not found',
	'vision.unavailable': 'No vision models available, image(s) ignored',
	'vision.proxyError': 'Vision proxy error:',
	'vision.action.configureProxy': 'Configure Vision Proxy',
	'vision.panel.title': 'Multi-Model Vision Proxy',
	'vision.panel.description':
		'Configure a vision-capable model to turn image attachments into text before the target model receives the request. The model receives the description, not the original images.',
	'vision.panel.source.vscodeLm': 'VS Code model',
	'vision.panel.source.apiEndpoint': 'API endpoint',
	'vision.panel.field.source': 'Vision proxy source',
	'vision.panel.field.visionModel': 'Vision model',
	'vision.panel.field.endpointType': 'Endpoint type',
	'vision.panel.field.endpointUrl': 'Endpoint URL',
	'vision.panel.field.apiKey': 'API key',
	'vision.panel.field.modelId': 'Model ID',
	'vision.panel.field.customHeaders': 'Custom headers JSON',
	'vision.panel.field.extraBody': 'Additional request body JSON',
	'vision.panel.hint.customHeaders':
		'Header values are stored with the profile. Put provider tokens in the API key field when possible.',
	'vision.panel.hint.extraBody':
		'Merged into the request body. Cannot override model, messages, input, or stream.',
	'vision.panel.placeholder.openaiEndpoint': 'https://api.example.com/v1/chat/completions',
	'vision.panel.placeholder.openaiResponsesEndpoint': 'https://api.example.com/v1/responses',
	'vision.panel.placeholder.anthropicEndpoint': 'https://api.example.com/v1/messages',
	'vision.panel.placeholder.endpointType': 'Select endpoint type',
	'vision.panel.placeholder.enterApiKey': 'Enter API key',
	'vision.panel.endpointType.openaiChatCompletions': 'OpenAI-compatible Chat Completions',
	'vision.panel.endpointType.openaiResponses': 'OpenAI-compatible Responses',
	'vision.panel.endpointType.anthropicMessages': 'Anthropic-compatible Messages',
	'vision.panel.hint.endpointTypeEmpty':
		'Enter an endpoint URL to infer the endpoint type automatically.',
	'vision.panel.hint.endpointTypeInferred': 'Inferred from URL: {0}.',
	'vision.panel.hint.endpointTypeManual':
		'Could not infer this URL. Select the endpoint type manually.',
	'vision.panel.hint.endpointTypeSelected': 'Using selected endpoint type: {0}.',
	'vision.panel.hint.apiKeySet': 'Stored API key is set. Enter a new key to replace it.',
	'vision.panel.hint.apiKeyUnset': 'API key will be stored in VS Code SecretStorage.',
	'vision.panel.cost.tokenCost': 'Cost: {0} credits / 1M tokens',
	'vision.panel.cost.longContextTokenCost': 'Long context: {0} credits / 1M tokens',
	'vision.panel.cost.input': 'input {0}',
	'vision.panel.cost.cachedInput': 'cached input {0}',
	'vision.panel.cost.output': 'output {0}',
	'vision.panel.cost.pricing': 'Cost: {0}',
	'vision.panel.cost.category.low': 'low cost',
	'vision.panel.cost.category.medium': 'medium cost',
	'vision.panel.cost.category.high': 'high cost',
	'vision.panel.cost.category.veryHigh': 'very high cost',
	'vision.panel.cost.category.named': '{0} cost',
	'vision.panel.status.vscodeLmSelected': 'VS Code language model is selected.',
	'vision.panel.status.apiKeySet': 'API key is set.',
	'vision.panel.status.apiKeyNotSet': 'API key is not set.',
	'vision.panel.status.testing': 'Testing vision proxy...',
	'vision.panel.status.vscodeLmNoHttpTest':
		'VS Code language model selection does not need an HTTP test.',
	'vision.panel.status.testSucceeded': 'Vision proxy responded. Review the sample below.',
	'vision.panel.status.vscodeLmSaved': 'VS Code language model is now active.',
	'vision.panel.status.endpointSavedWithKey':
		'API endpoint and API key saved. API endpoint is now active.',
	'vision.panel.status.endpointSaved': 'API endpoint saved. API endpoint is now active.',
	'vision.panel.status.apiKeyCleared': 'Saved API key cleared.',
	'vision.panel.summary.noVSCodeVision.title': 'Current: no VS Code vision model',
	'vision.panel.summary.noVSCodeVision.detail':
		'Configure an API endpoint or install a provider with image input support.',
	'vision.panel.summary.vscodeLm.title': 'Current: VS Code language model',
	'vision.panel.summary.vscodeLm.detail': '{0} · {1} · image input supported',
	'vision.panel.summary.apiNotConfigured.title': 'Current: API endpoint not configured',
	'vision.panel.summary.apiNotConfigured.detail':
		'Complete the endpoint URL, endpoint type, and model ID, then save.',
	'vision.panel.summary.apiEndpoint.title': 'Current: API endpoint',
	'vision.panel.summary.apiEndpoint.detail': '{0} · {1} · {2} · {3}',
	'vision.panel.summary.apiKeySet': 'API key set',
	'vision.panel.summary.apiKeyNotSet': 'API key not set',
	'vision.panel.action.save': 'Save',
	'vision.panel.action.test': 'Test',
	'vision.panel.action.clearApiKey': 'Clear saved API key',
	'vision.panel.test.image': 'Test image',
	'vision.panel.test.response': 'Model response',
	'vision.panel.error.required': '{0} is required',
	'vision.panel.error.invalidJson': '{0} must be valid JSON.',
	'vision.proxy.error.configurationInvalid': 'Vision proxy configuration is invalid.',
	'vision.proxy.error.providerFamilyInvalid': 'Vision proxy provider type is invalid.',
	'vision.proxy.error.apiTypeInvalid': 'Vision proxy API type is invalid.',
	'vision.proxy.error.fieldRequired': '{0} is required.',
	'vision.proxy.error.extraBodyObject': 'Additional request body JSON must be an object.',
	'vision.proxy.error.extraBodyProtectedKey': 'Additional request body cannot override "{0}".',
	'vision.proxy.error.customHeadersObject': 'Custom headers must be an object.',
	'vision.proxy.error.customHeaderNameEmpty': 'Custom header name cannot be empty.',
	'vision.proxy.error.customHeaderNameInvalid': 'Custom header "{0}" is invalid.',
	'vision.proxy.error.customHeaderValueString': 'Custom header "{0}" must have a string value.',
	'vision.proxy.error.customHeaderValueInvalid': 'Custom header "{0}" has an invalid value.',
	'vision.proxy.error.invalidUrl': 'Vision proxy endpoint URL is invalid.',
	'vision.proxy.error.invalidUrlProtocol':
		'Vision proxy endpoint URL must start with http:// or https://.',
	'vision.proxy.error.auth': 'Vision proxy authentication failed ({0}).',
	'vision.proxy.error.notFound': 'Vision proxy endpoint or model not found at {0}.',
	'vision.proxy.error.payloadTooLarge': 'Vision proxy image payload too large ({0}).',
	'vision.proxy.error.rateLimited': 'Vision proxy rate limited ({0}).',
	'vision.proxy.error.providerUnavailable': 'Vision proxy provider unavailable ({0}).',
	'vision.proxy.error.requestFailed': 'Vision proxy request failed ({0}).',
	'vision.proxy.error.cancelled': 'Vision proxy request was cancelled.',
	'vision.proxy.error.timeout': 'Vision proxy request timed out.',
	'vision.proxy.error.network.dns': 'Vision proxy DNS lookup failed ({0}).',
	'vision.proxy.error.network.unreachable':
		'Vision proxy endpoint is unreachable or refused the connection ({0}).',
	'vision.proxy.error.network.interrupted': 'Vision proxy connection was interrupted ({0}).',
	'vision.proxy.error.network.timeout': 'Vision proxy network connection timed out ({0}).',
	'vision.proxy.error.network.tls': 'Vision proxy TLS/certificate verification failed ({0}).',
	'vision.proxy.error.network.aborted': 'Vision proxy request was aborted ({0}).',
	'vision.proxy.error.network.protocol':
		'Vision proxy HTTP connection or response parsing failed ({0}).',
	'vision.proxy.error.network.configuration':
		'Vision proxy request configuration is invalid ({0}).',
	'vision.proxy.error.network.generic': 'Vision proxy network request failed ({0}).',
	'vision.proxy.error.emptyResponse': 'Vision proxy returned an empty response.',
	'vision.proxy.error.unsupportedAnthropicResponse':
		'Anthropic-compatible vision response has unsupported shape.',
	'vision.proxy.error.unsupportedOpenAIResponse':
		'OpenAI-compatible vision response has unsupported shape.',
	'vision.proxy.error.unsupportedOpenAIContent':
		'OpenAI-compatible vision response content has unsupported shape.',
	'vision.proxy.error.testFailed': 'Vision proxy test failed.',
	'vision.proxy.error.unknown': 'unknown',

	// Request
	'request.toolsLimitExceeded':
		'The current model supports at most {0} functions in a single `tools` request, but this request contains {1}. Use VS Code Configure Tools to disable tools you rarely use. If the experimental tool-list stabilization setting is enabled, turn it off.',
	'request.preflightRoundLimitExceeded':
		'Experimental tool-list stabilization tried {0} rounds but still could not get a stable enabled-tools list. Turn this experimental setting off, or use VS Code Configure Tools to disable tools you rarely use first.',
	'notice.visionProxyMissing':
		'⚠️ Vision Proxy is unavailable. The target model cannot see images. [Configure Vision Proxy]({0})',
	'notice.visionProxyFailure': '**⚠️ {0}**\\\n\\\n**{1} · {2}**',
	'notice.toolDrift':
		'⚠️ Tool list is unstable; cache hit rate may drop. [Learn more](https://github.com/WindSnowLi/multi-model-for-copilot/blob/main/docs/notices/tool-drift.en.md)',

	// Errors
	'error.http.400':
		'[{0}] Invalid request body format. Please modify your request body according to the hints in the error message.',
	'error.http.401':
		"[{0}] Authentication fails due to the wrong API key. Please check your API key. If you don't have one, please create an API key first.",
	'error.http.401.withCreateApiKeyLink':
		"[{0}] Authentication fails due to the wrong API key. Please check your API key. If you don't have one, please [create an API key]({1}) first.",
	'error.http.402':
		"[{0}] You have run out of balance. Please check your account's balance, and go to the Top up page to add funds.",
	'error.http.404':
		'[{0}] Model not found or endpoint path is incorrect. Please verify the model ID and API base URL.',
	'error.http.422':
		'[{0}] Your request contains invalid parameters. Please modify your request parameters according to the hints in the error message.',
	'error.http.429':
		'[{0}] You are sending requests too quickly. Please pace your requests reasonably.',
	'error.http.500':
		'[{0}] Our server encounters an issue. Please retry your request after a brief wait.',
	'error.http.503':
		'[{0}] The server is overloaded due to high traffic. Please retry your request after a brief wait.',
	'error.http.generic': '[{0}] The service returned an error response.',
	'error.action.setApiKey': 'Set API Key',
	'error.action.createApiKey': 'Create API Key',
	'error.action.viewUsage': 'Usage',
	'error.action.checkDeepSeekStatus': 'Check service status',
	'error.action.checkMiMoStatus': 'Check MiMo status',
	'error.action.checkStatus': 'Check service status',
	'error.action.viewDetails': 'Error Details',
	'error.network.dns':
		'[{0}] DNS lookup failed. Check your network connection, firewall, or proxy settings, and your custom baseUrl.',
	'error.network.unreachable':
		'[{0}] The target is unreachable or refused the connection. Check your custom baseUrl, proxy service, network connection, or firewall settings.',
	'error.network.interrupted':
		'[{0}] The connection was interrupted. Check your network connection, firewall, or proxy settings, or try again later.',
	'error.network.timeout':
		'[{0}] Connection timed out. Try again later, or check your network connection, firewall, or proxy settings.',
	'error.network.tls':
		'[{0}] TLS/certificate verification failed. Check your proxy settings, certificate configuration, or custom baseUrl.',
	'error.network.aborted':
		'[{0}] The request was aborted. If you did not cancel it, check your network connection or proxy settings, or try again later.',
	'error.network.protocol':
		'[{0}] The HTTP connection or response parsing failed. Check your proxy settings, custom baseUrl, or service response.',
	'error.network.configuration':
		'[{0}] The request configuration is invalid. Check your custom baseUrl or extension settings.',
	'error.network.generic':
		'[{0}] Network request failed. Check your network connection, firewall, or proxy settings, and your custom baseUrl.',
	'error.unknown': 'Model request failed: {0}',

	// Extension
	'extension.activateFailed': 'Extension failed to activate. Run "Multi-Model: Show Logs" for details.',
	'extension.deactivateFailed': 'Failed to prepare provider for deactivate',
	'extension.welcomeFailed': 'Failed to show welcome prompt',
	'extension.openRequestDumpsFolderFailed':
		'Failed to open request dumps folder. Run "Multi-Model: Show Logs" for details.',
};

/**
 * Resolve a translation key for the current VS Code display language.
 * Supports positional placeholders {0}, {1}, ...
 */
export function t(key: string, ...args: (string | number)[]): string {
	const dict = isZh() ? zh : en;
	let text = dict[key];
	if (text === undefined) {
		// Fall back to English when a key is missing from the active locale.
		text = en[key];
	}
	if (text === undefined) {
		return key;
	}
	// Replace all occurrences of each positional placeholder.
	for (let i = 0; i < args.length; i++) {
		text = text.replaceAll(`{${i}}`, String(args[i]));
	}
	return text;
}
