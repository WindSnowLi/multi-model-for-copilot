import vscode from 'vscode';
import { CONFIG_SECTION, EXTERNAL_URLS } from '../consts';
import { t } from '../i18n';
import { logger } from '../logger';
import { ensureRequestDumpRoot } from '../provider/debug';
import { getProviderDescriptor, getBuiltinProviderIds } from '../provider-registry';
import type { ApiProvider } from '../types';

interface ResetTarget extends vscode.QuickPickItem {
	target: vscode.ConfigurationTarget;
}

interface BaseUrlProviderPick extends vscode.QuickPickItem {
	provider: Exclude<ApiProvider, 'custom'>;
}

export function registerCommands(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.commands.registerCommand('multi-model-for-copilot.resetBaseUrl', resetBaseUrl),
		vscode.commands.registerCommand('multi-model-for-copilot.showLogs', () => logger.show()),
		vscode.commands.registerCommand('multi-model-for-copilot.openRequestDumpsFolder', () =>
			openRequestDumpsFolder(context),
		),
		vscode.commands.registerCommand('multi-model-for-copilot.getApiKey', () =>
			vscode.env.openExternal(vscode.Uri.parse(EXTERNAL_URLS.deepseek.apiKeys)),
		),
		vscode.commands.registerCommand('multi-model-for-copilot.openSettings', () =>
			vscode.commands.executeCommand('workbench.action.openSettings', 'multi-model-for-copilot'),
		),
	);
}

/**
 * Reset a provider's configured API base URL back to its built-in default.
 *
 * Markdown command links from Settings do not carry the active tab's scope, so
 * the command always asks which provider and which configuration scope to reset
 * and previews the value that will apply afterwards.
 */
async function resetBaseUrl(): Promise<void> {
	try {
		const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
		const providerPicks = collectConfiguredBaseUrls(config);
		if (providerPicks.length === 0) {
			void vscode.window.showInformationMessage(t('settings.resetBaseUrl.none'));
			return;
		}

		const providerPick =
			providerPicks.length === 1
				? providerPicks[0]
				: await vscode.window.showQuickPick(providerPicks, {
						title: t('settings.resetBaseUrl.title'),
						placeHolder: t('settings.resetBaseUrl.chooseProvider'),
					});
		if (!providerPick) {
			return;
		}

		const descriptor = getProviderDescriptor(providerPick.provider);
		if (!descriptor) {
			return;
		}

		const targets = buildScopeTargets(
			config,
			descriptor.baseUrlSettingsKey,
			descriptor.defaultBaseUrl,
		);
		const selected = await vscode.window.showQuickPick(targets, {
			title: t('settings.resetBaseUrl.title'),
			placeHolder: t('settings.resetBaseUrl.chooseScope'),
		});
		if (!selected) {
			return;
		}

		const current = config.inspect<string>(descriptor.baseUrlSettingsKey);
		const selectedValue =
			selected.target === vscode.ConfigurationTarget.Global
				? current?.globalValue
				: current?.workspaceValue;
		if (selectedValue === undefined) {
			return;
		}

		// Global uses VS Code's user-setting routing, including remote user overrides.
		await config.update(descriptor.baseUrlSettingsKey, undefined, selected.target);
	} catch (error) {
		logger.warn('Failed to reset API base URL', error);
		void vscode.window.showErrorMessage(t('settings.resetBaseUrl.failed'));
	}
}

function collectConfiguredBaseUrls(config: vscode.WorkspaceConfiguration): BaseUrlProviderPick[] {
	const picks: BaseUrlProviderPick[] = [];
	for (const provider of getBuiltinProviderIds()) {
		const descriptor = getProviderDescriptor(provider);
		if (!descriptor) {
			continue;
		}
		const inspection = config.inspect<string>(descriptor.baseUrlSettingsKey);
		if (inspection?.globalValue === undefined && inspection?.workspaceValue === undefined) {
			continue;
		}
		picks.push({
			label: descriptor.displayName,
			description: config.get<string>(descriptor.baseUrlSettingsKey),
			provider,
		});
	}
	return picks;
}

function buildScopeTargets(
	config: vscode.WorkspaceConfiguration,
	settingsKey: string,
	defaultValue: string,
): ResetTarget[] {
	const inspection = config.inspect<string>(settingsKey);
	const userValue = inspection?.globalValue;
	const workspaceValue = inspection?.workspaceValue;
	const hasWorkspace = Boolean(
		vscode.workspace.workspaceFile || vscode.workspace.workspaceFolders?.length,
	);
	const fallbackDefault = inspection?.defaultValue || defaultValue;

	return [
		{
			label: t('settings.resetBaseUrl.user'),
			target: vscode.ConfigurationTarget.Global,
			description:
				userValue === undefined
					? t('settings.resetBaseUrl.notConfigured')
					: t('settings.resetBaseUrl.current', userValue),
			// Public inspection merges local and remote user values, hiding a possible fallback.
			detail:
				userValue === undefined
					? undefined
					: vscode.env.remoteName && workspaceValue === undefined
						? t('settings.resetBaseUrl.afterInherited')
						: t('settings.resetBaseUrl.after', workspaceValue ?? fallbackDefault),
		},
		// The base URL settings have window scope: folder overrides do not apply in a multi-root workspace.
		...(hasWorkspace
			? [
					{
						label: t('settings.resetBaseUrl.workspace'),
						target: vscode.ConfigurationTarget.Workspace,
						description:
							workspaceValue === undefined
								? t('settings.resetBaseUrl.notConfigured')
								: t('settings.resetBaseUrl.current', workspaceValue),
						detail:
							workspaceValue === undefined
								? undefined
								: t('settings.resetBaseUrl.after', userValue ?? fallbackDefault),
					},
				]
			: []),
	];
}

async function openRequestDumpsFolder(context: vscode.ExtensionContext): Promise<void> {
	try {
		const root = await ensureRequestDumpRoot(context.globalStorageUri);
		logger.info(`Opening request dumps folder: ${root.toString(true)}`);
		await vscode.commands.executeCommand('revealFileInOS', root);
	} catch (error) {
		logger.warn('Failed to open request dumps folder', error);
		void vscode.window.showErrorMessage(t('extension.openRequestDumpsFolderFailed'));
	}
}
