# Project Structure Guide

This document describes the modular project structure designed for easy maintenance and extensibility.

## Directory Layout

```
src/
├── app/                          # Next.js App Router pages
│   ├── api/
│   │   ├── cdn/[...path]/        # CDN CORS proxy route
│   │   └── dramabox/[...path]/   # DramaBox API proxy route
│   ├── browse/                   # Browse/Explore page
│   ├── drama/[id]/               # Drama detail page
│   ├── search/                   # Search page
│   └── watch/[id]/[ep]/          # Video player page
│
├── components/
│   ├── ui/                       # shadcn/ui primitives (auto-generated)
│   ├── layout/                   # Layout components
│   │   ├── Navbar.tsx            #   Top navigation bar
│   │   ├── Footer.tsx            #   Site footer
│   │   └── Providers.tsx         #   React Query + other providers
│   ├── drama/                    # Drama-related components
│   │   ├── DramaCard.tsx         #   Drama poster card
│   │   └── SkeletonLoaders.tsx   #   Loading skeletons
│   └── player/                   # Player components (future expansion)
│
├── hooks/                        # Custom React hooks
│   ├── use-hls-player.ts         # HLS video player hook
│   ├── use-mobile.ts             # Mobile breakpoint hook
│   ├── use-toast.ts              # Toast hook
│   └── useSearchParamsCompat.ts  # Search params compat hook
│
├── lib/
│   ├── utils.ts                  # Generic utilities (cn, etc.)
│   ├── store.ts                  # Global Zustand state (lang, searchHistory)
│   ├── db.ts                     # Prisma database client
│   ├── api.ts                    # @deprecated — re-exports from dramabox
│   │
│   ├── platforms/                # 🎯 Platform-specific modules
│   │   └── dramabox/             #   DramaBox platform
│   │       ├── index.ts          #     Barrel export (import everything here)
│   │       ├── constants.ts      #     API_BASE, API_KEY, CDN_HOSTS, etc.
│   │       ├── types.ts          #     All TypeScript interfaces
│   │       ├── client.ts         #     Low-level fetchAPI function
│   │       ├── helpers.ts        #     normalizeDrama, normalizeEpisode, extractList
│   │       └── endpoints/        #     API endpoint groups
│   │           ├── content.ts    #       trending, hotrank, recommended, foryou, browse, search
│   │           ├── catalog.ts    #       categories, detail, allepisode
│   │           └── media.ts      #       hls, subtitles
│   │
│   └── proxy/                    # Proxy utility modules
│       ├── index.ts              #   Barrel export
│       ├── cdn-proxy.ts          #   CDN proxy constants & helpers
│       └── m3u8-rewriter.ts      #   M3U8 URL rewriting logic
```

## How to Add a New Platform

To add a new streaming platform (e.g., iQiyi, Youku, Viki):

1. **Create platform folder**: `src/lib/platforms/<platform-name>/`
2. **Add required files**:
   - `constants.ts` — API base URL, API key, CDN hosts, proxy prefix
   - `types.ts` — TypeScript interfaces for the platform's API responses
   - `client.ts` — Low-level fetch function for the platform
   - `helpers.ts` — Data normalization functions
   - `endpoints/` — Grouped API endpoints (content.ts, catalog.ts, media.ts)
   - `index.ts` — Barrel export + unified `api` object
3. **Add proxy route** (if needed): `src/app/api/<platform-name>/[...path]/route.ts`
4. **Add CDN proxy hosts** to `src/lib/proxy/cdn-proxy.ts` if the platform uses CDN
5. **Create platform components** in `src/components/<platform-name>/` if needed

## Import Conventions

```typescript
// ✅ Correct — import from platform barrel
import { api, normalizeDrama, type DramaItem } from "@/lib/platforms/dramabox";

// ✅ Correct — import from organized component folders
import Navbar from "@/components/layout/Navbar";
import DramaCard from "@/components/drama/DramaCard";

// ✅ Correct — import hooks
import { useHlsPlayer } from "@/hooks/use-hls-player";

// ❌ Deprecated — old flat imports (will be removed)
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
```
