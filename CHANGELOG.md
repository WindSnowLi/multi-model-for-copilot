# Changelog

## [0.8.0](https://github.com/WindSnowLi/multi-model-for-copilot/compare/v0.7.0...v0.8.0) (2026-10-08)


### Features

* **statusbar:** add live token-generation speed (tokens/s) in the status bar while a response streams, and live account balance for DeepSeek (toggle via `multi-model-for-copilot.statusBar.tokenSpeed` / `statusBar.balance`)
* **vision:** describe tool-result images through the vision proxy for non-native models, and forward them directly as `image_url` for native vision models
* **pricing:** show DeepSeek peak/off-peak dynamic pricing in the model picker, auto-refreshing at each billing-period transition
* **provider:** add DeepSeek V4.1 Flash with native vision input (sent to the `deepseek-flash` model name) and a 1M-token context, and drop the retired `deepseek-v4-flash` / `deepseek-v4-flash-vision-exp` presets that DeepSeek now serves from V4.1 Flash
* **config:** add `requestHeaders` with `${conversationId}` templating, merged case-insensitively into every chat completion request
* **tools:** emit an explicit empty schema for parameterless tools and drop the stale 128-tool limit
* **runtime:** register the provider synchronously and refresh models after Copilot activates, which avoids a BYOK activation deadlock; stop refreshing models during deactivation
* **settings:** add a `resetBaseUrl` command with scope preview, confirm API key removal, and contribute the previously missing `qwenBaseUrl` setting
* **provider:** respect `toolMode: required` and declare `capabilities.apiType` as Chat Completions
* **provider:** replace the MiMo V2.5 presets with the V2.6 series (Pro, Flash, Pro Ultraspeed); all three are natively omni-modal and accept image input

### Bug Fixes

* **vision:** ship the improved Vision Proxy prompt as the default
* **pricing:** emit only `infoText`/`priceCategory` so the model picker stops rendering formatted cost strings as "Unknown"
* **provider:** fix HTTP 400 "Invalid request parameters" from MiMo when thinking effort was set to `max` — the MiMo API rejects `reasoning_effort: max`, so MiMo models now offer `none`/`low`/`high` and send the documented `thinking: { type }` switch alongside `reasoning_effort`
* **pricing:** correct DeepSeek V4 Pro's CNY peak/off-peak rates and flat fallback price so they match the USD schedule
