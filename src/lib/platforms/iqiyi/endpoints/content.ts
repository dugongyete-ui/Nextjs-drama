/**
 * iQIYI Content Endpoints
 * Languages, Categories, Trending, ForYou, Search
 * Channel endpoints: Drama, K-Drama, Movie, Anime, Variety
 * Browse + Tags
 */

import { fetchAPI } from "../client";
import { IQIYI_PROXY_PREFIX, IQIYI_DEFAULT_CHANNEL_ID } from "../constants";
import type {
  LanguagesResponse,
  CategoriesResponse,
  TrendingResponse,
  ForYouResponse,
  ChannelResponse,
  SearchResponse,
  BrowseResponse,
  TagsResponse,
} from "../types";

/** Get available languages (16 languages supported) */
export async function getLanguages(): Promise<LanguagesResponse> {
  return await fetchAPI<LanguagesResponse>(
    `${IQIYI_PROXY_PREFIX}/languages`
  );
}

/** Get categories/channels list (Drama, K-Drama, Movie, Anime, Variety) */
export async function getCategories(): Promise<CategoriesResponse> {
  return await fetchAPI<CategoriesResponse>(
    `${IQIYI_PROXY_PREFIX}/categories`
  );
}

/** Get trending content across channels */
export async function getTrending(
  lang: string = "en"
): Promise<TrendingResponse> {
  return await fetchAPI<TrendingResponse>(
    `${IQIYI_PROXY_PREFIX}/trending`,
    { params: { lang } }
  );
}

/** Get "For You" personalized recommendations */
export async function getForYou(
  lang: string = "en"
): Promise<ForYouResponse> {
  return await fetchAPI<ForYouResponse>(
    `${IQIYI_PROXY_PREFIX}/foryou`,
    { params: { lang } }
  );
}

/** Get drama channel content (trending if no page, catalog if page provided) */
export async function getDrama(
  page?: number,
  lang: string = "en",
  region?: string,
  sort?: string,
  genre?: string,
  year?: string
): Promise<ChannelResponse> {
  return await fetchAPI<ChannelResponse>(
    `${IQIYI_PROXY_PREFIX}/drama`,
    { params: { page, lang, region, sort, genre, year } }
  );
}

/** Get K-Drama channel content */
export async function getKDrama(
  page?: number,
  lang: string = "en"
): Promise<ChannelResponse> {
  return await fetchAPI<ChannelResponse>(
    `${IQIYI_PROXY_PREFIX}/kdrama`,
    { params: { page, lang } }
  );
}

/** Get movie channel content */
export async function getMovie(
  page?: number,
  lang: string = "en"
): Promise<ChannelResponse> {
  return await fetchAPI<ChannelResponse>(
    `${IQIYI_PROXY_PREFIX}/movie`,
    { params: { page, lang } }
  );
}

/** Get anime channel content */
export async function getAnime(
  page?: number,
  lang: string = "en"
): Promise<ChannelResponse> {
  return await fetchAPI<ChannelResponse>(
    `${IQIYI_PROXY_PREFIX}/anime`,
    { params: { page, lang } }
  );
}

/** Get variety channel content */
export async function getVariety(
  page?: number,
  lang: string = "en"
): Promise<ChannelResponse> {
  return await fetchAPI<ChannelResponse>(
    `${IQIYI_PROXY_PREFIX}/variety`,
    { params: { page, lang } }
  );
}

/** Search dramas, movies, anime, etc. */
export async function search(
  q: string,
  lang: string = "en"
): Promise<SearchResponse> {
  return await fetchAPI<SearchResponse>(
    `${IQIYI_PROXY_PREFIX}/search`,
    { params: { q, lang } }
  );
}

/** Browse catalog with filters (cid, page, category, caption, sort) */
export async function getBrowse(
  page: number = 1,
  lang: string = "en",
  cid?: string,
  category?: string,
  caption?: string,
  sort?: string
): Promise<BrowseResponse> {
  return await fetchAPI<BrowseResponse>(
    `${IQIYI_PROXY_PREFIX}/browse`,
    { params: { cid: cid || IQIYI_DEFAULT_CHANNEL_ID, page: String(page), category, caption, sort, lang } }
  );
}

/** Get filter tags/options for the browse endpoint */
export async function getTags(
  cid: string = IQIYI_DEFAULT_CHANNEL_ID,
  lang: string = "en"
): Promise<TagsResponse> {
  return await fetchAPI<TagsResponse>(
    `${IQIYI_PROXY_PREFIX}/tags`,
    { params: { cid, lang } }
  );
}
