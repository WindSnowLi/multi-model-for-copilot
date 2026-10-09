import vscode from 'vscode';
import { t } from './i18n';
import { getProviderDescriptor } from './provider-registry';
import { API_KEY_SECRET } from './consts';
import type { ApiProvider } from './types';

/**
 * Manages API keys in VS Code SecretStorage (macOS Keychain / Windows Credential
 * Manager / Linux keyring). Keys are never read from or written to settings.
 * All provider-specific logic is driven by the Provider Registry.
 */
export class AuthManager {
	private readonly secretStorage: vscode.SecretStorage;

	constructor(context: vscode.ExtensionContext) {
		this.secretStorage = context.secrets;
	}

	/**
	 * Get API key for a specific provider from SecretStorage.
	 */
	async getApiKey(provider?: ApiProvider): Promise<string | undefined> {
		return this.getSecretKey(provider ?? 'deepseek');
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
