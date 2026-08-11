/**
 * @deprecated Import from "@/lib/platforms/dramabox" instead.
 * This file is kept for backward compatibility during migration.
 */
export {
  api,
  extractList,
  extractLanguages,
  normalizeDrama,
  normalizeEpisode,
  fetchAPI,
  DRAMABOX_API_BASE,
  DRAMABOX_API_KEY,
  DRAMABOX_CDN_HOSTS,
  DRAMABOX_PROXY_PREFIX,
  CDN_PROXY_PREFIX,
} from "./platforms/dramabox";

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
} from "./platforms/dramabox";
