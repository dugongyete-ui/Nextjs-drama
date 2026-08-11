/**
 * PineDrama Platform Constants
 * All platform-specific configuration lives here.
 * PineDrama serves short-form dramas via TikTok CDN (direct MP4, not HLS).
 */

/** PineDrama API base URL (external) — used by server-side proxy only */
export const PINEDRAMA_API_BASE = process.env.PRIV_API_BASE || "https://priv-api.anichin.bio";

/** PineDrama API path prefix (external) — appended after base URL */
export const PINEDRAMA_API_PREFIX = "/api/pinedrama";

/** PineDrama API key — used by server-side proxy only (read from env var) */
export const PINEDRAMA_API_KEY = process.env.PRIV_API_KEY || "";

/** Local proxy route prefix for PineDrama API */
export const PINEDRAMA_PROXY_PREFIX = "/api/pinedrama";

/** Local proxy route prefix for CDN segments (shared with DramaBox) */
export const CDN_PROXY_PREFIX = "/api/cdn";

/** CDN hosts that serve TikTok video segments (need CORS proxy) */
export const PINEDRAMA_CDN_HOSTS = [
  "tiktokcdn.com",
  "tiktokv.com",
] as const;
