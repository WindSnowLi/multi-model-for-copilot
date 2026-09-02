/**
 * Generic runtime type guards shared across the extension.
 */

/** True when `value` is a plain (non-null, non-array) object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
