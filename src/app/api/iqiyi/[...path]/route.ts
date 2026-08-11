import { NextRequest, NextResponse } from "next/server";
import {
  IQIYI_API_BASE,
  IQIYI_API_PREFIX,
  IQIYI_API_KEY,
  IQIYI_PROXY_PREFIX,
} from "@/lib/platforms/iqiyi/constants";

/**
 * iQIYI API Proxy
 * Proxies all API requests to the external iQIYI API.
 * Handles authentication (API key) server-side.
 *
 * iQIYI CDN has Referer + User-Agent restrictions:
 * - Referer: https://www.iq.com/
 * - User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
 *
 * For m3u8 responses, we rewrite CDN URLs to go through our CDN proxy
 * so the browser can access HLS segments.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const pathSegments = request.nextUrl.pathname
    .replace(`${IQIYI_PROXY_PREFIX}/`, "")
    .replace(/\/+$/, "");

  const url = new URL(`${IQIYI_API_BASE}${IQIYI_API_PREFIX}/${pathSegments}`);

  // Forward all query params
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-API-Key": IQIYI_API_KEY,
        "Content-Type": "application/json",
      },
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "";

    // Check if it's HLS m3u8 content — rewrite CDN URLs server-side
    if (text.startsWith("#EXTM3U") || contentType.includes("mpegurl")) {
      const rewritten = rewriteIqiyiM3u8Urls(text);
      return new NextResponse(rewritten, {
        status: res.status,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // JSON or other content
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": contentType || "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Proxy fetch failed", message: String(error) },
      { status: 502 }
    );
  }
}

/**
 * Rewrite URLs in iQIYI m3u8 playlists.
 *
 * iQIYI CDN URLs need to go through our CDN proxy because:
 * 1. CDN doesn't have CORS headers (Access-Control-Allow-Origin)
 * 2. CDN requires Referer: https://www.iq.com/
 * 3. CDN requires specific User-Agent
 *
 * We rewrite absolute CDN URLs to /api/cdn/<host>/<path>
 * so our CDN proxy adds the required headers.
 */
function rewriteIqiyiM3u8Urls(m3u8: string): string {
  let result = m3u8;

  // Rewrite iQIYI API-relative paths → local proxy
  // /api/iqiyi/episode?id=... → /api/iqiyi/episode?id=...
  // (already correct since we're the proxy, but handle if API returns full URLs)
  result = result.replace(
    new RegExp(`https?://[^/]+${IQIYI_API_PREFIX.replace(/\//g, "\\/")}/`, "g"),
    `${IQIYI_PROXY_PREFIX}/`
  );

  // Rewrite known iQIYI CDN hosts → CDN proxy
  const iqiyiCdnHosts = ["cdn-iqiyi.com", "iqiyi.com", "iq.com"];
  for (const host of iqiyiCdnHosts) {
    const escaped = host.replace(/\./g, "\\.");
    // Match https://<cdn-host>/<path> and rewrite to /api/cdn/<cdn-host>/<path>
    result = result.replace(
      new RegExp(`https://${escaped}/`, "g"),
      `/api/cdn/${host}/`
    );
    result = result.replace(
      new RegExp(`http://${escaped}/`, "g"),
      `/api/cdn/${host}/`
    );
  }

  return result;
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range",
      "Access-Control-Max-Age": "86400",
    },
  });
}
