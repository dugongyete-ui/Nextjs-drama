/**
 * iQIYI Platform — Barrel Export
 * Import everything from this single entry point:
 *   import { api, normalizeDrama, ... } from "@/lib/platforms/iqiyi";
 */

// Constants
export {
  IQIYI_API_BASE,
  IQIYI_API_PREFIX,
  IQIYI_API_KEY,
  IQIYI_PROXY_PREFIX,
  CDN_PROXY_PREFIX,
  IQIYI_CDN_HOSTS,
  IQIYI_CDN_REFERER,
  IQIYI_CDN_USER_AGENT,
  IQIYI_DEFAULT_CHANNEL_ID,
} from "./constants";

// Types
export type {
  Language,
  DramaItem,
  Episode,
  QualityItem,
  Category,
  TagOption,
  TagsResponse,
  LanguagesResponse,
  TrendingResponse,
  ForYouResponse,
  CategoriesResponse,
  ChannelResponse,
  BrowseResponse,
  SearchResponse,
  DetailResponse,
  AllEpisodesResponse,
  EpisodeResponse,
  SubtitleItem,
  NormalizedDrama,
  NormalizedEpisode,
} from "./types";

// Helpers
export {
  normalizeDrama,
  normalizeEpisode,
  extractList,
  extractCategories,
  extractLanguages,
} from "./helpers";

// Client (low-level, usually not needed directly)
export { fetchAPI } from "./client";

// Endpoints — Content
export {
  getLanguages,
  getCategories,
  getTrending,
  getForYou,
  getDrama,
  getKDrama,
  getMovie,
  getAnime,
  getVariety,
  search,
  getBrowse,
  getTags,
} from "./endpoints/content";

// Endpoints — Catalog
export { getDetail, getAllEpisodes, getEpisode } from "./endpoints/catalog";

// Endpoints — Media
export { getHLSUrl, getEpisodeMedia, buildHLSProxyUrl } from "./endpoints/media";

// Convenience: unified api object (same shape as other platforms)
import { fetchAPI } from "./client";
import type { LanguagesResponse, CategoriesResponse } from "./types";
import { IQIYI_PROXY_PREFIX } from "./constants";
import {
  getLanguages,
  getCategories,
  getTrending,
  getForYou,
  getDrama,
  getKDrama,
  getMovie,
  getAnime,
  getVariety,
  search,
  getBrowse,
  getTags,
} from "./endpoints/content";
import { getDetail, getAllEpisodes, getEpisode } from "./endpoints/catalog";
import { getHLSUrl, getEpisodeMedia, buildHLSProxyUrl } from "./endpoints/media";

export const api = {
  getLanguages,
  getCategories,
  getTrending,
  getForYou,
  getDrama,
  getKDrama,
  getMovie,
  getAnime,
  getVariety,
  search,
  getBrowse,
  getTags,
  getDetail,
  getAllEpisodes,
  getEpisode,
  getHLSUrl,
  getEpisodeMedia,
  buildHLSProxyUrl,
};
