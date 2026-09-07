import vscode from 'vscode';
import { CONFIG_SECTION } from '../consts';
import { t } from '../i18n';
import { getProviderDescriptor } from '../provider-registry';
import type { BalanceService, BalanceSnapshot } from '../provider/pricing/balance';
import type { StreamSpeedTracker } from '../provider/stream';
import type { ApiProvider } from '../types';

const SPEED_UPDATE_INTERVAL_MS = 200;
const FINAL_SPEED_DURATION_MS = 3000;

export interface StatusBarControllerOptions {
	readonly balanceService: BalanceService;
	readonly getCharsPerToken: () => number;
	readonly getShowBalance: () => boolean;
	readonly getShowTokenSpeed: () => boolean;
}

/**
 * Renders live account balance and token-generation speed in the VS Code
 * status bar. Both are optional and can be toggled via settings.
 */
export class StatusBarController {
	private readonly balanceItem: vscode.StatusBarItem;
	private readonly speedItem: vscode.StatusBarItem;
	private readonly disposables: vscode.Disposable[] = [];

	constructor(private readonly options: StatusBarControllerOptions) {
		this.balanceItem = vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Right,
			100,
		);
		this.speedItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
		this.disposables.push(this.balanceItem, this.speedItem);

		this.disposables.push(
			this.options.balanceService.onDidChange((snapshot) => this.updateBalance(snapshot)),
			vscode.workspace.onDidChangeConfiguration((event) => {
				if (
					event.affectsConfiguration(`${CONFIG_SECTION}.statusBar.balance`) ||
					event.affectsConfiguration(`${CONFIG_SECTION}.statusBar.tokenSpeed`)
				) {
					this.refreshVisibility();
				}
			}),
		);

		this.updateBalance(this.options.balanceService.getBalance());
	}

	/** Create a tracker that streams live token speed into the status bar. */
	createSpeedTracker(): StreamSpeedTracker {
		const speedItem = this.speedItem;
		const { getCharsPerToken, getShowTokenSpeed } = this.options;

		let startTime: number | undefined;
		let chars = 0;
		let updateTimer: ReturnType<typeof setTimeout> | undefined;
		let finalTimer: ReturnType<typeof setTimeout> | undefined;
		let hidden = true;

		const clearUpdateTimer = (): void => {
			if (updateTimer !== undefined) {
				clearTimeout(updateTimer);
				updateTimer = undefined;
			}
		};

		const clearFinalTimer = (): void => {
			if (finalTimer !== undefined) {
				clearTimeout(finalTimer);
				finalTimer = undefined;
			}
		};

		const update = (): void => {
			if (startTime === undefined) {
				return;
			}
			const elapsed = (Date.now() - startTime) / 1000;
			if (elapsed <= 0) {
				return;
			}
			const tokens = chars / Math.max(getCharsPerToken(), 1);
			const speed = tokens / elapsed;

			if (Number.isFinite(speed) && speed >= 0) {
				speedItem.text = t('statusBar.tokenSpeed.label', speed.toFixed(1));
				speedItem.tooltip = t('statusBar.tokenSpeed.tooltip', speed.toFixed(1));
				speedItem.show();
				hidden = false;
			}
		};

		const scheduleUpdate = (): void => {
			if (updateTimer !== undefined) {
				return;
			}
			updateTimer = setTimeout(() => {
				updateTimer = undefined;
				update();
			}, SPEED_UPDATE_INTERVAL_MS);
		};

		return {
			begin(): void {
				startTime = undefined;
				chars = 0;
				clearFinalTimer();
				speedItem.hide();
				hidden = true;
			},
			onChars(count: number): void {
				if (!getShowTokenSpeed()) {
					return;
				}
				if (startTime === undefined) {
					startTime = Date.now();
				}
				chars += count;
				scheduleUpdate();
			},
			finish(): void {
				clearUpdateTimer();
				update();
				if (hidden || !getShowTokenSpeed()) {
					speedItem.hide();
					startTime = undefined;
					chars = 0;
					return;
				}
				finalTimer = setTimeout(() => {
					speedItem.hide();
					startTime = undefined;
					chars = 0;
					hidden = true;
				}, FINAL_SPEED_DURATION_MS);
			},
		};
	}

	dispose(): void {
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
		this.disposables.length = 0;
	}

	refreshVisibility(): void {
		this.updateBalance(this.options.balanceService.getBalance());
		if (!this.options.getShowTokenSpeed()) {
			this.speedItem.hide();
		}
	}

	private updateBalance(snapshot: BalanceSnapshot | undefined): void {
		if (!this.options.getShowBalance() || !snapshot) {
			this.balanceItem.hide();
			return;
		}

		const symbol = snapshot.currency === 'CNY' ? '¥' : '$';
		const amount = formatMoney(snapshot.amount);
		const providerName =
			getProviderDescriptor(snapshot.provider as ApiProvider)?.displayName ?? snapshot.provider;
		this.balanceItem.text = t('statusBar.balance.label', `${symbol}${amount}`);
		this.balanceItem.tooltip = t('statusBar.balance.tooltip', providerName);
		this.balanceItem.command = 'multi-model-for-copilot.refreshBalance';
		this.balanceItem.show();
	}
}

function formatMoney(amount: number): string {
	return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}
