"use client";

/**
 * Platform Adapter
 * Provides a unified API interface that delegates to the active platform.
 * All pages use this adapter instead of calling platform APIs directly.
 */

import { useAppStore, type Platform } from "@/lib/store";
import * as dramabox from "@/lib/platforms/dramabox";
import * as pinedrama from "@/lib/platforms/pinedrama";
import * as iqiyi from "@/lib/platforms/iqiyi";

// ---- Unified Types ----
export interface UnifiedDrama {
  id: string;
  title: string;
  cover: string;
  coverVertical: string;
  coverHorizontal: string;
  synopsis: string;
  rating: string;
  episodes: number;
  genre: string;
  status: string;
  views: string;
  year: string;
  locked: boolean;
  tags: string[];
}

export interface UnifiedEpisode {
  number: number;
  chapterId: string;
  title: string;
  locked: boolean;
  duration: string;
  hlsUrl: string;
  mp4Url: string;
  videoUrl: string;
  subtitlesUrl: string;
  qualities: Array<{ quality: string; url: string }>;
}

// ---- Unified API Interface ----
export interface PlatformApi {
  getLanguages: () => Promise<any>;
  getTrending: (page: number, lang: string) => Promise<any>;
  getForYou: (page: number, lang: string) => Promise<any>;
  getDetail: (id: string | number, lang: string) => Promise<any>;
  getAllEpisodes: (id: string | number, lang: string) => Promise<any>;
  search: (query: string, lang: string) => Promise<any>;
  normalizeDrama: (item: any) => UnifiedDrama;
  normalizeEpisode: (ep: any) => UnifiedEpisode;
  extractList: <T>(response: Record<string, unknown>) => T[];
  extractLanguages: (response: any) => any[];
  /** Get the video URL for an episode — returns direct MP4 or HLS URL */
  getEpisodeVideoUrl?: (id: string | number, ep: number, lang: string) => Promise<string>;
  /** Resolve the video URL from a normalized episode object.
   *  DramaBox: rewrites HLS URLs and provides fallback construction.
   *  PineDrama: returns null (use getEpisodeVideoUrl instead). */
  resolveEpisodeVideoUrl?: (episode: UnifiedEpisode, dramaId: string | number, episodeNum: number) => string | null;
  /** Hot rank (DramaBox-specific; PineDrama falls back to trending) */
  getHotRank: (type: number, lang: string) => Promise<any>;
  /** Recommended dramas (DramaBox-specific; PineDrama falls back to forYou) */
  getRecommended: (page: number, lang: string) => Promise<any>;
  /** Browse catalog with optional category filter */
  getBrowse: (page: number, lang: string, category?: string) => Promise<any>;
  /** Get categories/genres list */
  getCategories: (lang: string) => Promise<any>;
  /** Extract categories from a categories response */
  extractCategories: (response: any) => any[];
}

// ---- DramaBox Adapter ----
const dramaboxApi: PlatformApi = {
  getLanguages: () => dramabox.api.getLanguages(),
  getTrending: (page, lang) => dramabox.api.getTrending(page, lang),
  getForYou: (page, lang) => dramabox.api.getForYou(page, lang),
  getDetail: (id, lang) => dramabox.api.getDetail(id, lang),
  getAllEpisodes: (id, lang) => dramabox.api.getAllEpisodes(id, lang),
  search: (query, lang) => dramabox.api.search(query, lang),
  normalizeDrama: (item) => dramabox.normalizeDrama(item) as UnifiedDrama,
  normalizeEpisode: (ep) => dramabox.normalizeEpisode(ep) as UnifiedEpisode,
  extractList: <T,>(response: Record<string, unknown>) => dramabox.extractList<T>(response),
  extractLanguages: (response) => dramabox.extractLanguages(response),
  getHotRank: (type, lang) => dramabox.api.getHotRank(type, lang),
  getRecommended: (page, lang) => dramabox.api.getRecommended(page, lang),
  getBrowse: (page, lang, category?) => dramabox.api.getBrowse(page, lang, category),
  getCategories: (lang) => dramabox.api.getCategories(lang),
  extractCategories: (response) => {
    // DramaBox categories response has a `categories` array with groups
    const resp = response as Record<string, unknown>;
    if (Array.isArray(resp.categories)) return resp.categories as any[];
    return [];
  },
  resolveEpisodeVideoUrl: (episode, dramaId, episodeNum) => {
    // Strategy 1: Direct MP4 URL from V2 API (fastest, no proxy needed)
    if (episode.mp4Url || episode.videoUrl) {
      return episode.mp4Url || episode.videoUrl;
    }
    // Strategy 2: HLS URL from V2 API (needs V2→proxy rewrite)
    if (episode.hlsUrl) {
      return episode.hlsUrl.replace(
        new RegExp(`^${dramabox.DRAMABOX_API_PREFIX.replace(/\//g, "\\/")}/`, "g"),
        `${dramabox.DRAMABOX_PROXY_PREFIX}/`
      );
    }
    // Strategy 3: Fallback — construct HLS URL from id/ep (V1 style)
    return `${dramabox.DRAMABOX_PROXY_PREFIX}/hls?id=${encodeURIComponent(String(dramaId))}&ep=${encodeURIComponent(String(episodeNum))}`;
  },
};

// ---- PineDrama Adapter ----
const pinedramaApi: PlatformApi = {
  getLanguages: () => pinedrama.api.getLanguages(),
  getTrending: (page, lang) => pinedrama.api.getTrending(page, lang),
  getForYou: (page, lang) => pinedrama.api.getForYou(page, lang),
  getDetail: (id, lang) => pinedrama.api.getDetail(id, lang),
  getAllEpisodes: (id, lang) => pinedrama.api.getAllEpisodes(id, lang),
  search: (query, lang) => pinedrama.api.search(query, lang),
  normalizeDrama: (item) => pinedrama.normalizeDrama(item) as UnifiedDrama,
  normalizeEpisode: (ep) => pinedrama.normalizeEpisode(ep) as UnifiedEpisode,
  extractList: <T,>(response: Record<string, unknown>) => pinedrama.extractList<T>(response),
  extractLanguages: (response) => pinedrama.extractLanguages(response),
  getEpisodeVideoUrl: (id, ep, lang) => pinedrama.api.getEpisodeMedia(id, ep, lang).then((r) => r.videoUrl),
  // PineDrama: resolve video URL from normalized episode data
  // /allepisode now returns videoUrl + qualityList per episode
  resolveEpisodeVideoUrl: (episode, _dramaId, _episodeNum) => {
    // Strategy 1: Use videoUrl/mp4Url from normalized episode (from /allepisode)
    // These URLs need CDN proxy for CORS
    if (episode.mp4Url || episode.videoUrl) {
      return pinedrama.api.proxyCDNUrl(episode.mp4Url || episode.videoUrl);
    }
    // Strategy 2: Use HD quality URL from qualities list
    if (episode.qualities && episode.qualities.length > 0) {
      const hd = episode.qualities.find((q) => q.quality === "HD");
      const url = hd?.url || episode.qualities[0]?.url;
      if (url) return pinedrama.api.proxyCDNUrl(url);
    }
    // No URL available — watch page will fall back to getEpisodeVideoUrl
    return null;
  },
  // PineDrama doesn't have hot rank — fallback to trending
  getHotRank: (_type, lang) => pinedrama.api.getTrending(1, 20, undefined, lang),
  // PineDrama doesn't have a separate recommended endpoint — fallback to forYou
  getRecommended: (page, lang) => pinedrama.api.getForYou(page, 20, undefined, lang),
  // PineDrama browse: use getCategory with id if provided, otherwise trending
  getBrowse: (page, lang, category?) =>
    category
      ? pinedrama.api.getCategory(category, page, 20, undefined, lang)
      : pinedrama.api.getTrending(page, 20, undefined, lang),
  // PineDrama categories: use getCategory() (no args) to list all categories
  getCategories: () => pinedrama.api.getCategory(),
  extractCategories: (response) => pinedrama.extractCategories(response as Record<string, unknown>),
};

// ---- iQIYI Adapter ----
const iqiyiApi: PlatformApi = {
  getLanguages: () => iqiyi.api.getLanguages(),
  getTrending: (_page, lang) => iqiyi.api.getTrending(lang),
  getForYou: (_page, lang) => iqiyi.api.getForYou(lang),
  getDetail: (id, lang) => iqiyi.api.getDetail(id, lang),
  getAllEpisodes: (id, lang) => iqiyi.api.getAllEpisodes(id, lang),
  search: (query, lang) => iqiyi.api.search(query, lang),
  normalizeDrama: (item) => iqiyi.normalizeDrama(item) as UnifiedDrama,
  normalizeEpisode: (ep) => iqiyi.normalizeEpisode(ep) as UnifiedEpisode,
  extractList: <T,>(response: Record<string, unknown>) => iqiyi.extractList<T>(response),
  extractLanguages: (response) => iqiyi.extractLanguages(response),
  // iQIYI: getEpisodeVideoUrl constructs the HLS proxy URL
  // The proxy route handles ?hls=true by fetching the m3u8 and returning rewritten content
  getEpisodeVideoUrl: (id, ep, lang) =>
    Promise.resolve(`${iqiyi.IQIYI_PROXY_PREFIX}/episode?id=${encodeURIComponent(String(id))}&ep=${encodeURIComponent(String(ep))}&lang=${encodeURIComponent(lang)}&hls=true`),
  // iQIYI: resolve video URL from normalized episode
  resolveEpisodeVideoUrl: (episode, dramaId, episodeNum) => {
    // Strategy 1: HLS URL already in episode data (from /allepisode)
    // These are external URLs — go through our proxy with ?hls=true
    // so the proxy fetches the m3u8, rewrites CDN URLs, and returns m3u8 content
    if (episode.hlsUrl) {
      // If it's already a local proxy URL, just return it
      if (episode.hlsUrl.startsWith("/api/")) return episode.hlsUrl;
      // External URL — route through our episode proxy with hls=true
      // The proxy will fetch the m3u8 from this URL and rewrite all CDN URLs
      return `${iqiyi.IQIYI_PROXY_PREFIX}/episode?id=${encodeURIComponent(String(dramaId))}&ep=${encodeURIComponent(String(episodeNum))}&hls=true`;
    }
    // Strategy 2: Direct MP4 URL (rare for iQIYI, but handle it)
    if (episode.mp4Url || episode.videoUrl) {
      const url = episode.mp4Url || episode.videoUrl;
      if (url.startsWith("/api/")) return url;
      // External MP4 URL — proxy through CDN
      return `/api/cdn?url=${encodeURIComponent(url)}`;
    }
    // Strategy 3: Fallback — construct proxy URL for /episode with ?hls=true
    // The proxy fetches the m3u8 from hlsUrl in the JSON, rewrites URLs, returns m3u8
    return `${iqiyi.IQIYI_PROXY_PREFIX}/episode?id=${encodeURIComponent(String(dramaId))}&ep=${encodeURIComponent(String(episodeNum))}&hls=true`;
  },
  // iQIYI doesn't have hot rank — fallback to trending
  getHotRank: (_type, lang) => iqiyi.api.getTrending(lang),
  // iQIYI doesn't have a separate recommended endpoint — fallback to forYou
  getRecommended: (_page, lang) => iqiyi.api.getForYou(lang),
  // iQIYI browse: use /browse with optional category (cid)
  getBrowse: (page, lang, category?) =>
    iqiyi.api.getBrowse(page, lang, category),
  // iQIYI categories: use /categories
  getCategories: () => iqiyi.api.getCategories(),
  extractCategories: (response) => iqiyi.extractCategories(response as Record<string, unknown>),
};

// ---- Platform Map ----
const platformApis: Record<Platform, PlatformApi> = {
  dramabox: dramaboxApi,
  pinedrama: pinedramaApi,
  iqiyi: iqiyiApi,
};

/**
 * Hook to get the current platform's unified API.
 * Use this in all pages instead of importing platform APIs directly.
 */
export function usePlatformApi(): PlatformApi {
  const { platform } = useAppStore();
  return platformApis[platform];
}

/**
 * Get a platform API by platform ID (for non-hook contexts).
 */
export function getPlatformApi(platform: Platform): PlatformApi {
  return platformApis[platform];
}
