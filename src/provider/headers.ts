import { randomUUID } from 'crypto';
import type vscode from 'vscode';

/** Last-resort id so every request of an extension-host session shares it. */
let fallbackConversationId: string | undefined;

/** Copilot's own conversation id, when the host transports it. */
export function getHostConversationId(
	options: vscode.ProvideLanguageModelChatResponseOptions,
): string | undefined {
	const upstreamId = options.modelOptions?._conversationId;
	return typeof upstreamId === 'string' && upstreamId.length > 0 ? upstreamId : undefined;
}

/**
 * Resolve header templates once per provider call, before any HTTP attempts.
 *
 * `segmentId` identifies the conversation when Copilot does not expose one; it
 * is carried by the replay markers, so every turn of a chat resolves the same
 * `${conversationId}` value instead of a fresh random id.
 */
export function resolveRequestHeaders(
	headers: Readonly<Record<string, string>>,
	options: vscode.ProvideLanguageModelChatResponseOptions,
	storageUri: vscode.Uri | undefined,
	segmentId?: string,
): Record<string, string> {
	let conversationId: string | undefined;
	return Object.fromEntries(
		Object.entries(headers).map(([name, value]) => [
			name,
			value.replaceAll('${conversationId}', () => {
				conversationId ??= resolveConversationId(options, storageUri, segmentId);
				return conversationId;
			}),
		]),
	);
}

function resolveConversationId(
	options: vscode.ProvideLanguageModelChatResponseOptions,
	storageUri: vscode.Uri | undefined,
	segmentId: string | undefined,
): string {
	const upstreamId = getHostConversationId(options);
	if (upstreamId) {
		return upstreamId;
	}

	// VS Code builds storageUri as <workspaceStorageHome>/<workspaceId>/<extensionId>.
	const storageDirectory = storageUri?.path.split('/').at(-2);
	if (storageDirectory) {
		// Node extension hosts may append a lock-conflict suffix to the workspace's MD5 ID.
		const workspaceId = storageDirectory.replace(/^([0-9a-f]{32})-\d+$/iu, '$1');
		return `workspace-${workspaceId}`;
	}

	if (segmentId) {
		return `segment-${segmentId}`;
	}

	// Copilot creates this correlation ID for each model request, so it is only
	// a last resort before the session-wide fallback.
	const upstreamRequestId = options.modelOptions?._capturingTokenCorrelationId;
	if (typeof upstreamRequestId === 'string' && upstreamRequestId.length > 0) {
		return `request-${upstreamRequestId}`;
	}

	fallbackConversationId ??= `request-${randomUUID()}`;
	return fallbackConversationId;
}
