import vscode from 'vscode';
import { AuthManager } from '../auth';
import { ApiClient } from '../client';
import { getApiModelId, getBaseUrl, getCustomModels, getCustomModelSecretKey, getMaxTokens } from '../config';
import { getAllModels } from '../consts';
import { isOfficialProviderBaseUrl } from '../endpoint';
import { t } from '../i18n';
import type { ChatCompletionRequest } from '../types';
import { convertMessages, countMessageChars } from './convert';
import {
	dumpChatCompletionRequest,
	type CacheDiagnosticsRecorder,
	type CacheDiagnosticsRun,
} from './debug';
import { getConfiguredThinkingEffort, type ModelConfigurationOptions } from './models';
import type { ReplayMarkerMetadata } from './replay';
import { classifyChatCompletionRequest, shouldForceThinkingNone, type RequestKind } from './routing';
import type { ConversationSegment } from './segment';
import { collectTrailingToolResultIds, prepareRequestTools } from './tools/request';
import { resolveImageMessages, type VisionDescriber } from './vision';

export interface PreparedChatRequest {
	client: ApiClient;
	request: ChatCompletionRequest;
	isThinkingModel: boolean;
	totalRequestChars: number;
	trailingToolResultIds: string[];
	cacheDiagnostics: CacheDiagnosticsRun;
	requestKind: RequestKind;
	segment: ConversationSegment;
	replayMarkerMetadata: ReplayMarkerMetadata;
	visionMarkerTextChars?: number;
	initialResponseNotice?: string;
}

export interface PrepareChatRequestOptions {
	authManager: AuthManager;
	globalStorageUri: vscode.Uri;
	modelInfo: vscode.LanguageModelChatInformation;
	segment: ConversationSegment;
	messages: readonly vscode.LanguageModelChatRequestMessage[];
	options: vscode.ProvideLanguageModelChatResponseOptions;
	token: vscode.CancellationToken;
	cacheDiagnostics: CacheDiagnosticsRecorder;
	getVisionDescriber: () => Promise<VisionDescriber | undefined>;
}

export async function prepareChatRequest({
	authManager,
	globalStorageUri,
	modelInfo,
	segment,
	messages,
	options,
	token,
	cacheDiagnostics,
	getVisionDescriber,
}: PrepareChatRequestOptions): Promise<PreparedChatRequest> {
	const customConfigs = getCustomModels();
	const allModels = getAllModels(customConfigs);
	const modelDef = allModels.find((m) => m.id === modelInfo.id);
	const customCfg = customConfigs.find((m) => m.id === modelInfo.id);

	// For custom models, get API key from model-specific secret; otherwise use provider key
	const secretKey = customCfg ? getCustomModelSecretKey(customCfg.id) : undefined;
	const apiKey = customCfg
		? await authManager.getApiKeyForSecret(secretKey!)
		: await authManager.getApiKey(modelDef?.provider);
	if (!apiKey) {
		throw new Error(t('auth.notConfigured'));
	}

	// Custom models use their own baseUrl; built-in models use settings
	const baseUrl = customCfg ? customCfg.baseUrl.replace(/\/+$/u, '') : getBaseUrl(modelDef?.provider);
	const provider = customCfg ? 'deepseek' : (modelDef?.provider ?? 'deepseek'); // custom models use DeepSeek-style auth by default
	const client = new ApiClient(baseUrl, apiKey, provider, customCfg);
	const isThinkingModel = modelDef?.capabilities.thinking ?? false;
	const maxTokens = getMaxTokens();

	const visionResolution = await resolveImageMessages(messages, token, getVisionDescriber, modelDef?.capabilities.imageInput);
	const resolvedMessages = visionResolution.messages;
	const ChatMessages = convertMessages(resolvedMessages, isThinkingModel, modelDef?.capabilities.imageInput);
	const tools = prepareRequestTools(modelDef?.capabilities.toolCalling, options);

	const totalRequestChars = countMessageChars(ChatMessages);
	const isMimo = modelDef?.provider === 'mimo';
	const useMaxCompletionTokens = isMimo || customCfg?.useMaxCompletionTokens;
	const baseRequest: ChatCompletionRequest = {
		model: customCfg ? customCfg.modelId : getApiModelId(modelInfo.id),
		messages: ChatMessages,
		stream: true,
		tools,
		tool_choice: tools && tools.length > 0 ? ('auto' as const) : undefined,
		// MiMo and custom models with useMaxCompletionTokens use OpenAI-style max_completion_tokens
		...(useMaxCompletionTokens ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens }),
	};
	const requestKind = classifyChatCompletionRequest({
		request: baseRequest,
		inputMessages: messages,
	});
	const configuredThinkingEffort = getConfiguredThinkingEffort(
		options as ModelConfigurationOptions,
	);
	// Only force helper requests into disabled thinking on the official API.
	// Custom endpoints keep their configured effort to preserve pre-#137 request shape.
	const forceNoneThinking =
		shouldForceThinkingNone(requestKind) && isOfficialProviderBaseUrl(baseUrl, modelDef?.provider ?? 'deepseek');
	const thinkingEffort = forceNoneThinking ? 'none' : configuredThinkingEffort;
	const request: ChatCompletionRequest = {
		...baseRequest,
		...(isThinkingModel
			? isMimo
				? {
						...(thinkingEffort !== 'none' ? { reasoning_effort: thinkingEffort } : {}),
					}
				: customCfg?.requiresThinkingParam === false
					? {
							...(thinkingEffort !== 'none' ? { reasoning_effort: thinkingEffort } : {}),
						}
					: {
							thinking: {
								type: thinkingEffort === 'none' ? ('disabled' as const) : ('enabled' as const),
							},
							...(thinkingEffort === 'none' ? {} : { reasoning_effort: thinkingEffort }),
						}
			: {}),
	};
	dumpChatCompletionRequest(request, {
		globalStorageUri,
		segment,
		requestKind,
		vscodeModelId: modelInfo.id,
		isThinkingModel,
		thinkingEffort,
		maxTokens,
		inputMessages: messages,
		resolvedMessages,
		requestOptions: options,
		visionModelId: visionResolution.visionModelId,
		visionProxySource: visionResolution.visionProxySource,
		visionStats: visionResolution.stats,
	});

	const diagnosticsRun = cacheDiagnostics.beginRequest({
		request,
		segment,
		requestKind,
		vscodeModelId: modelInfo.id,
		isThinkingModel,
		thinkingEffort,
		maxTokens,
		inputMessages: messages,
		resolvedMessages,
		visionModelId: visionResolution.visionModelId,
		visionProxySource: visionResolution.visionProxySource,
		visionStats: visionResolution.stats,
	});

	return {
		client,
		request,
		isThinkingModel,
		totalRequestChars,
		trailingToolResultIds: collectTrailingToolResultIds(ChatMessages),
		cacheDiagnostics: diagnosticsRun,
		requestKind,
		segment,
		replayMarkerMetadata: visionResolution.replayMarkerMetadata,
		visionMarkerTextChars: visionResolution.stats.markerVisionTextChars || undefined,
		initialResponseNotice: visionResolution.initialResponseNotice,
	};
}
