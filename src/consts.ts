import { DEFAULT_TOOLS_LIMIT } from './provider/tools/consts';
import type { CustomModelConfig, ModelDefinition } from './types';

/**
 * Compile-time constants shared across the extension.
 *
 * These do NOT depend on the VS Code runtime (no workspace configuration,
 * no secrets API). For run-time settings reads see `config.ts`.
 */

/** VS Code configuration section prefix for all extension settings. */
export const CONFIG_SECTION = 'multi-model-for-copilot';

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

/** SecretStorage key for the MiMo API key. */
export const MIMO_API_KEY_SECRET = 'multi-model-for-copilot.mimoApiKey';

/** SecretStorage key for the Qwen API key. */
export const QWEN_API_KEY_SECRET = 'multi-model-for-copilot.qwenApiKey';

/** memento key tracking whether the welcome walkthrough has been shown. */
export const WELCOME_SHOWN_KEY = 'multi-model-for-copilot.welcomeShown';

// ---- Walkthrough ----

/** Walkthrough contribution ID. */
export const WALKTHROUGH_ID = 'Vizards.multi-model-for-copilot#gettingStarted';

// ---- Model registry ----

/** Available models exposed through the language model provider. */
export const MODELS: ModelDefinition[] = [
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
			toolCalling: DEFAULT_TOOLS_LIMIT,
			imageInput: true,
			thinking: true,
		},
		requiresThinkingParam: true,
		pricing: {
			USD: { cacheHitInput: 0.0028, cacheMissInput: 0.14, output: 0.28 },
			CNY: { cacheHitInput: 0.02, cacheMissInput: 1, output: 2 },
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
			toolCalling: DEFAULT_TOOLS_LIMIT,
			imageInput: true,
			thinking: true,
		},
		requiresThinkingParam: true,
		pricing: {
			USD: { cacheHitInput: 0.003625, cacheMissInput: 0.435, output: 0.87 },
			CNY: { cacheHitInput: 0.025, cacheMissInput: 3, output: 6 },
		},
		priceCategory: 'low',
	},
	{
		id: 'mimo-v2.5-pro',
		name: 'MiMo V2.5 Pro',
		provider: 'mimo',
		family: 'mimo',
		version: 'v2.5',
		detail: 'Flagship reasoning model with deep thinking',
		maxInputTokens: 1000000,
		maxOutputTokens: 128000,
		capabilities: {
			toolCalling: true,
			imageInput: false,
			thinking: true,
		},
		requiresThinkingParam: false,
		pricing: {
			USD: { cacheHitInput: 0.0036, cacheMissInput: 0.435, output: 0.87 },
			CNY: { cacheHitInput: 0.025, cacheMissInput: 3, output: 6 },
		},
		priceCategory: 'low',
	},
	{
		id: 'mimo-v2.5',
		name: 'MiMo V2.5',
		provider: 'mimo',
		family: 'mimo',
		version: 'v2.5',
		detail: 'Omni-modal model with vision and thinking',
		maxInputTokens: 1000000,
		maxOutputTokens: 128000,
		capabilities: {
			toolCalling: true,
			imageInput: true,
			thinking: true,
		},
		requiresThinkingParam: false,
		pricing: {
			USD: { cacheHitInput: 0.0028, cacheMissInput: 0.14, output: 0.28 },
			CNY: { cacheHitInput: 0.02, cacheMissInput: 1, output: 2 },
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
			thinking: cfg.thinking ?? false,
		},
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
