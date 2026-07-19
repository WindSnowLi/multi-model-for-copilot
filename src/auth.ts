import vscode from 'vscode';
import { API_KEY_SECRET, MIMO_API_KEY_SECRET } from './consts';
import { t } from './i18n';
import type { ApiProvider } from './types';

/**
 * Manages API keys via VS Code SecretStorage (secure) with
 * fallback to extension settings (less secure, for CI/automation).
 * Supports multiple providers (DeepSeek, MiMo).
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

		const config = vscode.workspace.getConfiguration('multi-model-for-copilot');
		const settingsKeyName = provider === 'mimo' ? 'mimoApiKey' : 'apiKey';
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
		const secret = await this.secretStorage.get(secretKey);
		if (secret) {
			return secret;
		}
		return undefined;
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
		const isMimo = provider === 'mimo';
		const apiKey = await vscode.window.showInputBox({
			prompt: isMimo ? t('auth.mimoPrompt') : t('auth.prompt'),
			placeHolder: isMimo ? t('auth.mimoPlaceholder') : t('auth.placeholder'),
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
		return provider === 'mimo' ? MIMO_API_KEY_SECRET : API_KEY_SECRET;
	}

	private async getSecretKey(provider: ApiProvider): Promise<string | undefined> {
		const secretName = this.getSecretName(provider);
		return this.secretStorage.get(secretName);
	}
}
