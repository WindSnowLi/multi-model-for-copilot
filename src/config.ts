import vscode from 'vscode';
import { CONFIG_SECTION } from './consts';

const DEFAULT_TOOL_SEARCH_MAX_TOOLS = 24;

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

export type ToolSearchMode = 'auto' | 'off';

/**
 * When the extension narrows the `tools` array down to a relevant subset plus
 * the single tool-search entry point. `auto` narrows only once more tools are
 * enabled than `toolSearch.maxTools`, so small tool sets are forwarded as-is.
 */
export function getToolSearchMode(): ToolSearchMode {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	return normalizeToolSearchMode(config.get<unknown>('toolSearch.mode')) ?? 'auto';
}

/** Number of tools kept in the request when tool search narrows the list. */
export function getToolSearchMaxTools(): number {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const value = config.get<number>('toolSearch.maxTools', DEFAULT_TOOL_SEARCH_MAX_TOOLS);
	return Number.isFinite(value) && value >= 1 ? Math.floor(value) : DEFAULT_TOOL_SEARCH_MAX_TOOLS;
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

function normalizeToolSearchMode(value: unknown): ToolSearchMode | undefined {
	if (value === 'auto' || value === 'off') {
		return value;
	}
	return undefined;
}
