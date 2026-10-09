import vscode from 'vscode';
import { logger } from '../logger';
import { ChatProvider } from '../provider';

export function registerProvider(context: vscode.ExtensionContext): ChatProvider {
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
		vscode.commands.registerCommand('multi-model-for-copilot.setQwenApiKey', () =>
			provider.configureQwenApiKey(),
		),
		vscode.commands.registerCommand('multi-model-for-copilot.clearQwenApiKey', () =>
			provider.clearQwenApiKey(),
		),
		vscode.commands.registerCommand('multi-model-for-copilot.setVisionModel', () =>
			provider.setVisionModel(),
		),
		vscode.commands.registerCommand('multi-model-for-copilot.refreshBalance', () =>
			provider.refreshBalance(),
		),
		vscode.lm.registerLanguageModelChatProvider('multi-model', provider),
	);

	// Make models discoverable without waiting for Copilot, which may itself be waiting for BYOK.
	provider.refreshModelPicker();
	context.subscriptions.push(refreshModelsAfterCopilotActivation(provider));

	return provider;
}

function refreshModelsAfterCopilotActivation(provider: ChatProvider): vscode.Disposable {
	let disposed = false;

	// Keep the post-activation refresh to replace cached model info missing configurationSchema.
	Promise.resolve(vscode.extensions.getExtension('github.copilot-chat')?.activate())
		.then(() => {
			if (!disposed) {
				provider.refreshModelPicker();
			}
		})
		.catch((error) => {
			if (!disposed) {
				logger.warn('Failed to activate Copilot Chat or refresh model information', error);
			}
		});

	// Ignore late activation results after this extension is disposed.
	return new vscode.Disposable(() => {
		disposed = true;
	});
}
