/**
 * PineDrama Platform Types
 * All TypeScript interfaces for the PineDrama API live here.
 *
 * Key differences from DramaBox:
 * - Uses `totalEps` instead of `chapterCount`
 * - Episodes in detail have empty `videoUrl` (must fetch /episode separately)
 * - Episode endpoint returns `videoId`, `duration_ms`, `qualityList`
 * - Category list uses `categories` key
 * - Uses `count` param for pagination (in addition to `page`)
 * - Uses `cursor` for efficient pagination
 * - No HLS streaming — direct MP4 from TikTok CDN
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
  title: string;
  cover: string;
  description?: string;
  tags: string[];
  /** Episode count as number (in list responses) OR array of objects (in detail) */
  episodes: number | Episode[];
  /** Total episode count (PineDrama uses this instead of chapterCount) */
  totalEps?: number;
  type?: string;
  channel?: string;
  channelId?: string;
  channelAvatar?: string;
  /** View count — present in list responses (trending/foryou/search) */
  views?: number;
  [key: string]: unknown;
}

// ---- Episode ----
export interface Episode {
  number: number;
  title: string;
  /** Video URL — empty in detail responses; must fetch /episode to get actual URL */
  videoUrl: string;
  locked: boolean;
  /** Only present in /episode response */
  quality?: string;
  /** Only present in /episode response */
  videoId?: string;
  /** Duration in milliseconds — only present in /episode response */
  duration_ms?: number;
  /** Quality options — only present in /episode response */
  qualityList?: QualityItem[];
  [key: string]: unknown;
}

// ---- Quality Item ----
export interface QualityItem {
  label: string;
  url: string;
  isDefault: boolean;
  width?: number;
  height?: number;
}

// ---- Category ----
export interface Category {
  id: string;
  name: string;
}

// ---- API Responses ----

export interface LanguagesResponse {
  default?: string;
  languages?: Language[];
}

export interface TrendingResponse {
  items: DramaItem[];
  hasMore?: boolean;
  cursor?: string;
  [key: string]: unknown;
}

export interface ForYouResponse {
  items: DramaItem[];
  hasMore?: boolean;
  cursor?: string;
  [key: string]: unknown;
}

export interface CategoryListResponse {
  categories: Category[];
  [key: string]: unknown;
}

export interface CategoryByIdResponse {
  items: DramaItem[];
  hasMore?: boolean;
  cursor?: string;
  [key: string]: unknown;
}

export interface SearchResponse {
  items: DramaItem[];
  hasMore?: boolean;
  [key: string]: unknown;
}

export interface DetailResponse {
  id: string;
  title: string;
  cover: string;
  description?: string;
  tags: string[];
  /** Episodes with empty videoUrl — must call /episode to get actual URLs */
  episodes: Episode[];
  totalEps?: number;
  type?: string;
  channel?: string;
  channelId?: string;
  channelAvatar?: string;
  [key: string]: unknown;
}

/** /allepisode response — returns all episodes with full video info including qualityList */
export interface AllEpisodesResponse {
  bookId?: string;
  bookName?: string;
  cover?: string;
  description?: string;
  episodes: Episode[];
  [key: string]: unknown;
}

/** /episode response — single episode with full video info */
export interface EpisodeResponse {
  number: number;
  title: string;
  videoUrl: string;
  locked: boolean;
  quality: string;
  videoId: string;
  duration_ms: number;
  qualityList: QualityItem[];
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
  channel: string;
  channelId: string;
  channelAvatar: string;
}

export interface NormalizedEpisode {
  number: number;
  title: string;
  locked: boolean;
  duration: string;
  videoUrl: string;
  mp4Url: string;
  qualities: Array<{ quality: string; url: string }>;
  videoId: string;
}
