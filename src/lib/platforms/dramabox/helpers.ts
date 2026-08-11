/**
 * DramaBox Data Helpers
 * Functions for normalizing and extracting data from DramaBox API responses.
 */

import type {
  DramaItem,
  Episode,
  Language,
  LanguagesResponse,
  NormalizedDrama,
  NormalizedEpisode,
} from "./types";

/**
 * Normalize a raw DramaItem from the API into a consistent shape.
 * Handles the many field-name variations the DramaBox API returns.
 */
export function normalizeDrama(item: DramaItem): NormalizedDrama {
  // V2 API returns episodes as an array of objects; V1 returns a number.
  // Always extract a number for the episode count.
  const episodeCount =
    typeof item.episodes === "number"
      ? item.episodes
      : Array.isArray(item.episodes)
        ? item.episodes.length
        : item.chapterCount || 0;

  return {
    id: String(item.id || item.bookId || ""),
    title: item.title || item.bookName || "",
    cover: item.cover || item.coverWap || "",
    coverVertical: item.cover_vertical || item.coverWap || item.cover || "",
    coverHorizontal: item.cover_horizontal || item.cover || item.coverWap || "",
    synopsis: item.synopsis || item.description || item.introduction || "",
    rating: item.rating ? String(item.rating) : "",
    episodes: episodeCount,
    genre:
      item.genre ||
      (item.tags && item.tags.length > 0 ? item.tags[0] : "") ||
      (item.tagV3s && item.tagV3s.length > 0 ? item.tagV3s[0].tagName : ""),
    status: item.status || "",
    views: item.views ? String(item.views) : "",
    year: item.year ? String(item.year) : "",
    locked: item.locked || false,
    tags:
      item.tags ||
      (item.tagV3s ? item.tagV3s.map((t) => t.tagName) : []),
  };
}

/**
 * Normalize a raw Episode from the API into a consistent shape.
 * Converts duration from milliseconds to "m:ss" format.
 */
export function normalizeEpisode(ep: Episode): NormalizedEpisode {
  const durMs = typeof ep.duration === "number" ? ep.duration : 0;
  const durSec = Math.floor(durMs / 1000);
  const m = Math.floor(durSec / 60);
  const s = durSec % 60;
  return {
    number: ep.number || ep.ep || ep.episode || 0,
    chapterId: ep.chapterId || "",
    title: ep.chapterName || ep.title || "",
    locked: ep.locked || false,
    duration: durMs > 0 ? `${m}:${s.toString().padStart(2, "0")}` : "",
    hlsUrl: ep.hlsUrl || "",
    mp4Url: ep.mp4Url || ep.videoUrl || "",
    videoUrl: ep.videoUrl || ep.mp4Url || "",
    subtitlesUrl: ep.subtitlesUrl || "",
    qualities: ep.qualities || [],
  };
}

/**
 * Extract a list of items from an API response.
 * The DramaBox API returns arrays under different keys (items, list, data, episodes).
 */
export function extractList<T>(
  response: Record<string, unknown>
): T[] {
  if (!response) return [];
  if (Array.isArray(response.items)) return response.items as T[];
  if (Array.isArray(response.list)) return response.list as T[];
  if (Array.isArray(response.data)) return response.data as T[];
  if (Array.isArray(response.episodes)) return response.episodes as T[];
  return [];
}

/**
 * Extract languages from a LanguagesResponse.
 */
export function extractLanguages(response: LanguagesResponse): Language[] {
  if (Array.isArray(response.languages)) return response.languages;
  if (Array.isArray(response.list)) return response.list as Language[];
  if (Array.isArray(response.data)) return response.data as Language[];
  return [];
}
