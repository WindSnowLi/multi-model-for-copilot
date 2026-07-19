// Silence Node.js deprecation warnings from VS Code's Electron runtime internals
// (url.parse / punycode — not from this extension or its dependencies)
process.noDeprecation = true;

export { activate, deactivate } from './runtime';

