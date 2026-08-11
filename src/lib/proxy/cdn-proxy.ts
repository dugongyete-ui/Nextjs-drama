/**
 * CDN Proxy Utilities
 * Shared constants and helpers for the CDN CORS proxy route.
 */

import { DRAMABOX_CDN_HOSTS, CDN_PROXY_PREFIX } from "../platforms/dramabox/constants";
import { PINEDRAMA_CDN_HOSTS } from "../platforms/pinedrama/constants";
import { IQIYI_CDN_HOSTS } from "../platforms/iqiyi/constants";

/** CDN hosts allowed for proxying (DramaBox + PineDrama/TikTok + iQIYI CDN hosts) */
export const ALLOWED_CDN_HOSTS: readonly string[] = [
  ...DRAMABOX_CDN_HOSTS,
  ...PINEDRAMA_CDN_HOSTS,
  ...IQIYI_CDN_HOSTS,
];

/** CDN proxy route prefix (e.g., "/api/cdn") */
export { CDN_PROXY_PREFIX };

/**
 * Build a proxied CDN URL for a given host and path.
 * Example: buildCdnProxyUrl("hwzthls.dramaboxdb.com", "seg1.ts?key=val")
 *   → "/api/cdn/hwzthls.dramaboxdb.com/seg1.ts?key=val"
 */
export function buildCdnProxyUrl(host: string, path: string): string {
  return `${CDN_PROXY_PREFIX}/${host}/${path}`;
}

/**
 * Check if a host is in the allowed CDN hosts list.
 * Supports exact match and subdomain matching (e.g., v77e.tiktokcdn.com matches tiktokcdn.com).
 */
export function isCdnHostAllowed(host: string): boolean {
  return ALLOWED_CDN_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}
