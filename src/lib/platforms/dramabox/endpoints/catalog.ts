/**
 * DramaBox V2 Catalog Endpoints
 * Categories, Detail, Episode (single), AllEpisodes
 */

import { fetchAPI } from "../client";
import { DRAMABOX_PROXY_PREFIX } from "../constants";
import type {
  CategoriesResponse,
  DetailResponse,
  AllEpisodesResponse,
} from "../types";

/** Get available categories/genres (V2: /categories) */
export async function getCategories(
  lang: string = "en"
): Promise<CategoriesResponse> {
  return await fetchAPI<CategoriesResponse>(
    `${DRAMABOX_PROXY_PREFIX}/categories`,
    { params: { lang } }
  );
}

/** Get drama detail by ID (V2: /detail) */
export async function getDetail(
  id: string | number,
  lang: string = "en"
): Promise<DetailResponse> {
  return await fetchAPI<DetailResponse>(
    `${DRAMABOX_PROXY_PREFIX}/detail`,
    { params: { id, lang } }
  );
}

/** Get a single episode by number (V2: /episode — id, ep, q, lang) */
export async function getEpisode(
  id: string | number,
  ep: number,
  q: string = "720p",
  lang: string = "en"
): Promise<AllEpisodesResponse> {
  return await fetchAPI<AllEpisodesResponse>(
    `${DRAMABOX_PROXY_PREFIX}/episode`,
    { params: { id, ep, q, lang } }
  );
}

/** Get all episodes for a drama (V2: /allepisode — id, q, lang) */
export async function getAllEpisodes(
  id: string | number,
  lang: string = "en",
  q: string = "720p"
): Promise<AllEpisodesResponse> {
  return await fetchAPI<AllEpisodesResponse>(
    `${DRAMABOX_PROXY_PREFIX}/allepisode`,
    { params: { id, q, lang } }
  );
}
