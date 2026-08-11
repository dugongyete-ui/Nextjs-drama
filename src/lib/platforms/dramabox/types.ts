/**
 * DramaBox Platform Types
 * All TypeScript interfaces for the DramaBox API live here.
 */

// ---- Language ----
export interface Language {
  code: string;
  name: string;
  region?: string;
}

// ---- Drama Item ----
export interface DramaItem {
  id?: string | number;
  bookId?: string;
  title?: string;
  bookName?: string;
  cover?: string;
  coverWap?: string;
  cover_vertical?: string;
  cover_horizontal?: string;
  synopsis?: string;
  description?: string;
  introduction?: string;
  rating?: number | string;
  /** V1: number count; V2: array of episode objects */
  episodes?: number | Episode[];
  chapterCount?: number;
  views?: number | string;
  status?: string;
  genre?: string;
  year?: string | number;
  tags?: string[];
  tagV3s?: Array<{ tagId: number; tagName: string; tagEnName: string }>;
  locked?: boolean;
  [key: string]: unknown;
}

// ---- Episode ----
export interface Episode {
  number?: number;
  ep?: number;
  episode?: number;
  chapterId?: string;
  chapterName?: string;
  title?: string;
  cover?: string;
  locked?: boolean;
  duration?: number | string;
  hlsUrl?: string;
  mp4Url?: string;
  videoUrl?: string;
  subtitlesUrl?: string;
  qualities?: Array<{ quality: string; url: string }>;
  [key: string]: unknown;
}

// ---- Category ----
export interface Category {
  id: string | number;
  name: string;
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
  hasMore?: boolean;
  [key: string]: unknown;
}

export interface HotRankResponse {
  items?: DramaItem[];
  list?: DramaItem[];
  data?: DramaItem[];
  hasMore?: boolean;
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

export interface CategoriesResponse {
  items?: Category[];
  list?: Category[];
  data?: Category[];
  [key: string]: unknown;
}

export interface DetailResponse {
  id?: string | number;
  bookId?: string;
  title?: string;
  bookName?: string;
  cover?: string;
  coverWap?: string;
  cover_vertical?: string;
  cover_horizontal?: string;
  synopsis?: string;
  description?: string;
  introduction?: string;
  rating?: number | string;
  /** V1: number count; V2: array of episode objects */
  episodes?: number | Episode[];
  chapterCount?: number;
  views?: number | string;
  status?: string;
  genre?: string;
  year?: string | number;
  tags?: string[];
  tagV3s?: Array<{ tagId: number; tagName: string; tagEnName: string }>;
  locked?: boolean;
  [key: string]: unknown;
}

export interface AllEpisodesResponse {
  bookId?: string;
  bookName?: string;
  chapterCount?: number;
  cover?: string;
  totalEpisodes?: number;
  items?: Episode[];
  list?: Episode[];
  data?: Episode[];
  episodes?: Episode[];
  [key: string]: unknown;
}

export interface SubtitleItem {
  language?: string;
  lang?: string;
  url?: string;
  vttUrl?: string;
  [key: string]: unknown;
}

export interface SubtitleResponse {
  bookId?: string;
  episode?: number;
  subtitles?: SubtitleItem[] | string;
  data?: string;
  [key: string]: unknown;
}

export interface HLSResponse {
  url?: string;
  hls?: string;
  data?: string;
  [key: string]: unknown;
}

export interface SearchResponse {
  items?: DramaItem[];
  list?: DramaItem[];
  data?: DramaItem[];
  hasMore?: boolean;
  [key: string]: unknown;
}

// ---- Normalized Types ----
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
}
