import vscode from 'vscode';
import { CONFIG_SECTION } from './consts';

export type DebugMode = 'minimal' | 'metadata';

/**
 * Get custom request headers to merge into every chat completion request.
 * Values may contain `${name}` placeholders resolved per provider call.
 */
export function getRequestHeaders(): Record<string, string> {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	return config.get<Record<string, string>>('requestHeaders', {});
}

/**
 * Get the configured max output tokens limit.
 * Returns `undefined` when set to 0 (API default — no limit).
 */
export function getMaxTokens(): number | undefined {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const value = config.get<number>('maxTokens', 0);
	return value > 0 ? value : undefined;
}

/**
 * Diagnostic mode. `metadata` enables privacy-safe request diagnostics.
 */
export function getDebugMode(): DebugMode {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	return normalizeDebugMode(config.get<unknown>('debugMode')) ?? 'minimal';
}

/**
 * Whether to log privacy-preserving diagnostic debug information.
 */
export function getDebugLoggingEnabled(): boolean {
	return getDebugMode() !== 'minimal';
}

export function getStabilizeToolListEnabled(): boolean {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	return config.get<boolean>('experimental.stabilizeToolList', false);
}

/**
 * Whether to show the live account balance in the status bar.
 */
export function getShowBalanceStatusBar(): boolean {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	return config.get<boolean>('statusBar.balance', true);
}

/**
 * Whether to show the peak/off-peak pricing notice in the model picker for
 * providers that expose period-aware rates (DeepSeek).
 */
export function getShowPricingNotice(): boolean {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	return config.get<boolean>('showPricingNotice', true);
}

/**
 * Whether to show the live token generation speed in the status bar.
 */
export function getShowTokenSpeedStatusBar(): boolean {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	return config.get<boolean>('statusBar.tokenSpeed', true);
}

function normalizeDebugMode(value: unknown): DebugMode | undefined {
	if (value === 'minimal' || value === 'metadata') {
		return value;
	}
	return undefined;
}
