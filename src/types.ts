/**
 * Shared types for the multi-model extension.
 */

// ---- API request/response types ----

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant' | 'tool';
	content: string;
	tool_call_id?: string;
	tool_calls?: ChatToolCall[];
	reasoning_content?: string;
	/** Image data for models with native image support (base64 data URLs). */
	imageUrls?: string[];
}

export interface ChatToolCall {
	id: string;
	type: 'function';
	function: {
		name: string;
		arguments: string;
	};
}

export interface ChatTool {
	type: 'function';
	function: {
		name: string;
		description?: string;
		parameters?: Record<string, unknown>;
	};
}

export interface ChatUsage {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
	prompt_cache_hit_tokens?: number;
	prompt_cache_miss_tokens?: number;
}

export interface ChatCompletionRequest {
	model: string;
	messages: ChatMessage[];
	stream: boolean;
	temperature?: number;
	top_p?: number;
	max_tokens?: number;
	max_completion_tokens?: number;
	tools?: ChatTool[];
	tool_choice?: 'none' | 'auto' | 'required';
	thinking?: { type: 'enabled' | 'disabled' };
	reasoning_effort?: Exclude<ThinkingEffort, 'none'>;
	stream_options?: {
		include_usage: boolean;
	};
}

export interface ChatStreamChunk {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: Array<{
		index: number;
		delta: {
			role?: string;
			content?: string;
			reasoning_content?: string;
			tool_calls?: Array<{
				index: number;
				id?: string;
				type?: string;
				function?: {
					name?: string;
					arguments?: string;
				};
			}>;
		};
		finish_reason: string | null;
	}>;
	usage?: ChatUsage;
}

// ---- Stream callbacks ----

export interface StreamCallbacks {
	onContent: (content: string) => void;
	onThinking: (text: string) => void;
	onToolCall: (toolCall: ChatToolCall) => void;
	onError: (error: Error) => void;
	onDone: () => void;
	onUsage?: (usage: ChatUsage) => void;
}

// ---- Model definitions ----

export type PricingCurrency = 'USD' | 'CNY';

export type PriceCategory = 'low' | 'medium' | 'high' | 'very_high';

/** DeepSeek-style peak/off-peak billing period. */
export type PricingPeriod = 'offPeak' | 'peak';

export interface ModelPricing {
	cacheHitInput: number;
	cacheMissInput: number;
	output: number;
}

/**
 * Model pricing that differs by billing period. DeepSeek charges different
 * rates during peak vs. off-peak hours (off-peak is half of peak).
 */
export interface ModelPricingSchedule {
	/** Peak-period rates. */
	readonly peak: ModelPricing;
	/** Off-peak-period rates. */
	readonly offPeak: ModelPricing;
}

export type ApiProvider = 'deepseek' | 'mimo' | 'qwen';

/** Reasoning effort levels exposed in the model picker. */
export type ThinkingEffort = 'none' | 'low' | 'high' | 'max';

export interface ModelDefinition {
	id: string;
	name: string;
	provider: ApiProvider;
	family: string;
	version: string;
	detail: string;
	maxInputTokens: number;
	maxOutputTokens: number;
	capabilities: {
		/**
		 * Tool calling support. `true` enables tools; a number additionally
		 * advertises the model's own per-request tool limit to VS Code, which
		 * trims the tool list before the request reaches this provider.
		 */
		toolCalling: boolean | number;
		/**
		 * Whether the model picker exposes image input for this model. When `true`
		 * the user may attach images; if `nativeImageInput` is `false` those images
		 * are routed through the vision proxy (described to text) before the request
		 * is sent, because the underlying API model does not accept images itself.
		 */
		imageInput: boolean;
		/**
		 * Whether the underlying API model natively accepts image data (OpenAI
		 * `image_url` content blocks). Only native models have images forwarded
		 * directly; non-native models with `imageInput: true` use the vision proxy.
		 */
		nativeImageInput?: boolean;
		/** Whether the model supports a reasoning/thinking effort picker. */
		thinking: boolean;
	};
	/** Ordered list of reasoning efforts the model supports (default: none/high/max). */
	thinkingEfforts?: readonly ThinkingEffort[];
	requiresThinkingParam: boolean;
	pricing?: Readonly<Record<PricingCurrency, ModelPricing>>;
	/** Period-aware pricing (peak/off-peak). When present it drives dynamic rate display. */
	pricingSchedule?: Readonly<Record<PricingCurrency, ModelPricingSchedule>>;
	priceCategory?: PriceCategory;
}
