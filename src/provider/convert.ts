import vscode from 'vscode';
import { safeStringify } from '../json';
import type { ChatMessage, ChatTool, ChatToolCall } from '../types';
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
		const toolResults: Array<{ callId: string; content: string }> = [];
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
				let toolContent = '';
				for (const item of part.content) {
					if (item instanceof vscode.LanguageModelTextPart) {
						toolContent += item.value;
					}
				}
				toolResults.push({
					callId: part.callId,
					content: toolContent || safeStringify(part.content),
				});
			} else if (supportsNativeVision && isImageDataPart(part)) {
				// Collect image data for native vision models
				const base64 = uint8ArrayToBase64(part.data);
				imageUrls.push(`data:${part.mimeType};base64,${base64}`);
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
			result.push({
				role: 'tool',
				content: tr.content,
				tool_call_id: tr.callId,
			});
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

function isLanguageModelThinkingPart(part: unknown): part is vscode.LanguageModelThinkingPart {
	return (
		typeof vscode.LanguageModelThinkingPart === 'function' &&
		part instanceof vscode.LanguageModelThinkingPart
	);
}

function normalizeThinkingPartText(value: string | string[]): string {
	return Array.isArray(value) ? value.join('') : value;
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
			parameters: tool.inputSchema as Record<string, unknown> | undefined,
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

function isImageDataPart(part: unknown): part is vscode.LanguageModelDataPart {
	return part instanceof vscode.LanguageModelDataPart && part.mimeType.startsWith('image/');
}

function uint8ArrayToBase64(data: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < data.length; i++) {
		binary += String.fromCharCode(data[i]);
	}
	return btoa(binary);
}
