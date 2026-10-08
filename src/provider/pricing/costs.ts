import vscode from 'vscode';
import { t } from '../../i18n';
import type { ModelDefinition, ModelPricing, PriceCategory, PricingCurrency } from '../../types';
import { getPricingPeriod, type PricingPeriod } from './schedule';

/**
 * Cost metadata for the model picker.
 *
 * All rates are rendered into `infoText`, which VS Code forwards from extension
 * providers since 1.135; earlier supported hosts ignore it and degrade to a plain
 * model card. Do not restore formatted currency strings as the
 * `inputCost`/`outputCost`/`cacheCost` fields: the credit-based model picker
 * accepts only numbers there and renders strings as `Unknown`.
 */
export interface ModelCostInformation {
	readonly priceCategory?: PriceCategory;
	readonly infoText?: Readonly<Record<string, string>>;
}

export function toModelCostInfo(
	model: ModelDefinition,
	currency?: PricingCurrency,
	now = new Date(),
	showPricingNotice = true,
): ModelCostInformation {
	if (!currency || !showPricingNotice) {
		return {};
	}

	const schedule = model.pricingSchedule?.[currency];
	if (!schedule) {
		// Static per-model rates (providers without peak/off-peak billing).
		const pricing = model.pricing?.[currency];
		if (!pricing) {
			return {};
		}
		return {
			...(model.priceCategory ? { priceCategory: model.priceCategory } : {}),
			infoText: { pricing: formatStaticPricingNotice(pricing, currency) },
		};
	}

	const period = getPricingPeriod(now);
	const pricing = schedule[period.period];
	return {
		...(model.priceCategory ? { priceCategory: model.priceCategory } : {}),
		infoText: {
			pricing: formatPricingNotice(
				period.period,
				pricing,
				currency,
				now,
				period.nextTransitionAt,
			),
		},
	};
}

function formatStaticPricingNotice(pricing: ModelPricing, currency: PricingCurrency): string {
	return [
		`**${t('model.pricing.ratesTitle')}**`,
		formatPricingBlock(pricing, currency),
	].join('\n');
}

function formatPricingNotice(
	period: PricingPeriod,
	pricing: ModelPricing,
	currency: PricingCurrency,
	now: Date,
	nextTransitionAt: Date,
): string {
	const periodLabel = t(
		period === 'peak' ? 'model.pricing.currentPeak' : 'model.pricing.currentOffPeak',
	);
	const nextPeriod = period === 'peak' ? 'offPeak' : 'peak';
	const nextPeriodLabel = t(
		nextPeriod === 'peak' ? 'model.pricing.currentPeak' : 'model.pricing.currentOffPeak',
	);
	const transitionTime = formatTransitionTime(now, nextTransitionAt);
	const transitionNotice = t('model.pricing.periodStarts', nextPeriodLabel, transitionTime);

	return [`**${periodLabel}** · ${transitionNotice}`, formatPricingBlock(pricing, currency)].join(
		'\n',
	);
}

function formatPricingBlock(pricing: ModelPricing, currency: PricingCurrency): string {
	const unitSuffix = t('model.pricing.unitSuffix');
	const priceLines = [
		`${t('model.pricing.inputLabel')}: ${formatPriceValue(pricing.cacheMissInput, currency)}${unitSuffix}`,
		`${t('model.pricing.cacheHitInputLabel')}: ${formatPriceValue(pricing.cacheHitInput, currency)}${unitSuffix}`,
		`${t('model.pricing.outputLabel')}: ${formatPriceValue(pricing.output, currency)}${unitSuffix}`,
	].join('\n');
	return ['```bash', priceLines, '```'].join('\n');
}

function formatPriceValue(value: number, currency: PricingCurrency): string {
	return `${currency === 'CNY' ? '¥' : '$'}${value}`;
}

function formatTransitionTime(now: Date, nextTransitionAt: Date): string {
	const locale = getPricingLocale();
	const time = new Intl.DateTimeFormat(locale, {
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	}).format(nextTransitionAt);
	const dayDifference = getLocalDayNumber(nextTransitionAt) - getLocalDayNumber(now);

	if (dayDifference === 0) {
		return t('model.pricing.transitionTime.today', time);
	}
	if (dayDifference === 1) {
		return t('model.pricing.transitionTime.tomorrow', time);
	}

	const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(nextTransitionAt);
	return t('model.pricing.transitionTime.weekday', weekday, time);
}

function getLocalDayNumber(date: Date): number {
	const DAY_MS = 24 * 60 * 60 * 1000;
	return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
}

function getPricingLocale(): 'en-US' | 'zh-CN' {
	return vscode.env.language.toLowerCase() === 'zh-cn' ? 'zh-CN' : 'en-US';
}
