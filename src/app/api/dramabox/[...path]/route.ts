import { NextRequest, NextResponse } from "next/server";
import { DRAMABOX_API_BASE, DRAMABOX_API_PREFIX, DRAMABOX_API_KEY, DRAMABOX_PROXY_PREFIX } from "@/lib/platforms/dramabox/constants";
import { rewriteM3u8Urls } from "@/lib/proxy/m3u8-rewriter";

/**
 * DramaBox API Proxy
 * Proxies all API requests to the external DramaBox API.
 * Handles authentication (API key) and m3u8 URL rewriting server-side.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const pathSegments = request.nextUrl.pathname
    .replace(`${DRAMABOX_PROXY_PREFIX}/`, "")
    .replace(/\/+$/, "");

  const url = new URL(`${DRAMABOX_API_BASE}${DRAMABOX_API_PREFIX}/${pathSegments}`);

  // Forward all query params
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-API-Key": DRAMABOX_API_KEY,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });

    const text = await res.text();

    // Check if it's HLS m3u8 content — rewrite CDN URLs server-side
    const contentType = res.headers.get("content-type") || "";
    if (text.startsWith("#EXTM3U") || contentType.includes("mpegurl")) {
      const rewritten = rewriteM3u8Urls(text);
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
