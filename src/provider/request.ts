import vscode from 'vscode';
import { AuthManager } from '../auth';
import { ApiClient, createApiKeyNotConfiguredError } from '../client';
import { getMaxTokens, getRequestHeaders } from '../config';
import { MODELS } from '../consts';
import { getProviderDescriptor } from '../provider-registry';
import type { ChatCompletionRequest } from '../types';
import { convertMessages, countMessageChars } from './convert';
import {
	dumpChatCompletionRequest,
	type CacheDiagnosticsRecorder,
	type CacheDiagnosticsRun,
} from './debug';
import { resolveRequestHeaders } from './headers';
import {
	getConfiguredThinkingEffort,
	getModelThinkingEfforts,
	type ModelConfigurationOptions,
} from './models';
import type { ReplayMarkerMetadata } from './replay';
import {
	classifyChatCompletionRequest,
	shouldForceThinkingNone,
	type RequestKind,
} from './routing';
import type { ConversationSegment } from './segment';
import { collectTrailingToolResultIds, prepareRequestTools } from './tools/request';
import { resolveImageMessages, type VisionDescriber } from './vision';

export interface PreparedChatRequest {
	client: ApiClient;
	request: ChatCompletionRequest;
	isThinkingModel: boolean;
	totalRequestChars: number;
	/** Whether this request forwarded image parts natively to a native-image model. */
	hasNativeImages: boolean;
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
	/** Workspace-scoped storage URI, used to derive a stable conversation ID. */
	storageUri?: vscode.Uri;
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
	storageUri,
	modelInfo,
	segment,
	messages,
	options,
	token,
	cacheDiagnostics,
	getVisionDescriber,
}: PrepareChatRequestOptions): Promise<PreparedChatRequest> {
	const modelDef = MODELS.find((m) => m.id === modelInfo.id);

	const apiKey = await authManager.getApiKey(modelDef?.provider);
	if (!apiKey) {
		throw createApiKeyNotConfiguredError(modelInfo.name || modelInfo.id);
	}

	const baseUrl =
		getProviderDescriptor(modelDef?.provider ?? 'deepseek')?.defaultBaseUrl ??
		'https://api.deepseek.com';
	const provider = modelDef?.provider ?? 'deepseek';
	const requestHeaders = resolveRequestHeaders(getRequestHeaders(), options, storageUri);
	const client = new ApiClient(baseUrl, apiKey, provider, requestHeaders);
	const isThinkingModel = modelDef?.capabilities.thinking ?? false;
	const nativeImageInput = modelDef?.capabilities.nativeImageInput === true;
	const supportedThinkingEfforts = getModelThinkingEfforts(modelDef);
	const maxTokens = getMaxTokens();

	const visionResolution = await resolveImageMessages(
		messages,
		token,
		getVisionDescriber,
		nativeImageInput,
	);
	const resolvedMessages = visionResolution.messages;
	const ChatMessages = convertMessages(resolvedMessages, isThinkingModel, nativeImageInput);
	const tools = prepareRequestTools(modelDef?.capabilities.toolCalling, options);

	const totalRequestChars = countMessageChars(ChatMessages);
	// A request only counts as native-image when the converted payload actually
	// carries forwarded image data. Proxy-described images do not qualify.
	const hasNativeImages =
		nativeImageInput && ChatMessages.some((msg) => Boolean(msg.imageUrls?.length));
	const providerDesc = getProviderDescriptor(modelDef?.provider ?? 'deepseek');
	const useMaxCompletionTokens = providerDesc?.useMaxCompletionTokens ?? false;
	const baseRequest: ChatCompletionRequest = {
		model: modelInfo.id,
		messages: ChatMessages,
		stream: true,
		tools,
		// Respect the host's tool-selection mode: `Required` asks the model to call
		// one of the provided tools instead of answering directly.
		tool_choice:
			tools && tools.length > 0
				? options.toolMode === vscode.LanguageModelChatToolMode.Required
					? ('required' as const)
					: ('auto' as const)
				: undefined,
		// Some providers use OpenAI-style max_completion_tokens instead of max_tokens
		...(useMaxCompletionTokens ? { max_completion_tokens: maxTokens } : { max_tokens: maxTokens }),
	};
	const requestKind = classifyChatCompletionRequest({
		request: baseRequest,
		inputMessages: messages,
	});
	const configuredThinkingEffort = getConfiguredThinkingEffort(
		options as ModelConfigurationOptions,
		supportedThinkingEfforts,
	);
	// Helper requests run with thinking disabled.
	const thinkingEffort = shouldForceThinkingNone(requestKind) ? 'none' : configuredThinkingEffort;

	// Thinking parameter format is provider-specific:
	//   'reasoning_effort' → only reasoning_effort param (Qwen)
	//   'thinking_type'    → thinking: { type } + reasoning_effort (DeepSeek, MiMo)
	const thinkingFormat = providerDesc?.thinkingFormat ?? 'thinking_type';

	const request: ChatCompletionRequest = {
		...baseRequest,
		...(isThinkingModel
			? thinkingFormat === 'reasoning_effort'
				? thinkingEffort === 'none'
					? {}
					: { reasoning_effort: thinkingEffort }
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
		hasNativeImages,
		trailingToolResultIds: collectTrailingToolResultIds(ChatMessages),
		cacheDiagnostics: diagnosticsRun,
		requestKind,
		segment,
		replayMarkerMetadata: visionResolution.replayMarkerMetadata,
		visionMarkerTextChars: visionResolution.stats.markerVisionTextChars || undefined,
		initialResponseNotice: visionResolution.initialResponseNotice,
	};
}
