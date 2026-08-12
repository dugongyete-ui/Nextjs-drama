import { NextRequest, NextResponse } from "next/server";
import {
  IQIYI_API_BASE,
  IQIYI_API_PREFIX,
  IQIYI_API_KEY,
  IQIYI_PROXY_PREFIX,
  IQIYI_CDN_REFERER,
  IQIYI_CDN_USER_AGENT,
} from "@/lib/platforms/iqiyi/constants";

/**
 * iQIYI API Proxy
 * Proxies all API requests to the external iQIYI API.
 * Handles authentication (API key) server-side.
 *
 * Special handling for /episode endpoint:
 * - When ?hls=true query param is present, fetches the m3u8 from the hlsUrl
 *   in the JSON response, rewrites all TS segment URLs to go through our CDN proxy,
 *   and returns the rewritten m3u8 content directly.
 * - This allows hls.js to load /api/iqiyi/episode?id=X&ep=Y&hls=true as an m3u8 source.
 *
 * iQIYI CDN (data.video.iqiyi.com) requires:
 * - Referer: https://www.iq.com/
 * - User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
 * - CORS proxy (no Access-Control-Allow-Origin from CDN)
 */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const pathSegments = request.nextUrl.pathname
    .replace(`${IQIYI_PROXY_PREFIX}/`, "")
    .replace(/\/+$/, "");

  const url = new URL(`${IQIYI_API_BASE}${IQIYI_API_PREFIX}/${pathSegments}`);

  // Forward all query params (except our custom ones)
  const isHlsRequest = searchParams.get("hls") === "true";
  searchParams.forEach((value, key) => {
    if (key !== "hls") {
      url.searchParams.set(key, value);
    }
  });

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-API-Key": IQIYI_API_KEY,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "";

    // Check if it's raw HLS m3u8 content — rewrite CDN URLs server-side
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

    // Special handling for /episode endpoint with ?hls=true
    // The iQIYI episode API returns JSON with a `m3u8` field containing
    // the FULL m3u8 playlist content as a string (not a URL).
    // We extract it, rewrite CDN URLs, and return as m3u8.
    if (isHlsRequest && pathSegments === "episode") {
      try {
        const json = JSON.parse(text);

        // Case 1: `m3u8` field contains the full m3u8 content as a string
        const m3u8Content = json.m3u8 || "";
        if (m3u8Content && typeof m3u8Content === "string" && m3u8Content.includes("#EXTM3U")) {
          const rewritten = rewriteIqiyiM3u8Urls(m3u8Content);
          return new NextResponse(rewritten, {
            status: 200,
            headers: {
              "Content-Type": "application/vnd.apple.mpegurl",
              "Cache-Control": "no-cache",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }

        // Case 2: `hlsUrl` or `m3u8Url` contains a URL to fetch m3u8 from
        const hlsUrl = json.hlsUrl || json.m3u8Url || json.videoUrl || "";
        if (hlsUrl) {
          // Fetch the actual m3u8 content from the HLS URL
          const m3u8Res = await fetch(hlsUrl, {
            headers: {
              "Referer": IQIYI_CDN_REFERER,
              "User-Agent": IQIYI_CDN_USER_AGENT,
            },
            signal: AbortSignal.timeout(30_000),
          });

          let fetchedContent = await m3u8Res.text();

          // If the response is itself an m3u8, rewrite URLs
          if (fetchedContent.startsWith("#EXTM3U")) {
            fetchedContent = rewriteIqiyiM3u8Urls(fetchedContent);
            return new NextResponse(fetchedContent, {
              status: 200,
              headers: {
                "Content-Type": "application/vnd.apple.mpegurl",
                "Cache-Control": "no-cache",
                "Access-Control-Allow-Origin": "*",
              },
            });
          }

          // Might be another JSON with a URL or m3u8 content
          try {
            const innerJson = JSON.parse(fetchedContent);
            const innerM3u8 = innerJson.m3u8 || "";
            if (innerM3u8 && innerM3u8.includes("#EXTM3U")) {
              const rewritten = rewriteIqiyiM3u8Urls(innerM3u8);
              return new NextResponse(rewritten, {
                status: 200,
                headers: {
                  "Content-Type": "application/vnd.apple.mpegurl",
                  "Cache-Control": "no-cache",
                  "Access-Control-Allow-Origin": "*",
                },
              });
            }
          } catch {
            // Not JSON
          }
        }

        // No m3u8 content found — return error
        return NextResponse.json(
          { error: "No m3u8 content found in episode response" },
          { status: 502 }
        );
      } catch {
        // Failed to parse episode response — fall through to return JSON
      }
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
 * iQIYI CDN URLs (data.video.iqiyi.com) need to go through our CDN proxy because:
 * 1. CDN doesn't have CORS headers (Access-Control-Allow-Origin)
 * 2. CDN requires Referer: https://www.iq.com/
 * 3. CDN requires specific User-Agent
 *
 * We rewrite ALL absolute https:// URLs in the m3u8 to go through
 * /api/cdn?url=<encoded> so our CDN proxy adds the required headers.
 *
 * This catch-all approach ensures we handle any CDN host iQIYI uses,
 * including data.video.iqiyi.com and any subdomains.
 */
function rewriteIqiyiM3u8Urls(m3u8: string): string {
  // Rewrite ALL absolute URLs to go through our CDN proxy
  // Match https://<host>/<path> patterns in the m3u8
  // Using query-based CDN proxy format: /api/cdn?url=<encoded>
  return m3u8.replace(
    /https?:\/\/[^\s"']+/g,
    (match) => {
      // Don't rewrite our own proxy URLs
      if (match.startsWith("/api/")) return match;

      // Use query-based CDN proxy format
      return `/api/cdn?url=${encodeURIComponent(match)}`;
    }
  );
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
