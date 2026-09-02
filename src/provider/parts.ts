import vscode from 'vscode';

/**
 * Shared helpers for VS Code language-model content parts.
 *
 * Single source of truth for part-type detection (images, proposed thinking
 * parts) and binary→base64 conversion so provider, vision, conversion, token
 * counting, and diagnostics code paths agree on how parts are classified and
 * encoded on the wire.
 */

/** True when `part` is a VS Code data part whose MIME type is an image. */
export function isImageDataPart(part: unknown): part is vscode.LanguageModelDataPart {
	return part instanceof vscode.LanguageModelDataPart && part.mimeType.startsWith('image/');
}

/**
 * Check for LanguageModelThinkingPart (proposed API, may not be available at runtime).
 */
export function isLanguageModelThinkingPart(
	part: unknown,
): part is vscode.LanguageModelThinkingPart {
	return (
		typeof (vscode as Record<string, unknown>).LanguageModelThinkingPart === 'function' &&
		part instanceof vscode.LanguageModelThinkingPart
	);
}

/**
 * Encode image bytes as a `data:` URL suitable for OpenAI-compatible
 * `image_url` content blocks. Uses Buffer (not `btoa`) so it works in Node
 * without relying on a browser global.
 */
export function toImageDataUrl(
	part: Pick<vscode.LanguageModelDataPart, 'mimeType' | 'data'>,
): string {
	return `data:${part.mimeType};base64,${Buffer.from(
		part.data.buffer,
		part.data.byteOffset,
		part.data.byteLength,
	).toString('base64')}`;
}
