import { DEEPSEEK_TOOLS_LIMIT } from './provider/tools/consts';
import type { CustomModelDefinition, ModelDefinition } from './types';
import vscode from 'vscode';

/**
 * Compile-time constants shared across the extension.
 *
 * These do NOT depend on the VS Code runtime (no workspace configuration,
 * no secrets API). For run-time settings reads see `config.ts`.
 */

/** VS Code configuration section prefix for all extension settings. */
export const CONFIG_SECTION = 'multi-model-copilot';

export const EXTERNAL_URLS = {
	deepseek: {
		apiKeys: 'https://platform.deepseek.com/api_keys',
		usage: 'https://platform.deepseek.com/usage',
		status: 'https://status.deepseek.com',
	},
	zhipu: {
		apiKeys: 'https://bigmodel.cn/usercenter/proj-mgmt/apikeys',
		usage: 'https://bigmodel.cn/usercenter/finance/pay',
	},
} as const;

/** URI path handled by this extension to reveal the output log. */
export const SHOW_LOGS_URI_PATH = '/showLogs';

/** URI path handled by this extension to open API key configuration. */
export const CONFIGURE_API_KEY_URI_PATH = '/setApiKey';

/** URI path handled by this extension to open vision model configuration. */
export const SET_VISION_MODEL_URI_PATH = '/setVisionModel';

// VS Code's internal LanguageModelChatMessageRole.System is not exposed in @types/vscode.
export const LANGUAGE_MODEL_CHAT_SYSTEM_ROLE = 3;

// ---- Secret keys ----

/** SecretStorage key for the DeepSeek API key. */
export const API_KEY_SECRET = 'multi-model-copilot.apiKey';

// ---- Walkthrough ----

/** Walkthrough contribution ID. */
export const WELCOME_SHOWN_KEY = 'multi-model-copilot.welcomeShown';

/** Walkthrough contribution ID. */
export const WALKTHROUGH_ID = 'ludysama.multi-model-copilot#deepseekGettingStarted';

// ---- Model registry ----

/** Available models exposed through the language model provider. */
export const MODELS: ModelDefinition[] = [
	{
		id: 'deepseek-v4-flash',
		name: 'DeepSeek V4 Flash',
		family: 'deepseek',
		version: 'v4',
		detail: 'Fast, general-purpose model',
		maxInputTokens: 655360,
		maxOutputTokens: 393216,
		capabilities: {
			toolCalling: DEEPSEEK_TOOLS_LIMIT,
			imageInput: true,
			thinking: true,
		},
		requiresThinkingParam: true,
		baseUrl: 'https://api.deepseek.com',
		apiKeySecret: 'deepseek-copilot.apiKey',
		pricing: {
			USD: { cacheHitInput: 0.0028, cacheMissInput: 0.14, output: 0.28 },
			CNY: { cacheHitInput: 0.02, cacheMissInput: 1, output: 2 },
		},
		priceCategory: 'low',
	},
	{
		id: 'deepseek-v4-pro',
		name: 'DeepSeek V4 Pro',
		family: 'deepseek',
		version: 'v4',
		detail: 'Most capable reasoning model',
		maxInputTokens: 655360,
		maxOutputTokens: 393216,
		capabilities: {
			toolCalling: DEEPSEEK_TOOLS_LIMIT,
			imageInput: true,
			thinking: true,
		},
		requiresThinkingParam: true,
		baseUrl: 'https://api.deepseek.com',
		apiKeySecret: 'deepseek-copilot.apiKey',
		pricing: {
			USD: { cacheHitInput: 0.003625, cacheMissInput: 0.435, output: 0.87 },
			CNY: { cacheHitInput: 0.025, cacheMissInput: 3, output: 6 },
		},
		priceCategory: 'low',
	},
	// ====== 新增: 智谱 GLM-5.2 ======
	{
		id: 'glm-5.2',
		name: 'GLM-5.2 (智谱)',
		family: 'glm',
		version: '5.2',
		detail: '智谱 GLM-5.2 · 1M 上下文 · Coding 开源 SOTA',
		maxInputTokens: 1000000,
		maxOutputTokens: 128000,
		capabilities: {
			toolCalling: 256,
			imageInput: false,
			thinking: true,
		},
		requiresThinkingParam: false,
		baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
		apiKeySecret: 'deepseek-copilot.apiKey.zhipu',
		pricing: {
			USD: { cacheHitInput: 0.1, cacheMissInput: 1.4, output: 4.4 },
			CNY: { cacheHitInput: 0.07, cacheMissInput: 1, output: 4 },
		},
		priceCategory: 'low',
	},
	// ====== 智谱 GLM-5.2 (Coding Plan 独立扣费通道) ======
	// 同一模型权重，但走智谱 Coding Plan endpoint，需要单独申请的 API Key
	// 用户在模型选择器里按需选用；Key 独立保存，与标准版互不干扰
	{
		id: 'glm-5.2-coding',
		name: 'GLM-5.2 (智谱 Coding Plan)',
		family: 'glm',
		version: '5.2',
		detail: '智谱 GLM-5.2 · Coding Plan 独立 endpoint 与 API Key · 1M 上下文',
		maxInputTokens: 1000000,
		maxOutputTokens: 128000,
		capabilities: {
			toolCalling: 256,
			imageInput: false,
			thinking: true,
		},
		requiresThinkingParam: false,
		baseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4',
		apiKeySecret: 'deepseek-copilot.apiKey.zhipu-coding',
		pricing: {
			USD: { cacheHitInput: 0.1, cacheMissInput: 1.4, output: 4.4 },
			CNY: { cacheHitInput: 0.07, cacheMissInput: 1, output: 4 },
		},
		priceCategory: 'low',
	},
];

/**
 * Default capabilities applied to custom models when not specified.
 */
const DEFAULT_CUSTOM_CAPABILITIES = {
	toolCalling: 256,
	imageInput: false,
	thinking: false,
};

/**
 * Convert a user-defined CustomModelDefinition (from settings) into a
 * full ModelDefinition that the provider can consume.
 */
function customToModelDef(c: CustomModelDefinition): ModelDefinition {
	return {
		id: c.id,
		name: c.name,
		family: 'custom',
		version: 'custom',
		detail: c.baseUrl,
		maxInputTokens: c.maxInputTokens ?? 128000,
		maxOutputTokens: c.maxOutputTokens ?? 32768,
		capabilities: {
			toolCalling: c.capabilities?.toolCalling ?? DEFAULT_CUSTOM_CAPABILITIES.toolCalling,
			imageInput: c.capabilities?.imageInput ?? DEFAULT_CUSTOM_CAPABILITIES.imageInput,
			thinking: c.capabilities?.thinking ?? DEFAULT_CUSTOM_CAPABILITIES.thinking,
		},
		requiresThinkingParam: false,
		baseUrl: c.baseUrl,
		apiKeySecret: c.apiKeySecret,
	};
}

/**
 * Return the merged list of built-in + user-defined custom models.
 * Custom models are read from `multi-model-copilot.customModels` settings.
 */
export function getAllModels(): ModelDefinition[] {
	const builtin = MODELS;
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const customs: CustomModelDefinition[] = config.get<CustomModelDefinition[]>('customModels') ?? [];
	const customModels = customs.map(customToModelDef);
	return [...builtin, ...customModels];
}

/**
 * Save a custom model definition to VS Code settings.
 */
export async function saveCustomModel(model: CustomModelDefinition): Promise<void> {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const existing: CustomModelDefinition[] = config.get<CustomModelDefinition[]>('customModels') ?? [];
	// Replace if same id already exists, otherwise append
	const idx = existing.findIndex((m) => m.id === model.id);
	if (idx >= 0) {
		existing[idx] = model;
	} else {
		existing.push(model);
	}
	await config.update('customModels', existing, vscode.ConfigurationTarget.Global);
}

/**
 * Remove a custom model definition from VS Code settings by id.
 */
export async function removeCustomModel(id: string): Promise<void> {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	const existing: CustomModelDefinition[] = config.get<CustomModelDefinition[]>('customModels') ?? [];
	const filtered = existing.filter((m) => m.id !== id);
	await config.update('customModels', filtered, vscode.ConfigurationTarget.Global);
}
