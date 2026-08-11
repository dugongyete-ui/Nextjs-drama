/**
 * iQIYI Data Helpers
 * Functions for normalizing and extracting data from iQIYI API responses.
 *
 * Key differences from DramaBox/PineDrama:
 * - iQIYI uses `name` alongside `title` for drama names
 * - iQIYI has `albumId` for detail/episode lookups
 * - iQIYI has VIP/locked status (`isVip`, `locked`)
 * - iQIYI has channel-based content (drama, kdrama, movie, anime, variety)
 * - iQIYI episode returns HLS m3u8 URL with Referer-restricted CDN
 * - Movie uses ep=0
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
 * Format a view count into a human-readable string.
 * e.g., 43595911 → "43.6M", 14888160 → "14.9M", 523720 → "523.7K"
 */
function formatViews(views: number): string {
  if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B`;
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return String(views);
}

/**
 * Normalize a raw DramaItem from the iQIYI API into a consistent shape.
 */
export function normalizeDrama(item: DramaItem): NormalizedDrama {
  // iQIYI episodes field can be:
  // - A number (in list responses) → use directly
  // - An array (in detail response) → use .length
  // Also check totalEps/episodeTotal as fallback
  const episodeCount =
    typeof item.episodes === "number"
      ? item.episodes
      : Array.isArray(item.episodes)
        ? item.episodes.length
        : item.totalEps || item.episodeTotal || 0;

  // Format views count if present
  const viewsStr =
    typeof item.views === "number" && item.views > 0
      ? formatViews(item.views)
      : typeof item.views === "string"
        ? item.views
        : "";

  // Rating — iQIYI uses score or rating
  const ratingStr = item.score
    ? String(item.score)
    : item.rating
      ? String(item.rating)
      : "";

  return {
    id: String(item.id || ""),
    title: item.title || item.name || "",
    cover: item.cover || item.coverImage || item.imageUrl || "",
    coverVertical: item.cover || item.coverImage || item.imageUrl || "",
    coverHorizontal: item.cover || item.coverImage || item.imageUrl || "",
    synopsis: item.synopsis || item.description || "",
    rating: ratingStr,
    episodes: episodeCount,
    genre:
      item.genre ||
      (item.tags && item.tags.length > 0 ? item.tags[0] : "") ||
      item.channelName ||
      "",
    status: item.status || "",
    views: viewsStr,
    year: item.year ? String(item.year) : "",
    locked: item.locked || item.isVip || false,
    tags: item.tags || [],
    albumId: item.albumId || "",
    channel: item.channel || item.channelName || "",
    channelId: item.channelId || "",
    isVip: item.isVip || false,
  };
}

/**
 * Normalize a raw Episode from the iQIYI API into a consistent shape.
 * Converts duration from milliseconds to "m:ss" format.
 */
export function normalizeEpisode(ep: Episode): NormalizedEpisode {
  // Duration can be in ms or seconds
  const durMs =
    typeof ep.duration_ms === "number"
      ? ep.duration_ms
      : typeof ep.duration === "number"
        ? ep.duration
        : 0;
  const durSec = Math.floor(durMs / 1000);
  const m = Math.floor(durSec / 60);
  const s = durSec % 60;

  return {
    number: ep.number || ep.ep || 0,
    chapterId: ep.albumId || "",
    title: ep.title || ep.episodeName || ep.name || "",
    locked: ep.locked || ep.isVip || false,
    duration: durMs > 0 ? `${m}:${s.toString().padStart(2, "0")}` : "",
    hlsUrl: ep.hlsUrl || ep.m3u8Url || "",
    mp4Url: ep.mp4Url || ep.videoUrl || "",
    videoUrl: ep.videoUrl || ep.hlsUrl || ep.m3u8Url || ep.mp4Url || "",
    subtitlesUrl: ep.subtitlesUrl || "",
    qualities:
      ep.qualities ||
      (ep.qualityList
        ? ep.qualityList.map((q) => ({ quality: q.label, url: q.url }))
        : []),
    albumId: ep.albumId || "",
  };
}

/**
 * Extract a list of drama items from an iQIYI API response.
 * iQIYI may use `items`, `list`, `data`, or `episodes` as the array key.
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
 * Extract categories from a CategoriesResponse.
 * iQIYI uses `categories` or `items` as the key.
 */
export function extractCategories(
  response: Record<string, unknown>
): { id: string; name: string }[] {
  if (!response) return [];
  if (Array.isArray(response.categories))
    return response.categories as { id: string; name: string }[];
  if (Array.isArray(response.items))
    return response.items as { id: string; name: string }[];
  if (Array.isArray(response.list))
    return response.list as { id: string; name: string }[];
  if (Array.isArray(response.data))
    return response.data as { id: string; name: string }[];
  return [];
}

/**
 * Extract languages from a LanguagesResponse.
 */
export function extractLanguages(response: LanguagesResponse): Language[] {
  if (Array.isArray(response.languages)) return response.languages;
  if (Array.isArray((response as Record<string, unknown>).list))
    return (response as Record<string, unknown>).list as Language[];
  if (Array.isArray((response as Record<string, unknown>).data))
    return (response as Record<string, unknown>).data as Language[];
  return [];
}
