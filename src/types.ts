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
	reasoning_effort?: 'high' | 'max';
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

export interface ModelPricing {
	cacheHitInput: number;
	cacheMissInput: number;
	output: number;
}

export type ApiProvider = 'deepseek' | 'mimo' | 'qwen' | 'custom';

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
		toolCalling: boolean | number;
		imageInput: boolean;
		thinking: boolean;
	};
	requiresThinkingParam: boolean;
	pricing?: Readonly<Record<PricingCurrency, ModelPricing>>;
	priceCategory?: PriceCategory;
}

// ---- Custom model configuration (from settings) ----

/**
 * User-defined custom model configuration stored in settings.
 * Allows connecting to any OpenAI-compatible API endpoint.
 */
export interface CustomModelConfig {
	/** Unique identifier for this model (used in model picker). */
	id: string;
	/** Display name shown in the model picker. */
	name: string;
	/** Base URL of the OpenAI-compatible API (e.g. https://api.example.com/v1). */
	baseUrl: string;
	/** Model ID to send in the API request body. */
	modelId: string;
	/** VS Code SecretStorage key for this model's API key. Stored separately. */
	apiKeySecretKey?: string;
	/** HTTP header name for authentication. Defaults to 'Authorization'. */
	authHeader?: string;
	/** Prefix before the API key value. Defaults to 'Bearer '. Set to '' for api-key header style. */
	authPrefix?: string;
	/** Maximum input tokens. Defaults to 128000. */
	maxInputTokens?: number;
	/** Maximum output tokens. Defaults to 8192. */
	maxOutputTokens?: number;
	/** Tool calling support. true/false or a number for max tools. Defaults to false. */
	toolCalling?: boolean | number;
	/** Image input support. Defaults to false. */
	imageInput?: boolean;
	/** Thinking/reasoning mode support. Defaults to false. */
	thinking?: boolean;
	/** Whether to send thinking: { type: 'enabled' } param. Defaults to false. */
	requiresThinkingParam?: boolean;
	/** Use max_completion_tokens instead of max_tokens. Defaults to false. */
	useMaxCompletionTokens?: boolean;
	/** Short description for the model picker. */
	detail?: string;
}
