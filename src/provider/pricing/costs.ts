import vscode from 'vscode';
import { t } from '../../i18n';
import type { ModelDefinition, ModelPricing, PriceCategory, PricingCurrency } from '../../types';
import { getPricingPeriod, type PricingPeriod } from './schedule';

/**
 * Cost metadata for the model picker.
 *
 * Models with a `pricingSchedule` expose period-aware rates through `infoText`
 * (VS Code 1.135+ forwards this; earlier hosts ignore it and degrade to a plain
 * model card). Models without a schedule keep the legacy formatted cost fields.
 */
export interface ModelCostInformation {
	readonly inputCost?: string;
	readonly outputCost?: string;
	readonly cacheCost?: string;
	readonly priceCategory?: PriceCategory;
	readonly infoText?: Readonly<Record<string, string>>;
}

export function toModelCostInfo(
	model: ModelDefinition,
	currency?: PricingCurrency,
	now = new Date(),
	showPricingNotice = true,
): ModelCostInformation {
	if (!currency) {
		return {};
	}

	const schedule = model.pricingSchedule?.[currency];
	if (!schedule) {
		// Back-compat: static pricing rendered as formatted cost fields.
		const pricing = model.pricing?.[currency];
		if (!pricing) {
			return {};
		}
		return {
			...(model.priceCategory ? { priceCategory: model.priceCategory } : {}),
			inputCost: formatPriceValue(pricing.cacheMissInput, currency),
			outputCost: formatPriceValue(pricing.output, currency),
			cacheCost: formatPriceValue(pricing.cacheHitInput, currency),
		};
	}

	if (!showPricingNotice) {
		return {};
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
	const unitSuffix = t('model.pricing.unitSuffix');
	const transitionTime = formatTransitionTime(now, nextTransitionAt);
	const priceLines = [
		`${t('model.pricing.inputLabel')}: ${formatPriceValue(pricing.cacheMissInput, currency)}${unitSuffix}`,
		`${t('model.pricing.cacheHitInputLabel')}: ${formatPriceValue(pricing.cacheHitInput, currency)}${unitSuffix}`,
		`${t('model.pricing.outputLabel')}: ${formatPriceValue(pricing.output, currency)}${unitSuffix}`,
	].join('\n');
	const priceBlock = ['```bash', priceLines, '```'].join('\n');
	const transitionNotice = t('model.pricing.periodStarts', nextPeriodLabel, transitionTime);

	return [`**${periodLabel}** · ${transitionNotice}`, priceBlock].join('\n');
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
