/**
 * iQIYI Media Endpoints
 * HLS streaming via /episode endpoint
 *
 * iQIYI uses HLS (m3u8) streaming with Referer + User-Agent restricted CDN.
 * The CDN proxy handles:
 * - Adding Referer: https://www.iq.com/ header
 * - Adding User-Agent header
 * - CORS headers for browser access
 */

import { fetchAPI } from "../client";
import { IQIYI_PROXY_PREFIX } from "../constants";
import type { EpisodeResponse } from "../types";

/**
 * Get the HLS m3u8 URL for a specific episode.
 * Fetches the /episode endpoint and returns the hlsUrl/m3u8Url.
 * The proxy handles Referer and User-Agent headers for CDN access.
 */
export async function getHLSUrl(
  id: string | number,
  ep: number = 1,
  lang: string = "en",
  albumId?: string
): Promise<string> {
  const response = await fetchAPI<EpisodeResponse>(
    `${IQIYI_PROXY_PREFIX}/episode`,
    { params: { id, ep, lang, albumId } }
  );

  return response.hlsUrl || response.m3u8Url || response.videoUrl || "";
}

/**
 * Get full episode media info including HLS URL, subtitles, and quality options.
 * For movies, use ep=0.
 */
export async function getEpisodeMedia(
  id: string | number,
  ep: number = 1,
  lang: string = "en",
  albumId?: string
): Promise<EpisodeResponse> {
  return await fetchAPI<EpisodeResponse>(
    `${IQIYI_PROXY_PREFIX}/episode`,
    { params: { id, ep, lang, albumId } }
  );
}

/**
 * Build the local proxy URL for an HLS episode.
 * hls.js will fetch the m3u8 through our proxy which handles:
 * - Rewriting API-relative paths in the m3u8
 * - Adding Referer/UA headers for CDN segment requests
 */
export function buildHLSProxyUrl(
  id: string | number,
  ep: number,
  lang: string = "en",
  albumId?: string
): string {
  const params = new URLSearchParams({
    id: String(id),
    ep: String(ep),
    lang,
  });
  if (albumId) {
    params.set("albumId", albumId);
  }
  return `${IQIYI_PROXY_PREFIX}/episode?${params.toString()}`;
}
