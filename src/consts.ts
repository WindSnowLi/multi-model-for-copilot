import type { CustomModelConfig, ModelDefinition, ThinkingEffort } from './types';

/**
 * Compile-time constants shared across the extension.
 *
 * These do NOT depend on the VS Code runtime (no workspace configuration,
 * no secrets API). For run-time settings reads see `config.ts`.
 */

/** VS Code configuration section prefix for all extension settings. */
export const CONFIG_SECTION = 'multi-model-for-copilot';

// ---- Reasoning efforts ----

/** Default reasoning efforts for models that expose a thinking picker. */
export const DEFAULT_THINKING_EFFORTS: readonly ThinkingEffort[] = ['none', 'high', 'max'];

/** DeepSeek V4 family additionally supports a low reasoning tier. */
export const DEEPSEEK_THINKING_EFFORTS: readonly ThinkingEffort[] = ['none', 'low', 'high', 'max'];

/**
 * MiMo V2.6 reasoning efforts. The API accepts the documented `thinking.type`
 * switch together with the `low`/`high` reasoning efforts; `max` is rejected
 * with HTTP 400 "Invalid request parameters".
 */
export const MIMO_THINKING_EFFORTS: readonly ThinkingEffort[] = ['none', 'low', 'high'];

/** DeepSeek native vision model ID (experimental, accepts image_url input). */
export const DEEPSEEK_VISION_EXP_MODEL_ID = 'deepseek-v4-flash-vision-exp';

/** DeepSeek V4.1 Flash: the current flagship, with native image input. */
export const DEEPSEEK_V41_FLASH_MODEL_ID = 'deepseek-v4.1-flash';

export const EXTERNAL_URLS = {
	deepseek: {
		apiKeys: 'https://platform.deepseek.com/api_keys',
		usage: 'https://platform.deepseek.com/usage',
		status: 'https://status.deepseek.com',
	},
	mimo: {
		apiKeys: 'https://platform.xiaomimimo.com/#/console/plan-manage',
		usage: 'https://platform.xiaomimimo.com/#/console/plan-manage',
		status: 'https://platform.xiaomimimo.com/#/console/plan-manage',
	},
	qwen: {
		apiKeys: 'https://platform.qianwenai.com/docs/api-reference/preparation/api-key',
		usage: 'https://platform.qianwenai.com/docs/api-reference/preparation/api-key',
		status: 'https://status.qianwenai.com',
	},
} as const;

/** URI path handled by this extension to reveal the output log. */
export const SHOW_LOGS_URI_PATH = '/showLogs';

/** URI path handled by this extension to open API key configuration. */
export const CONFIGURE_API_KEY_URI_PATH = '/setApiKey';

/** URI path handled by this extension to open vision model configuration. */
export const SET_VISION_MODEL_URI_PATH = '/setVisionModel';

// VS Code's internal LanguageModelChatMessageRole.System is not exposed in @types/vscode.
export const LANGUAGE_MODEL_CHAT_SYSTEM_ROLE = 3;

// ---- Secret keys ----

/** SecretStorage key for the DeepSeek API key. */
export const API_KEY_SECRET = 'multi-model-for-copilot.apiKey';

/** memento key tracking whether the welcome walkthrough has been shown. */
export const WELCOME_SHOWN_KEY = 'multi-model-for-copilot.welcomeShown';

// ---- Walkthrough ----

/** Walkthrough contribution ID. */
export const WALKTHROUGH_ID = 'Vizards.multi-model-for-copilot#gettingStarted';

// ---- Model registry ----

/** Available models exposed through the language model provider. */
export const MODELS: ModelDefinition[] = [
	{
		id: DEEPSEEK_V41_FLASH_MODEL_ID,
		name: 'DeepSeek V4.1 Flash',
		provider: 'deepseek',
		family: 'deepseek',
		version: 'v4.1',
		detail: 'Vision and thinking mode',
		maxInputTokens: 655360,
		maxOutputTokens: 393216,
		capabilities: {
			toolCalling: true,
			imageInput: true,
			// V4.1 Flash accepts image_url input natively.
			nativeImageInput: true,
			thinking: true,
		},
		thinkingEfforts: DEEPSEEK_THINKING_EFFORTS,
		requiresThinkingParam: true,
		pricingSchedule: {
			USD: {
				peak: { cacheHitInput: 0.006, cacheMissInput: 0.3, output: 1.2 },
				offPeak: { cacheHitInput: 0.003, cacheMissInput: 0.15, output: 0.6 },
			},
			CNY: {
				peak: { cacheHitInput: 0.04, cacheMissInput: 2, output: 8 },
				offPeak: { cacheHitInput: 0.02, cacheMissInput: 1, output: 4 },
			},
		},
		priceCategory: 'low',
	},
	{
		id: 'deepseek-v4-flash',
		name: 'DeepSeek V4 Flash',
		provider: 'deepseek',
		family: 'deepseek',
		version: 'v4',
		detail: 'Fast, general-purpose model',
		maxInputTokens: 1048576,
		maxOutputTokens: 393216,
		capabilities: {
			toolCalling: true,
			imageInput: true,
			// Flash does not accept image_url input natively; images are described
			// by the vision proxy before the request is sent to the model.
			nativeImageInput: false,
			thinking: true,
		},
		thinkingEfforts: DEEPSEEK_THINKING_EFFORTS,
		requiresThinkingParam: true,
		pricing: {
			USD: { cacheHitInput: 0.0028, cacheMissInput: 0.14, output: 0.28 },
			CNY: { cacheHitInput: 0.02, cacheMissInput: 1, output: 2 },
		},
		pricingSchedule: {
			USD: {
				peak: { cacheHitInput: 0.014, cacheMissInput: 0.44, output: 1.32 },
				offPeak: { cacheHitInput: 0.007, cacheMissInput: 0.22, output: 0.66 },
			},
			CNY: {
				peak: { cacheHitInput: 0.02, cacheMissInput: 1, output: 2 },
				offPeak: { cacheHitInput: 0.01, cacheMissInput: 0.5, output: 1 },
			},
		},
		priceCategory: 'low',
	},
	{
		id: 'deepseek-v4-pro',
		name: 'DeepSeek V4 Pro',
		provider: 'deepseek',
		family: 'deepseek',
		version: 'v4',
		detail: 'Most capable reasoning model',
		maxInputTokens: 1048576,
		maxOutputTokens: 393216,
		capabilities: {
			toolCalling: true,
			imageInput: true,
			nativeImageInput: false,
			thinking: true,
		},
		thinkingEfforts: DEEPSEEK_THINKING_EFFORTS,
		requiresThinkingParam: true,
		pricing: {
			USD: { cacheHitInput: 0.022, cacheMissInput: 0.66, output: 1.98 },
			CNY: { cacheHitInput: 0.15, cacheMissInput: 4.5, output: 13.5 },
		},
		pricingSchedule: {
			USD: {
				peak: { cacheHitInput: 0.044, cacheMissInput: 1.32, output: 3.96 },
				offPeak: { cacheHitInput: 0.022, cacheMissInput: 0.66, output: 1.98 },
			},
			CNY: {
				peak: { cacheHitInput: 0.3, cacheMissInput: 9, output: 27 },
				offPeak: { cacheHitInput: 0.15, cacheMissInput: 4.5, output: 13.5 },
			},
		},
		priceCategory: 'low',
	},
	{
		id: DEEPSEEK_VISION_EXP_MODEL_ID,
		name: 'DeepSeek V4 Flash Vision Exp',
		provider: 'deepseek',
		family: 'deepseek',
		version: 'v4',
		detail: 'Experimental native vision model',
		maxInputTokens: 1048576,
		maxOutputTokens: 393216,
		capabilities: {
			toolCalling: true,
			imageInput: true,
			// DeepSeek's only model that accepts image_url input natively.
			nativeImageInput: true,
			thinking: true,
		},
		thinkingEfforts: DEEPSEEK_THINKING_EFFORTS,
		requiresThinkingParam: true,
		pricing: {
			USD: { cacheHitInput: 0.0028, cacheMissInput: 0.14, output: 0.28 },
			CNY: { cacheHitInput: 0.02, cacheMissInput: 1, output: 2 },
		},
		pricingSchedule: {
			USD: {
				peak: { cacheHitInput: 0.014, cacheMissInput: 0.44, output: 1.32 },
				offPeak: { cacheHitInput: 0.007, cacheMissInput: 0.22, output: 0.66 },
			},
			CNY: {
				peak: { cacheHitInput: 0.02, cacheMissInput: 1, output: 2 },
				offPeak: { cacheHitInput: 0.01, cacheMissInput: 0.5, output: 1 },
			},
		},
		priceCategory: 'low',
	},
	// MiMo V2.6 models. All three are natively omni-modal, so image input is
	// forwarded as image_url instead of being described by the vision proxy.
	{
		id: 'mimo-v2.6-pro',
		name: 'MiMo V2.6 Pro',
		provider: 'mimo',
		family: 'mimo',
		version: 'v2.6',
		detail: 'Flagship reasoning model with deep thinking',
		maxInputTokens: 1000000,
		maxOutputTokens: 128000,
		capabilities: {
			toolCalling: true,
			imageInput: true,
			nativeImageInput: true,
			thinking: true,
		},
		thinkingEfforts: MIMO_THINKING_EFFORTS,
		requiresThinkingParam: false,
		pricing: {
			USD: { cacheHitInput: 0.0036, cacheMissInput: 0.435, output: 0.87 },
			CNY: { cacheHitInput: 0.025, cacheMissInput: 3, output: 6 },
		},
		priceCategory: 'low',
	},
	{
		id: 'mimo-v2.6-flash',
		name: 'MiMo V2.6 Flash',
		provider: 'mimo',
		family: 'mimo',
		version: 'v2.6',
		detail: 'Efficient omni-modal model with vision and thinking',
		maxInputTokens: 1000000,
		maxOutputTokens: 128000,
		capabilities: {
			toolCalling: true,
			imageInput: true,
			nativeImageInput: true,
			thinking: true,
		},
		thinkingEfforts: MIMO_THINKING_EFFORTS,
		requiresThinkingParam: false,
		pricing: {
			USD: { cacheHitInput: 0.0028, cacheMissInput: 0.14, output: 0.28 },
			CNY: { cacheHitInput: 0.02, cacheMissInput: 1, output: 2 },
		},
		priceCategory: 'low',
	},
	{
		id: 'mimo-v2.6-pro-ultraspeed',
		name: 'MiMo V2.6 Pro Ultraspeed',
		provider: 'mimo',
		family: 'mimo',
		version: 'v2.6',
		detail: 'Flagship reasoning at up to 20x output speed',
		maxInputTokens: 1000000,
		maxOutputTokens: 128000,
		capabilities: {
			toolCalling: true,
			imageInput: true,
			nativeImageInput: true,
			thinking: true,
		},
		thinkingEfforts: MIMO_THINKING_EFFORTS,
		requiresThinkingParam: false,
		pricing: {
			USD: { cacheHitInput: 0.036, cacheMissInput: 4.35, output: 8.7 },
			CNY: { cacheHitInput: 0.25, cacheMissInput: 30, output: 60 },
		},
		priceCategory: 'low',
	},
	// Qwen models
	{
		id: 'qwen-max',
		name: 'Qwen Max',
		provider: 'qwen',
		family: 'qwen',
		version: 'max',
		detail: '千问 AI 平台旗舰模型，最强大的能力',
		maxInputTokens: 32000,
		maxOutputTokens: 8192,
		capabilities: {
			toolCalling: true,
			imageInput: false,
			nativeImageInput: false,
			thinking: true,
		},
		requiresThinkingParam: false,
		pricing: {
			USD: { cacheHitInput: 0.0014, cacheMissInput: 0.014, output: 0.028 },
			CNY: { cacheHitInput: 0.01, cacheMissInput: 0.1, output: 0.2 },
		},
		priceCategory: 'low',
	},
	{
		id: 'qwen-plus',
		name: 'Qwen Plus',
		provider: 'qwen',
		family: 'qwen',
		version: 'plus',
		detail: '千问 AI 平台高性价比模型',
		maxInputTokens: 131072,
		maxOutputTokens: 8192,
		capabilities: {
			toolCalling: true,
			imageInput: false,
			nativeImageInput: false,
			thinking: true,
		},
		requiresThinkingParam: false,
		pricing: {
			USD: { cacheHitInput: 0.0007, cacheMissInput: 0.007, output: 0.014 },
			CNY: { cacheHitInput: 0.005, cacheMissInput: 0.05, output: 0.1 },
		},
		priceCategory: 'low',
	},
	{
		id: 'qwen-turbo',
		name: 'Qwen Turbo',
		provider: 'qwen',
		family: 'qwen',
		version: 'turbo',
		detail: '千问 AI 平台快速响应模型',
		maxInputTokens: 131072,
		maxOutputTokens: 8192,
		capabilities: {
			toolCalling: true,
			imageInput: false,
			nativeImageInput: false,
			thinking: false,
		},
		requiresThinkingParam: false,
		pricing: {
			USD: { cacheHitInput: 0.00035, cacheMissInput: 0.0035, output: 0.007 },
			CNY: { cacheHitInput: 0.0025, cacheMissInput: 0.025, output: 0.05 },
		},
		priceCategory: 'low',
	},
	// Qwen Vision models
	{
		id: 'qwen-vl-max',
		name: 'Qwen VL Max',
		provider: 'qwen',
		family: 'qwen-vl',
		version: 'max',
		detail: '千问 AI 平台视觉理解旗舰模型',
		maxInputTokens: 32000,
		maxOutputTokens: 4096,
		capabilities: {
			toolCalling: true,
			imageInput: true,
			nativeImageInput: true,
			thinking: true,
		},
		requiresThinkingParam: false,
		pricing: {
			USD: { cacheHitInput: 0.0014, cacheMissInput: 0.014, output: 0.028 },
			CNY: { cacheHitInput: 0.01, cacheMissInput: 0.1, output: 0.2 },
		},
		priceCategory: 'low',
	},
	{
		id: 'qwen-vl-plus',
		name: 'Qwen VL Plus',
		provider: 'qwen',
		family: 'qwen-vl',
		version: 'plus',
		detail: '千问 AI 平台高性价比视觉模型',
		maxInputTokens: 131072,
		maxOutputTokens: 4096,
		capabilities: {
			toolCalling: true,
			imageInput: true,
			nativeImageInput: true,
			thinking: true,
		},
		requiresThinkingParam: false,
		pricing: {
			USD: { cacheHitInput: 0.0007, cacheMissInput: 0.007, output: 0.014 },
			CNY: { cacheHitInput: 0.005, cacheMissInput: 0.05, output: 0.1 },
		},
		priceCategory: 'low',
	},
	{
		id: 'qwen-vl-turbo',
		name: 'Qwen VL Turbo',
		provider: 'qwen',
		family: 'qwen-vl',
		version: 'turbo',
		detail: '千问 AI 平台快速视觉模型',
		maxInputTokens: 131072,
		maxOutputTokens: 4096,
		capabilities: {
			toolCalling: true,
			imageInput: true,
			nativeImageInput: true,
			thinking: false,
		},
		requiresThinkingParam: false,
		pricing: {
			USD: { cacheHitInput: 0.00035, cacheMissInput: 0.0035, output: 0.007 },
			CNY: { cacheHitInput: 0.0025, cacheMissInput: 0.025, output: 0.05 },
		},
		priceCategory: 'low',
	},
];

/**
 * Convert a user-defined CustomModelConfig into a ModelDefinition
 * that the provider can use like any built-in model.
 */
export function toModelDefinition(cfg: CustomModelConfig): ModelDefinition {
	return {
		id: cfg.id,
		name: cfg.name,
		provider: 'custom',
		family: cfg.id,
		version: '',
		detail: cfg.detail || `Custom model via ${new URL(cfg.baseUrl).hostname}`,
		maxInputTokens: cfg.maxInputTokens ?? 128000,
		maxOutputTokens: cfg.maxOutputTokens ?? 8192,
		capabilities: {
			toolCalling: cfg.toolCalling ?? false,
			imageInput: cfg.imageInput ?? false,
			nativeImageInput: cfg.nativeImageInput ?? cfg.imageInput ?? false,
			thinking: cfg.thinking ?? false,
		},
		// Custom models keep the default effort set unless they opt into low.
		thinkingEfforts: cfg.thinkingEfforts,
		requiresThinkingParam: cfg.requiresThinkingParam ?? false,
	};
}

/**
 * Get the merged list of all models: built-in + user-defined custom models.
 */
export function getAllModels(customConfigs: CustomModelConfig[]): ModelDefinition[] {
	const builtIn = MODELS;
	const custom = customConfigs.map(toModelDefinition);
	return [...builtIn, ...custom];
}
