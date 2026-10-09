import vscode from 'vscode';
import { WELCOME_SHOWN_KEY } from '../consts';
import { ChatProvider } from '../provider';

export async function showWelcomeIfNeeded(
	context: vscode.ExtensionContext,
	provider: ChatProvider,
): Promise<void> {
	if (context.globalState.get<boolean>(WELCOME_SHOWN_KEY)) {
		return;
	}
	if (await provider.hasApiKey()) {
		await context.globalState.update(WELCOME_SHOWN_KEY, true);
		return;
	}

	// The walkthrough id is derived from the installed extension id so it keeps
	// working regardless of which publisher the build uses.
	const walkthroughId = `${context.extension.id}#gettingStarted`;
	await vscode.commands.executeCommand('workbench.action.openWalkthrough', walkthroughId, false);
	await context.globalState.update(WELCOME_SHOWN_KEY, true);
}
