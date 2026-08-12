import { NextRequest, NextResponse } from "next/server";
import {
  IQIYI_API_BASE,
  IQIYI_API_PREFIX,
  IQIYI_API_KEY,
  IQIYI_PROXY_PREFIX,
  IQIYI_CDN_REFERER,
  IQIYI_CDN_USER_AGENT,
} from "@/lib/platforms/iqiyi/constants";
import { nodeFetch } from "@/lib/proxy/node-fetch";

/**
 * iQIYI API Proxy
 * Proxies all API requests to the external iQIYI API.
 * Handles authentication (API key) server-side.
 *
 * Uses nodeFetch (node:https) instead of undici fetch() for resilience —
 * undici fetch can crash the process when the external API is slow/unreachable.
 *
 * Special handling for /episode endpoint:
 * - When ?hls=true query param is present, fetches the m3u8 from the hlsUrl
 *   in the JSON response, rewrites all TS segment URLs to go through our CDN proxy,
 *   and returns the rewritten m3u8 content directly.
 * - This allows hls.js to load /api/iqiyi/episode?id=X&ep=Y&hls=true as an m3u8 source.
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
    const res = await nodeFetch(url.toString(), {
      headers: {
        "X-API-Key": IQIYI_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 60_000,
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
          const m3u8Res = await nodeFetch(hlsUrl, {
            headers: {
              "Referer": IQIYI_CDN_REFERER,
              "User-Agent": IQIYI_CDN_USER_AGENT,
            },
            timeout: 60_000,
          });

          let fetchedContent = await m3u8Res.text();

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
 * All CDN URLs go through /api/cdn?url=<encoded> for CORS + Referer + UA headers.
 */
function rewriteIqiyiM3u8Urls(m3u8: string): string {
  return m3u8.replace(
    /https?:\/\/[^\s"']+/g,
    (match) => {
      if (match.startsWith("/api/")) return match;
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
      "Access-Control-Max-Age": "86400",
    },
  });
}
