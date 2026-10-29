export const ACTIVATE_TOOL_PREFIX = 'activate_';
export const PREFLIGHT_ACTIVATE_CALL_ID_PREFIX = 'deepseek_preflight_activate_';
export const MAX_PREFLIGHT_ROUNDS_PER_USER_REQUEST = 3;

/**
 * Single tool-search entry point. The extension registers it as a real VS Code
 * tool (`contributes.languageModelTools`) and only forwards it to the model
 * together with the tools that are actually relevant, so a large enabled-tool
 * list never has to be sent in full.
 */
export const TOOL_SEARCH_TOOL_NAME = 'multi_model_tool_search';
export const TOOL_SEARCH_MAX_RESULTS = 8;
export const TOOL_SEARCH_MAX_DESCRIPTION_CHARS = 400;
export const TOOL_SEARCH_QUERY_MESSAGE_COUNT = 3;

export const TOOL_DRIFT_NOTICE_START = '[multi-model-for-copilot-tool-drift-notice-start]: #';
export const TOOL_DRIFT_NOTICE_END = '[multi-model-for-copilot-tool-drift-notice-end]: #';
export const VISION_PROXY_NOTICE_START = '[multi-model-for-copilot-vision-proxy-notice-start]: #';
export const VISION_PROXY_NOTICE_END = '[multi-model-for-copilot-vision-proxy-notice-end]: #';
