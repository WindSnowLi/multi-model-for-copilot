import type { ChatUsage } from '../types';

/**
 * Normalize provider-specific cache accounting into the DeepSeek-style fields.
 *
 * DeepSeek reports `prompt_cache_hit_tokens` / `prompt_cache_miss_tokens` on the
 * usage root, while OpenAI-compatible providers (for example Qwen) only report
 * the cached portion as `prompt_tokens_details.cached_tokens`. Diagnostics and
 * the Copilot usage data part read the DeepSeek fields, so derive them here
 * instead of dropping the provider-reported cache hit.
 */
export function normalizeUsage(usage: ChatUsage): ChatUsage {
	const hit =
		toTokenCount(usage.prompt_cache_hit_tokens) ??
		toTokenCount(usage.prompt_tokens_details?.cached_tokens);
	const miss =
		toTokenCount(usage.prompt_cache_miss_tokens) ??
		(hit === undefined ? undefined : Math.max(0, usage.prompt_tokens - hit));

	const normalized: ChatUsage = { ...usage };
	if (hit !== undefined) {
		normalized.prompt_cache_hit_tokens = hit;
	}
	if (miss !== undefined) {
		normalized.prompt_cache_miss_tokens = miss;
	}
	return normalized;
}

function toTokenCount(value: number | undefined): number | undefined {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return undefined;
	}
	return Math.max(0, Math.round(value));
}
