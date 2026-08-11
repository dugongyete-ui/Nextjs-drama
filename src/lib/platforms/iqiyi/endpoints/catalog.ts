/**
 * iQIYI Catalog Endpoints
 * Detail, AllEpisodes, Episode (single)
 *
 * IMPORTANT NOTES:
 * - /detail returns drama metadata + episode list (episodes may not have video URLs)
 * - /allepisode returns all episodes for a drama
 * - /episode returns a single episode with HLS m3u8 URL + subtitles + quality info
 * - Movie uses ep=0
 * - albumId is optional — API auto-resolves if not provided
 */

import { fetchAPI } from "../client";
import { IQIYI_PROXY_PREFIX } from "../constants";
import type {
  DetailResponse,
  AllEpisodesResponse,
  EpisodeResponse,
} from "../types";

/** Get drama detail by ID (includes episode list) */
export async function getDetail(
  id: string | number,
  lang: string = "en",
  albumId?: string
): Promise<DetailResponse> {
  return await fetchAPI<DetailResponse>(
    `${IQIYI_PROXY_PREFIX}/detail`,
    { params: { id, lang, albumId } }
  );
}

/**
 * Get all episodes for a drama.
 * Returns episode list (may not include video URLs in all cases).
 */
export async function getAllEpisodes(
  id: string | number,
  lang: string = "en",
  albumId?: string
): Promise<AllEpisodesResponse> {
  return await fetchAPI<AllEpisodesResponse>(
    `${IQIYI_PROXY_PREFIX}/allepisode`,
    { params: { id, lang, albumId } }
  );
}

/**
 * Get a single episode with full streaming info.
 * This returns the HLS m3u8 URL, subtitles, and quality options.
 * For movies, use ep=0.
 */
export async function getEpisode(
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
