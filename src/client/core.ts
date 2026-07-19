import type { CancellationToken } from 'vscode';
import { safeStringify } from '../json';
import { logger } from '../logger';
import type {
    ApiProvider, ChatCompletionRequest, CustomModelConfig,
    ChatStreamChunk,
    ChatToolCall,
    ChatUsage,
    StreamCallbacks
} from '../types';
import { createHttpError, formatRequestError, normalizeRequestError } from './error';

/**
 * Lightweight SSE-streaming API client supporting multiple providers.
 * No external dependencies — uses Node's built-in fetch.
 */
export class ApiClient {
	constructor(
		private readonly baseUrl: string,
		private readonly apiKey: string,
		private readonly provider: ApiProvider = 'deepseek',
		private readonly customConfig?: CustomModelConfig,
	) {}

	/**
	 * Stream a chat completion from the API.
	 * Parses SSE chunks and dispatches callbacks for content, thinking, and tool calls.
	 */
	async streamChatCompletion(
		request: ChatCompletionRequest,
		callbacks: StreamCallbacks,
		cancellationToken?: CancellationToken,
	): Promise<void> {
		const controller = new AbortController();
		const cancelListener = cancellationToken?.onCancellationRequested(() => {
			controller.abort();
		});
		if (cancellationToken?.isCancellationRequested) {
			controller.abort();
		}

		try {
			// Request usage stats in streaming responses so we can calibrate token counting.
			const requestBody = {
				...request,
				messages: serializeMessagesWithImages(request.messages),
				stream_options: { include_usage: true },
			};

			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
			};

			// Custom models: use configured auth header/prefix
			if (this.customConfig) {
				const headerName = this.customConfig.authHeader || 'Authorization';
				const prefix = this.customConfig.authPrefix ?? 'Bearer ';
				headers[headerName] = `${prefix}${this.apiKey}`;
			} else if (this.provider === 'mimo') {
				// MiMo uses `api-key` header
				headers['api-key'] = this.apiKey;
			} else {
				// DeepSeek and others use `Authorization: Bearer`
				headers['Authorization'] = `Bearer ${this.apiKey}`;
			}

			const response = await fetch(`${this.baseUrl}/chat/completions`, {
				method: 'POST',
				headers,
				body: safeStringify(requestBody),
				signal: controller.signal,
			});

			if (!response.ok) {
				throw await createHttpError(response, { baseUrl: this.baseUrl, request });
			}

			if (!response.body) {
				throw new Error('No response body received');
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';
			let latestUsage: ChatUsage | undefined;

			// Accumulate tool call deltas by index, then emit on finish_reason=stop/tool_calls
			const pendingToolCalls = new Map<number, ChatToolCall>();

			while (true) {
				if (cancellationToken?.isCancellationRequested) {
					controller.abort();
					return;
				}

				const { done, value } = await reader.read();
				if (done) {
					break;
				}

				buffer += decoder.decode(value, { stream: true });

				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					const trimmed = line.trim();

					if (!trimmed || trimmed.startsWith(':')) {
						continue;
					}

					if (trimmed === 'data: [DONE]') {
						// Flush any remaining tool calls
						for (const tc of pendingToolCalls.values()) {
							callbacks.onToolCall(tc);
						}
						pendingToolCalls.clear();
						reportFinalUsage(callbacks, latestUsage);
						callbacks.onDone();
						return;
					}

					if (!trimmed.startsWith('data: ')) {
						continue;
					}

					const jsonStr = trimmed.slice(6);
					try {
						const chunk: ChatStreamChunk = JSON.parse(jsonStr);
						const choice = chunk.choices?.[0];

						// Some OpenAI-compatible providers emit usage on every streaming chunk.
						// Keep only the latest value and report it once when the stream completes.
						if (chunk.usage) {
							latestUsage = chunk.usage;
						}

						if (!choice) {
							continue;
						}

						// Thinking content → report with correct field name so VS Code renders collapsible blocks
						const reasoning = choice.delta.reasoning_content;
						if (reasoning) {
							callbacks.onThinking(reasoning);
						}

						// Regular content
						if (choice.delta.content) {
							callbacks.onContent(choice.delta.content);
						}

						// Tool calls — accumulate deltas by index
						if (choice.delta.tool_calls) {
							for (const tc of choice.delta.tool_calls) {
								let pending = pendingToolCalls.get(tc.index);
								if (!pending && tc.id) {
									pending = {
										id: tc.id,
										type: 'function',
										function: { name: '', arguments: '' },
									};
									pendingToolCalls.set(tc.index, pending);
								}
								if (pending) {
									if (tc.function?.name) {
										pending.function.name += tc.function.name;
									}
									if (tc.function?.arguments) {
										pending.function.arguments += tc.function.arguments;
									}
								}
							}
						}

						// Flush pending tool calls on finish
						if (choice.finish_reason === 'tool_calls' || choice.finish_reason === 'stop') {
							for (const tc of pendingToolCalls.values()) {
								callbacks.onToolCall(tc);
							}
							pendingToolCalls.clear();
						}
					} catch (e) {
						logger.error('Failed to parse SSE chunk:', jsonStr.slice(0, 200), e);
					}
				}
			}

			reportFinalUsage(callbacks, latestUsage);
			callbacks.onDone();
		} catch (error) {
			if (isAbortError(error) && cancellationToken?.isCancellationRequested) {
				return;
			}
			const normalizedError = normalizeRequestError(error, { baseUrl: this.baseUrl, request });
			logger.error('DeepSeek request failed:', formatRequestError(normalizedError));
			callbacks.onError(normalizedError);
		} finally {
			cancelListener?.dispose();
		}
	}
}

function reportFinalUsage(callbacks: StreamCallbacks, usage: ChatUsage | undefined): void {
	if (!usage || !callbacks.onUsage) {
		return;
	}
	callbacks.onUsage(usage);
}

function isAbortError(error: unknown): boolean {
	return error instanceof Error && error.name === 'AbortError';
}

/**
 * Serialize messages with imageUrls into OpenAI-compatible multipart content format.
 * Messages without images are passed through unchanged.
 */
function serializeMessagesWithImages(
	messages: ChatCompletionRequest['messages'],
): ChatCompletionRequest['messages'] {
	return messages.map((msg) => {
		if (!msg.imageUrls || msg.imageUrls.length === 0) {
			return msg;
		}
		// Convert to array content format: text + image_url blocks
		const contentParts: unknown[] = [];
		if (msg.content) {
			contentParts.push({ type: 'text', text: msg.content });
		}
		for (const url of msg.imageUrls) {
			contentParts.push({ type: 'image_url', image_url: { url } });
		}
		// Use type assertion since the serialized format differs from ChatMessage
		return { ...msg, content: contentParts as unknown as string };
	});
}
