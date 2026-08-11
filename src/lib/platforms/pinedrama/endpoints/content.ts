/**
 * PineDrama Content Endpoints
 * Languages, Trending, ForYou, Category, Search
 *
 * PineDrama uses `count` and `cursor` params for pagination (DramaBox doesn't).
 */

import { fetchAPI } from "../client";
import { PINEDRAMA_PROXY_PREFIX } from "../constants";
import type {
  LanguagesResponse,
  TrendingResponse,
  ForYouResponse,
  CategoryListResponse,
  CategoryByIdResponse,
  SearchResponse,
} from "../types";

/** Get available languages */
export async function getLanguages(): Promise<LanguagesResponse> {
  return await fetchAPI<LanguagesResponse>(
    `${PINEDRAMA_PROXY_PREFIX}/languages`
  );
}

/** Get trending dramas with cursor-based pagination */
export async function getTrending(
  page: number = 1,
  count: number = 20,
  cursor?: string,
  lang: string = "en"
): Promise<TrendingResponse> {
  return await fetchAPI<TrendingResponse>(
    `${PINEDRAMA_PROXY_PREFIX}/trending`,
    { params: { page, count, cursor, lang } }
  );
}

/** Get "For You" personalized recommendations with cursor-based pagination */
export async function getForYou(
  page: number = 1,
  count: number = 20,
  cursor?: string,
  lang: string = "en"
): Promise<ForYouResponse> {
  return await fetchAPI<ForYouResponse>(
    `${PINEDRAMA_PROXY_PREFIX}/foryou`,
    { params: { page, count, cursor, lang } }
  );
}

/**
 * Get category list (no params) or dramas by category ID.
 * When called without an id, returns the list of all categories.
 * When called with an id, returns dramas in that category.
 */
export async function getCategory(): Promise<CategoryListResponse>;
export async function getCategory(
  id: string | number,
  page?: number,
  count?: number,
  cursor?: string,
  lang?: string
): Promise<CategoryByIdResponse>;
export async function getCategory(
  id?: string | number,
  page: number = 1,
  count: number = 20,
  cursor?: string,
  lang: string = "en"
): Promise<CategoryListResponse | CategoryByIdResponse> {
  if (id === undefined) {
    // List all categories
    return await fetchAPI<CategoryListResponse>(
      `${PINEDRAMA_PROXY_PREFIX}/category`
    );
  }
  // Get dramas by category ID
  return await fetchAPI<CategoryByIdResponse>(
    `${PINEDRAMA_PROXY_PREFIX}/category`,
    { params: { id, page, count, cursor, lang } }
  );
}

/** Search dramas by query (PineDrama uses `q` param, not `query`) */
export async function search(
  q: string,
  page: number = 1,
  count: number = 20,
  lang: string = "en"
): Promise<SearchResponse> {
  return await fetchAPI<SearchResponse>(
    `${PINEDRAMA_PROXY_PREFIX}/search`,
    { params: { q, page, count, lang } }
  );
}
