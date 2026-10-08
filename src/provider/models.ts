import vscode from 'vscode';
import { DEFAULT_THINKING_EFFORTS, DEEPSEEK_V41_FLASH_MODEL_ID } from '../consts';
import { t } from '../i18n';
import type { ModelDefinition, PricingCurrency, ThinkingEffort } from '../types';
import { toModelCostInfo, type ModelCostInformation } from './pricing/costs';
import { getModelRetirementNotice } from './retirement';

/**
 * NOTE: Non-public API surface.
 *
 * The fields below (`configurationSchema` on chat info, cost metadata,
 * `warningText` / `infoText` model picker banners, `modelConfiguration` on
 * response options, plus `isBYOK` / `isUserSelectable` / `statusIcon`) are not
 * part of the stable `vscode.LanguageModelChat*` typings yet. They are the same
 * shape currently consumed by GitHub Copilot Chat to render model picker
 * metadata and per-model configuration controls.
 */

export type ModelConfigurationOptions = vscode.ProvideLanguageModelChatResponseOptions & {
	readonly modelConfiguration?: Record<string, unknown>;
	readonly configuration?: Record<string, unknown>;
};

type ThinkingEffortConfigurationSchema = ReturnType<typeof buildThinkingEffortSchema>;

export type ModelPickerChatInformation = vscode.LanguageModelChatInformation &
	ModelCostInformation & {
		readonly isUserSelectable: boolean;
		readonly isBYOK: true;
		readonly statusIcon?: vscode.ThemeIcon;
		/** Warning banner shown in the model picker hover (e.g. retirement notices). */
		readonly warningText?: Readonly<Record<string, string>>;
		readonly capabilities: vscode.LanguageModelChatCapabilities & {
			/**
			 * Request protocol used by this provider (1 = Chat Completions). Declared
			 * through the proposed `languageModelCapabilities` API so the host knows
			 * which reasoning blocks can be replayed.
			 */
			readonly apiType?: number;
		};
		readonly configurationSchema?: ThinkingEffortConfigurationSchema;
	};

/** Chat Completions protocol marker for `LanguageModelChatCapabilities.apiType`. */
const CHAT_COMPLETIONS_API_TYPE = 1;

export function toChatInfo(
	m: ModelDefinition,
	hasApiKey: boolean,
	pricingCurrency?: PricingCurrency,
	showPricingNotice = true,
	usesOfficialModel = true,
): ModelPickerChatInformation {
	const modelDetail = resolveModelText(m, 'detail') ?? m.detail;
	const modelTooltip = resolveModelText(m, 'tooltip');
	const thinkingEfforts = getModelThinkingEfforts(m);
	const retirement = getModelRetirementNotice(m.id, usesOfficialModel);
	return {
		id: m.id,
		name: m.name,
		family: m.family,
		version: m.version,
		detail: hasApiKey ? modelDetail : t('auth.apiKeyRequiredDetail'),
		tooltip: hasApiKey ? modelTooltip : t('auth.apiKeyRequiredDetail'),
		statusIcon: !hasApiKey || retirement ? new vscode.ThemeIcon('warning') : undefined,
		...(retirement ? { warningText: { [retirement.code]: retirement.message } } : {}),
		maxInputTokens: m.maxInputTokens,
		maxOutputTokens: m.maxOutputTokens,
		isBYOK: true,
		isUserSelectable: true,
		capabilities: {
			toolCalling: m.capabilities.toolCalling,
			imageInput: m.capabilities.imageInput,
			// Every built-in provider and custom model speaks the OpenAI-compatible
			// Chat Completions protocol.
			apiType: CHAT_COMPLETIONS_API_TYPE,
		},
		...toModelCostInfo(m, pricingCurrency, new Date(), showPricingNotice),
		...(m.capabilities.thinking
			? { configurationSchema: buildThinkingEffortSchema(thinkingEfforts) }
			: {}),
	};
}

/**
 * Resolve the ordered reasoning efforts a model exposes. Falls back to the
 * default set (none/high/max) when the model does not declare any.
 */
export function getModelThinkingEfforts(m: ModelDefinition | undefined): readonly ThinkingEffort[] {
	return m?.thinkingEfforts ?? DEFAULT_THINKING_EFFORTS;
}

/**
 * Read the reasoning effort the caller requested for this turn, normalized to
 * the model's supported set. `none` means thinking is disabled.
 */
export function getConfiguredThinkingEffort(
	options: ModelConfigurationOptions,
	supportedEfforts: readonly ThinkingEffort[] = DEFAULT_THINKING_EFFORTS,
): ThinkingEffort {
	const configuredEffort =
		options.modelConfiguration?.reasoningEffort ?? options.configuration?.reasoningEffort;

	if (configuredEffort === 'none' && supportedEfforts.includes('none')) {
		return 'none';
	}
	if (configuredEffort === 'low' && supportedEfforts.includes('low')) {
		return 'low';
	}
	if (configuredEffort === 'max' && supportedEfforts.includes('max')) {
		return 'max';
	}
	// Fall back to high when the model supports it (keeps the historical default),
	// otherwise to the first non-disabled supported effort.
	return (
		supportedEfforts.includes('high')
			? 'high'
			: (supportedEfforts.find((effort) => effort !== 'none') ?? 'high')
	) as ThinkingEffort;
}

function buildThinkingEffortSchema(efforts: readonly ThinkingEffort[]) {
	const activeEfforts = efforts.filter((effort) => effort !== 'none');
	return {
		properties: {
			reasoningEffort: {
				type: 'string',
				title: t('status.thinking'),
				enum: [...efforts],
				enumItemLabels: efforts.map((effort) => t(`thinking.${effort}`)),
				enumDescriptions: efforts.map((effort) => t(`thinking.${effort}.desc`)),
				default: efforts.includes('high') ? 'high' : (activeEfforts[0] ?? 'high'),
				group: 'navigation',
			},
		},
	} as const;
}

function resolveModelText(m: ModelDefinition, field: 'detail' | 'tooltip'): string | undefined {
	const suffix = extractModelSuffix(m);
	const key = `model.${m.provider}.${suffix}.${field}`;
	const translated = t(key);
	return translated !== key ? translated : undefined;
}

function extractModelSuffix(m: ModelDefinition): string {
	// DeepSeek V4.1: deepseek-v4.1-flash → v4.1-flash (distinct from the legacy V4 Flash keys)
	if (m.id === DEEPSEEK_V41_FLASH_MODEL_ID) {
		return 'v4.1-flash';
	}
	// DeepSeek: deepseek-v4-flash → flash, deepseek-v4-pro → pro
	if (m.id.startsWith('deepseek-v4-')) {
		return m.id.slice('deepseek-v4-'.length);
	}
	// MiMo: mimo-v2.6-pro → pro, mimo-v2.6-flash → flash,
	// mimo-v2.6-pro-ultraspeed → pro-ultraspeed
	const mimoSuffix = /^mimo-v[\d.]+-(.+)$/u.exec(m.id);
	if (mimoSuffix) {
		return mimoSuffix[1];
	}
	return m.id;
}
