/**
 * iQIYI Platform Constants
 * All platform-specific configuration lives here.
 * iQIYI uses HLS streaming with Referer/UA-restricted CDN.
 */

/** iQIYI API base URL (external) — used by server-side proxy only */
export const IQIYI_API_BASE = process.env.PRIV_API_BASE || "https://priv-api.anichin.bio";

/** iQIYI API path prefix (external) — appended after base URL */
export const IQIYI_API_PREFIX = "/api/iqiyi";

/** iQIYI API key — used by server-side proxy only (read from env var) */
export const IQIYI_API_KEY = process.env.PRIV_API_KEY || "";

/** Local proxy route prefix for iQIYI API */
export const IQIYI_PROXY_PREFIX = "/api/iqiyi";

/** Local proxy route prefix for CDN segments (shared with other platforms) */
export const CDN_PROXY_PREFIX = "/api/cdn";

/**
 * CDN hosts that serve iQIYI HLS segments.
 * Primary: data.video.iqiyi.com — serves m3u8 playlists and TS segments.
 * These hosts require CORS proxy + Referer + User-Agent headers.
 */
export const IQIYI_CDN_HOSTS = [
  "data.video.iqiyi.com",
  "cdn-iqiyi.com",
  "iqiyi.com",
  "iq.com",
] as const;

/** Referer header required by iQIYI CDN for segment requests */
export const IQIYI_CDN_REFERER = "https://www.iq.com/";

/** User-Agent header required by iQIYI CDN */
export const IQIYI_CDN_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

/** Default channel ID for browse endpoint */
export const IQIYI_DEFAULT_CHANNEL_ID = "4";
