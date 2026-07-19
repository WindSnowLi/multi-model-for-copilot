import vscode from 'vscode';
import { logger } from '../logger';
import { ChatProvider } from '../provider';

export async function registerProvider(
	context: vscode.ExtensionContext,
): Promise<ChatProvider> {
	const provider = new ChatProvider(context);

	context.subscriptions.push(
		vscode.commands.registerCommand('multi-model-for-copilot.setApiKey', () => provider.configureApiKey()),
		vscode.commands.registerCommand('multi-model-for-copilot.clearApiKey', () => provider.clearApiKey()),
		vscode.commands.registerCommand('multi-model-for-copilot.setMiMoApiKey', () =>
			provider.configureMiMoApiKey(),
		),
		vscode.commands.registerCommand('multi-model-for-copilot.clearMiMoApiKey', () =>
			provider.clearMiMoApiKey(),
		),
		vscode.commands.registerCommand('multi-model-for-copilot.setVisionModel', () =>
			provider.setVisionModel(),
		),
		vscode.commands.registerCommand('multi-model-for-copilot.addCustomModel', () =>
			provider.addCustomModel(),
		),
		vscode.commands.registerCommand('multi-model-for-copilot.removeCustomModel', () =>
			provider.removeCustomModel(),
		),
		vscode.commands.registerCommand('multi-model-for-copilot.discoverModels', () =>
			provider.discoverAndAddModels(),
		),
		vscode.lm.registerLanguageModelChatProvider('deepseek', provider),
	);

	// Copilot Chat can serve cached model info without configurationSchema.
	// Activate it first so this refresh reaches a live listener and re-queries the provider.
	await activateCopilotChat();
	provider.refreshModelPicker();

	return provider;
}

async function activateCopilotChat(): Promise<void> {
	try {
		await vscode.extensions.getExtension('github.copilot-chat')?.activate();
	} catch (error) {
		logger.warn('Copilot Chat activation unavailable; model picker refresh may be delayed', error);
	}
}
