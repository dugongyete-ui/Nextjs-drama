"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePlatformApi } from "@/lib/platforms/adapter";
import { useAppStore } from "@/lib/store";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DramaCard from "@/components/drama/DramaCard";
import { DramaCardGridSkeleton } from "@/components/drama/SkeletonLoaders";
import { Search, X, Clock, TrendingUp, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, platform, searchHistory, addSearchHistory, clearSearchHistory } = useAppStore();
  const platformApi = usePlatformApi();
  const initialQuery = useMemo(() => searchParams.get("q") || "", [searchParams]);
  const [query, setQuery] = useState(() => initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(() => initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchData, isLoading } = useQuery({
    queryKey: ["search", platform, debouncedQuery, lang],
    queryFn: () => platformApi.search(debouncedQuery, lang),
    enabled: !!debouncedQuery.trim(),
  });

  const results = platformApi.extractList((searchData || {}) as Record<string, unknown>).map(platformApi.normalizeDrama);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      addSearchHistory(query.trim());
    }
  }, [query, addSearchHistory]);

  return (
    <div className="min-h-screen flex flex-col bg-deep">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          <div className="max-w-2xl mx-auto mb-8">
            <h1 className="text-3xl font-bold text-foreground text-center mb-6 flex items-center justify-center gap-3">
              <Search className="w-8 h-8 text-cinema" />Search Dramas
            </h1>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Search for your favorite drama..." className="pl-10 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground focus:border-cinema focus:ring-cinema/30 h-12" />
                {query && <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
              </div>
              <Button onClick={handleSearch} className="bg-cinema hover:bg-cinema/90 text-white h-12 px-6">Search</Button>
            </div>
          </div>

          {!debouncedQuery.trim() && searchHistory.length > 0 && (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2"><Clock className="w-4 h-4" />Recent Searches</h3>
                <Button variant="ghost" size="sm" onClick={clearSearchHistory} className="text-xs text-muted-foreground hover:text-cinema h-7">Clear All</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((h) => (
                  <button key={h} onClick={() => { setQuery(h); setDebouncedQuery(h); addSearchHistory(h); }} className="px-4 py-2 rounded-full text-sm text-muted-foreground bg-white/5 hover:bg-white/10 hover:text-foreground transition-all border border-white/5">{h}</button>
                ))}
              </div>
            </div>
          )}

          {debouncedQuery.trim() && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Results for &ldquo;{debouncedQuery}&rdquo;</h2>
                {!isLoading && <span className="text-sm text-muted-foreground">{results.length} drama{results.length !== 1 ? "s" : ""} found</span>}
              </div>
              {isLoading ? (
                <DramaCardGridSkeleton count={12} />
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {results.map((item, idx) => (
                    <DramaCard key={item.id || idx} id={item.id} title={item.title} cover={item.cover} coverVertical={item.coverVertical} rating={item.rating} episodes={item.episodes} status={item.status} genre={item.genre} views={item.views} tags={item.tags} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Search className="w-16 h-16 text-muted-foreground/20 mb-4" />
                  <h3 className="text-lg text-muted-foreground">No results found</h3>
                  <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Try a different search term or browse our catalog</p>
                  <Button variant="outline" className="mt-4 border-white/10 text-foreground hover:bg-white/5" onClick={() => router.push("/browse")}>
                    <TrendingUp className="w-4 h-4 mr-2" />Browse All Dramas
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-deep items-center justify-center">
          <Loader2 className="w-8 h-8 text-cinema animate-spin" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
