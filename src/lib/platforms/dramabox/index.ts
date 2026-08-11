/**
 * DramaBox Platform — Barrel Export
 * Import everything from this single entry point:
 *   import { api, normalizeDrama, ... } from "@/lib/platforms/dramabox";
 */

// Constants
export {
  DRAMABOX_API_BASE,
  DRAMABOX_API_PREFIX,
  DRAMABOX_API_KEY,
  DRAMABOX_CDN_HOSTS,
  DRAMABOX_PROXY_PREFIX,
  CDN_PROXY_PREFIX,
} from "./constants";

// Types
export type {
  Language,
  DramaItem,
  Episode,
  Category,
  LanguagesResponse,
  TrendingResponse,
  HotRankResponse,
  BrowseResponse,
  CategoriesResponse,
  DetailResponse,
  AllEpisodesResponse,
  SubtitleItem,
  SubtitleResponse,
  HLSResponse,
  SearchResponse,
  NormalizedDrama,
  NormalizedEpisode,
} from "./types";

// Helpers
export {
  normalizeDrama,
  normalizeEpisode,
  extractList,
  extractLanguages,
} from "./helpers";

// Client (low-level, usually not needed directly)
export { fetchAPI } from "./client";

// Endpoints — Content
export {
  getLatest,
  getTrending,
  getHotRank,
  getRecommended,
  getForYou,
  getBrowse,
  getPopularSearch,
  search,
} from "./endpoints/content";

// Endpoints — Catalog
export { getCategories, getDetail, getEpisode, getAllEpisodes } from "./endpoints/catalog";

// Endpoints — Media
export { getHLS, getSubtitles } from "./endpoints/media";

// Convenience: unified api object (same shape as the old api.ts for easy migration)
import { fetchAPI } from "./client";
import type { LanguagesResponse } from "./types";
import { getLatest, getTrending, getHotRank, getRecommended, getForYou, getBrowse, getPopularSearch, search } from "./endpoints/content";
import { getCategories, getDetail, getEpisode, getAllEpisodes } from "./endpoints/catalog";
import { getHLS, getSubtitles } from "./endpoints/media";
import { DRAMABOX_PROXY_PREFIX } from "./constants";

export const api = {
  getLanguages: async (): Promise<LanguagesResponse> => {
    return await fetchAPI<LanguagesResponse>(
      `${DRAMABOX_PROXY_PREFIX}/languages`
    );
  },
  getLatest,
  getTrending,
  getHotRank,
  getRecommended,
  getForYou,
  getBrowse,
  getPopularSearch,
  getCategories,
  search,
  getDetail,
  getEpisode,
  getAllEpisodes,
  getSubtitles,
  getHLS,
};
