# SKILL.md — Platform Creator Guide

> **Panduan lengkap untuk menambahkan platform drama baru ke project Nextjs-drama.**
> Ikuti setiap langkah secara berurutan. Setelah selesai, platform baru langsung siap produksi dan deploy.

---

## Arsitektur Overview

Project ini menggunakan **Platform Adapter Pattern** — setiap platform drama memiliki modul sendiri di `src/lib/platforms/<nama>/` yang mengimplementasikan interface `PlatformApi` secara unified. Semua halaman (home, detail, watch, search, browse) menggunakan **satu adapter yang sama** via `usePlatformApi()`, sehingga UI tidak perlu tahu platform mana yang aktif.

**Platform yang sudah diimplementasikan:**
- **DramaBox** — HLS + MP4 streaming, m3u8 rewriting, 3 CDN hosts
- **PineDrama** — Direct MP4 dari TikTok CDN, cursor-based pagination, creator/channel info

---

## Checklist Cepat (7 Langkah)

| # | Langkah | File yang Diubah/Dibuat |
|---|---------|------------------------|
| 1 | Buat folder platform & semua modul | `src/lib/platforms/<nama>/` (7 file) |
| 2 | Daftarkan platform di store | `src/lib/store.ts` |
| 3 | Daftarkan adapter di adapter.ts | `src/lib/platforms/adapter.ts` |
| 4 | Buat API proxy route | `src/app/api/<nama>/[...path]/route.ts` |
| 5 | Tambah CDN hosts | `src/lib/proxy/cdn-proxy.ts` |
| 6 | Tambah logo & image pattern | `public/<nama>-logo.png` + `next.config.ts` |
| 7 | Tambah env vars (jika perlu) | `.env.example` + `.env.local` |

---

## Langkah 1: Buat Folder Platform

Buat folder `src/lib/platforms/<nama>/` dengan 7 file berikut:

### 1.1 `constants.ts` — Konfigurasi Platform

```typescript
/**
 * <Nama> Platform Constants
 * Semua konfigurasi platform-specific ada di sini.
 */

/** API base URL (external) — hanya dipakai server-side proxy */
export const <NAMA>_API_BASE = process.env.PRIV_API_BASE || "https://priv-api.anichin.bio";

/** API path prefix (external) — ditambahkan setelah base URL */
export const <NAMA>_API_PREFIX = "/api/<nama>";

/** API key — hanya dipakai server-side proxy (dari env var) */
export const <NAMA>_API_KEY = process.env.PRIV_API_KEY || "";

/** Local proxy route prefix untuk <Nama> API */
export const <NAMA>_PROXY_PREFIX = "/api/<nama>";

/** CDN hosts yang melayani video segments (butuh CORS proxy) */
export const <NAMA>_CDN_HOSTS = [
  // "cdn1.example.com",
  // "cdn2.example.com",
] as const;

/** Local proxy route prefix untuk CDN segments (shared) */
export const CDN_PROXY_PREFIX = "/api/cdn";
```

**⚠️ Catatan penting:**
- Jika platform menggunakan API base dan key yang **berbeda** dari yang ada, tambahkan env var baru (misal `<NAMA>_API_KEY`, `<NAMA>_API_BASE`) dan baca dari `process.env`.
- `CDN_PROXY_PREFIX` selalu `/api/cdn` (shared antar semua platform).

### 1.2 `types.ts` — TypeScript Interfaces

Definisikan interface untuk **raw API response** dari platform baru. Minimal yang dibutuhkan:

```typescript
/** Language */
export interface Language {
  code: string;
  name: string;
  region?: string;
}

/** Drama Item — sesuaikan field dengan response API platform */
export interface DramaItem {
  id: string;
  title: string;
  cover: string;
  // ... field lain sesuai API platform
  [key: string]: unknown; // wajib: mengakomodasi field tak terduga
}

/** Episode */
export interface Episode {
  number: number;
  title: string;
  videoUrl?: string;
  locked?: boolean;
  duration?: number;
  // ... field lain sesuai API platform
  [key: string]: unknown;
}

// ... Response types (TrendingResponse, DetailResponse, dll.)
// ... NormalizedDrama, NormalizedEpisode (shape yang dipakai UI)
```

**⚠️ Referensi lengkap:** Lihat `src/lib/platforms/dramabox/types.ts` dan `pinedrama/types.ts` untuk contoh lengkap. Setiap platform punya field yang berbeda — jangan copy-paste mentah, sesuaikan dengan API platform baru.

### 1.3 `client.ts` — Low-Level Fetch

```typescript
/**
 * <Nama> API Client
 * Low-level fetch function via local Next.js proxy.
 */

interface RequestOptions {
  params?: Record<string, string | number | undefined>;
}

export async function fetchAPI<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const params = new URLSearchParams();
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    });
  }
  const queryString = params.toString();
  const url = `${endpoint}${queryString ? "?" + queryString : ""}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText} for ${endpoint}`);
  }

  const text = await res.text();

  // Jika response m3u8, return sebagai raw string
  if (text.startsWith("#EXTM3U")) {
    return text as unknown as T;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`API Error: Invalid JSON response from ${endpoint}`);
  }
}
```

**Catatan:** Client selalu fetch via **local proxy** (`/api/<nama>/...`), bukan langsung ke external API. Proxy handle auth & CORS.

### 1.4 `helpers.ts` — Normalisasi Data

Fungsi yang mengubah raw API response → unified shape untuk UI:

```typescript
import type { DramaItem, Episode, NormalizedDrama, NormalizedEpisode } from "./types";

/** Normalize drama item → UnifiedDrama shape */
export function normalizeDrama(item: DramaItem): NormalizedDrama {
  return {
    id: String(item.id || ""),
    title: item.title || "",
    cover: item.cover || "",
    coverVertical: item.cover || "",   // sesuaikan field platform
    coverHorizontal: item.cover || "",  // sesuaikan field platform
    synopsis: item.description || "",   // sesuaikan field platform
    rating: "",
    episodes: typeof item.episodes === "number"
      ? item.episodes
      : Array.isArray(item.episodes) ? item.episodes.length : 0,
    genre: item.tags?.[0] || "",
    status: "",
    views: "",
    year: "",
    locked: false,
    tags: item.tags || [],
  };
}

/** Normalize episode → UnifiedEpisode shape */
export function normalizeEpisode(ep: Episode): NormalizedEpisode {
  // Konversi duration ke format "m:ss"
  const durMs = typeof ep.duration === "number" ? ep.duration : 0;
  const durSec = Math.floor(durMs / 1000);
  const m = Math.floor(durSec / 60);
  const s = durSec % 60;

  return {
    number: ep.number || 0,
    chapterId: "",
    title: ep.title || "",
    locked: ep.locked || false,
    duration: durMs > 0 ? `${m}:${s.toString().padStart(2, "0")}` : "",
    hlsUrl: "",       // isi jika platform pakai HLS
    mp4Url: ep.videoUrl || "",
    videoUrl: ep.videoUrl || "",
    subtitlesUrl: "",
    qualities: [],     // isi jika platform punya quality options
  };
}

/** Extract list dari API response */
export function extractList<T>(response: Record<string, unknown>): T[] {
  if (!response) return [];
  if (Array.isArray(response.items)) return response.items as T[];
  if (Array.isArray(response.list)) return response.list as T[];
  if (Array.isArray(response.data)) return response.data as T[];
  if (Array.isArray(response.episodes)) return response.episodes as T[];
  return [];
}

/** Extract languages */
export function extractLanguages(response: any): any[] {
  if (Array.isArray(response.languages)) return response.languages;
  if (Array.isArray(response.list)) return response.list;
  if (Array.isArray(response.data)) return response.data;
  return [];
}

/** Extract categories (jika platform punya) */
export function extractCategories(response: Record<string, unknown>): any[] {
  if (Array.isArray(response.categories)) return response.categories;
  if (Array.isArray(response.items)) return response.items;
  return [];
}
```

### 1.5 `endpoints/content.ts` — Content Endpoints

Implementasikan endpoint yang tersedia di platform. **Minimal** yang harus ada: `getTrending`, `getForYou`, `search`. Lihat DramaBox/PineDrama untuk contoh endpoint tambahan.

```typescript
import { fetchAPI } from "../client";
import { <NAMA>_PROXY_PREFIX } from "../constants";

export async function getTrending(page: number = 1, lang: string = "en"): Promise<any> {
  return await fetchAPI(`${<NAMA>_PROXY_PREFIX}/trending`, { params: { page, lang } });
}

export async function getForYou(page: number = 1, lang: string = "en"): Promise<any> {
  return await fetchAPI(`${<NAMA>_PROXY_PREFIX}/foryou`, { params: { page, lang } });
}

export async function search(query: string, lang: string = "en"): Promise<any> {
  return await fetchAPI(`${<NAMA>_PROXY_PREFIX}/search`, { params: { q: query, lang } });
}
```

### 1.6 `endpoints/catalog.ts` — Catalog Endpoints

**Minimal:** `getDetail`, `getAllEpisodes`.

```typescript
import { fetchAPI } from "../client";
import { <NAMA>_PROXY_PREFIX } from "../constants";

export async function getDetail(id: string | number, lang: string = "en"): Promise<any> {
  return await fetchAPI(`${<NAMA>_PROXY_PREFIX}/detail`, { params: { id, lang } });
}

export async function getAllEpisodes(id: string | number, lang: string = "en"): Promise<any> {
  return await fetchAPI(`${<NAMA>_PROXY_PREFIX}/allepisode`, { params: { id, lang } });
}
```

### 1.7 `endpoints/media.ts` — Media Endpoints

Implementasi tergantung tipe streaming platform:

**Jika HLS (seperti DramaBox):**
```typescript
import { <NAMA>_PROXY_PREFIX } from "../constants";

export async function getHLS(id: string | number, ep: number): Promise<string> {
  return `${<NAMA>_PROXY_PREFIX}/hls?id=${encodeURIComponent(String(id))}&ep=${encodeURIComponent(String(ep))}`;
}
```

**Jika Direct MP4 (seperti PineDrama):**
```typescript
import { fetchAPI } from "../client";
import { <NAMA>_PROXY_PREFIX, CDN_PROXY_PREFIX, <NAMA>_CDN_HOSTS } from "../constants";

export async function getVideoUrl(id: string | number, ep: number, lang: string = "en"): Promise<string> {
  const response = await fetchAPI(`${<NAMA>_PROXY_PREFIX}/episode`, { params: { id, ep, lang } });
  return response.videoUrl || "";
}

/** Proxy CDN URL jika host tidak punya CORS headers */
export function proxyCDNUrl(url: string): string {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const isCDN = <NAMA>_CDN_HOSTS.some((cdnHost) => host === cdnHost || host.endsWith(`.${cdnHost}`));
    if (isCDN) return `${CDN_PROXY_PREFIX}?url=${encodeURIComponent(url)}`;
  } catch {}
  return url;
}
```

### 1.8 `index.ts` — Barrel Export

```typescript
/**
 * <Nama> Platform — Barrel Export
 * import { api, normalizeDrama, ... } from "@/lib/platforms/<nama>";
 */

// Constants
export { <NAMA>_API_BASE, <NAMA>_API_PREFIX, <NAMA>_API_KEY, <NAMA>_CDN_HOSTS, <NAMA>_PROXY_PREFIX, CDN_PROXY_PREFIX } from "./constants";

// Types (export semua yang diperlukan)
export type { /* ... */ } from "./types";

// Helpers
export { normalizeDrama, normalizeEpisode, extractList, extractLanguages, extractCategories } from "./helpers";

// Client
export { fetchAPI } from "./client";

// Endpoints
export { getTrending, getForYou, search } from "./endpoints/content";
export { getDetail, getAllEpisodes } from "./endpoints/catalog";
// export { getHLS } from "./endpoints/media";        // jika HLS
// export { getVideoUrl, proxyCDNUrl } from "./endpoints/media";  // jika MP4

// Convenience: unified api object
import { fetchAPI } from "./client";
import { <NAMA>_PROXY_PREFIX } from "./constants";
import { getTrending, getForYou, search } from "./endpoints/content";
import { getDetail, getAllEpisodes } from "./endpoints/catalog";
// import media exports...

export const api = {
  getTrending,
  getForYou,
  search,
  getDetail,
  getAllEpisodes,
  // ... tambahkan semua endpoint
};
```

---

## Langkah 2: Daftarkan di Store

Edit **`src/lib/store.ts`**:

```typescript
// 1. Tambahkan ke Platform type union
export type Platform = "dramabox" | "pinedrama" | "<nama>";

// 2. Tambahkan ke PLATFORMS array
export const PLATFORMS: { id: Platform; name: string; logo: string }[] = [
  { id: "dramabox", name: "DramaBox", logo: "/dramabox-logo.png" },
  { id: "pinedrama", name: "PineDrama", logo: "/pinedrama-logo.png" },
  { id: "<nama>", name: "<Nama>", logo: "/<nama>-logo.png" },  // ← BARU
];
```

---

## Langkah 3: Daftarkan di Adapter

Edit **`src/lib/platforms/adapter.ts`**:

```typescript
// 1. Import platform baru
import * as <nama> from "@/lib/platforms/<nama>";

// 2. Buat adapter object (implementasi PlatformApi interface)
const <nama>Api: PlatformApi = {
  getLanguages: () => <nama>.api.getLanguages(),
  getTrending: (page, lang) => <nama>.api.getTrending(page, lang),
  getForYou: (page, lang) => <nama>.api.getForYou(page, lang),
  getDetail: (id, lang) => <nama>.api.getDetail(id, lang),
  getAllEpisodes: (id, lang) => <nama>.api.getAllEpisodes(id, lang),
  search: (query, lang) => <nama>.api.search(query, lang),
  normalizeDrama: (item) => <nama>.normalizeDrama(item) as UnifiedDrama,
  normalizeEpisode: (ep) => <nama>.normalizeEpisode(ep) as UnifiedEpisode,
  extractList: <T,>(response) => <nama>.extractList<T>(response),
  extractLanguages: (response) => <nama>.extractLanguages(response),

  // === Endpoint opsional / fallback ===

  // Jika platform TIDAK punya hot rank → fallback ke trending
  getHotRank: (_type, lang) => <nama>.api.getTrending(1, lang),

  // Jika platform TIDAK punya recommended → fallback ke forYou
  getRecommended: (page, lang) => <nama>.api.getForYou(page, lang),

  // Jika platform TIDAK punya browse → fallback ke trending
  getBrowse: (page, lang, category?) =>
    category
      ? <nama>.api.getCategory?.(category, page, lang) || <nama>.api.getTrending(page, lang)
      : <nama>.api.getTrending(page, lang),

  // Category handling
  getCategories: () => <nama>.api.getCategory?.() || Promise.resolve({}),
  extractCategories: (response) => <nama>.extractCategories(response as Record<string, unknown>),

  // === Video URL resolution ===

  // Untuk HLS platform (seperti DramaBox):
  resolveEpisodeVideoUrl: (episode, dramaId, episodeNum) => {
    if (episode.mp4Url || episode.videoUrl) return episode.mp4Url || episode.videoUrl;
    if (episode.hlsUrl) {
      return episode.hlsUrl.replace(
        new RegExp(`^${<nama>.<NAMA>_API_PREFIX.replace(/\//g, "\\/")}/`, "g"),
        `${<nama>.<NAMA>_PROXY_PREFIX}/`
      );
    }
    return `${<nama>.<NAMA>_PROXY_PREFIX}/hls?id=${encodeURIComponent(String(dramaId))}&ep=${encodeURIComponent(String(episodeNum))}`;
  },

  // Untuk MP4 platform (seperti PineDrama):
  // resolveEpisodeVideoUrl: (episode) => {
  //   if (episode.mp4Url || episode.videoUrl) return <nama>.api.proxyCDNUrl(episode.mp4Url || episode.videoUrl);
  //   return null;
  // },
};

// 3. Tambahkan ke platformApis map
const platformApis: Record<Platform, PlatformApi> = {
  dramabox: dramaboxApi,
  pinedrama: pinedramaApi,
  <nama>: <nama>Api,  // ← BARU
};
```

### Detail `resolveEpisodeVideoUrl` Strategy

| Skenario | Strategy | Contoh |
|----------|----------|--------|
| **HLS platform** | 1. MP4 direct → 2. HLS rewrite → 3. Fallback construct | DramaBox |
| **MP4-only platform** | 1. videoUrl/mp4Url via CDN proxy → 2. qualities list → 3. null (fallback) | PineDrama |
| **CORS-capable CDN** | Return URL as-is (browser fetch langsung) | hwztakavideo.dramaboxdb.com |
| **No-CORS CDN** | Route melalui `/api/cdn` proxy | tiktokcdn.com, tiktokv.com |

---

## Langkah 4: Buat API Proxy Route

Buat file **`src/app/api/<nama>/[...path]/route.ts`**:

```typescript
import { NextRequest, NextResponse } from "next/server";
import {
  <NAMA>_API_BASE,
  <NAMA>_API_PREFIX,
  <NAMA>_API_KEY,
  <NAMA>_PROXY_PREFIX,
} from "@/lib/platforms/<nama>/constants";

/**
 * <Nama> API Proxy
 * Proxies semua API request ke external <Nama> API.
 * Handles authentication (API key) server-side.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const pathSegments = request.nextUrl.pathname
    .replace(`${<NAMA>_PROXY_PREFIX}/`, "")
    .replace(/\/+$/, "");

  const url = new URL(`${<NAMA>_API_BASE}${<NAMA>_API_PREFIX}/${pathSegments}`);

  // Forward semua query params
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  try {
    const headers: Record<string, string> = {
      "X-API-Key": <NAMA>_API_KEY,
      "Content-Type": "application/json",
      // Tambahkan User-Agent jika dibutuhkan (misal Cloudflare block)
      // "User-Agent": "DramaBox-App/2.0",
    };

    const res = await fetch(url.toString(), { headers });
    const text = await res.text();
    const contentType = res.headers.get("content-type") || "";

    // Jika HLS m3u8 → rewrite CDN URLs server-side
    // (hanya jika platform pakai HLS — import rewriteM3u8Urls jika perlu)
    // if (text.startsWith("#EXTM3U") || contentType.includes("mpegurl")) {
    //   const rewritten = rewriteM3u8Urls(text);
    //   return new NextResponse(rewritten, { ... });
    // }

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

// CORS preflight
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
```

### Proxy Khusus: m3u8 Rewriting (HLS Platform)

Jika platform baru pakai **HLS streaming**, proxy route perlu rewrite m3u8 URLs. Tambahkan:

```typescript
import { rewriteM3u8Urls } from "@/lib/proxy/m3u8-rewriter";

// Di dalam GET handler, setelah fetch:
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
```

**⚠️ Jika platform punya format m3u8 yang berbeda dari DramaBox**, mungkin perlu custom rewriter function (bukan `rewriteM3u8Urls` yang sudah ada, karena itu DramaBox-specific).

---

## Langkah 5: Tambah CDN Hosts

Edit **`src/lib/proxy/cdn-proxy.ts`**:

```typescript
import { <NAMA>_CDN_HOSTS } from "../platforms/<nama>/constants";

export const ALLOWED_CDN_HOSTS: readonly string[] = [
  ...DRAMABOX_CDN_HOSTS,
  ...PINEDRAMA_CDN_HOSTS,
  ...<NAMA>_CDN_HOSTS,  // ← BARU
];
```

### CDN Strategy per Platform

| Tipe CDN | Cara Proxy | Contoh |
|----------|-----------|--------|
| **Path-based** (CDN domain di URL path) | `/api/cdn/<host>/<path>` | DramaBox CDN |
| **Query-based** (URL encoded sebagai param) | `/api/cdn?url=<encoded>` | PineDrama/TikTok CDN |
| **CORS-capable** | 302 redirect ke original URL | hwztakavideo.dramaboxdb.com |

CDN proxy yang sudah ada mendukung **kedua format**. Cukup tambahkan CDN hosts ke `ALLOWED_CDN_HOSTS`, dan gunakan format yang sesuai di `endpoints/media.ts`.

---

## Langkah 6: Logo & Image Pattern

### 6.1 Tambah Logo

Taruh file logo di **`public/<nama>-logo.png`** (PNG, ukuran ~48x48 atau 64x64, transparan).

### 6.2 Tambah Image Pattern di `next.config.ts`

```typescript
images: {
  localPatterns: [
    // ... existing patterns
    {
      pathname: "/<nama>-logo.png",
      search: "",
    },
  ],
},
```

---

## Langkah 7: Environment Variables

Jika platform baru menggunakan **API key atau base URL yang berbeda**:

### 7.1 `.env.example`

```bash
# ... existing vars
<NAMA>_API_KEY=       # API key untuk <Nama> platform
<NAMA>_API_BASE=      # Base URL untuk <Nama> API (jika berbeda)
```

### 7.2 `constants.ts` update

```typescript
export const <NAMA>_API_KEY = process.env.<NAMA>_API_KEY || "";
export const <NAMA>_API_BASE = process.env.<NAMA>_API_BASE || "https://default-api.example.com";
```

**Jika platform pakai API key dan base URL yang sama** (sama seperti DramaBox & PineDrama yang share `PRIV_API_KEY` + `PRIV_API_BASE`), **tidak perlu** env var baru.

---

## Langkah 8: Build & Verifikasi

Setelah semua langkah di atas selesai, lakukan verifikasi:

```bash
# 1. TypeScript check
npx tsc --noEmit

# 2. Build
bun run build

# 3. Dev server — test manual
bun run dev
```

### Checklist Verifikasi Manual

- [ ] Platform muncul di dropdown switcher (Navbar)
- [ ] Switch ke platform baru → data trending muncul di home
- [ ] Search berfungsi dan return hasil
- [ ] Klik drama → detail page muncul (cover, synopsis, episodes)
- [ ] Klik episode → video player muncul dan stream berjalan
- [ ] Browse/categories berfungsi (jika platform punya)
- [ ] Language switcher berfungsi
- [ ] No console errors di browser
- [ ] API proxy mengirim auth headers dengan benar (cek Network tab)

---

## Referensi: PlatformApi Interface

Interface lengkap yang harus diimplementasi (dari `adapter.ts`):

```typescript
export interface PlatformApi {
  // === WAJIB (semua platform harus implement) ===
  getLanguages: () => Promise<any>;
  getTrending: (page: number, lang: string) => Promise<any>;
  getForYou: (page: number, lang: string) => Promise<any>;
  getDetail: (id: string | number, lang: string) => Promise<any>;
  getAllEpisodes: (id: string | number, lang: string) => Promise<any>;
  search: (query: string, lang: string) => Promise<any>;
  normalizeDrama: (item: any) => UnifiedDrama;
  normalizeEpisode: (ep: any) => UnifiedEpisode;
  extractList: <T>(response: Record<string, unknown>) => T[];
  extractLanguages: (response: any) => any[];

  // === OPSIONAL (boleh undefined, fallback otomatis) ===
  getEpisodeVideoUrl?: (id: string | number, ep: number, lang: string) => Promise<string>;
  resolveEpisodeVideoUrl?: (episode: UnifiedEpisode, dramaId: string | number, episodeNum: number) => string | null;
  getHotRank: (type: number, lang: string) => Promise<any>;
  getRecommended: (page: number, lang: string) => Promise<any>;
  getBrowse: (page: number, lang: string, category?: string) => Promise<any>;
  getCategories: (lang: string) => Promise<any>;
  extractCategories: (response: any) => any[];
}
```

### UnifiedDrama (Shape UI)

```typescript
export interface UnifiedDrama {
  id: string;
  title: string;
  cover: string;
  coverVertical: string;
  coverHorizontal: string;
  synopsis: string;
  rating: string;
  episodes: number;
  genre: string;
  status: string;
  views: string;
  year: string;
  locked: boolean;
  tags: string[];
}
```

### UnifiedEpisode (Shape UI)

```typescript
export interface UnifiedEpisode {
  number: number;
  chapterId: string;
  title: string;
  locked: boolean;
  duration: string;         // format "m:ss"
  hlsUrl: string;           // kosong jika MP4-only
  mp4Url: string;           // kosong jika HLS-only
  videoUrl: string;         // URL utama (HLS atau MP4)
  subtitlesUrl: string;
  qualities: Array<{ quality: string; url: string }>;
}
```

---

## Referensi: Streaming Strategy per Tipe

### Tipe A: HLS Streaming (seperti DramaBox)

```
Browser → hls.js → /api/dramabox/hls?id=X&ep=Y
                         ↓
                    Proxy (server) → External API → m3u8
                         ↓
                    rewriteM3u8Urls()
                    (API paths → local proxy, CDN → /api/cdn/)
                         ↓
                    Browser → hls.js parse m3u8
                         ↓
                    Fetch segments (via /api/cdn/ proxy atau langsung jika CORS-capable)
```

### Tipe B: Direct MP4 (seperti PineDrama)

```
Browser → <video> → /api/cdn?url=<encoded-tiktok-cdn-url>
                         ↓
                    CDN Proxy (server) → TikTok CDN → MP4
                         ↓
                    Stream ke browser dengan CORS headers
```

### Tipe C: Direct MP4 dengan CORS

Jika platform CDN **sudah punya CORS headers** (`Access-Control-Allow-Origin: *`), tidak perlu proxy — URL bisa langsung dipakai di `<video>` src.

---

## Referensi: Perbedaan DramaBox vs PineDrama

| Aspek | DramaBox | PineDrama |
|-------|----------|-----------|
| Streaming | HLS (m3u8) + MP4 fallback | Direct MP4 only |
| CDN | 3 hosts (2 butuh proxy, 1 CORS-capable) | TikTok CDN (2 hosts, semua butuh proxy) |
| Auth | X-API-Key | X-API-Key + User-Agent (Cloudflare) |
| Pagination | `page` param | `page` + `count` + `cursor` params |
| Search param | `query` | `q` |
| Episode count | `chapterCount` / `episodes` | `totalEps` / `episodes` |
| Episode duration | `duration` (ms) | `duration_ms` (ms) |
| Categories | `categories` array with groups | `categories` flat array |
| Creator info | Tidak ada | `channel`, `channelId`, `channelAvatar` |
| m3u8 rewrite | Ya (server-side) | Tidak (no HLS) |
| Popular Search | Ya (`/populersearch`) | Tidak |
| Hot Rank | Ya (`/hotrank`) | Tidak (fallback trending) |
| Recommended | Ya (`/recommended`) | Tidak (fallback forYou) |

---

## Troubleshooting

### "Platform not found" error di adapter
- Pastikan platform sudah ditambahkan ke `platformApis` map di `adapter.ts`
- Pastikan `Platform` type di `store.ts` sudah di-update

### CORS error saat fetch video
- CDN host belum ditambahkan ke `ALLOWED_CDN_HOSTS` di `cdn-proxy.ts`
- Atau URL video tidak melalui CDN proxy (cek `resolveEpisodeVideoUrl` di adapter)

### 403 dari external API
- API key salah atau belum diset di `.env.local`
- User-Agent header dibutuhkan tapi tidak dikirim (cek proxy route)

### m3u8 tidak bisa diputar
- `rewriteM3u8Urls` tidak dipanggil di proxy route
- CDN hosts di m3u8 tidak match dengan yang di `ALLOWED_CDN_HOSTS`

### Build error: Type '"<nama>"' is not assignable to type 'Platform'
- `Platform` type union belum di-update di `store.ts`

---

## Ringkasan: Satu Prompt untuk Platform Baru

Setelah memahami guide ini, Anda bisa menambahkan platform baru dengan **satu prompt** ke AI assistant:

> **"Tambahkan platform [nama] dengan API base [url], API prefix [/api/nama], CDN hosts [host1, host2], streaming type [HLS/MP4], dan auth [X-API-Key / custom]. Endpoint yang tersedia: [list endpoint]. Logo: [logo-url]."**

AI assistant akan mengikuti langkah-langkah di atas secara otomatis dan menghasilkan semua file yang diperlukan.
