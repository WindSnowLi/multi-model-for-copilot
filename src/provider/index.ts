import vscode from 'vscode';
import { AuthManager } from '../auth';
import { discoverModels, getBaseUrl, getCustomModels, getCustomModelSecretKey, getStabilizeToolListEnabled } from '../config';
import { CONFIG_SECTION, getAllModels, MODELS } from '../consts';
import { t } from '../i18n';
import { logger } from '../logger';
import { createCacheDiagnosticsRecorder, dumpProviderInput } from './debug';
import { toChatInfo } from './models';
import { BalanceCurrencyResolver } from './pricing/currency';
import { prepareChatRequest } from './request';
import { classifyProviderRequest } from './routing';
import { resolveConversationSegment } from './segment';
import { streamChatCompletion } from './stream';
import { estimateTokenCount } from './tokens';
import { processToolFlow } from './tools/flow';
import { createVisionService } from './vision';

/**
 * DeepSeek Chat Provider — implements vscode.LanguageModelChatProvider so
 * Models appear directly in the Copilot Chat model picker.
 */
export class ChatProvider implements vscode.LanguageModelChatProvider {
	private readonly authManager: AuthManager;
	private readonly globalStorageUri: vscode.Uri;
	private readonly onDidChangeLanguageModelChatInformationEmitter = new vscode.EventEmitter<void>();
	private isActive = true;

	readonly onDidChangeLanguageModelChatInformation =
		this.onDidChangeLanguageModelChatInformationEmitter.event;

	private readonly cacheDiagnostics = createCacheDiagnosticsRecorder();

	/** Vision proxy: internal bridge + VS Code LM fallback. */
	private readonly vision: ReturnType<typeof createVisionService>;
	private readonly balanceCurrencyResolver: BalanceCurrencyResolver;

	/**
	 * Adaptive chars-per-token ratio, calibrated from actual usage data.
	 * Updated via exponential moving average each time the API reports real token counts.
	 */
	private charsPerToken = 4.0;

	constructor(context: vscode.ExtensionContext) {
		this.authManager = new AuthManager(context);
		this.globalStorageUri = context.globalStorageUri;
		this.vision = createVisionService(context);
		this.balanceCurrencyResolver = new BalanceCurrencyResolver(context, this.authManager, () =>
			this.onDidChangeLanguageModelChatInformationEmitter.fire(),
		);

		context.subscriptions.push(
			this.onDidChangeLanguageModelChatInformationEmitter,
			// Settings-based fallback API key + base URL changes.
			vscode.workspace.onDidChangeConfiguration((e) => {
				if (
					e.affectsConfiguration('multi-model-for-copilot.apiKey') ||
					e.affectsConfiguration('multi-model-for-copilot.baseUrl') ||
					e.affectsConfiguration('multi-model-for-copilot.mimoApiKey') ||
					e.affectsConfiguration('multi-model-for-copilot.mimoBaseUrl') ||
					e.affectsConfiguration('multi-model-for-copilot.customModels')
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
		await this.authManager.deleteApiKey();
		this.invalidateCurrencyAndRefreshModels();
		vscode.window.showInformationMessage(t('auth.removed'));
	}

	async clearMiMoApiKey(): Promise<void> {
		await this.authManager.deleteApiKey('mimo');
		this.invalidateCurrencyAndRefreshModels();
		vscode.window.showInformationMessage(t('auth.removed'));
	}

	async hasApiKey(): Promise<boolean> {
		return this.authManager.hasApiKey();
	}

	/** Force Copilot Chat to re-query model information (including configurationSchema). */
	refreshModelPicker(): void {
		this.onDidChangeLanguageModelChatInformationEmitter.fire();
	}

	private invalidateCurrencyAndRefreshModels(): void {
		void this.balanceCurrencyResolver
			.invalidate()
			.catch((error) => logger.warn('Failed to invalidate balance currency', error))
			.finally(() => this.onDidChangeLanguageModelChatInformationEmitter.fire());
	}

	async prepareForDeactivate(): Promise<void> {
		this.isActive = false;
		this.onDidChangeLanguageModelChatInformationEmitter.fire();

		// Force the host to re-pull `provideLanguageModelChatInformation` synchronously
		// before the extension unloads. With `isActive = false` we now return [],
		// which makes Copilot Chat drop models from the picker immediately
		// instead of leaving stale entries behind after deactivate.
		// This is best-effort — Canceled errors are expected during VS Code shutdown.
		try {
			await vscode.lm.selectChatModels({ vendor: 'deepseek' });
		} catch {
			// Silently ignore — VS Code may already be shutting down
		}
	}

	async setVisionModel(): Promise<void> {
		await this.vision.openConfiguration();
	}

	async addCustomModel(): Promise<void> {
		const id = await vscode.window.showInputBox({
			prompt: t('customModel.prompt.id'),
			placeHolder: 'my-gpt-4o',
			ignoreFocusOut: true,
		});
		if (!id?.trim()) return;

		const name = await vscode.window.showInputBox({
			prompt: t('customModel.prompt.name'),
			placeHolder: 'GPT-4o (Custom)',
			ignoreFocusOut: true,
		});
		if (!name?.trim()) return;

		const baseUrl = await vscode.window.showInputBox({
			prompt: t('customModel.prompt.baseUrl'),
			placeHolder: 'https://api.openai.com/v1',
			ignoreFocusOut: true,
		});
		if (!baseUrl?.trim()) return;

		const modelId = await vscode.window.showInputBox({
			prompt: t('customModel.prompt.modelId'),
			placeHolder: 'gpt-4o',
			ignoreFocusOut: true,
		});
		if (!modelId?.trim()) return;

		const toolCalling = await vscode.window.showQuickPick(
			[
				{ label: t('customModel.toolCalling.true'), value: true },
				{ label: t('customModel.toolCalling.false'), value: false },
			],
			{ placeHolder: t('customModel.prompt.toolCalling') },
		);
		if (!toolCalling) return;

		const imageInput = await vscode.window.showQuickPick(
			[
				{ label: t('customModel.imageInput.true'), value: true },
				{ label: t('customModel.imageInput.false'), value: false },
			],
			{ placeHolder: t('customModel.prompt.imageInput') },
		);
		if (!imageInput) return;

		const thinking = await vscode.window.showQuickPick(
			[
				{ label: t('customModel.thinking.true'), value: true },
				{ label: t('customModel.thinking.false'), value: false },
			],
			{ placeHolder: t('customModel.prompt.thinking') },
		);
		if (!thinking) return;

		const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
		const customModels = config.get<Array<Record<string, unknown>>>('customModels', []);

		// Check for duplicate ID
		if (customModels.some((m) => m.id === id.trim())) {
			vscode.window.showErrorMessage(t('customModel.error.duplicateId', id.trim()));
			return;
		}

		const newModel: Record<string, unknown> = {
			id: id.trim(),
			name: name.trim(),
			baseUrl: baseUrl.trim(),
			modelId: modelId.trim(),
			toolCalling: toolCalling.value,
			imageInput: imageInput.value,
			thinking: thinking.value,
		};

		customModels.push(newModel);
		await config.update('customModels', customModels, vscode.ConfigurationTarget.Global);

		// Prompt for API key
		const apiKey = await vscode.window.showInputBox({
			prompt: t('customModel.prompt.apiKey'),
			placeHolder: 'sk-...',
			password: true,
			ignoreFocusOut: true,
		});
		if (apiKey?.trim()) {
			await this.authManager.setApiKeyForSecret(getCustomModelSecretKey(id.trim()), apiKey.trim());
		}

		this.onDidChangeLanguageModelChatInformationEmitter.fire();
		vscode.window.showInformationMessage(t('customModel.added', name.trim()));
	}

	async removeCustomModel(): Promise<void> {
		const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
		const customModels = config.get<Array<Record<string, unknown>>>('customModels', []);

		if (customModels.length === 0) {
			vscode.window.showInformationMessage(t('customModel.none'));
			return;
		}

		const picks = customModels.map((m) => ({
			label: (m.name as string) || (m.id as string),
			description: m.baseUrl as string,
			id: m.id as string,
		}));

		const selected = await vscode.window.showQuickPick(picks, {
			placeHolder: t('customModel.prompt.remove'),
		});
		if (!selected) return;

		const updated = customModels.filter((m) => m.id !== selected.id);
		await config.update('customModels', updated, vscode.ConfigurationTarget.Global);

		this.onDidChangeLanguageModelChatInformationEmitter.fire();
		vscode.window.showInformationMessage(t('customModel.removed', selected.label));
	}

	async discoverAndAddModels(): Promise<void> {
		// Check which providers already have keys
		const hasDeepSeekKey = await this.authManager.hasApiKey('deepseek');
		const hasMiMoKey = await this.authManager.hasApiKey('mimo');

		const source = await vscode.window.showQuickPick(
			[
				{
					label: 'DeepSeek (api.deepseek.com)',
					description: hasDeepSeekKey ? '✓ API Key configured' : '',
					value: 'deepseek',
				},
				{
					label: 'MiMo (api.xiaomimimo.com)',
					description: hasMiMoKey ? '✓ API Key configured' : '',
					value: 'mimo',
				},
				{ label: t('customModel.discover.customUrl'), value: 'custom' },
			],
			{ placeHolder: t('customModel.discover.pickSource') },
		);
		if (!source) return;

		let baseUrl: string;
		let apiKey: string;
		let authHeader = 'Authorization';
		let authPrefix = 'Bearer ';

		if (source.value === 'deepseek') {
			baseUrl = getBaseUrl('deepseek');
			apiKey = (await this.authManager.getApiKey('deepseek')) ?? '';
			if (!apiKey) {
				vscode.window.showErrorMessage(t('customModel.discover.noKey', 'DeepSeek'));
				return;
			}
		} else if (source.value === 'mimo') {
			baseUrl = 'https://api.xiaomimimo.com/v1';
			apiKey = (await this.authManager.getApiKey('mimo')) ?? '';
			authHeader = 'api-key';
			authPrefix = '';
			if (!apiKey) {
				vscode.window.showErrorMessage(t('customModel.discover.noKey', 'MiMo'));
				return;
			}
		} else {
			const url = await vscode.window.showInputBox({
				prompt: t('customModel.discover.enterUrl'),
				placeHolder: 'https://api.example.com/v1',
				ignoreFocusOut: true,
			});
			if (!url?.trim()) return;
			baseUrl = url.trim();

			const key = await vscode.window.showInputBox({
				prompt: t('customModel.discover.enterKey'),
				placeHolder: 'sk-...',
				password: true,
				ignoreFocusOut: true,
			});
			if (!key?.trim()) return;
			apiKey = key.trim();
		}

		let discovered: Awaited<ReturnType<typeof discoverModels>>;
		try {
			discovered = await discoverModels(baseUrl, apiKey, authHeader, authPrefix);
		} catch (error) {
			vscode.window.showErrorMessage(
				t('customModel.discover.failed', error instanceof Error ? error.message : String(error)),
			);
			return;
		}

		if (discovered.length === 0) {
			vscode.window.showInformationMessage(t('customModel.discover.empty'));
			return;
		}

		// Filter out built-in model IDs and already-added custom models
		const builtInIds = new Set(MODELS.map((m) => m.id));
		const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
		const existing = config.get<Array<Record<string, unknown>>>('customModels', []);
		const existingIds = new Set(existing.map((m) => m.id as string));

		const picks = discovered
			.filter((m) => !builtInIds.has(m.id) && !existingIds.has(m.id))
			.map((m) => ({
				label: m.id,
				description: m.owned_by,
				picked: false,
			}));

		if (picks.length === 0) {
			vscode.window.showInformationMessage(t('customModel.discover.allExist'));
			return;
		}

		const selected = await vscode.window.showQuickPick(picks, {
			placeHolder: t('customModel.discover.selectModels'),
			canPickMany: true,
		});
		if (!selected || selected.length === 0) return;

		// Add selected models to customModels
		const useMaxCompletionTokens = source.value === 'mimo';
		const newModels = selected.map((s) => ({
			id: s.label,
			name: s.label,
			baseUrl,
			modelId: s.label,
			authHeader,
			authPrefix,
			maxInputTokens: 1000000,
			maxOutputTokens: 128000,
			toolCalling: true,
			imageInput: false,
			thinking: true,
			useMaxCompletionTokens,
		}));

		const updated = [...existing, ...newModels];
		await config.update('customModels', updated, vscode.ConfigurationTarget.Global);

		// Store API key for custom endpoints
		if (source.value === 'custom') {
			const secretKey = getCustomModelSecretKey(selected[0].label);
			await this.authManager.setApiKeyForSecret(secretKey, apiKey);
		}

		this.onDidChangeLanguageModelChatInformationEmitter.fire();
		vscode.window.showInformationMessage(t('customModel.discover.added', selected.length.toString()));
	}

	// ---- LanguageModelChatProvider ----

	async provideLanguageModelChatInformation(
		_options: vscode.PrepareLanguageModelChatModelOptions,
		_token: vscode.CancellationToken,
	): Promise<vscode.LanguageModelChatInformation[]> {
		if (!this.isActive) {
			return [];
		}

		const pricingCurrency = this.balanceCurrencyResolver.getDisplayCurrency();
		const hasDeepSeekKey = await this.authManager.hasApiKey('deepseek');
		const hasMiMoKey = await this.authManager.hasApiKey('mimo');
		const customConfigs = getCustomModels();

		if (hasDeepSeekKey || hasMiMoKey) {
			this.balanceCurrencyResolver.refreshInBackground();
		}

		const allModels = getAllModels(customConfigs);
		return allModels.map((model) => {
			let hasKey: boolean;
			if (model.provider === 'mimo') {
				hasKey = hasMiMoKey;
			} else if (model.provider === 'custom') {
				hasKey = true; // custom models always appear; missing key shown via detail
			} else {
				hasKey = hasDeepSeekKey;
			}
			return toChatInfo(model, hasKey, pricingCurrency);
		});
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
