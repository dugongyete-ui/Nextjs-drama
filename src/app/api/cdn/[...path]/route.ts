import { NextRequest, NextResponse } from "next/server";
import { isCdnHostAllowed, CDN_PROXY_PREFIX } from "@/lib/proxy/cdn-proxy";
import { CORS_CAPABLE_CDN_HOSTS } from "@/lib/proxy/m3u8-rewriter";
import { IQIYI_CDN_HOSTS, IQIYI_CDN_REFERER, IQIYI_CDN_USER_AGENT } from "@/lib/platforms/iqiyi/constants";
import { nodeFetch } from "@/lib/proxy/node-fetch";

/**
 * CDN Proxy — forwards requests to DramaBox and PineDrama/TikTok CDNs.
 *
 * Supports two formats:
 *
 * 1. Path-based (DramaBox):
 *    /api/cdn/hwzthls.dramaboxdb.com/48/2x5/.../file.ts?sig=...
 *      → https://hwzthls.dramaboxdb.com/48/2x5/.../file.ts?sig=...
 *
 * 2. Query-based (PineDrama/TikTok CDN):
 *    /api/cdn?url=https%3A%2F%2Fv77e.tiktokcdn.com%2F...
 *      → https://v77e.tiktokcdn.com/...
 *
 * For CORS-capable CDN hosts: returns a 302 redirect to the original URL.
 * For non-CORS CDN hosts: streams the response through our proxy
 * with proper CORS headers.
 *
 * Only known CDN hosts are allowed (security: no open proxy).
 */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Check for query-based URL format (?url=...) used by PineDrama
  const queryUrl = searchParams.get("url");
  if (queryUrl) {
    return handleProxyRequest(request, queryUrl);
  }

  // Path-based format: /api/cdn/<host>/<rest>
  const fullPath = request.nextUrl.pathname.replace(`${CDN_PROXY_PREFIX}/`, "");

  // Extract host from first path segment
  const firstSlash = fullPath.indexOf("/");
  if (firstSlash === -1) {
    return NextResponse.json({ error: "Missing path after host" }, { status: 400 });
  }

  const host = fullPath.substring(0, firstSlash);
  const restPath = fullPath.substring(firstSlash + 1);

  if (!isCdnHostAllowed(host)) {
    return NextResponse.json({ error: "CDN host not allowed" }, { status: 403 });
  }

  // Build the real CDN URL
  const url = new URL(`https://${host}/${restPath}`);
  searchParams.forEach((value, key) => {
    if (key !== "url") {
      url.searchParams.set(key, value);
    }
  });

  return handleProxyRequest(request, url.toString());
}

/**
 * Core proxy logic: given a target URL, either redirect (CORS-capable)
 * or stream the response through our proxy.
 */
async function handleProxyRequest(request: NextRequest, targetUrl: string) {
  // Validate the URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Check host is allowed
  if (!isCdnHostAllowed(parsedUrl.hostname)) {
    return NextResponse.json({ error: "CDN host not allowed" }, { status: 403 });
  }

  // For CORS-capable CDN hosts, redirect to the original URL.
  if (CORS_CAPABLE_CDN_HOSTS.includes(parsedUrl.hostname as any)) {
    return NextResponse.redirect(targetUrl, 302);
  }

  // For non-CORS CDN hosts, proxy the response with streaming
  try {
    const headers: Record<string, string> = {
      "User-Agent": "DramaBox-Proxy/1.0",
    };

    // iQIYI CDN requires Referer + specific User-Agent
    const isIqiyiCdn = IQIYI_CDN_HOSTS.some(
      (host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`)
    );
    if (isIqiyiCdn) {
      headers["Referer"] = IQIYI_CDN_REFERER;
      headers["User-Agent"] = IQIYI_CDN_USER_AGENT;
      headers["Origin"] = "https://www.iq.com";
    }
    const rangeHeader = request.headers.get("Range");
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    const res = await nodeFetch(targetUrl, { headers, timeout: 30_000 });

    // Determine the correct content type for the response
    let responseContentType = res.headers.get("content-type") || "";
    if (parsedUrl.pathname.endsWith(".ts")) {
      responseContentType = "video/mp2t";
    } else if (parsedUrl.pathname.endsWith(".mp4")) {
      responseContentType = "video/mp4";
    } else if (parsedUrl.pathname.endsWith(".m3u8")) {
      responseContentType = "application/vnd.apple.mpegurl";
    } else if (parsedUrl.pathname.endsWith(".key")) {
      responseContentType = "application/octet-stream";
    }

    // Build response headers
    const responseHeaders: Record<string, string> = {
      "Content-Type": responseContentType || "application/octet-stream",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    };

    // Forward Content-Range for partial content responses
    const contentRange = res.headers.get("Content-Range");
    if (contentRange) {
      responseHeaders["Content-Range"] = contentRange;
    }
    const acceptRanges = res.headers.get("Accept-Ranges");
    if (acceptRanges) {
      responseHeaders["Accept-Ranges"] = acceptRanges;
    }

    // Stream the response body
    const status = res.status;
    const body = res.body;

    if (body) {
      return new NextResponse(body, { status, headers: responseHeaders });
    }

    // Fallback: if no readable body, buffer small responses
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, { status, headers: responseHeaders });
  } catch (error) {
    return NextResponse.json(
      { error: "CDN proxy fetch failed", message: String(error) },
      { status: 502 }
    );
  }
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
