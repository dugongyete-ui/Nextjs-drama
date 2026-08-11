/**
 * DramaBox Media Endpoints
 * HLS streaming, Subtitles
 */

import { DRAMABOX_PROXY_PREFIX } from "../constants";
import type { SubtitleResponse } from "../types";
import { fetchAPI } from "../client";

/**
 * Get HLS streaming URL for a specific episode.
 * Returns the local proxy URL — the proxy handles m3u8 rewriting server-side.
 */
export async function getHLS(
  id: string | number,
  ep: number
): Promise<string> {
  return `${DRAMABOX_PROXY_PREFIX}/hls?id=${encodeURIComponent(String(id))}&ep=${encodeURIComponent(String(ep))}`;
}

/**
 * Get subtitles for a specific episode.
 */
export async function getSubtitles(
  id: string | number,
  ep: number,
  lang: string = "en"
): Promise<SubtitleResponse> {
  return await fetchAPI<SubtitleResponse>(
    `${DRAMABOX_PROXY_PREFIX}/subtitles`,
    { params: { id, ep, lang } }
  );
}
