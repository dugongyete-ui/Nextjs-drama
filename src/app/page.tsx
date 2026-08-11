"use client";

import { useQuery } from "@tanstack/react-query";
import { usePlatformApi, type UnifiedDrama } from "@/lib/platforms/adapter";
import { useAppStore } from "@/lib/store";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DramaCard from "@/components/drama/DramaCard";
import {
  DramaCardGridSkeleton,
  HeroBannerSkeleton,
  HotRankSkeleton,
} from "@/components/drama/SkeletonLoaders";
import { Play, ChevronLeft, ChevronRight, Star, TrendingUp, Sparkles, Award } from "lucide-react";
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
  const { lang, platform } = useAppStore();
  const platformApi = usePlatformApi();
  const [hotRankType, setHotRankType] = useState("1");
  const [recPage, setRecPage] = useState(1);
  const [fyPage, setFyPage] = useState(1);
  const trendingScrollRef = useRef<HTMLDivElement>(null);

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ["trending", platform, 1, lang],
    queryFn: () => platformApi.getTrending(1, lang),
  });

  const { data: hotRankData, isLoading: hotRankLoading } = useQuery({
    queryKey: ["hotrank", platform, hotRankType, lang],
    queryFn: () => platformApi.getHotRank(Number(hotRankType), lang),
  });

  const { data: recommendedData, isLoading: recLoading } = useQuery({
    queryKey: ["recommended", platform, recPage, lang],
    queryFn: () => platformApi.getRecommended(recPage, lang),
  });

  const { data: forYouData, isLoading: fyLoading } = useQuery({
    queryKey: ["foryou", platform, fyPage, lang],
    queryFn: () => platformApi.getForYou(fyPage, lang),
  });

  const trendingList = platformApi.extractList((trendingData || {}) as Record<string, unknown>).map(platformApi.normalizeDrama);
  const hotRankList = platformApi.extractList((hotRankData || {}) as Record<string, unknown>).map(platformApi.normalizeDrama);
  const recommendedList = platformApi.extractList((recommendedData || {}) as Record<string, unknown>).map(platformApi.normalizeDrama);
  const forYouList = platformApi.extractList((forYouData || {}) as Record<string, unknown>).map(platformApi.normalizeDrama);

  // Accumulate "For You" items across pages
  // This useEffect stores each page's results in a map so we can accumulate
  // items across "Load More" clicks without losing previous pages' data.
  const [fyPages, setFyPages] = useState<Map<number, UnifiedDrama[]>>(new Map());
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate: accumulating paginated data across renders
    setFyPages((prev) => {
      const next = new Map(prev);
      // When resetting to page 1, clear all previous pages
      if (fyPage === 1) {
        next.clear();
      }
      next.set(fyPage, forYouList);
      return next;
    });
  }, [forYouData, fyPage]);

  // Reset accumulated pages when platform or lang changes
  useEffect(() => {
    setFyPages(new Map());
    setFyPage(1);
    setRecPage(1);
  }, [platform, lang]);

  const fyAccumulated = useMemo(() => {
    const result: UnifiedDrama[] = [];
    const seen = new Set<string>();
    // Iterate pages in order (1, 2, 3, ...)
    const sortedKeys = Array.from(fyPages.keys()).sort((a, b) => a - b);
    for (const page of sortedKeys) {
      const items = fyPages.get(page) || [];
      for (const item of items) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          result.push(item);
        }
      }
    }
    return result;
  }, [fyPages]);

  const scrollTrending = useCallback((dir: "left" | "right") => {
    if (trendingScrollRef.current) {
      const amount = dir === "left" ? -400 : 400;
      trendingScrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-deep">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero Trending Banner */}
        <section className="relative">
          {trendingLoading ? (
            <HeroBannerSkeleton />
          ) : trendingList.length > 0 ? (
            <HeroBanner items={trendingList} />
          ) : null}

          {/* Trending Carousel */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-cinema" />
                Trending Now
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => scrollTrending("left")} className="text-muted-foreground hover:text-foreground hover:bg-white/5 h-8 w-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => scrollTrending("right")} className="text-muted-foreground hover:text-foreground hover:bg-white/5 h-8 w-8">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {trendingLoading ? (
              <DramaCardGridSkeleton count={6} />
            ) : (
              <div ref={trendingScrollRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                {trendingList.map((item, idx) => (
                  <div key={item.id || idx} className="shrink-0 w-[160px] sm:w-[180px]">
                    <DramaCard
                      id={item.id}
                      title={item.title}
                      cover={item.cover}
                      coverVertical={item.coverVertical}
                      rating={item.rating}
                      episodes={item.episodes}
                      status={item.status}
                      genre={item.genre}
                      views={item.views}
                      tags={item.tags}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Hot Rank Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-gold" />
            Hot Rankings
          </h2>
          <Tabs value={hotRankType} onValueChange={setHotRankType}>
            <TabsList className="bg-white/5 border border-white/10 mb-6">
              <TabsTrigger value="1" className="data-[state=active]:bg-cinema data-[state=active]:text-white text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-2" />Trending
              </TabsTrigger>
              <TabsTrigger value="2" className="data-[state=active]:bg-cinema data-[state=active]:text-white text-muted-foreground">
                <Sparkles className="w-4 h-4 mr-2" />Top Searched
              </TabsTrigger>
              <TabsTrigger value="3" className="data-[state=active]:bg-cinema data-[state=active]:text-white text-muted-foreground">
                <Star className="w-4 h-4 mr-2" />New Releases
              </TabsTrigger>
            </TabsList>
            {["1", "2", "3"].map((type) => (
              <TabsContent key={type} value={type}>
                {hotRankLoading ? (
                  <HotRankSkeleton />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {hotRankList.map((item, idx) => (
                      <HotRankItem key={item.id || idx} item={item} rank={idx + 1} />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </section>

        {/* Recommended Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cinema" />Recommended For You
            </h2>
          </div>
          {recLoading ? (
            <DramaCardGridSkeleton count={12} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {recommendedList.map((item, idx) => (
                <DramaCard key={item.id || idx} id={item.id} title={item.title} cover={item.cover} coverVertical={item.coverVertical} rating={item.rating} episodes={item.episodes} status={item.status} genre={item.genre} views={item.views} tags={item.tags} />
              ))}
            </div>
          )}
        </section>

        {/* For You Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Star className="w-5 h-5 text-gold" />For You
            </h2>
            {fyPage > 1 && (
              <Button variant="ghost" size="sm" onClick={() => setFyPage(1)} className="text-muted-foreground hover:text-cinema">Reset</Button>
            )}
          </div>
          {fyLoading ? (
            <DramaCardGridSkeleton count={12} />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {fyAccumulated.map((item, idx) => (
                  <DramaCard key={item.id || idx} id={item.id} title={item.title} cover={item.cover} coverVertical={item.coverVertical} rating={item.rating} episodes={item.episodes} status={item.status} genre={item.genre} views={item.views} tags={item.tags} />
                ))}
              </div>
              {fyAccumulated.length > 0 && (
                <div className="flex justify-center mt-8">
                  <Button onClick={() => setFyPage((p) => p + 1)} className="bg-white/5 hover:bg-white/10 text-foreground border border-white/10">Load More</Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function HeroBanner({ items }: { items: UnifiedDrama[] }) {
  const [current, setCurrent] = useState(0);
  const hero = items[current] || items[0];
  if (!hero) return null;
  const bannerImage = hero.coverHorizontal || hero.cover || hero.coverVertical;

  return (
    <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
      {bannerImage && <img src={bannerImage} alt={hero.title} className="absolute inset-0 w-full h-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-deep via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 pb-10 sm:pb-16 pt-8 sm:pt-12 max-w-7xl mx-auto">
        <div className="max-w-xl space-y-5">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">{hero.title}</h1>
          {hero.synopsis && <p className="text-sm sm:text-base text-white/70 line-clamp-3 leading-relaxed">{hero.synopsis}</p>}
          <div className="flex items-center gap-4 text-sm text-white/60">
            {hero.rating && <span className="flex items-center gap-1"><Star className="w-4 h-4 text-gold fill-gold" />{hero.rating}</span>}
            {hero.episodes > 0 && <span>{hero.episodes} Episodes</span>}
            {hero.genre && <span>{hero.genre}</span>}
          </div>
          <div className="flex items-center gap-3 pt-3">
            <Link href={`/watch/${hero.id}/1`}>
              <Button className="bg-cinema hover:bg-cinema/90 text-white glow-cinema px-8">
                <Play className="w-5 h-5 mr-2 fill-white" />Watch Now
              </Button>
            </Link>
            <Link href={`/drama/${hero.id}`}>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-6">More Info</Button>
            </Link>
          </div>
        </div>
        {items.length > 1 && (
          <div className="flex items-center gap-2 mt-6">
            {items.slice(0, 5).map((_, idx) => (
              <button key={idx} onClick={() => setCurrent(idx)} className={`h-1 rounded-full transition-all duration-300 ${idx === current ? "w-8 bg-cinema" : "w-2 bg-white/30 hover:bg-white/50"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HotRankItem({ item, rank }: { item: UnifiedDrama; rank: number }) {
  const posterUrl = item.coverVertical || item.cover || item.coverHorizontal;
  return (
    <Link href={`/drama/${item.id}`} className="flex items-center gap-4 p-3 rounded-xl bg-surface/50 hover:bg-surface border border-white/5 hover:border-cinema/20 transition-all duration-200 group">
      <span className="rank-number w-8 text-center shrink-0">{String(rank).padStart(2, "0")}</span>
      {posterUrl ? (
        <img src={posterUrl} alt={item.title} className="w-12 h-16 rounded-lg object-cover shrink-0" loading="lazy" />
      ) : (
        <div className="w-12 h-16 rounded-lg bg-white/5 shrink-0 flex items-center justify-center"><Play className="w-4 h-4 text-muted-foreground/30" /></div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-cinema transition-colors">{item.title}</h3>
        <div className="flex items-center gap-2 mt-1">
          {item.genre && <span className="text-xs text-muted-foreground">{item.genre}</span>}
          {item.rating && <span className="flex items-center gap-1 text-xs text-gold"><Star className="w-3 h-3 fill-gold" />{item.rating}</span>}
        </div>
      </div>
      {item.episodes > 0 && <span className="text-xs text-muted-foreground shrink-0">{item.episodes} Ep</span>}
    </Link>
  );
}
