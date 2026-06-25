import vscode from 'vscode';
import { AuthManager } from '../auth';
import { getStabilizeToolListEnabled } from '../config';
import { getAllModels } from '../consts';
import { t } from '../i18n';
import { logger } from '../logger';
import { createCacheDiagnosticsRecorder, dumpProviderInput } from './debug';
import { toChatInfo } from './models';
import { BalanceCurrencyResolver } from './pricing/currency';
import { prepareChatRequest } from './request';
import { classifyProviderRequest } from './routing';
import { resolveConversationSegment } from './segment';
import { streamChatCompletion } from './stream';
import { estimateTokenCount } from './tokens';
import { processToolFlow } from './tools/flow';
import { createVisionService } from './vision';

/**
 * DeepSeek Chat Provider — implements vscode.LanguageModelChatProvider so
 * DeepSeek V4 models appear directly in the Copilot Chat model picker.
 */
export class DeepSeekChatProvider implements vscode.LanguageModelChatProvider {
	private readonly authManager: AuthManager;
	private readonly globalStorageUri: vscode.Uri;
	private readonly onDidChangeLanguageModelChatInformationEmitter = new vscode.EventEmitter<void>();
	private isActive = true;

	readonly onDidChangeLanguageModelChatInformation =
		this.onDidChangeLanguageModelChatInformationEmitter.event;

	private readonly cacheDiagnostics = createCacheDiagnosticsRecorder();

	/** Vision proxy: internal bridge + VS Code LM fallback. */
	private readonly vision: ReturnType<typeof createVisionService>;
	private readonly balanceCurrencyResolver: BalanceCurrencyResolver;

	/**
	 * Adaptive chars-per-token ratio, calibrated from actual usage data.
	 * Updated via exponential moving average each time the API reports real token counts.
	 */
	private charsPerToken = 4.0;

	constructor(context: vscode.ExtensionContext) {
		this.authManager = new AuthManager(context);
		this.globalStorageUri = context.globalStorageUri;
		this.vision = createVisionService(context);
		this.balanceCurrencyResolver = new BalanceCurrencyResolver(context, this.authManager, () =>
			this.onDidChangeLanguageModelChatInformationEmitter.fire(),
		);

		context.subscriptions.push(
			this.onDidChangeLanguageModelChatInformationEmitter,
			// Settings-based fallback API key + base URL changes.
			vscode.workspace.onDidChangeConfiguration((e) => {
				if (
					e.affectsConfiguration('multi-model-copilot.apiKey') ||
					e.affectsConfiguration('multi-model-copilot.baseUrl') ||
					e.affectsConfiguration('multi-model-copilot.customModels')
				) {
					this.invalidateCurrencyAndRefreshModels();
				}
			}),
			// Multi-window: SecretStorage changes don't fire onDidChangeConfiguration.
			// When another window sets/clears the API key, refresh this window's
			// model picker so the warning state stays in sync.
			context.secrets.onDidChange((e) => {
				if (e.key === 'multi-model-copilot.apiKey') {
					this.invalidateCurrencyAndRefreshModels();
				}
			}),
		);
	}

	// ---- Public commands ----

	async configureApiKey(): Promise<void> {
		// QuickPick: pick which provider's key to set. Each model stores its
		// own key under MODELS[*].apiKeySecret so multiple providers (e.g.
		// DeepSeek + Zhipu GLM) can coexist without a single global key.
		const allModels = getAllModels();
		const pick = await vscode.window.showQuickPick(
			allModels.map((m) => ({
				label: m.name,
				description: m.baseUrl,
				modelId: m.id,
			})),
			{
				title: t('auth.selectModelTitle'),
				placeHolder: t('auth.selectModelPlaceholder'),
				ignoreFocusOut: true,
			},
		);
		if (!pick) {
			return;
		}
		const saved = await this.authManager.promptForApiKey(pick.modelId);
		if (saved) {
			this.invalidateCurrencyAndRefreshModels();
		}
	}

	/**
	 * Walk the user through adding a custom model provider.
	 * Collects name, base URL, API model ID, and API key — saves to
	 * `multi-model-copilot.customModels` settings and immediately refreshes
	 * the model picker so the new provider appears.
	 */
	async addCustomProvider(): Promise<void> {
		// Step 1: Provider display name
		const name = await vscode.window.showInputBox({
			title: t('custom.addProviderTitle'),
			prompt: t('custom.namePrompt'),
			placeHolder: t('custom.namePlaceholder'),
			ignoreFocusOut: true,
			validateInput: (v) => (v?.trim() ? undefined : t('custom.nameRequired')),
		});
		if (!name?.trim()) return;

		// Step 2: Base URL
		const baseUrl = await vscode.window.showInputBox({
			title: t('custom.addProviderTitle'),
			prompt: t('custom.urlPrompt'),
			placeHolder: t('custom.urlPlaceholder'),
			ignoreFocusOut: true,
			validateInput: (v) => {
				if (!v?.trim()) return t('custom.urlRequired');
				try {
					new URL(v.trim());
					return undefined;
				} catch {
					return t('custom.urlInvalid');
				}
			},
		});
		if (!baseUrl?.trim()) return;

		// Step 3: API model ID (what's sent to the endpoint)
		const apiModelId = await vscode.window.showInputBox({
			title: t('custom.addProviderTitle'),
			prompt: t('custom.apiModelIdPrompt'),
			placeHolder: t('custom.apiModelIdPlaceholder'),
			ignoreFocusOut: true,
			validateInput: (v) => (v?.trim() ? undefined : t('custom.apiModelIdRequired')),
		});
		if (!apiModelId?.trim()) return;

		// Step 4: API Key (stored in SecretStorage)
		const apiKey = await vscode.window.showInputBox({
			title: t('custom.addProviderTitle'),
			prompt: t('custom.apiKeyPrompt', name.trim()),
			placeHolder: t('auth.placeholder'),
			password: true,
			ignoreFocusOut: true,
			validateInput: (v) => (v?.trim() ? undefined : t('custom.apiKeyRequired')),
		});
		if (!apiKey?.trim()) return;

		// Generate a stable id from the name
		const id = 'custom-' + name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
		const secretKey = `multi-model-copilot.custom.${id}`;

		// Save the custom model config to settings FIRST so getAllModels() can find it
		const config = vscode.workspace.getConfiguration('multi-model-copilot');
		const existing: object[] = config.get<object[]>('customModels') ?? [];
		const idx = existing.findIndex((m: any) => m.id === id);
		const entry = {
			id,
			name: name.trim(),
			baseUrl: baseUrl.trim().replace(/\/+$/, ''),
			apiModelId: apiModelId.trim(),
			apiKeySecret: secretKey,
		};
		if (idx >= 0) {
			existing[idx] = entry;
		} else {
			existing.push(entry);
		}
		await config.update('customModels', existing, vscode.ConfigurationTarget.Global);

		// Now save the API key — setApiKeyForModel will find the model via getAllModels()
		await this.authManager.setApiKeyForModel(id, apiKey.trim());

		vscode.window.showInformationMessage(t('custom.saved', name.trim()));
		this.invalidateCurrencyAndRefreshModels();
	}

	async clearApiKey(): Promise<void> {
		await this.authManager.deleteApiKey();
		this.invalidateCurrencyAndRefreshModels();
		vscode.window.showInformationMessage(t('auth.removed'));
	}

	async hasApiKey(): Promise<boolean> {
		return this.authManager.hasApiKey();
	}

	/** Force Copilot Chat to re-query model information (including configurationSchema). */
	refreshModelPicker(): void {
		this.onDidChangeLanguageModelChatInformationEmitter.fire();
	}

	private invalidateCurrencyAndRefreshModels(): void {
		void this.balanceCurrencyResolver
			.invalidate()
			.catch((error) => logger.warn('Failed to invalidate DeepSeek balance currency', error))
			.finally(() => this.onDidChangeLanguageModelChatInformationEmitter.fire());
	}

	async prepareForDeactivate(): Promise<void> {
		this.isActive = false;
		this.onDidChangeLanguageModelChatInformationEmitter.fire();

		// Force the host to re-pull `provideLanguageModelChatInformation` synchronously
		// before the extension unloads. With `isActive = false` we now return [],
		// which makes Copilot Chat drop DeepSeek models from the picker immediately
		// instead of leaving stale entries behind after deactivate. The returned
		// model list itself is unused — we only call this for its side effect.
		try {
			await vscode.lm.selectChatModels({ vendor: 'deepseek' });
		} catch (error) {
			logger.warn('Failed to refresh DeepSeek models during deactivate', error);
		}
	}

	async setVisionModel(): Promise<void> {
		await this.vision.openConfiguration();
	}

	// ---- LanguageModelChatProvider ----

	async provideLanguageModelChatInformation(
		_options: vscode.PrepareLanguageModelChatModelOptions,
		_token: vscode.CancellationToken,
	): Promise<vscode.LanguageModelChatInformation[]> {
		if (!this.isActive) {
			return [];
		}

		const pricingCurrency = this.balanceCurrencyResolver.getDisplayCurrency();
		if (await this.authManager.hasApiKey()) {
			this.balanceCurrencyResolver.refreshInBackground();
		}
		// 每个 model 各自查自己的 key (per-model apiKeySecret)
		return Promise.all(
			getAllModels().map(async (model) => {
				const hasKey = await this.authManager.hasApiKey(model.id);
				return toChatInfo(model, hasKey, pricingCurrency);
			}),
		);
	}

	async provideLanguageModelChatResponse(
		modelInfo: vscode.LanguageModelChatInformation,
		messages: readonly vscode.LanguageModelChatRequestMessage[],
		options: vscode.ProvideLanguageModelChatResponseOptions,
		progress: vscode.Progress<vscode.LanguageModelResponsePart>,
		token: vscode.CancellationToken,
	): Promise<void> {
		const segment = resolveConversationSegment(messages);
		const requestKind = classifyProviderRequest({
			messages,
			tools: options.tools,
		});

		dumpProviderInput({
			globalStorageUri: this.globalStorageUri,
			segment,
			modelInfo,
			messages,
			requestOptions: options,
			requestKind,
		});

		const toolFlow = processToolFlow({
			stabilizeToolList: getStabilizeToolListEnabled(),
			messages,
			tools: options.tools,
			progress,
			requestKind,
		});
		if (toolFlow.preflightHandled) {
			return;
		}

		const prepared = await prepareChatRequest({
			authManager: this.authManager,
			globalStorageUri: this.globalStorageUri,
			modelInfo,
			segment,
			messages: toolFlow.messages,
			options,
			token,
			cacheDiagnostics: this.cacheDiagnostics,
			getVisionDescriber: () => this.vision.get(),
		});

		return streamChatCompletion({
			prepared,
			progress,
			token,
			initialResponseNotice: joinInitialResponseNotices(
				toolFlow.initialResponseNotice,
				prepared.initialResponseNotice,
			),
			getCharsPerToken: () => this.charsPerToken,
			setCharsPerToken: (charsPerToken) => {
				this.charsPerToken = charsPerToken;
			},
		});
	}

	async provideTokenCount(
		_modelInfo: vscode.LanguageModelChatInformation,
		text: string | vscode.LanguageModelChatRequestMessage,
		_token: vscode.CancellationToken,
	): Promise<number> {
		return estimateTokenCount(text, this.charsPerToken);
	}
}

function joinInitialResponseNotices(...notices: (string | undefined)[]): string | undefined {
	const joined = notices.filter((notice) => notice && notice.trim().length > 0).join('\n');
	return joined || undefined;
}
