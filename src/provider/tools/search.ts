import { createHash } from 'crypto';
import vscode from 'vscode';
import type { ToolSearchMode } from '../../config';
import type { ChatTool } from '../../types';
import { convertTools } from '../convert';
import {
	TOOL_SEARCH_MAX_DESCRIPTION_CHARS,
	TOOL_SEARCH_MAX_RESULTS,
	TOOL_SEARCH_QUERY_MESSAGE_COUNT,
	TOOL_SEARCH_TOOL_NAME,
	TOOL_SEARCH_TRACKED_CONVERSATIONS,
} from './consts';

/** Tool description handed to the model after a tool-search call. */
export interface ToolSearchEntry {
	name: string;
	description?: string;
	parameters?: Record<string, unknown>;
}

export interface ToolSearchResponse {
	query: string;
	tools: ToolSearchEntry[];
	note?: string;
}

/** Outcome of narrowing the request tool list for one provider call. */
export interface ToolSearchPlan {
	applied: boolean;
	/** Whether the tool list was reused from an earlier turn of this conversation. */
	sticky: boolean;
	/** Tools appended because the model unlocked them through tool search. */
	appendedCount: number;
	/** Tools the host offered for this request, tool-search entry included. */
	availableCount: number;
	/** Tools forwarded to the API. */
	forwardedCount: number;
	/** Tools unlocked by earlier tool-search calls in this conversation. */
	unlockedCount: number;
}

export interface ResolveRequestToolsOptions {
	toolCallingCapability: boolean | number | undefined;
	tools: readonly vscode.LanguageModelChatTool[] | undefined;
	messages: readonly vscode.LanguageModelChatRequestMessage[];
	/** Model id, used to scope the per-conversation tool selection. */
	modelId: string;
	mode: ToolSearchMode;
	maxTools: number;
}

export interface ResolvedRequestTools {
	tools: ChatTool[] | undefined;
	plan: ToolSearchPlan;
}

type ToolDefinition = {
	readonly name: string;
	readonly description: string;
	readonly inputSchema?: object;
};

let hostTools: readonly vscode.LanguageModelChatTool[] = [];

/**
 * Tool lists that were already sent in a conversation, keyed by model and the
 * first user message. Reusing them keeps the `tools` array - and therefore the
 * request prefix the provider caches on - byte-identical across turns.
 */
const conversationSelections = new Map<string, readonly string[]>();

/**
 * Remember the tools the host offered for the latest request. `lm.tools` does
 * not know about host-provided tools in every chat host (for example tools
 * owned by an agent host), so tool search reads this snapshot too.
 */
export function recordHostTools(
	tools: readonly vscode.LanguageModelChatTool[] | undefined,
): void {
	hostTools = tools ?? [];
}

/** Whether narrowing applies for the given host tool list. */
export function isToolSearchActive(
	tools: readonly vscode.LanguageModelChatTool[] | undefined,
	mode: ToolSearchMode,
	maxTools: number,
): boolean {
	return mode !== 'off' && countSelectableTools(tools) > Math.max(1, maxTools);
}

/**
 * Build the `tools` array for one request. When tool search is active the
 * model only sees the tools that matter for the current conversation plus the
 * single tool-search entry point; everything else stays reachable through
 * `multi_model_tool_search`.
 */
export function resolveRequestTools({
	toolCallingCapability,
	tools,
	messages,
	modelId,
	mode,
	maxTools,
}: ResolveRequestToolsOptions): ResolvedRequestTools {
	recordHostTools(tools);

	const available = tools ?? [];
	const availableCount = available.length;
	const forwardAll = (unlockedCount = 0): ResolvedRequestTools => ({
		tools: toolCallingCapability ? convertTools(available) : undefined,
		plan: {
			applied: false,
			sticky: false,
			appendedCount: 0,
			availableCount,
			forwardedCount: availableCount,
			unlockedCount,
		},
	});

	if (!toolCallingCapability || !isToolSearchActive(available, mode, maxTools)) {
		return forwardAll();
	}

	const searchTool = resolveSearchTool(available);
	if (!searchTool) {
		return forwardAll();
	}

	const unlocked = collectUnlockedToolNames(messages);
	const candidates = collectCandidates(available, unlocked);
	const candidateByName = new Map(candidates.map((tool) => [tool.name, tool]));
	const limit = Math.max(1, maxTools);
	const conversationKey = buildConversationKey(modelId, messages);
	const previousNames = conversationKey
		? conversationSelections.get(conversationKey)
		: undefined;

	let names: string[];
	let sticky = false;
	if (previousNames) {
		// Keep the order that is already cached; only drop tools the host no
		// longer offers or that fall outside a shrunken budget.
		names = previousNames.filter((name) => candidateByName.has(name)).slice(0, limit);
		sticky = true;
	} else {
		names = selectToolNames(candidates, unlocked, collectQueryText(messages), limit);
	}

	// Unlocked tools are always callable, so they are appended instead of being
	// inserted, which would invalidate the cached prefix from that point on.
	let appendedCount = 0;
	for (const name of unlocked) {
		if (!candidateByName.has(name) || names.includes(name)) {
			continue;
		}
		names.push(name);
		appendedCount += 1;
	}

	if (conversationKey) {
		rememberSelection(conversationKey, names);
	}

	const selected = names
		.map((name) => candidateByName.get(name))
		.filter((tool): tool is ToolDefinition => tool !== undefined);
	// The search entry point stays first so the growing tool list only ever
	// changes at its tail.
	const forwarded = [searchTool, ...selected];

	if (forwarded.length >= availableCount) {
		return forwardAll(unlocked.size);
	}

	return {
		tools: convertTools(forwarded),
		plan: {
			applied: true,
			sticky,
			appendedCount,
			availableCount,
			forwardedCount: forwarded.length,
			unlockedCount: unlocked.size,
		},
	};
}

/** Tools named by earlier tool-search results in this conversation. */
export function collectUnlockedToolNames(
	messages: readonly vscode.LanguageModelChatRequestMessage[],
): Set<string> {
	const searchCallIds = new Set<string>();
	for (const message of messages) {
		for (const part of message.content) {
			if (
				part instanceof vscode.LanguageModelToolCallPart &&
				part.name === TOOL_SEARCH_TOOL_NAME
			) {
				searchCallIds.add(part.callId);
			}
		}
	}

	const names = new Set<string>();
	if (searchCallIds.size === 0) {
		return names;
	}

	for (const message of messages) {
		for (const part of message.content) {
			if (
				!(part instanceof vscode.LanguageModelToolResultPart) ||
				!searchCallIds.has(part.callId)
			) {
				continue;
			}
			for (const name of parseToolSearchResultNames(part)) {
				names.add(name);
			}
		}
	}
	return names;
}

/**
 * Search every tool this window can reach: the registered `lm.tools` plus the
 * host-provided list of the latest request, which also covers tools the host
 * trimmed before calling this provider.
 */
export function searchToolCatalog(
	query: string,
	limit = TOOL_SEARCH_MAX_RESULTS,
): ToolSearchResponse {
	const entries = collectSearchEntries();
	const tokens = tokenize(query);
	const scored = entries
		.map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
		.filter((candidate) => tokens.length === 0 || candidate.score > 0)
		.sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name))
		.slice(0, Math.max(1, limit))
		.map((candidate) => toSearchEntry(candidate.entry));

	return {
		query,
		tools: scored,
		...(scored.length === 0 ? { note: 'No tool matched the query.' } : {}),
	};
}

function countSelectableTools(
	tools: readonly vscode.LanguageModelChatTool[] | undefined,
): number {
	if (!tools) {
		return 0;
	}
	return new Set(
		tools.map((tool) => tool.name).filter((name) => name !== TOOL_SEARCH_TOOL_NAME),
	).size;
}

/**
 * The search entry point is normally part of the host tool list. It is still
 * offered from the registry when the host dropped it, so the model always has
 * a way to reach the tools that were left out.
 */
function resolveSearchTool(
	tools: readonly vscode.LanguageModelChatTool[],
): ToolDefinition | undefined {
	const offered = tools.find((tool) => tool.name === TOOL_SEARCH_TOOL_NAME);
	if (offered) {
		return offered;
	}
	const registered = vscode.lm.tools.find((tool) => tool.name === TOOL_SEARCH_TOOL_NAME);
	return registered
		? {
				name: registered.name,
				description: registered.description,
				inputSchema: registered.inputSchema,
			}
		: undefined;
}

function collectCandidates(
	tools: readonly vscode.LanguageModelChatTool[],
	unlocked: ReadonlySet<string>,
): ToolDefinition[] {
	const candidates = new Map<string, ToolDefinition>();
	for (const tool of tools) {
		if (tool.name === TOOL_SEARCH_TOOL_NAME) {
			continue;
		}
		candidates.set(tool.name, tool);
	}
	// Tools the host trimmed (its own tool limit) but the model unlocked through
	// tool search stay callable for the rest of the conversation.
	for (const name of unlocked) {
		if (candidates.has(name)) {
			continue;
		}
		const registered = vscode.lm.tools.find((tool) => tool.name === name);
		if (registered) {
			candidates.set(registered.name, {
				name: registered.name,
				description: registered.description,
				inputSchema: registered.inputSchema,
			});
		}
	}
	return [...candidates.values()];
}

function selectToolNames(
	candidates: readonly ToolDefinition[],
	unlocked: ReadonlySet<string>,
	query: string,
	limit: number,
): string[] {
	const order = new Map(candidates.map((tool, index) => [tool.name, index]));
	const selected = new Set<string>();

	for (const tool of candidates) {
		if (unlocked.has(tool.name)) {
			selected.add(tool.name);
		}
	}

	const tokens = tokenize(query);
	const ranked = candidates
		.map((tool) => ({ tool, score: scoreEntry(tool, tokens) }))
		.filter((candidate) => candidate.score > 0)
		.sort(
			(a, b) =>
				b.score - a.score || (order.get(a.tool.name) ?? 0) - (order.get(b.tool.name) ?? 0),
		);
	for (const { tool } of ranked) {
		if (selected.size >= limit) {
			break;
		}
		selected.add(tool.name);
	}

	// Fill up in host order so the initial list is as predictable as possible.
	for (const tool of candidates) {
		if (selected.size >= limit) {
			break;
		}
		selected.add(tool.name);
	}

	return candidates.filter((tool) => selected.has(tool.name)).map((tool) => tool.name);
}

/**
 * Identify the conversation by model and first human message, so the tool list
 * picked on the first turn is reused for every later turn of the same chat.
 */
function buildConversationKey(
	modelId: string,
	messages: readonly vscode.LanguageModelChatRequestMessage[],
): string | undefined {
	for (const message of messages) {
		if (message.role !== vscode.LanguageModelChatMessageRole.User) {
			continue;
		}
		const text = message.content
			.map((part) => (part instanceof vscode.LanguageModelTextPart ? part.value : ''))
			.join(' ')
			.trim();
		if (text.length === 0) {
			continue;
		}
		const digest = createHash('sha256').update(text.slice(0, 2000)).digest('hex');
		return `${modelId}\u0000${digest.slice(0, 32)}`;
	}
	return undefined;
}

function rememberSelection(key: string, names: readonly string[]): void {
	conversationSelections.delete(key);
	conversationSelections.set(key, [...names]);
	while (conversationSelections.size > TOOL_SEARCH_TRACKED_CONVERSATIONS) {
		const oldestKey = conversationSelections.keys().next().value;
		if (oldestKey === undefined) {
			return;
		}
		conversationSelections.delete(oldestKey);
	}
}

function collectSearchEntries(): ToolDefinition[] {
	const entries = new Map<string, ToolDefinition>();
	for (const tool of vscode.lm.tools) {
		if (tool.name === TOOL_SEARCH_TOOL_NAME) {
			continue;
		}
		entries.set(tool.name, {
			name: tool.name,
			description: tool.description,
			inputSchema: tool.inputSchema,
		});
	}
	for (const tool of hostTools) {
		if (tool.name === TOOL_SEARCH_TOOL_NAME) {
			continue;
		}
		entries.set(tool.name, tool);
	}
	return [...entries.values()];
}

function toSearchEntry(tool: ToolDefinition): ToolSearchEntry {
	return {
		name: tool.name,
		description: truncate(tool.description, TOOL_SEARCH_MAX_DESCRIPTION_CHARS),
		parameters: tool.inputSchema as Record<string, unknown> | undefined,
	};
}

function parseToolSearchResultNames(part: vscode.LanguageModelToolResultPart): string[] {
	const text = part.content
		.map((item) => (item instanceof vscode.LanguageModelTextPart ? item.value : ''))
		.join('');
	if (!text) {
		return [];
	}

	try {
		const parsed: unknown = JSON.parse(text);
		if (!isToolSearchResponse(parsed)) {
			return [];
		}
		return parsed.tools
			.map((tool) => tool.name)
			.filter((name): name is string => typeof name === 'string' && name.length > 0);
	} catch {
		return [];
	}
}

function isToolSearchResponse(value: unknown): value is ToolSearchResponse {
	return (
		typeof value === 'object' &&
		value !== null &&
		Array.isArray((value as ToolSearchResponse).tools)
	);
}

function collectQueryText(
	messages: readonly vscode.LanguageModelChatRequestMessage[],
): string {
	const texts: string[] = [];
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		if (texts.length >= TOOL_SEARCH_QUERY_MESSAGE_COUNT) {
			break;
		}
		const message = messages[index];
		if (message.role !== vscode.LanguageModelChatMessageRole.User) {
			continue;
		}
		const text = message.content
			.map((part) => (part instanceof vscode.LanguageModelTextPart ? part.value : ''))
			.join(' ')
			.trim();
		if (text.length > 0) {
			texts.push(text);
		}
	}
	return texts.join(' ');
}

function tokenize(text: string): string[] {
	return [
		...new Set(
			text
				.toLowerCase()
				.split(/[^\p{L}\p{N}]+/u)
				.filter((token) => token.length >= 2),
		),
	];
}

function scoreEntry(tool: ToolDefinition, tokens: readonly string[]): number {
	if (tokens.length === 0) {
		return 0;
	}
	const name = tool.name.toLowerCase();
	const description = (tool.description ?? '').toLowerCase();
	let score = 0;
	for (const token of tokens) {
		if (name.includes(token)) {
			score += 8;
		} else if (description.includes(token)) {
			score += 2;
		}
	}
	return score;
}

function truncate(value: string, maxChars: number): string | undefined {
	if (value.length === 0) {
		return undefined;
	}
	return value.length <= maxChars ? value : `${value.slice(0, maxChars - 1)}…`;
}
