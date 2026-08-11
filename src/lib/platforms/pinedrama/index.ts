/**
 * PineDrama Platform — Barrel Export
 * Import everything from this single entry point:
 *   import { api, normalizeDrama, ... } from "@/lib/platforms/pinedrama";
 */

// Constants
export {
  PINEDRAMA_API_BASE,
  PINEDRAMA_API_PREFIX,
  PINEDRAMA_API_KEY,
  PINEDRAMA_PROXY_PREFIX,
  CDN_PROXY_PREFIX,
  PINEDRAMA_CDN_HOSTS,
} from "./constants";

// Types
export type {
  Language,
  DramaItem,
  Episode,
  QualityItem,
  Category,
  LanguagesResponse,
  TrendingResponse,
  ForYouResponse,
  CategoryListResponse,
  CategoryByIdResponse,
  SearchResponse,
  DetailResponse,
  AllEpisodesResponse,
  EpisodeResponse,
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
  getTrending,
  getForYou,
  getCategory,
  search,
} from "./endpoints/content";

// Endpoints — Catalog
export { getDetail, getEpisode, getAllEpisodes } from "./endpoints/catalog";

// Endpoints — Media
export { getVideoUrl, getEpisodeMedia, proxyCDNUrl } from "./endpoints/media";

// Convenience: unified api object for easy access
import { fetchAPI } from "./client";
import type { LanguagesResponse } from "./types";
import { PINEDRAMA_PROXY_PREFIX } from "./constants";
import {
  getLanguages,
  getTrending,
  getForYou,
  getCategory,
  search,
} from "./endpoints/content";
import { getDetail, getEpisode, getAllEpisodes } from "./endpoints/catalog";
import { getVideoUrl, getEpisodeMedia, proxyCDNUrl } from "./endpoints/media";

export const api = {
  getLanguages,
  getTrending,
  getForYou,
  getCategory,
  search,
  getDetail,
  getEpisode,
  getAllEpisodes,
  getVideoUrl,
  getEpisodeMedia,
  proxyCDNUrl,
};
