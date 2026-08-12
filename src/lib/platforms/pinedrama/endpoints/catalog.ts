/**
 * PineDrama Catalog Endpoints
 * Detail, Episode (single), AllEpisodes
 *
 * IMPORTANT NOTES:
 * - /allepisode endpoint returns all episodes with video URLs, qualityList, duration_ms
 * - /episode endpoint returns a single episode with full video info
 * - PineDrama does NOT use HLS — it returns direct MP4 from TikTok CDN
 */

import { fetchAPI } from "../client";
import { PINEDRAMA_PROXY_PREFIX } from "../constants";
import type {
  DetailResponse,
  EpisodeResponse,
  AllEpisodesResponse,
} from "../types";

/** Get drama detail by ID */
export async function getDetail(
  id: string | number,
  lang: string = "en"
): Promise<DetailResponse> {
  return await fetchAPI<DetailResponse>(
    `${PINEDRAMA_PROXY_PREFIX}/detail`,
    { params: { id, lang } }
  );
}

/**
 * Get a single episode with full video info.
 * This is the ONLY way to get the actual videoUrl — it's empty in detail responses.
 * Returns videoUrl, videoId, duration_ms, qualityList.
 */
export async function getEpisode(
  id: string | number,
  ep: number,
  lang: string = "en"
): Promise<EpisodeResponse> {
  return await fetchAPI<EpisodeResponse>(
    `${PINEDRAMA_PROXY_PREFIX}/episode`,
    { params: { id, ep, lang } }
  );
}

/**
 * Get all episodes for a drama.
 * The /allepisode endpoint returns full episode data including:
 * - videoUrl (direct MP4 URL from TikTok CDN)
 * - qualityList (HD/SD options with URLs)
 * - duration_ms (episode duration)
 * - quality (default quality label)
 * Falls back to detail.episodes if the endpoint fails.
 */
export async function getAllEpisodes(
  id: string | number,
  lang: string = "en"
): Promise<AllEpisodesResponse> {
  try {
    const response = await fetchAPI<AllEpisodesResponse>(
      `${PINEDRAMA_PROXY_PREFIX}/allepisode`,
      { params: { id, lang } }
    );
    // Verify we got episodes back
    if (response.episodes && Array.isArray(response.episodes) && response.episodes.length > 0) {
      return response;
    }
    // Fallback: empty or unexpected response format
    throw new Error("No episodes in allepisode response");
  } catch {
    // Fallback to detail.episodes (won't have video URLs but at least shows episode list)
    const detail = await getDetail(id, lang);
    return { episodes: detail.episodes || [] };
  }
}
