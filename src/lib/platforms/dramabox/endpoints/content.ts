/**
 * DramaBox V2 Content Endpoints
 * Latest, Trending, HotRank, Recommended, ForYou, Browse, PopularSearch, Search
 */

import { fetchAPI } from "../client";
import { DRAMABOX_PROXY_PREFIX } from "../constants";
import type {
  TrendingResponse,
  HotRankResponse,
  BrowseResponse,
  SearchResponse,
} from "../types";

/** Get latest dramas (V2: /latest) */
export async function getLatest(
  page: number = 1,
  pageSize: number = 50,
  lang: string = "en"
): Promise<BrowseResponse> {
  return await fetchAPI<BrowseResponse>(
    `${DRAMABOX_PROXY_PREFIX}/latest`,
    { params: { page, pageSize, lang } }
  );
}

/** Get trending dramas (V2: /trending, page 1 = theater, page 2+ = catalog) */
export async function getTrending(
  page: number = 1,
  lang: string = "en"
): Promise<TrendingResponse> {
  return await fetchAPI<TrendingResponse>(
    `${DRAMABOX_PROXY_PREFIX}/trending`,
    { params: { page, lang } }
  );
}

/** Get hot rank dramas by type (1=Trending, 2=Top Searched, 3=New Releases) */
export async function getHotRank(
  type: number = 1,
  lang: string = "en"
): Promise<HotRankResponse> {
  return await fetchAPI<HotRankResponse>(
    `${DRAMABOX_PROXY_PREFIX}/hotrank`,
    { params: { type: String(type), lang } }
  );
}

/** Get recommended dramas with cursor-based pagination (V2: /recommended) */
export async function getRecommended(
  page: number = 1,
  lang: string = "en",
  cursor?: string
): Promise<BrowseResponse> {
  return await fetchAPI<BrowseResponse>(
    `${DRAMABOX_PROXY_PREFIX}/recommended`,
    { params: { page, lang, cursor } }
  );
}

/** Get "For You" personalized recommendations (V2: /foryou) */
export async function getForYou(
  page: number = 1,
  lang: string = "en"
): Promise<BrowseResponse> {
  return await fetchAPI<BrowseResponse>(
    `${DRAMABOX_PROXY_PREFIX}/foryou`,
    { params: { page, lang } }
  );
}

/** Browse all dramas with filters (V2: /browse — genre, region, sort, pageSize) */
export async function getBrowse(
  page: number = 1,
  lang: string = "en",
  genre?: string,
  region?: string,
  sort?: number,
  pageSize?: number
): Promise<BrowseResponse> {
  return await fetchAPI<BrowseResponse>(
    `${DRAMABOX_PROXY_PREFIX}/browse`,
    { params: { page, lang, genre, region, sort: sort ? String(sort) : undefined, pageSize } }
  );
}

/** Get popular search terms (V2: /populersearch) */
export async function getPopularSearch(
  lang: string = "en"
): Promise<SearchResponse> {
  return await fetchAPI<SearchResponse>(
    `${DRAMABOX_PROXY_PREFIX}/populersearch`,
    { params: { lang } }
  );
}

/** Search dramas by query (V2: /search — uses "query" param, not "q") */
export async function search(
  query: string,
  lang: string = "en",
  page: number = 1
): Promise<SearchResponse> {
  return await fetchAPI<SearchResponse>(
    `${DRAMABOX_PROXY_PREFIX}/search`,
    { params: { query, lang, page } }
  );
}
