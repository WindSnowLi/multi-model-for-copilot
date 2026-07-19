import type { ApiProvider } from './types';
import { isOfficialHost } from './provider-registry';

// Re-export for backward compatibility — callers can migrate to `isOfficialHost` directly.
export const OFFICIAL_DEEPSEEK_API_HOST = 'api.deepseek.com';

export function isOfficialDeepSeekBaseUrl(baseUrl: string): boolean {
	return isOfficialHost(baseUrl, 'deepseek');
}

export function isOfficialMiMoBaseUrl(baseUrl: string): boolean {
	return isOfficialHost(baseUrl, 'mimo');
}

export function isOfficialQwenBaseUrl(baseUrl: string): boolean {
	return isOfficialHost(baseUrl, 'qwen');
}

/**
 * Check if a base URL belongs to the official endpoint for a given provider.
 * Driven entirely by the Provider Registry — no per-provider branching.
 */
export function isOfficialProviderBaseUrl(baseUrl: string, provider: ApiProvider): boolean {
	return isOfficialHost(baseUrl, provider);
}

export function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.trim().replace(/\/+$/u, '');
}
