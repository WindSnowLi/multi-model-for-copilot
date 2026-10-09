import { isOfficialHost } from './provider-registry';

export function isOfficialDeepSeekBaseUrl(baseUrl: string): boolean {
	return isOfficialHost(baseUrl, 'deepseek');
}

export function isOfficialMiMoBaseUrl(baseUrl: string): boolean {
	return isOfficialHost(baseUrl, 'mimo');
}

export function isOfficialQwenBaseUrl(baseUrl: string): boolean {
	return isOfficialHost(baseUrl, 'qwen');
}

export function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.trim().replace(/\/+$/u, '');
}
