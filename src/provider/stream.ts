import vscode from 'vscode';
import { createUserFacingError } from '../client';
import { logger } from '../logger';
import type { ChatToolCall, ChatUsage } from '../types';
import {
    observeCancellationToken,
    type CacheDiagnosticsRun,
    type ReplayMarkerReportTrigger,
} from './debug';
import {
    createReplayMarkerPart,
    hasReplayMarkerMetadata,
    type ReplayMarkerMetadata,
} from './replay';
import type { PreparedChatRequest } from './request';
import { formatRequestLogLine, type RequestKind } from './routing';

interface ResponseStreamState {
	accumulatedReasoning: string;
	emittedToolCallIds: string[];
	initialResponseNoticeReported: boolean;
	replayMarkerReported: boolean;
}

const COPILOT_USAGE_DATA_PART_MIME = 'usage';

/**
 * Optional hook for surfacing real-time stream metrics (e.g. token generation
 * speed) to the host UI while a response is being streamed.
 */
export interface StreamSpeedTracker {
	/** Called once when the stream begins producing output. */
	begin(): void;
	/** Called with the character count of the latest content/thinking delta. */
	onChars(chars: number): void;
	/** Called when the stream finishes or is aborted with an error. */
	finish(): void;
}

export interface StreamChatCompletionOptions {
	prepared: PreparedChatRequest;
	progress: vscode.Progress<vscode.LanguageModelResponsePart>;
	token: vscode.CancellationToken;
	initialResponseNotice?: string;
	getCharsPerToken: () => number;
	setCharsPerToken: (charsPerToken: number) => void;
	speedTracker?: StreamSpeedTracker;
}

export function streamChatCompletion({
	prepared,
	progress,
	token,
	initialResponseNotice,
	getCharsPerToken,
	setCharsPerToken,
	speedTracker,
}: StreamChatCompletionOptions): Promise<void> {
	const state: ResponseStreamState = {
		accumulatedReasoning: '',
		emittedToolCallIds: [],
		initialResponseNoticeReported: false,
		replayMarkerReported: false,
	};
	const cancelListener = observeCancellationToken(token, prepared.cacheDiagnostics);
	speedTracker?.begin();

	return prepared.client
		.streamChatCompletion(
			prepared.request,
			{
				onContent: (content: string) => {
					reportInitialResponseNoticeOnce(progress, state, initialResponseNotice);
					progress.report(new vscode.LanguageModelTextPart(content));
					speedTracker?.onChars(content.length);
				},

				onThinking: (text: string) => {
					reportInitialResponseNoticeOnce(progress, state, initialResponseNotice);
					handleThinking(text, state, progress);
					speedTracker?.onChars(text.length);
				},

				onToolCall: (toolCall: ChatToolCall) => {
					reportInitialResponseNoticeOnce(progress, state, initialResponseNotice);
					handleToolCall(toolCall, state, progress);
					speedTracker?.onChars(toolCall.function.arguments.length);
				},

				onError: (error: Error) => {
					throw createUserFacingError(error, prepared.request.model);
				},

				onDone: () => {
					reportReplayMarkerOnce(prepared, progress, state, 'done');
					finalizeReplayDiagnostics(
						prepared.trailingToolResultIds,
						state,
						prepared.cacheDiagnostics,
					);
				},

				onUsage: (usage) => {
					// Native-image requests include image token cost that our
					// char-based calibration cannot represent. Skip adapting the
					// charsPerToken ratio so image-heavy requests do not skew it.
					const charsPerToken = prepared.hasNativeImages
						? getCharsPerToken()
						: updateCharsPerToken(
								prepared.totalRequestChars,
								usage,
								getCharsPerToken(),
							);
					if (!prepared.hasNativeImages) {
						setCharsPerToken(charsPerToken);
					}
					prepared.cacheDiagnostics.onUsage(usage, charsPerToken);
					reportCopilotContextUsage(progress, usage, prepared.requestKind);
				},
			},
			token,
		)
		.then(undefined, (error) => {
			reportSkippedReplayMarkerIfNeeded(
				prepared,
				state,
				token.isCancellationRequested ? 'cancelled' : 'stream-error',
				error,
			);
			throw error;
		})
		.then(() => {
			if (token.isCancellationRequested) {
				reportSkippedReplayMarkerIfNeeded(prepared, state, 'cancelled');
			}
		})
		.finally(() => {
			speedTracker?.finish();
			cancelListener.dispose();
		});
}

function reportInitialResponseNoticeOnce(
	progress: vscode.Progress<vscode.LanguageModelResponsePart>,
	state: ResponseStreamState,
	initialResponseNotice: string | undefined,
): void {
	if (!initialResponseNotice || state.initialResponseNoticeReported) {
		return;
	}
	state.initialResponseNoticeReported = true;
	progress.report(new vscode.LanguageModelTextPart(initialResponseNotice));
}

function reportReplayMarkerOnce(
	prepared: PreparedChatRequest,
	progress: vscode.Progress<vscode.LanguageModelResponsePart>,
	state: ResponseStreamState,
	trigger: ReplayMarkerReportTrigger,
): void {
	if (state.replayMarkerReported) {
		return;
	}
	state.replayMarkerReported = true;
	reportReplayMarker(prepared, progress, state, trigger);
}

function reportSkippedReplayMarkerIfNeeded(
	prepared: PreparedChatRequest,
	state: ResponseStreamState,
	reason: 'cancelled' | 'stream-error',
	error?: unknown,
): void {
	if (state.replayMarkerReported) {
		return;
	}
	state.replayMarkerReported = true;
	prepared.cacheDiagnostics.onReplayMarkerReport({
		status: 'skipped',
		reason,
		visionTextChars: prepared.visionMarkerTextChars,
		reasoningTextChars: state.accumulatedReasoning.length || undefined,
		error,
	});
}

function reportReplayMarker(
	prepared: PreparedChatRequest,
	progress: vscode.Progress<vscode.LanguageModelResponsePart>,
	state: ResponseStreamState,
	trigger: ReplayMarkerReportTrigger,
): void {
	const metadata = getReplayMarkerMetadata(prepared, state);
	if (!hasReplayMarkerMetadata(metadata)) {
		prepared.cacheDiagnostics.onReplayMarkerReport({
			status: 'skipped',
			trigger,
			reason: 'no-replay-data',
			visionTextChars: prepared.visionMarkerTextChars,
			reasoningTextChars: state.accumulatedReasoning.length || undefined,
		});
		return;
	}

	try {
		const markerPart = createReplayMarkerPart(metadata);
		progress.report(markerPart);
		prepared.cacheDiagnostics.onReplayMarkerReport({
			status: 'reported',
			trigger,
			markerBytes: markerPart.data.byteLength,
			visionTextChars: prepared.visionMarkerTextChars,
			reasoningTextChars: state.accumulatedReasoning.length || undefined,
		});
	} catch (error) {
		prepared.cacheDiagnostics.onReplayMarkerReport({
			status: 'failed',
			trigger,
			visionTextChars: prepared.visionMarkerTextChars,
			reasoningTextChars: state.accumulatedReasoning.length || undefined,
			error,
		});
		logger.warn(
			formatRequestLogLine(prepared.requestKind, 'Failed to report replay marker'),
			error,
		);
	}
}

function getReplayMarkerMetadata(
	prepared: PreparedChatRequest,
	state: ResponseStreamState,
): ReplayMarkerMetadata {
	return {
		...prepared.replayMarkerMetadata,
		reasoningText: state.accumulatedReasoning || undefined,
	};
}

function handleThinking(
	text: string,
	state: ResponseStreamState,
	progress: vscode.Progress<vscode.LanguageModelResponsePart>,
): void {
	state.accumulatedReasoning += text;

	// LanguageModelThinkingPart is a proposed API; the project root augmentation provides types.
	progress.report(
		new vscode.LanguageModelThinkingPart(text) as unknown as vscode.LanguageModelResponsePart,
	);
}

function handleToolCall(
	toolCall: ChatToolCall,
	state: ResponseStreamState,
	progress: vscode.Progress<vscode.LanguageModelResponsePart>,
): void {
	state.emittedToolCallIds.push(toolCall.id);

	try {
		const args = JSON.parse(toolCall.function.arguments);
		progress.report(
			new vscode.LanguageModelToolCallPart(toolCall.id, toolCall.function.name, args),
		);
	} catch {
		progress.report(new vscode.LanguageModelToolCallPart(toolCall.id, toolCall.function.name, {}));
	}
}

function finalizeReplayDiagnostics(
	trailingToolResultIds: readonly string[],
	state: ResponseStreamState,
	cacheDiagnostics: CacheDiagnosticsRun,
): void {
	cacheDiagnostics.onDone({
		reasoningTextChars: state.accumulatedReasoning.length,
		emittedToolCalls: state.emittedToolCallIds.length,
		trailingToolResults: trailingToolResultIds.length,
	});
}

function updateCharsPerToken(
	totalRequestChars: number,
	usage: ChatUsage,
	charsPerToken: number,
): number {
	if (totalRequestChars > 0 && usage.prompt_tokens > 0) {
		const observedRatio = totalRequestChars / usage.prompt_tokens;
		return charsPerToken * 0.7 + observedRatio * 0.3;
	}
	return charsPerToken;
}

function reportCopilotContextUsage(
	progress: vscode.Progress<vscode.LanguageModelResponsePart>,
	usage: ChatUsage,
	requestKind: RequestKind,
): void {
	const data = {
		prompt_tokens: usage.prompt_tokens,
		completion_tokens: usage.completion_tokens,
		total_tokens: usage.total_tokens,
		prompt_tokens_details: {
			cached_tokens: usage.prompt_cache_hit_tokens ?? 0,
		},
	};

	try {
		progress.report(
			new vscode.LanguageModelDataPart(
				new TextEncoder().encode(JSON.stringify(data)),
				COPILOT_USAGE_DATA_PART_MIME,
			),
		);
	} catch (error) {
		logger.warn(formatRequestLogLine(requestKind, 'Failed to report usage data'), error);
	}
}
