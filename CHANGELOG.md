# Changelog

## 0.10.0 (2026-10-29)

Brings large tool sets back under control and keeps the request prefix cacheable.

### Features

* **tools:** tool search — when a chat has more enabled tools than `toolSearch.maxTools` (default 24), only the relevant tools plus one `multi_model_tool_search` entry point are sent; the model searches for anything else and then calls it directly. Tools disabled in the picker are never re-added, while tools the host trimmed stay reachable once searched for ([docs](docs/settings/tool-search.en.md))
* **settings:** `toolSearch.mode` (`auto` / `off`) and `toolSearch.maxTools`

### Performance

* **cache:** the tool list is picked once per conversation and only ever grows at its tail, so the cached request prefix survives later turns; `experimental.stabilizeToolList` pre-activation is skipped while tool search is active
* **diagnostics:** the `[tool-search]` log line reports `sticky=` and `appended=` next to the existing cache trace

## 0.9.0 (2026-10-09)

Rebuilt around what Copilot's built-in Custom Endpoint provider does not cover.

### Features

* **presets:** DeepSeek, MiMo, and Qwen stay, with per-provider auth and `thinking` handling, pricing, context limits, and the vision proxy for models without native vision
* **packaging:** `npm run package` works on any platform (Node replaces the bash + awk README step), and the welcome walkthrough id is derived from the installed extension id

### Breaking changes

* **provider:** the custom-model editor and model discovery are gone - use Copilot's built-in Custom Endpoint provider (`chatLanguageModels.json`) for arbitrary endpoints
* **settings:** `baseUrl`, `mimoBaseUrl`, `qwenBaseUrl`, `modelIdOverrides`, and the `resetBaseUrl` command are removed; providers are pinned to their official endpoints
* **settings:** the `customModels` setting and the `debugMode: verbose` level are removed (request payloads are no longer written to disk, and the dumps-folder command is gone)
* **auth:** API keys are read from VS Code SecretStorage only
* **compat:** legacy replay-marker and vision-model formats, the legacy `debug` setting, and the inherited tags/releases are gone

### Documentation

* README, `docs/`, and the walkthrough condensed; the outdated picker screenshot removed
* VS Code Marketplace publishing removed - this fork publishes to Open VSX only
