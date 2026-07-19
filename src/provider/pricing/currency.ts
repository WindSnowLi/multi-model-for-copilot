import vscode from 'vscode';
import { AuthManager } from '../../auth';
import { getBaseUrl } from '../../config';
import { normalizeBaseUrl } from '../../endpoint';
import { logger } from '../../logger';
import { requireProviderDescriptor } from '../../provider-registry';
import type { ApiProvider, PricingCurrency } from '../../types';

const CACHE_KEY = 'multi-model-for-copilot.balanceCurrency.cache';
const BALANCE_TIMEOUT_MS = 5000;

interface CachedBalanceCurrency {
	readonly version: 1;
	readonly currency: PricingCurrency;
	readonly baseUrl: string;
	readonly provider: string;
}

interface BalanceInfo {
	readonly currency?: unknown;
	readonly total_balance?: unknown;
	readonly topped_up_balance?: unknown;
}

interface BalanceResponse {
	readonly balance_infos?: unknown;
}

/** Providers whose balance endpoint can auto-detect display currency. */
const BALANCE_PROVIDERS: Exclude<ApiProvider, 'custom'>[] = ['deepseek'];

export class BalanceCurrencyResolver {
	private inFlight: Promise<void> | undefined;
	private controller: AbortController | undefined;
	private generation = 0;
	private resolved: CachedBalanceCurrency | undefined;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly authManager: AuthManager,
		private readonly onDidChangeCurrency: () => void,
	) {}

	getDisplayCurrency(): PricingCurrency | undefined {
		// Check all balance-capable providers in priority order.
		for (const provider of BALANCE_PROVIDERS) {
			const desc = requireProviderDescriptor(provider);
			const baseUrl = normalizeBaseUrl(getBaseUrl(provider));
			const isOfficial = desc.officialHosts.includes(normalizeHostname(baseUrl));

			if (!isOfficial) {
				continue;
			}

			if (this.resolved?.provider === provider && this.resolved?.baseUrl === baseUrl) {
				return this.resolved.currency;
			}

			const cached = this.readCache();
			if (cached?.provider === provider && cached?.baseUrl === baseUrl) {
				return cached.currency;
			}
		}

		return getLocaleFallbackCurrency();
	}

	refreshInBackground(): void {
		if (this.inFlight || !this.needsRefresh()) {
			return;
		}

		const controller = new AbortController();
		const generation = this.generation;
		const refresh = this.refreshFromBalance(controller, generation)
			.catch((error) => {
				if (!(isAbortError(error) && generation !== this.generation)) {
					logger.warn('Failed to refresh balance currency', error);
				}
			})
			.finally(() => {
				if (this.inFlight === refresh) {
					this.inFlight = undefined;
				}
				if (this.controller === controller) {
					this.controller = undefined;
				}
			});
		this.controller = controller;
		this.inFlight = refresh;
	}

	async invalidate(): Promise<void> {
		this.generation++;
		this.controller?.abort();
		await this.inFlight;
		this.resolved = undefined;
		await this.context.globalState.update(CACHE_KEY, undefined);
	}

	private needsRefresh(): boolean {
		for (const provider of BALANCE_PROVIDERS) {
			const desc = requireProviderDescriptor(provider);
			const baseUrl = normalizeBaseUrl(getBaseUrl(provider));
			if (!desc.officialHosts.includes(normalizeHostname(baseUrl))) {
				continue;
			}
			if (this.resolved?.baseUrl === baseUrl || this.readCache()?.baseUrl === baseUrl) {
				return false;
			}
			return true;
		}
		return false;
	}

	private async refreshFromBalance(controller: AbortController, generation: number): Promise<void> {
		for (const provider of BALANCE_PROVIDERS) {
			const desc = requireProviderDescriptor(provider);
			const baseUrl = normalizeBaseUrl(getBaseUrl(provider));
			if (!desc.officialHosts.includes(normalizeHostname(baseUrl))) {
				continue;
			}

			const apiKey = await this.authManager.getApiKey(provider);
			if (!apiKey) {
				continue;
			}

			const currency = await fetchBalanceCurrency(baseUrl, apiKey, controller);
			if (!currency || controller.signal.aborted || generation !== this.generation) {
				return;
			}

			const previous = this.resolved ?? this.readCache();
			this.resolved = { version: 1, currency, baseUrl, provider };
			await this.context.globalState.update(CACHE_KEY, this.resolved);
			if (previous?.baseUrl !== baseUrl || previous.currency !== currency) {
				this.onDidChangeCurrency();
			}
			return;
		}
	}

	private readCache(): CachedBalanceCurrency | undefined {
		const value = this.context.globalState.get<unknown>(CACHE_KEY);
		if (!isCachedBalanceCurrency(value)) {
			return undefined;
		}
		return value;
	}
}

function normalizeHostname(url: string): string {
	try {
		return new URL(url).hostname.toLowerCase();
	} catch {
		return '';
	}
}

function getLocaleFallbackCurrency(): PricingCurrency {
	return vscode.env.language.toLowerCase().startsWith('zh') ? 'CNY' : 'USD';
}

function getBalanceUrl(baseUrl: string): string {
	return new URL('/user/balance', baseUrl).toString();
}

async function fetchBalanceCurrency(
	baseUrl: string,
	apiKey: string,
	controller: AbortController,
): Promise<PricingCurrency | undefined> {
	const timeout = setTimeout(() => controller.abort(), BALANCE_TIMEOUT_MS);

	try {
		const balanceUrl = getBalanceUrl(baseUrl);
		const response = await fetch(balanceUrl, {
			method: 'GET',
			headers: { Authorization: `Bearer ${apiKey}` },
			signal: controller.signal,
		});

		if (!response.ok) {
			logger.debug(`DeepSeek balance request failed with HTTP ${response.status}`);
			return undefined;
		}

		const data = (await response.json()) as BalanceResponse;
		return chooseBalanceCurrency(data);
	} finally {
		clearTimeout(timeout);
	}
}

function chooseBalanceCurrency(data: BalanceResponse): PricingCurrency | undefined {
	if (!Array.isArray(data.balance_infos)) {
		return undefined;
	}

	const infos = data.balance_infos.filter(isBalanceInfo);
	return (
		findCurrencyByPositiveBalance(infos, 'topped_up_balance') ??
		findCurrencyByPositiveBalance(infos, 'total_balance') ??
		infos.map((info) => parsePricingCurrency(info.currency)).find(Boolean)
	);
}

function findCurrencyByPositiveBalance(
	infos: readonly BalanceInfo[],
	key: 'total_balance' | 'topped_up_balance',
): PricingCurrency | undefined {
	for (const info of infos) {
		const currency = parsePricingCurrency(info.currency);
		if (currency && Number(info[key]) > 0) {
			return currency;
		}
	}
	return undefined;
}

function parsePricingCurrency(value: unknown): PricingCurrency | undefined {
	return value === 'USD' || value === 'CNY' ? value : undefined;
}

function isBalanceInfo(value: unknown): value is BalanceInfo {
	return typeof value === 'object' && value !== null;
}

function isAbortError(value: unknown): boolean {
	return value instanceof Error && value.name === 'AbortError';
}

function isCachedBalanceCurrency(value: unknown): value is CachedBalanceCurrency {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const cache = value as CachedBalanceCurrency;
	return (
		cache.version === 1 &&
		parsePricingCurrency(cache.currency) !== undefined &&
		typeof cache.baseUrl === 'string'
	);
}
