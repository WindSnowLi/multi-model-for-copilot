import vscode from 'vscode';
import { EXTERNAL_URLS } from '../consts';
import { logger } from '../logger';

export function registerCommands(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.commands.registerCommand('multi-model-for-copilot.showLogs', () => logger.show()),
		vscode.commands.registerCommand('multi-model-for-copilot.getApiKey', () =>
			vscode.env.openExternal(vscode.Uri.parse(EXTERNAL_URLS.deepseek.apiKeys)),
		),
		vscode.commands.registerCommand('multi-model-for-copilot.openSettings', () =>
			vscode.commands.executeCommand('workbench.action.openSettings', 'multi-model-for-copilot'),
		),
	);
}
