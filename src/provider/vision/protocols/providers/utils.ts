import { isRecord } from '../../../../guards';
import type { VisionImagePart } from '../../types';

export { isRecord };

export function toBase64(image: VisionImagePart): string {
	return Buffer.from(image.data.buffer, image.data.byteOffset, image.data.byteLength).toString(
		'base64',
	);
}
