import type { ApiProvider } from './types';

export const OFFICIAL_DEEPSEEK_API_HOST = 'api.deepseek.com';

const OFFICIAL_MIMO_API_HOSTS = [
	'token-plan-cn.xiaomimimo.com',
	'token-plan-sgp.xiaomimimo.com',
	'token-plan-ams.xiaomimimo.com',
];

export function isOfficialDeepSeekBaseUrl(baseUrl: string): boolean {
	try {
		return new URL(baseUrl).hostname.toLowerCase() === OFFICIAL_DEEPSEEK_API_HOST;
	} catch {
		return false;
	}
}

export function isOfficialMiMoBaseUrl(baseUrl: string): boolean {
	try {
		const hostname = new URL(baseUrl).hostname.toLowerCase();
		return OFFICIAL_MIMO_API_HOSTS.includes(hostname);
	} catch {
		return false;
	}
}

export function isOfficialProviderBaseUrl(baseUrl: string, provider: ApiProvider): boolean {
	switch (provider) {
		case 'deepseek':
			return isOfficialDeepSeekBaseUrl(baseUrl);
		case 'mimo':
			return isOfficialMiMoBaseUrl(baseUrl);
		case 'custom':
			return false;
	}
}

export function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.trim().replace(/\/+$/u, '');
}
