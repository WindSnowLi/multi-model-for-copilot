import vscode from 'vscode';
import { safeStringify } from '../json';
import type { ChatMessage, ChatTool, ChatToolCall } from '../types';
import { isImageDataPart, isLanguageModelThinkingPart, toImageDataUrl } from './parts';
import { parseFirstReplayMarker } from './replay';

/**
 * Convert VS Code chat messages to API format.
 * Injects marker-replayed reasoning_content for assistant messages.
 * When supportsNativeVision is true, image data is collected into imageUrls field.
 */
export function convertMessages(
	messages: readonly vscode.LanguageModelChatRequestMessage[],
	isThinkingModel: boolean,
	supportsNativeVision?: boolean,
): ChatMessage[] {
	const result: ChatMessage[] = [];

	for (const message of messages) {
		const role = mapRole(message.role);

		let content = '';
		let thinkingContent = '';
		const toolCalls: ChatToolCall[] = [];
		const toolResults: Array<{ callId: string; content: string; imageUrls?: string[] }> = [];
		const imageUrls: string[] = [];

		for (const part of message.content) {
			if (part instanceof vscode.LanguageModelTextPart) {
				content += part.value;
			} else if (isLanguageModelThinkingPart(part)) {
				thinkingContent += normalizeThinkingPartText(part.value);
			} else if (part instanceof vscode.LanguageModelToolCallPart) {
				toolCalls.push({
					id: part.callId,
					type: 'function',
					function: {
						name: part.name,
						arguments: safeStringify(part.input),
					},
				});
			} else if (part instanceof vscode.LanguageModelToolResultPart) {
				toolResults.push({
					callId: part.callId,
					content: collectToolResultText(part),
					// Native vision models receive tool-result images directly as
					// image_url content blocks instead of a proxy description.
					imageUrls: supportsNativeVision
						? collectToolResultImageUrls(part)
						: undefined,
				});
			} else if (supportsNativeVision && isImageDataPart(part)) {
				// Collect image data for native vision models
				imageUrls.push(toImageDataUrl(part));
			}
		}

		if (role === 'assistant') {
			if (content || toolCalls.length > 0) {
				const replayMarker = isThinkingModel ? parseFirstReplayMarker(message) : undefined;
				const msg: ChatMessage = {
					role: 'assistant' as const,
					content: content || '',
				};

				if (toolCalls.length > 0) {
					msg.tool_calls = toolCalls;
				}

				if (isThinkingModel) {
					msg.reasoning_content = getReasoningContent(replayMarker, thinkingContent);
				}

				result.push(msg);
			}
		} else {
			if (content || imageUrls.length > 0) {
				const msg: ChatMessage = {
					role: role as 'user' | 'assistant',
					content: content,
				};
				if (imageUrls.length > 0) {
					msg.imageUrls = imageUrls;
				}
				result.push(msg);
			}
		}

		// Tool result messages follow their associated assistant message
		for (const tr of toolResults) {
			const toolMsg: ChatMessage = {
				role: 'tool',
				content: tr.content,
				tool_call_id: tr.callId,
			};
			if (tr.imageUrls && tr.imageUrls.length > 0) {
				toolMsg.imageUrls = tr.imageUrls;
			}
			result.push(toolMsg);
		}
	}

	return result;
}

function getReasoningContent(
	replayMarker: ReturnType<typeof parseFirstReplayMarker>,
	thinkingContent: string,
): string {
	if (replayMarker?.valid && replayMarker.reasoningText) {
		return replayMarker.reasoningText;
	}
	return thinkingContent;
}

function normalizeThinkingPartText(value: string | string[]): string {
	return Array.isArray(value) ? value.join('') : value;
}

/**
 * Extract the text payload of a tool result.
 *
 * Tool messages in OpenAI-compatible APIs carry a plain string, so binary image
 * bytes are never serialized directly here. Instead, image handling depends on
 * the model route: native vision models forward tool-result images as
 * `image_url` blocks (see {@link collectToolResultImageUrls}), while proxy
 * models receive a text image description injected by the vision resolver.
 */
function collectToolResultText(part: vscode.LanguageModelToolResultPart): string {
	let toolContent = '';
	const serializableItems: unknown[] = [];
	for (const item of part.content) {
		if (item instanceof vscode.LanguageModelTextPart) {
			toolContent += item.value;
		} else if (isImageDataPart(item)) {
			// Skip image bytes; they cannot be represented in a tool message string
			// and must never be serialized into the request body.
			continue;
		} else {
			serializableItems.push(item);
		}
	}
	if (toolContent) {
		return toolContent;
	}
	// Fall back to a structural summary only when there is genuinely serializable
	// (non-image) content to describe.
	return serializableItems.length > 0 ? safeStringify(serializableItems) : '';
}

/**
 * Collect image data parts embedded in a tool-result part as base64 data URLs
 * so native vision models can receive them directly as `image_url` blocks.
 */
function collectToolResultImageUrls(part: vscode.LanguageModelToolResultPart): string[] {
	return (part.content as readonly unknown[])
		.filter(isImageDataPart)
		.map(toImageDataUrl);
}

function mapRole(role: vscode.LanguageModelChatMessageRole): 'user' | 'assistant' {
	switch (role) {
		case vscode.LanguageModelChatMessageRole.User:
			return 'user';
		case vscode.LanguageModelChatMessageRole.Assistant:
			return 'assistant';
		default:
			return 'user';
	}
}

/**
 * Convert VS Code tool definitions to DeepSeek format.
 */
export function convertTools(
	tools: readonly vscode.LanguageModelChatTool[] | undefined,
): ChatTool[] | undefined {
	if (!tools || tools.length === 0) {
		return undefined;
	}

	return tools.map((tool) => ({
		type: 'function' as const,
		function: {
			name: tool.name,
			description: tool.description,
			// Some compatible endpoints require an explicit schema for tools without parameters.
			parameters: (tool.inputSchema ?? { type: 'object', properties: {} }) as Record<
				string,
				unknown
			>,
		},
	}));
}

/**
 * Count total characters across all messages to calibrate chars-per-token ratio.
 */
export function countMessageChars(messages: ChatMessage[]): number {
	let total = 0;
	for (const msg of messages) {
		total += msg.content?.length ?? 0;
		total += msg.reasoning_content?.length ?? 0;
		if (msg.tool_calls) {
			for (const tc of msg.tool_calls) {
				total += tc.function?.name?.length ?? 0;
				total += tc.function?.arguments?.length ?? 0;
			}
		}
	}
	return total;
}
