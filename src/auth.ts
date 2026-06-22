import vscode from 'vscode';
import { API_KEY_SECRET, MODELS } from './consts';
import { t } from './i18n';

/**
 * Manages DeepSeek API key via VS Code SecretStorage (secure) with
 * fallback to extension settings (less secure, for CI/automation).
 */
export class AuthManager {
	private readonly secretStorage: vscode.SecretStorage;

	constructor(context: vscode.ExtensionContext) {
		this.secretStorage = context.secrets;
	}

	/**
	 * Get API key. Tries SecretStorage first, then falls back to settings.
	 *
	 * @param modelId Optional model id to look up a per-model key override.
	 *                If the model declares `apiKeySecret`, that SecretStorage
	 *                entry is checked first; otherwise falls back to the
	 *                global `API_KEY_SECRET` and `settings.apiKey`.
	 */
	async getApiKey(modelId?: string): Promise<string | undefined> {
		// 1) 优先 model 自己的 secret
		if (modelId) {
			const modelDef = MODELS.find((m) => m.id === modelId);
			if (modelDef?.apiKeySecret) {
				const modelKey = await this.secretStorage.get(modelDef.apiKeySecret);
				if (modelKey) {
					return modelKey;
				}
			}
		}
		// 2) 兜底:全局 deepseek key
		const secretKey = await this.secretStorage.get(API_KEY_SECRET);
		if (secretKey) {
			return secretKey;
		}

		// 3) 兜底:settings.apiKey
		const config = vscode.workspace.getConfiguration('deepseek-copilot');
		const settingsKey = config.get<string>('apiKey');
		if (settingsKey?.trim()) {
			return settingsKey.trim();
		}

		return undefined;
	}

	/**
	 * Store API key in SecretStorage.
	 */
	async setApiKey(apiKey: string): Promise<void> {
		await this.secretStorage.store(API_KEY_SECRET, apiKey.trim());
	}

	/**
	 * Store API key for a specific model — uses the model's `apiKeySecret`
	 * SecretStorage key when declared, otherwise falls back to the global key.
	 */
	async setApiKeyForModel(modelId: string, apiKey: string): Promise<void> {
		const modelDef = MODELS.find((m) => m.id === modelId);
		const secretKey = modelDef?.apiKeySecret ?? API_KEY_SECRET;
		await this.secretStorage.store(secretKey, apiKey.trim());
	}

	/**
	 * Delete stored API key.
	 */
	async deleteApiKey(): Promise<void> {
		await this.secretStorage.delete(API_KEY_SECRET);
	}

	/**
	 * Check if an API key is configured.
	 */
	async hasApiKey(modelId?: string): Promise<boolean> {
		const key = await this.getApiKey(modelId);
		return key !== undefined && key.length > 0;
	}

	/**
	 * Prompt user to enter API key via input box.
	 *
	 * @param modelId Optional model id. When provided, the key is stored under
	 *                the model's `apiKeySecret` SecretStorage entry so the two
	 *                providers (e.g. DeepSeek vs Zhipu) can coexist.
	 */
	async promptForApiKey(modelId?: string): Promise<boolean> {
		const modelDef = modelId ? MODELS.find((m) => m.id === modelId) : undefined;
		const modelLabel = modelDef?.name ?? t('auth.defaultModelLabel');
		const apiKey = await vscode.window.showInputBox({
			prompt: t('auth.promptFor', modelLabel),
			placeHolder: t('auth.placeholder'),
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
			if (modelId) {
				await this.setApiKeyForModel(modelId, apiKey);
			} else {
				await this.setApiKey(apiKey);
			}
			vscode.window.showInformationMessage(t('auth.savedFor', modelLabel));
			return true;
		}

		return false;
	}
}
