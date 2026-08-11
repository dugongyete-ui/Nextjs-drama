/**
 * DramaBox Platform Constants
 * All platform-specific configuration lives here.
 * When adding a new platform, create a similar constants.ts in its own folder.
 */

/** DramaBox API base URL (external) — used by server-side proxy only */
export const DRAMABOX_API_BASE = process.env.PRIV_API_BASE || "https://priv-api.anichin.bio";

/** DramaBox V2 API path prefix (external) — appended after base URL */
export const DRAMABOX_API_PREFIX = "/api/dramaboxv2";

/** DramaBox API key — used by server-side proxy only (read from env var) */
export const DRAMABOX_API_KEY = process.env.PRIV_API_KEY || "";

/** CDN hosts that serve HLS segments (need CORS proxy) */
export const DRAMABOX_CDN_HOSTS = [
  "hwzthls.dramaboxdb.com",
  "thwztchapter.dramaboxdb.com",
  "hwztakavideo.dramaboxdb.com",
] as const;

/** Local proxy route prefix for DramaBox API */
export const DRAMABOX_PROXY_PREFIX = "/api/dramabox";

/** Local proxy route prefix for CDN segments */
export const CDN_PROXY_PREFIX = "/api/cdn";
