import { getAllModels } from '../../consts';

export const REPLAY_MARKER_MIME = 'stateful_marker';
export const REPLAY_MARKER_WRITER_ID = 'deepseek-copilot';

/**
 * Return the set of known model IDs that may appear as replay marker prefixes.
 * Includes both built-in and user-defined custom models.
 */
export function getReplayMarkerPrefixes(): Set<string> {
	return new Set([
		REPLAY_MARKER_WRITER_ID,
		...getAllModels().map((model) => model.id),
	]);
}
export const ENCODED_JSON_MARKER_PREFIX = 'json:';
export const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
export const LEGACY_SEGMENT_ID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
