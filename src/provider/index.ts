import vscode from 'vscode';
import { AuthManager } from '../auth';
import { getShowBalanceStatusBar, getShowPricingNotice, getShowTokenSpeedStatusBar, getStabilizeToolListEnabled } from '../config';
import { MODELS } from '../consts';
import { t } from '../i18n';
import { logger } from '../logger';
import { getProviderDescriptor } from '../provider-registry';
import type { ApiProvider } from '../types';
import { StatusBarController } from '../runtime/status-bar';
import { createCacheDiagnosticsRecorder, dumpProviderInput } from './debug';
import { toChatInfo } from './models';
import { BalanceService } from './pricing/balance';
import { BalanceCurrencyResolver } from './pricing/currency';
import { PricingRefreshScheduler } from './pricing/schedule';
import { prepareChatRequest } from './request';
import { classifyProviderRequest } from './routing';
import { resolveConversationSegment } from './segment';
import { streamChatCompletion } from './stream';
import { estimateTokenCount } from './tokens';
import { processToolFlow } from './tools/flow';
import { createVisionService } from './vision';

/**
 * Multi-Model Chat Provider — implements vscode.LanguageModelChatProvider so
 * models from every configured provider appear in the Copilot Chat model picker.
 */
export class ChatProvider implements vscode.LanguageModelChatProvider {
	private readonly authManager: AuthManager;
	private readonly globalStorageUri: vscode.Uri;
	private readonly storageUri: vscode.Uri | undefined;
	private readonly onDidChangeLanguageModelChatInformationEmitter = new vscode.EventEmitter<void>();

	readonly onDidChangeLanguageModelChatInformation =
		this.onDidChangeLanguageModelChatInformationEmitter.event;

	private readonly cacheDiagnostics = createCacheDiagnosticsRecorder();

	/** Vision proxy: internal bridge + VS Code LM fallback. */
	private readonly vision: ReturnType<typeof createVisionService>;
	private readonly balanceCurrencyResolver: BalanceCurrencyResolver;
	private readonly balanceService: BalanceService;
	private readonly statusBar: StatusBarController;
	private readonly pricingRefreshScheduler: PricingRefreshScheduler;

	/**
	 * Adaptive chars-per-token ratio, calibrated from actual usage data.
	 * Updated via exponential moving average each time the API reports real token counts.
	 */
	private charsPerToken = 4.0;

	constructor(context: vscode.ExtensionContext) {
		this.authManager = new AuthManager(context);
		this.globalStorageUri = context.globalStorageUri;
		this.storageUri = context.storageUri;
		this.vision = createVisionService(context);
		this.balanceCurrencyResolver = new BalanceCurrencyResolver(context, this.authManager, () =>
			this.onDidChangeLanguageModelChatInformationEmitter.fire(),
		);
		this.balanceService = new BalanceService(this.authManager);
		this.statusBar = new StatusBarController({
			balanceService: this.balanceService,
			getCharsPerToken: () => this.charsPerToken,
			getShowBalance: getShowBalanceStatusBar,
			getShowTokenSpeed: getShowTokenSpeedStatusBar,
		});
		this.balanceService.startPeriodicRefresh();
		this.balanceService.refreshInBackground();
		this.pricingRefreshScheduler = new PricingRefreshScheduler(() =>
			this.onDidChangeLanguageModelChatInformationEmitter.fire(),
		);

		context.subscriptions.push(
			this.onDidChangeLanguageModelChatInformationEmitter,
			this.balanceService,
			this.pricingRefreshScheduler,
			{ dispose: () => this.statusBar.dispose() },
			// Settings-based fallback API key + base URL changes.
			vscode.workspace.onDidChangeConfiguration((e) => {
				if (
					e.affectsConfiguration('multi-model-for-copilot.apiKey') ||
					e.affectsConfiguration('multi-model-for-copilot.mimoApiKey')
				) {
					this.invalidateCurrencyAndRefreshModels();
				}
			}),
			// Multi-window: SecretStorage changes don't fire onDidChangeConfiguration.
			// When another window sets/clears the API key, refresh this window's
			// model picker so the warning state stays in sync.
			context.secrets.onDidChange((e) => {
				if (
					e.key === 'multi-model-for-copilot.apiKey' ||
					e.key === 'multi-model-for-copilot.mimoApiKey'
				) {
					this.invalidateCurrencyAndRefreshModels();
				}
			}),
		);
	}

	// ---- Public commands ----

	async configureApiKey(): Promise<void> {
		const saved = await this.authManager.promptForApiKey();
		if (saved) {
			this.invalidateCurrencyAndRefreshModels();
		}
	}

	async configureMiMoApiKey(): Promise<void> {
		const saved = await this.authManager.promptForApiKey('mimo');
		if (saved) {
			this.invalidateCurrencyAndRefreshModels();
		}
	}

	async clearApiKey(): Promise<void> {
		if (!(await this.confirmClearApiKey('deepseek'))) return;
		await this.authManager.deleteApiKey();
		this.invalidateCurrencyAndRefreshModels();
		vscode.window.showInformationMessage(t('auth.removed'));
	}

	async clearMiMoApiKey(): Promise<void> {
		if (!(await this.confirmClearApiKey('mimo'))) return;
		await this.authManager.deleteApiKey('mimo');
		this.invalidateCurrencyAndRefreshModels();
		vscode.window.showInformationMessage(t('auth.removed'));
	}

	async configureQwenApiKey(): Promise<void> {
		const saved = await this.authManager.promptForApiKey('qwen');
		if (saved) {
			this.invalidateCurrencyAndRefreshModels();
		}
	}

	async clearQwenApiKey(): Promise<void> {
		if (!(await this.confirmClearApiKey('qwen'))) return;
		await this.authManager.deleteApiKey('qwen');
		this.invalidateCurrencyAndRefreshModels();
		vscode.window.showInformationMessage(t('auth.removed'));
	}

	private async confirmClearApiKey(provider: ApiProvider): Promise<boolean> {
		const descriptor = getProviderDescriptor(provider);
		const clearAction = t('auth.clearAction');
		const selected = await vscode.window.showWarningMessage(
			t('auth.clearConfirm', descriptor?.displayName ?? provider),
			{ modal: true, detail: t('auth.clearDetail') },
			clearAction,
		);
		return selected === clearAction;
	}

	async hasApiKey(): Promise<boolean> {
		return this.authManager.hasApiKey();
	}

	/** Re-fetch the account balance shown in the status bar. */
	refreshBalance(): void {
		this.balanceService.refreshInBackground(true);
	}

	/** Force Copilot Chat to re-query model information (including configurationSchema). */
	refreshModelPicker(): void {
		this.onDidChangeLanguageModelChatInformationEmitter.fire();
	}

	private invalidateCurrencyAndRefreshModels(): void {
		void Promise.all([
			this.balanceCurrencyResolver.invalidate().catch((error) =>
				logger.warn('Failed to invalidate balance currency', error),
			),
			this.balanceService.invalidate().catch((error) =>
				logger.warn('Failed to invalidate balance', error),
			),
		]).finally(() => {
			this.balanceService.refreshInBackground(true);
			this.onDidChangeLanguageModelChatInformationEmitter.fire();
		});
	}

	async setVisionModel(): Promise<void> {
		await this.vision.openConfiguration();
	}

	// ---- LanguageModelChatProvider ----

	async provideLanguageModelChatInformation(
		_options: vscode.PrepareLanguageModelChatModelOptions,
		_token: vscode.CancellationToken,
	): Promise<vscode.LanguageModelChatInformation[]> {
		const pricingCurrency = this.balanceCurrencyResolver.getDisplayCurrency();

		// Check key availability for all providers once.
		const keyAvailability: Record<string, boolean> = {};
		for (const model of MODELS) {
			if (!(model.provider in keyAvailability)) {
				keyAvailability[model.provider] = await this.authManager.hasApiKey(model.provider);
			}
		}

		const hasAnyKey = Object.values(keyAvailability).some(Boolean);
		if (hasAnyKey) {
			this.balanceCurrencyResolver.refreshInBackground();
			this.balanceService.refreshInBackground();
		}

		return MODELS.map((model) =>
			toChatInfo(
				model,
				keyAvailability[model.provider] ?? false,
				pricingCurrency,
				getShowPricingNotice(),
			),
		);
	}

	async provideLanguageModelChatResponse(
		modelInfo: vscode.LanguageModelChatInformation,
		messages: readonly vscode.LanguageModelChatRequestMessage[],
		options: vscode.ProvideLanguageModelChatResponseOptions,
		progress: vscode.Progress<vscode.LanguageModelResponsePart>,
		token: vscode.CancellationToken,
	): Promise<void> {
		const segment = resolveConversationSegment(messages);
		const requestKind = classifyProviderRequest({
			messages,
			tools: options.tools,
		});

		dumpProviderInput({
			globalStorageUri: this.globalStorageUri,
			segment,
			modelInfo,
			messages,
			requestOptions: options,
			requestKind,
		});

		const toolFlow = processToolFlow({
			stabilizeToolList: getStabilizeToolListEnabled(),
			messages,
			tools: options.tools,
			progress,
			requestKind,
		});
		if (toolFlow.preflightHandled) {
			return;
		}

		const prepared = await prepareChatRequest({
			authManager: this.authManager,
			globalStorageUri: this.globalStorageUri,
			storageUri: this.storageUri,
			modelInfo,
			segment,
			messages: toolFlow.messages,
			options,
			token,
			cacheDiagnostics: this.cacheDiagnostics,
			getVisionDescriber: () => this.vision.get(),
		});

		return streamChatCompletion({
			prepared,
			progress,
			token,
			initialResponseNotice: joinInitialResponseNotices(
				toolFlow.initialResponseNotice,
				prepared.initialResponseNotice,
			),
			getCharsPerToken: () => this.charsPerToken,
			setCharsPerToken: (charsPerToken) => {
				this.charsPerToken = charsPerToken;
			},
			speedTracker: this.statusBar.createSpeedTracker(),
		});
	}

	async provideTokenCount(
		_modelInfo: vscode.LanguageModelChatInformation,
		text: string | vscode.LanguageModelChatRequestMessage,
		_token: vscode.CancellationToken,
	): Promise<number> {
		return estimateTokenCount(text, this.charsPerToken);
	}
}

function joinInitialResponseNotices(...notices: (string | undefined)[]): string | undefined {
	const joined = notices.filter((notice) => notice && notice.trim().length > 0).join('\n');
	return joined || undefined;
}
