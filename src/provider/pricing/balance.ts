import vscode from 'vscode';
import { AuthManager } from '../../auth';
import { getBaseUrl } from '../../config';
import { normalizeBaseUrl } from '../../endpoint';
import { logger } from '../../logger';
import { buildAuthHeaders, getBalanceCapableProviders, requireProviderDescriptor } from '../../provider-registry';
import type { ApiProvider, PricingCurrency } from '../../types';

const BALANCE_TIMEOUT_MS = 5000;
const BALANCE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const BALANCE_MIN_REFRESH_DELAY_MS = 30 * 1000;

export interface BalanceSnapshot {
	readonly currency: PricingCurrency;
	readonly amount: number;
	readonly provider: string;
	readonly baseUrl: string;
}

interface BalanceInfo {
	readonly currency?: unknown;
	readonly total_balance?: unknown;
	readonly topped_up_balance?: unknown;
}

interface BalanceResponse {
	readonly balance_infos?: unknown;
	readonly is_available?: unknown;
}

interface FetchBalanceResult {
	readonly currency: PricingCurrency;
	readonly amount: number;
}

/**
 * Fetches and caches the account balance (amount + currency) from balance-capable
 * providers (currently DeepSeek) so the status bar can display it in real time.
 */
export class BalanceService {
	private snapshot: BalanceSnapshot | undefined;
	private inFlight: Promise<void> | undefined;
	private controller: AbortController | undefined;
	private generation = 0;
	private timer: ReturnType<typeof setInterval> | undefined;
	private lastRefreshedAt: number | undefined;

	private readonly onDidChangeEmitter =
		new vscode.EventEmitter<BalanceSnapshot | undefined>();

	readonly onDidChange = this.onDidChangeEmitter.event;

	constructor(private readonly authManager: AuthManager) {}

	getBalance(): BalanceSnapshot | undefined {
		return this.snapshot;
	}

	refreshInBackground(force = false): void {
		if (this.inFlight) {
			return;
		}
		if (
			!force &&
			this.lastRefreshedAt !== undefined &&
			Date.now() - this.lastRefreshedAt < BALANCE_MIN_REFRESH_DELAY_MS
		) {
			return;
		}

		const controller = new AbortController();
		const generation = this.generation;
		const refresh = this.refreshFromEndpoint(controller, generation)
			.catch((error) => {
				if (!isAbortError(error)) {
					logger.warn('Failed to refresh balance', error);
				}
			})
			.finally(() => {
				this.lastRefreshedAt = Date.now();
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

	startPeriodicRefresh(): void {
		if (this.timer) {
			return;
		}
		this.timer = setInterval(() => this.refreshInBackground(true), BALANCE_REFRESH_INTERVAL_MS);
		this.timer.unref?.();
	}

	async invalidate(): Promise<void> {
		this.generation++;
		this.controller?.abort();
		await this.inFlight;
		this.snapshot = undefined;
		this.onDidChangeEmitter.fire(undefined);
	}

	dispose(): void {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = undefined;
		}
		this.onDidChangeEmitter.dispose();
	}

	private async refreshFromEndpoint(
		controller: AbortController,
		generation: number,
	): Promise<void> {
		for (const provider of getBalanceCapableProviders()) {
			const desc = requireProviderDescriptor(provider);
			const baseUrl = normalizeBaseUrl(getBaseUrl(provider));
			if (!desc.officialHosts.includes(normalizeHostname(baseUrl))) {
				continue;
			}

			const apiKey = await this.authManager.getApiKey(provider);
			if (!apiKey) {
				continue;
			}

			const balance = await fetchBalance(provider, baseUrl, apiKey, controller);
			if (!balance || controller.signal.aborted || generation !== this.generation) {
				return;
			}

			const changed =
				this.snapshot?.baseUrl !== baseUrl ||
				this.snapshot?.provider !== provider ||
				this.snapshot?.currency !== balance.currency ||
				this.snapshot?.amount !== balance.amount;

			this.snapshot = {
				currency: balance.currency,
				amount: balance.amount,
				provider,
				baseUrl,
			};

			if (changed) {
				this.onDidChangeEmitter.fire(this.snapshot);
			}
			return;
		}
	}
}

function normalizeHostname(url: string): string {
	try {
		return new URL(url).hostname.toLowerCase();
	} catch {
		return '';
	}
}

function getBalanceUrl(baseUrl: string): string {
	return new URL('/user/balance', baseUrl).toString();
}

async function fetchBalance(
	provider: ApiProvider,
	baseUrl: string,
	apiKey: string,
	controller: AbortController,
): Promise<FetchBalanceResult | undefined> {
	const timeout = setTimeout(() => controller.abort(), BALANCE_TIMEOUT_MS);

	try {
		// DeepSeek-style balance endpoint (`/user/balance` with `balance_infos`).
		// When another provider is added, dispatch on `provider` here for its
		// own path + response shape (e.g. OpenRouter `/api/v1/auth/key`).
		const response = await fetch(getBalanceUrl(baseUrl), {
			method: 'GET',
			headers: buildAuthHeaders(provider, apiKey),
			signal: controller.signal,
		});

		if (!response.ok) {
			return undefined;
		}

		const data = (await response.json()) as BalanceResponse;
		return chooseBalance(data);
	} catch (error) {
		if (!isAbortError(error)) {
			logger.debug('Balance fetch failed', error);
		}
		return undefined;
	} finally {
		clearTimeout(timeout);
	}
}

function chooseBalance(data: BalanceResponse): FetchBalanceResult | undefined {
	if (!Array.isArray(data.balance_infos)) {
		return undefined;
	}

	const infos = data.balance_infos.filter(isBalanceInfo);
	const selected =
		infos.find((info) => parseCurrency(info.currency) && toNumber(info.topped_up_balance) > 0) ??
		infos.find((info) => parseCurrency(info.currency) && toNumber(info.total_balance) > 0) ??
		infos[0];

	if (!selected) {
		return undefined;
	}

	const currency = parseCurrency(selected.currency);
	if (!currency) {
		return undefined;
	}

	// Prefer the total balance; fall back to topped-up balance when the total
	// is unavailable or parses as zero (some providers report them separately).
	const amount = toNumber(selected.total_balance) || toNumber(selected.topped_up_balance);
	if (amount < 0) {
		return undefined;
	}

	return { currency, amount };
}

function toNumber(value: unknown): number {
	const number = Number(value);
	return Number.isFinite(number) ? number : 0;
}

function parseCurrency(value: unknown): PricingCurrency | undefined {
	return value === 'USD' || value === 'CNY' ? value : undefined;
}

function isBalanceInfo(value: unknown): value is BalanceInfo {
	return typeof value === 'object' && value !== null;
}

function isAbortError(value: unknown): boolean {
	return value instanceof Error && value.name === 'AbortError';
}
