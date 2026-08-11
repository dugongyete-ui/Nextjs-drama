/**
 * M3U8 URL Rewriter
 * Rewrites URLs in m3u8 playlists so the browser can access them.
 *
 * Three types of rewriting:
 *
 * 1. API-relative paths: "/api/dramaboxv2/" → "/api/dramabox/"
 *    The V2 API returns master m3u8 with sub-playlist paths like
 *    "/api/dramaboxv2/hls?id=...&q=720p&media=1" which are relative
 *    to the API server. hls.js resolves them relative to our proxy URL,
 *    so we must rewrite them to match our local proxy prefix.
 *
 * 2. CDN URLs WITHOUT CORS: "https://<cdn-host>/" → "/api/cdn/<cdn-host>/"
 *    Some CDN hosts don't return CORS headers, so the browser (hls.js)
 *    can't fetch segments directly. We route through our CDN proxy.
 *
 * 3. CDN URLs WITH CORS: Left as-is (https://<cdn-host>/...)
 *    Some CDN hosts already return Access-Control-Allow-Origin: *,
 *    so the browser can fetch directly without our proxy.
 *    This avoids issues with long URLs breaking serverless gateways.
 */

import { DRAMABOX_CDN_HOSTS, CDN_PROXY_PREFIX, DRAMABOX_API_PREFIX, DRAMABOX_PROXY_PREFIX } from "../platforms/dramabox/constants";

/**
 * CDN hosts that already support CORS (Access-Control-Allow-Origin: *).
 * These are left as-is in the m3u8 so the browser fetches directly.
 * This avoids CDN proxy 403 errors from URL length limits on serverless gateways.
 */
export const CORS_CAPABLE_CDN_HOSTS: readonly string[] = [
  "hwztakavideo.dramaboxdb.com",
];

/**
 * CDN hosts that do NOT support CORS and must go through our CDN proxy.
 */
const PROXY_NEEDED_CDN_HOSTS = DRAMABOX_CDN_HOSTS.filter(
  (host) => !CORS_CAPABLE_CDN_HOSTS.includes(host)
);

/**
 * Rewrite all URLs in an m3u8 playlist string.
 */
export function rewriteM3u8Urls(m3u8: string): string {
  let result = m3u8;

  // 1. Rewrite API-relative paths → local API proxy
  //    /api/dramaboxv2/hls?id=... → /api/dramabox/hls?id=...
  result = result.replace(
    new RegExp(`${DRAMABOX_API_PREFIX.replace(/\//g, "\\/")}/`, "g"),
    `${DRAMABOX_PROXY_PREFIX}/`
  );

  // 2. Rewrite CDN host URLs → local CDN proxy (only for hosts WITHOUT CORS)
  for (const host of PROXY_NEEDED_CDN_HOSTS) {
    const escaped = host.replace(/\./g, "\\.");
    result = result.replace(
      new RegExp(`https://${escaped}/`, "g"),
      `${CDN_PROXY_PREFIX}/${host}/`
    );
  }

  // 3. CORS-capable CDN hosts are left as-is — browser fetches directly

  return result;
}
