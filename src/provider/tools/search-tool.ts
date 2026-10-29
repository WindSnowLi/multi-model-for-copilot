import vscode from 'vscode';
import { t } from '../../i18n';
import { TOOL_SEARCH_TOOL_NAME } from './consts';
import { searchToolCatalog } from './search';

/**
 * Registers the single tool-search entry point the provider offers when a chat
 * has more enabled tools than a model should receive at once. The tool only
 * reads the tool registry, so it never needs user confirmation.
 */
export function registerToolSearchTool(): vscode.Disposable {
	return vscode.lm.registerTool(TOOL_SEARCH_TOOL_NAME, {
		prepareInvocation(options) {
			return { invocationMessage: t('toolSearch.invoking', readQuery(options.input) ?? '') };
		},
		invoke(options) {
			const response = searchToolCatalog(readQuery(options.input) ?? '');
			return new vscode.LanguageModelToolResult([
				new vscode.LanguageModelTextPart(JSON.stringify(response, null, 2)),
			]);
		},
	});
}

function readQuery(input: unknown): string | undefined {
	if (typeof input !== 'object' || input === null) {
		return undefined;
	}
	const query = (input as { query?: unknown }).query;
	return typeof query === 'string' ? query : undefined;
}
