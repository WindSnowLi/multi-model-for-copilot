import vscode from 'vscode';
import { DEFAULT_THINKING_EFFORTS } from '../consts';
import { t } from '../i18n';
import type { ModelDefinition, PricingCurrency, ThinkingEffort } from '../types';
import { toModelCostInfo, type ModelCostInformation } from './pricing/costs';

/**
 * NOTE: Non-public API surface.
 *
 * The fields below (`configurationSchema` on chat info, cost metadata,
 * `modelConfiguration` on response options, plus `isBYOK` / `isUserSelectable` /
 * `statusIcon`)
 * are not part of the stable `vscode.LanguageModelChat*` typings yet. They are
 * the same shape currently consumed by GitHub Copilot Chat to render model picker
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
		readonly configurationSchema?: ThinkingEffortConfigurationSchema;
	};

export function toChatInfo(
	m: ModelDefinition,
	hasApiKey: boolean,
	pricingCurrency?: PricingCurrency,
	showPricingNotice = true,
): ModelPickerChatInformation {
	const modelDetail = resolveModelText(m, 'detail') ?? m.detail;
	const modelTooltip = resolveModelText(m, 'tooltip');
	const thinkingEfforts = getModelThinkingEfforts(m);
	return {
		id: m.id,
		name: m.name,
		family: m.family,
		version: m.version,
		detail: hasApiKey ? modelDetail : t('auth.apiKeyRequiredDetail'),
		tooltip: hasApiKey ? modelTooltip : t('auth.apiKeyRequiredDetail'),
		statusIcon: hasApiKey ? undefined : new vscode.ThemeIcon('warning'),
		maxInputTokens: m.maxInputTokens,
		maxOutputTokens: m.maxOutputTokens,
		isBYOK: true,
		isUserSelectable: true,
		capabilities: {
			toolCalling: m.capabilities.toolCalling,
			imageInput: m.capabilities.imageInput,
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
	// DeepSeek: deepseek-v4-flash → flash, deepseek-v4-pro → pro
	if (m.id.startsWith('deepseek-v4-')) {
		return m.id.slice('deepseek-v4-'.length);
	}
	// MiMo: mimo-v2.5-pro → pro, mimo-v2.5 → standard
	if (m.id === 'mimo-v2.5') {
		return 'standard';
	}
	if (m.id.startsWith('mimo-v2.5-')) {
		return m.id.slice('mimo-v2.5-'.length);
	}
	return m.id;
}
