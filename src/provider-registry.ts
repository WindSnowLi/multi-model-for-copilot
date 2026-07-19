/**
 * Provider Registry — single source of truth for all provider-specific configuration.
 *
 * Instead of scattering `if (provider === 'mimo')` branches across the codebase,
 * every provider declares its metadata here. Adding a new provider = adding one entry.
 *
 * Runtime-resolved values (base URLs from settings) are handled by getter functions
 * that read from this registry, not by per-file branching.
 */

import type { ApiProvider } from './types';

// ---- Thinking parameter format ----

/**
 * How a provider expects thinking/reasoning to be signaled in the request body.
 *
 * - `'reasoning_effort'`     → only `reasoning_effort` param (MiMo, Qwen-style)
 * - `'thinking_type'`        → `thinking: { type: 'enabled'|'disabled' }` + `reasoning_effort` (DeepSeek)
 */
export type ThinkingFormat = 'reasoning_effort' | 'thinking_type';

// ---- Auth header style ----

/**
 * How a provider authenticates API requests.
 *
 * - `'bearer'`   → `Authorization: Bearer <key>`  (DeepSeek, Qwen)
 * - `'api-key'`  → `api-key: <key>`               (MiMo)
 */
export type AuthHeaderStyle = 'bearer' | 'api-key';

// ---- Provider descriptor ----

export interface ProviderDescriptor {
	/** Unique provider identifier. */
	readonly id: ApiProvider;

	/** Display name shown in UI (e.g. model picker, error messages). */
	readonly displayName: string;

	/** SecretStorage key for this provider's API key. */
	readonly secretKey: string;

	/** VS Code settings key for fallback API key storage. */
	readonly settingsKey: string;

	/** Default base URL (used when no user override is configured). */
	readonly defaultBaseUrl: string;

	/** VS Code settings key for user-overridden base URL. Empty string = no override setting. */
	readonly baseUrlSettingsKey: string;

	/** Official API hostnames (for `isOfficialProviderBaseUrl` checks). */
	readonly officialHosts: readonly string[];

	/** Authentication header style. */
	readonly authStyle: AuthHeaderStyle;

	/** How thinking/reasoning parameters are sent in the request. */
	readonly thinkingFormat: ThinkingFormat;

	/** Whether to use `max_completion_tokens` instead of `max_tokens`. */
	readonly useMaxCompletionTokens: boolean;

	/** Whether this provider supports a balance/currency endpoint. */
	readonly hasBalanceEndpoint: boolean;
}

// ---- Registry ----

const PROVIDER_REGISTRY: Record<Exclude<ApiProvider, 'custom'>, ProviderDescriptor> = {
	deepseek: {
		id: 'deepseek',
		displayName: 'DeepSeek',
		secretKey: 'multi-model-for-copilot.apiKey',
		settingsKey: 'apiKey',
		defaultBaseUrl: 'https://api.deepseek.com',
		baseUrlSettingsKey: 'baseUrl',
		officialHosts: ['api.deepseek.com'],
		authStyle: 'bearer',
		thinkingFormat: 'thinking_type',
		useMaxCompletionTokens: false,
		hasBalanceEndpoint: true,
	},
	mimo: {
		id: 'mimo',
		displayName: 'MiMo',
		secretKey: 'multi-model-for-copilot.mimoApiKey',
		settingsKey: 'mimoApiKey',
		defaultBaseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
		baseUrlSettingsKey: 'mimoBaseUrl',
		officialHosts: [
			'token-plan-cn.xiaomimimo.com',
			'token-plan-sgp.xiaomimimo.com',
			'token-plan-ams.xiaomimimo.com',
		],
		authStyle: 'api-key',
		thinkingFormat: 'reasoning_effort',
		useMaxCompletionTokens: true,
		hasBalanceEndpoint: false,
	},
	qwen: {
		id: 'qwen',
		displayName: 'Qwen',
		secretKey: 'multi-model-for-copilot.qwenApiKey',
		settingsKey: 'qwenApiKey',
		defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
		baseUrlSettingsKey: 'qwenBaseUrl',
		officialHosts: ['dashscope.aliyuncs.com'],
		authStyle: 'bearer',
		thinkingFormat: 'reasoning_effort',
		useMaxCompletionTokens: true,
		hasBalanceEndpoint: false,
	},
};

// ---- Public API ----

/**
 * Get the provider descriptor. Returns `undefined` for 'custom' or unknown providers.
 */
export function getProviderDescriptor(provider: ApiProvider): ProviderDescriptor | undefined {
	return PROVIDER_REGISTRY[provider as keyof typeof PROVIDER_REGISTRY];
}

/**
 * Get the provider descriptor, throwing if not found (for built-in providers only).
 */
export function requireProviderDescriptor(provider: Exclude<ApiProvider, 'custom'>): ProviderDescriptor {
	const desc = PROVIDER_REGISTRY[provider];
	if (!desc) {
		throw new Error(`Unknown built-in provider: ${provider}`);
	}
	return desc;
}

/**
 * Resolve the official hostname check for a base URL.
 * Returns `false` for 'custom' or unknown providers.
 */
export function isOfficialHost(baseUrl: string, provider: ApiProvider): boolean {
	const desc = getProviderDescriptor(provider);
	if (!desc) {
		return false;
	}
	try {
		const hostname = new URL(baseUrl).hostname.toLowerCase();
		return desc.officialHosts.includes(hostname);
	} catch {
		return false;
	}
}

/**
 * Build the auth header for an API request.
 */
export function buildAuthHeaders(
	provider: ApiProvider,
	apiKey: string,
): Record<string, string> {
	const desc = getProviderDescriptor(provider);
	if (!desc) {
		// Fallback: standard bearer
		return { Authorization: `Bearer ${apiKey}` };
	}
	if (desc.authStyle === 'api-key') {
		return { 'api-key': apiKey };
	}
	return { Authorization: `Bearer ${apiKey}` };
}
