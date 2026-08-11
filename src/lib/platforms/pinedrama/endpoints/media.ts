/**
 * PineDrama Media Endpoints
 * Video URL retrieval (direct MP4 from TikTok CDN)
 *
 * PineDrama does NOT use HLS streaming like DramaBox.
 * Instead, it serves direct MP4 video files from TikTok CDN.
 * The /episode endpoint returns the videoUrl and qualityList.
 */

import { fetchAPI } from "../client";
import { PINEDRAMA_PROXY_PREFIX, CDN_PROXY_PREFIX, PINEDRAMA_CDN_HOSTS } from "../constants";
import type { EpisodeResponse } from "../types";

/**
 * Get the video URL for a specific episode.
 * Fetches the /episode endpoint and returns the videoUrl.
 * Optionally proxies the URL through the CDN proxy if the host matches TikTok CDN.
 */
export async function getVideoUrl(
  id: string | number,
  ep: number,
  lang: string = "en",
  /** If true, rewrites TikTok CDN URLs to go through the local proxy */
  proxy: boolean = true
): Promise<string> {
  const response = await fetchAPI<EpisodeResponse>(
    `${PINEDRAMA_PROXY_PREFIX}/episode`,
    { params: { id, ep, lang } }
  );

  let videoUrl = response.videoUrl || "";

  if (proxy && videoUrl) {
    videoUrl = proxyCDNUrl(videoUrl);
  }

  return videoUrl;
}

/**
 * Get the full episode response including quality options.
 * Useful when you need qualityList or other metadata.
 */
export async function getEpisodeMedia(
  id: string | number,
  ep: number,
  lang: string = "en",
  proxy: boolean = true
): Promise<EpisodeResponse> {
  const response = await fetchAPI<EpisodeResponse>(
    `${PINEDRAMA_PROXY_PREFIX}/episode`,
    { params: { id, ep, lang } }
  );

  if (proxy) {
    // Proxy the main videoUrl
    if (response.videoUrl) {
      response.videoUrl = proxyCDNUrl(response.videoUrl);
    }
    // Proxy all quality list URLs
    if (response.qualityList) {
      response.qualityList = response.qualityList.map((q) => ({
        ...q,
        url: proxyCDNUrl(q.url),
      }));
    }
  }

  return response;
}

/**
 * Rewrite a TikTok CDN URL to go through the local CDN proxy.
 * TikTok CDN does NOT have CORS headers, so all requests must be proxied.
 * URLs that don't match TikTok CDN hosts are returned as-is.
 */
export function proxyCDNUrl(url: string): string {
  if (!url) return url;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname;

    // Check if the host matches any PineDrama CDN hosts
    const isCDN = PINEDRAMA_CDN_HOSTS.some((cdnHost) =>
      host === cdnHost || host.endsWith(`.${cdnHost}`)
    );

    if (isCDN) {
      // Rewrite: /api/cdn?url=<encoded original URL>
      return `${CDN_PROXY_PREFIX}?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // Invalid URL, return as-is
  }

  return url;
}
