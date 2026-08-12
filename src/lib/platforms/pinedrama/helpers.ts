/**
 * PineDrama Data Helpers
 * Functions for normalizing and extracting data from PineDrama API responses.
 *
 * Key differences from DramaBox:
 * - PineDrama uses `totalEps` for episode count (DramaBox uses `chapterCount`)
 * - PineDrama episodes always have `videoUrl` (may be empty in detail)
 * - PineDrama episode endpoint returns `duration_ms` and `qualityList`
 * - PineDrama items have `channel`, `channelId`, `channelAvatar`
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
 * Normalize a raw DramaItem from the PineDrama API into a consistent shape.
 */
export function normalizeDrama(item: DramaItem): NormalizedDrama {
  // PineDrama episodes field can be:
  // - A number (in list responses: trending/foryou/search) → use directly
  // - An array (in detail response) → use .length
  // Also check totalEps as fallback
  const episodeCount =
    typeof item.episodes === "number"
      ? item.episodes
      : Array.isArray(item.episodes)
        ? item.episodes.length
        : item.totalEps || 0;

  // Format views count if present
  const viewsStr =
    typeof item.views === "number" && item.views > 0
      ? formatViews(item.views)
      : "";

  return {
    id: String(item.id || ""),
    title: item.title || "",
    cover: item.cover || "",
    coverVertical: item.cover || "",
    coverHorizontal: item.cover || "",
    synopsis: item.description || "",
    rating: "",
    episodes: episodeCount,
    genre:
      item.tags && item.tags.length > 0 ? item.tags[0] : item.type || "",
    status: "",
    views: viewsStr,
    year: "",
    locked: false,
    tags: item.tags || [],
    channel: item.channel || "",
    channelId: item.channelId || "",
    channelAvatar: item.channelAvatar || "",
  };
}

/**
 * Normalize a raw Episode from the PineDrama API into a consistent shape.
 * Converts duration from milliseconds to "m:ss" format.
 */
export function normalizeEpisode(ep: Episode): NormalizedEpisode {
  const durMs = typeof ep.duration_ms === "number" ? ep.duration_ms : 0;
  const durSec = Math.floor(durMs / 1000);
  const m = Math.floor(durSec / 60);
  const s = durSec % 60;

  return {
    number: ep.number || 0,
    title: ep.title || "",
    locked: ep.locked || false,
    duration: durMs > 0 ? `${m}:${s.toString().padStart(2, "0")}` : "",
    videoUrl: ep.videoUrl || "",
    mp4Url: ep.videoUrl || "",
    qualities:
      ep.qualityList?.map((q) => ({
        quality: q.label,
        url: q.url,
      })) || [],
    videoId: ep.videoId || "",
  };
}

/**
 * Extract a list of drama items from a PineDrama API response.
 * PineDrama consistently uses `items` as the array key.
 */
export function extractList<T>(
  response: Record<string, unknown>
): T[] {
  if (!response) return [];
  if (Array.isArray(response.episodes)) return response.episodes as T[];
  if (Array.isArray(response.items)) return response.items as T[];
  if (Array.isArray(response.list)) return response.list as T[];
  if (Array.isArray(response.data)) return response.data as T[];
  return [];
}

/**
 * Extract categories from a CategoryListResponse.
 * PineDrama uses `categories` as the key.
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
