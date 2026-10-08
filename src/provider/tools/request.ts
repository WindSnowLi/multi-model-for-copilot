import vscode from 'vscode';
import type { ChatMessage, ChatTool } from '../../types';
import { convertTools } from '../convert';

export function prepareRequestTools(
	toolCallingCapability: boolean | number | undefined,
	options: vscode.ProvideLanguageModelChatResponseOptions,
): ChatTool[] | undefined {
	// A numeric capability only advertises the model's own tool limit to VS Code.
	// The host trims the tool list, so the provider never rejects a request.
	return toolCallingCapability ? convertTools(options.tools) : undefined;
}

export function collectTrailingToolResultIds(messages: readonly ChatMessage[]): string[] {
	const trailingToolResultIds: string[] = [];
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message.role !== 'tool' || !message.tool_call_id) {
			break;
		}
		trailingToolResultIds.push(message.tool_call_id);
	}
	return trailingToolResultIds.reverse();
}
