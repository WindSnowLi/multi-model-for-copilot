import type { ApiProvider, ChatCompletionRequest } from '../types';

export interface ErrorActionUrls {
	configureApiKey?: string;
	showLogs?: string;
}

export interface RequestErrorContext {
	provider: ApiProvider;
	baseUrl: string;
	request: ChatCompletionRequest;
}

export interface ErrorActionLink {
	labelKey: string;
	url: string;
}

export interface HttpErrorLinkDefinition {
	labelKey: string;
	url: string;
}

export type HttpErrorLinkStatusKey = 401 | 402 | '5xx';

export type ApiRequestErrorKind = 'http' | 'network' | 'unknown';

export type NetworkErrorCategory =
	| 'dns'
	| 'unreachable'
	| 'interrupted'
	| 'timeout'
	| 'tls'
	| 'aborted'
	| 'protocol'
	| 'configuration'
	| 'generic';
