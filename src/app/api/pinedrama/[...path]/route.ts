import { NextRequest, NextResponse } from "next/server";
import {
  PINEDRAMA_API_BASE,
  PINEDRAMA_API_PREFIX,
  PINEDRAMA_API_KEY,
  PINEDRAMA_PROXY_PREFIX,
} from "@/lib/platforms/pinedrama/constants";

/**
 * PineDrama API Proxy
 * Proxies all API requests to the external PineDrama API.
 * Handles authentication (API key) and adds User-Agent for Cloudflare.
 * PineDrama uses direct MP4 (no HLS/m3u8), so no m3u8 rewriting needed.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const pathSegments = request.nextUrl.pathname
    .replace(`${PINEDRAMA_PROXY_PREFIX}/`, "")
    .replace(/\/+$/, "");

  const url = new URL(`${PINEDRAMA_API_BASE}${PINEDRAMA_API_PREFIX}/${pathSegments}`);

  // Forward all query params
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "X-API-Key": PINEDRAMA_API_KEY,
        "Content-Type": "application/json",
        // PineDrama requires User-Agent — Cloudflare blocks without it
        "User-Agent": "DramaBox-App/2.0",
      },
      signal: AbortSignal.timeout(30_000),
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "";

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
