import vscode from 'vscode';
import { t } from './i18n';
import { getProviderDescriptor } from './provider-registry';
import { API_KEY_SECRET } from './consts';
import type { ApiProvider } from './types';

/**
 * Manages API keys via VS Code SecretStorage (secure) with
 * fallback to extension settings (less secure, for CI/automation).
 * Supports multiple providers — all provider-specific logic is driven
 * by the Provider Registry, not per-file branching.
 */
export class AuthManager {
	private readonly secretStorage: vscode.SecretStorage;

	constructor(context: vscode.ExtensionContext) {
		this.secretStorage = context.secrets;
	}

	/**
	 * Get API key for a specific provider.
	 * Tries SecretStorage first, then falls back to settings.
	 */
	async getApiKey(provider?: ApiProvider): Promise<string | undefined> {
		const secretKey = await this.getSecretKey(provider ?? 'deepseek');
		if (secretKey) {
			return secretKey;
		}

		const desc = getProviderDescriptor(provider ?? 'deepseek');
		const config = vscode.workspace.getConfiguration('multi-model-for-copilot');
		const settingsKeyName = desc?.settingsKey ?? 'apiKey';
		const settingsKey = config.get<string>(settingsKeyName);
		if (settingsKey?.trim()) {
			return settingsKey.trim();
		}

		return undefined;
	}

	/**
	 * Store API key in SecretStorage for a specific provider.
	 */
	async setApiKey(apiKey: string, provider?: ApiProvider): Promise<void> {
		const secretName = this.getSecretName(provider ?? 'deepseek');
		await this.secretStorage.store(secretName, apiKey.trim());
	}

	/**
	 * Delete stored API key for a specific provider.
	 */
	async deleteApiKey(provider?: ApiProvider): Promise<void> {
		const secretName = this.getSecretName(provider ?? 'deepseek');
		await this.secretStorage.delete(secretName);
	}

	/**
	 * Check if an API key is configured for a specific provider.
	 */
	async hasApiKey(provider?: ApiProvider): Promise<boolean> {
		const key = await this.getApiKey(provider);
		return key !== undefined && key.length > 0;
	}

	/**
	 * Get API key by arbitrary secret key name (for custom models).
	 */
	async getApiKeyForSecret(secretKey: string): Promise<string | undefined> {
		return this.secretStorage.get(secretKey) ?? undefined;
	}

	/**
	 * Store API key by arbitrary secret key name (for custom models).
	 */
	async setApiKeyForSecret(secretKey: string, apiKey: string): Promise<void> {
		await this.secretStorage.store(secretKey, apiKey.trim());
	}

	/**
	 * Prompt user to enter API key via input box.
	 */
	async promptForApiKey(provider?: ApiProvider): Promise<boolean> {
		const id = provider ?? 'deepseek';
		const apiKey = await vscode.window.showInputBox({
			prompt: t(`auth.${id}Prompt`) || t('auth.prompt'),
			placeHolder: t(`auth.${id}Placeholder`) || t('auth.placeholder'),
			password: true,
			ignoreFocusOut: true,
			validateInput: (value: string) => {
				if (!value?.trim()) {
					return t('auth.emptyValidation');
				}
				return undefined;
			},
		});

		if (apiKey) {
			await this.setApiKey(apiKey, provider);
			vscode.window.showInformationMessage(t('auth.saved'));
			return true;
		}

		return false;
	}

	private getSecretName(provider: ApiProvider): string {
		const desc = getProviderDescriptor(provider);
		return desc?.secretKey ?? API_KEY_SECRET;
	}

	private async getSecretKey(provider: ApiProvider): Promise<string | undefined> {
		const secretName = this.getSecretName(provider);
		return this.secretStorage.get(secretName);
	}
}
