/**
 * iQIYI Platform Types
 * All TypeScript interfaces for the iQIYI API live here.
 *
 * Key characteristics:
 * - Supports 16 languages (en, id, th, vi, ms, zh, ko, ja, ar, fr, de, hi, tr, pt, es, fil)
 * - Has channel-based endpoints: /drama, /kdrama, /movie, /anime, /variety
 * - Browse uses cid (channel ID), category, caption, sort filters
 * - Tags endpoint provides filter options for browse
 * - Episode returns HLS m3u8 URL with Referer/UA-restricted CDN
 * - Movie uses ep=0
 */

// ---- Language ----
export interface Language {
  code: string;
  name: string;
  region?: string;
}

// ---- Drama Item ----
export interface DramaItem {
  id: string;
  title?: string;
  name?: string;
  cover?: string;
  coverImage?: string;
  imageUrl?: string;
  description?: string;
  synopsis?: string;
  /** Episode count — can be number or array */
  episodes?: number | Episode[];
  totalEps?: number;
  episodeTotal?: number;
  views?: number | string;
  score?: number | string;
  rating?: number | string;
  status?: string;
  genre?: string;
  tags?: string[];
  year?: string | number;
  locked?: boolean;
  isVip?: boolean;
  /** Channel/category info */
  channel?: string;
  channelId?: string;
  channelName?: string;
  /** Album ID — used for detail/episode lookups */
  albumId?: string;
  /** Region/country */
  region?: string;
  [key: string]: unknown;
}

// ---- Episode ----
export interface Episode {
  number?: number;
  ep?: number;
  title?: string;
  name?: string;
  episodeName?: string;
  cover?: string;
  locked?: boolean;
  isVip?: boolean;
  duration?: number | string;
  duration_ms?: number;
  hlsUrl?: string;
  m3u8Url?: string;
  mp4Url?: string;
  videoUrl?: string;
  subtitlesUrl?: string;
  subtitles?: SubtitleItem[];
  qualities?: Array<{ quality: string; url: string }>;
  qualityList?: QualityItem[];
  /** Album ID */
  albumId?: string;
  /** Play URL (iQIYI specific) */
  playUrl?: string;
  [key: string]: unknown;
}

// ---- Quality Item ----
export interface QualityItem {
  label: string;
  url: string;
  isDefault?: boolean;
  width?: number;
  height?: number;
}

// ---- Category / Channel ----
export interface Category {
  id: string | number;
  name: string;
  /** Channel type (drama, kdrama, movie, anime, variety) */
  type?: string;
  [key: string]: unknown;
}

// ---- Tag / Filter Option ----
export interface TagOption {
  id?: string | number;
  name: string;
  value?: string;
  [key: string]: unknown;
}

export interface TagsResponse {
  genre?: TagOption[];
  region?: TagOption[];
  sort?: TagOption[];
  caption?: TagOption[];
  [key: string]: unknown;
}

// ---- API Responses ----

export interface LanguagesResponse {
  default?: string;
  languages?: Language[];
}

export interface TrendingResponse {
  items?: DramaItem[];
  list?: DramaItem[];
  data?: DramaItem[];
  [key: string]: unknown;
}

export interface ForYouResponse {
  items?: DramaItem[];
  list?: DramaItem[];
  data?: DramaItem[];
  [key: string]: unknown;
}

export interface CategoriesResponse {
  categories?: Category[];
  items?: Category[];
  list?: Category[];
  data?: Category[];
  [key: string]: unknown;
}

export interface ChannelResponse {
  items?: DramaItem[];
  list?: DramaItem[];
  data?: DramaItem[];
  hasMore?: boolean;
  page?: number;
  [key: string]: unknown;
}

export interface BrowseResponse {
  items?: DramaItem[];
  list?: DramaItem[];
  data?: DramaItem[];
  total?: number;
  page?: number;
  hasMore?: boolean;
  [key: string]: unknown;
}

export interface SearchResponse {
  items?: DramaItem[];
  list?: DramaItem[];
  data?: DramaItem[];
  hasMore?: boolean;
  [key: string]: unknown;
}

export interface DetailResponse {
  id?: string;
  title?: string;
  name?: string;
  cover?: string;
  coverImage?: string;
  imageUrl?: string;
  description?: string;
  synopsis?: string;
  episodes?: number | Episode[];
  totalEps?: number;
  episodeTotal?: number;
  views?: number | string;
  score?: number | string;
  rating?: number | string;
  status?: string;
  genre?: string;
  tags?: string[];
  year?: string | number;
  locked?: boolean;
  isVip?: boolean;
  channel?: string;
  channelId?: string;
  albumId?: string;
  region?: string;
  [key: string]: unknown;
}

export interface AllEpisodesResponse {
  id?: string;
  title?: string;
  name?: string;
  cover?: string;
  episodes?: Episode[];
  items?: Episode[];
  list?: Episode[];
  data?: Episode[];
  episodeTotal?: number;
  totalEps?: number;
  [key: string]: unknown;
}

export interface EpisodeResponse {
  number?: number;
  ep?: number;
  title?: string;
  name?: string;
  episodeName?: string;
  hlsUrl?: string;
  m3u8Url?: string;
  mp4Url?: string;
  videoUrl?: string;
  playUrl?: string;
  locked?: boolean;
  isVip?: boolean;
  duration?: number | string;
  duration_ms?: number;
  subtitles?: SubtitleItem[];
  qualityList?: QualityItem[];
  qualities?: Array<{ quality: string; url: string }>;
  albumId?: string;
  [key: string]: unknown;
}

export interface SubtitleItem {
  language?: string;
  lang?: string;
  url?: string;
  vttUrl?: string;
  [key: string]: unknown;
}

// ---- Normalized Types (shared shape for UI consumption) ----

export interface NormalizedDrama {
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
  /** iQIYI-specific: album ID for detail/episode lookups */
  albumId: string;
  /** iQIYI-specific: channel info */
  channel: string;
  channelId: string;
  /** iQIYI-specific: VIP status */
  isVip: boolean;
}

export interface NormalizedEpisode {
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
  /** iQIYI-specific: album ID */
  albumId: string;
}
