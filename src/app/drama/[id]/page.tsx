"use client";

import { useQuery } from "@tanstack/react-query";
import { usePlatformApi, type UnifiedDrama, type UnifiedEpisode } from "@/lib/platforms/adapter";
import { useAppStore } from "@/lib/store";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DramaCard from "@/components/drama/DramaCard";
import { DetailPageSkeleton, DramaCardGridSkeleton } from "@/components/drama/SkeletonLoaders";
import { Play, Star, BookOpen, Clock, Share2, Heart, ListVideo, ChevronRight, Lock } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

export default function DramaDetailPage() {
  const params = useParams();
  const { lang, platform } = useAppStore();
  const platformApi = usePlatformApi();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("episodes");

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["detail", platform, id, lang],
    queryFn: () => platformApi.getDetail(id, lang),
    enabled: !!id,
  });

  const { data: episodesData, isLoading: episodesLoading } = useQuery({
    queryKey: ["allepisode", platform, id, lang],
    queryFn: () => platformApi.getAllEpisodes(id, lang),
    enabled: !!id,
  });

  const { data: recommendedData } = useQuery({
    queryKey: ["recommended", platform, 1, lang],
    queryFn: () => platformApi.getRecommended(1, lang),
  });

  const rawEpisodes = platformApi.extractList((episodesData || {}) as Record<string, unknown>);
  const episodeList = rawEpisodes.map(platformApi.normalizeEpisode);
  const recommendedList = platformApi.extractList((recommendedData || {}) as Record<string, unknown>).map(platformApi.normalizeDrama);

  const detail = detailData ? platformApi.normalizeDrama(detailData) : null;
  const title = detail?.title || "";
  const synopsis = detail?.synopsis || "";
  const cover = detail?.cover || "";
  const coverHorizontal = detail?.coverHorizontal || "";
  const coverVertical = detail?.coverVertical || "";
  const rating = detail?.rating || "";
  const episodes = detail?.episodes || 0;
  const genre = detail?.genre || "";
  const tags = detail?.tags || [];

  const backdropImage = coverHorizontal || cover || coverVertical;

  if (detailLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-deep">
        <Navbar />
        <main className="flex-1 pt-16"><DetailPageSkeleton /></main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-deep">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="relative h-[50vh] min-h-[300px] overflow-hidden">
          {backdropImage ? (
            <>
              <img src={backdropImage} alt={title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-deep via-deep/60 to-transparent" />
              <div className="absolute inset-0 backdrop-blur-sm bg-black/30" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-surface to-deep" />
          )}
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 relative z-10">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="shrink-0">
              <div className="w-48 md:w-56 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10">
                {coverVertical || cover ? (
                  <img src={coverVertical || cover} alt={title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-surface flex items-center justify-center"><Play className="w-12 h-12 text-muted-foreground/20" /></div>
                )}
              </div>
            </div>

            <div className="flex-1 pt-0 md:pt-12">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground leading-tight mb-4">{title || "Untitled Drama"}</h1>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {rating && <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gold/15 text-gold text-sm font-semibold"><Star className="w-4 h-4 fill-gold" />{rating}</span>}
                {episodes > 0 && <span className="flex items-center gap-1 text-sm text-muted-foreground"><ListVideo className="w-4 h-4" />{episodes} Episodes</span>}
                {genre && <span className="text-sm text-muted-foreground">{genre}</span>}
                {tags.length > 0 && <span className="text-xs text-muted-foreground/60">{tags.slice(0, 3).join(" · ")}</span>}
              </div>
              {synopsis && <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl line-clamp-4">{synopsis}</p>}
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/watch/${id}/1`}>
                  <Button className="bg-cinema hover:bg-cinema/90 text-white glow-cinema px-8 h-12"><Play className="w-5 h-5 mr-2 fill-white" />Play Episode 1</Button>
                </Link>
                <Button variant="outline" className="border-white/20 text-foreground hover:bg-white/10 h-12 px-6" onClick={() => toast.success("Added to Watchlist!")}>
                  <Heart className="w-5 h-5 mr-2" />Watchlist
                </Button>
                <Button variant="outline" className="border-white/20 text-foreground hover:bg-white/10 h-12 px-6" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied!"); }}>
                  <Share2 className="w-5 h-5 mr-2" />Share
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-white/5 border border-white/10 mb-6">
                <TabsTrigger value="episodes" className="data-[state=active]:bg-cinema data-[state=active]:text-white text-muted-foreground"><ListVideo className="w-4 h-4 mr-2" />Episodes</TabsTrigger>
                <TabsTrigger value="related" className="data-[state=active]:bg-cinema data-[state=active]:text-white text-muted-foreground"><BookOpen className="w-4 h-4 mr-2" />You May Also Like</TabsTrigger>
              </TabsList>

              <TabsContent value="episodes">
                {episodesLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (<div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />))}
                  </div>
                ) : episodeList.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {episodeList.map((ep) => (
                      <Link key={ep.number} href={ep.locked ? "#" : `/watch/${id}/${ep.number}`} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 group ${ep.locked ? "bg-white/3 border-white/5 opacity-50 cursor-not-allowed" : "bg-surface/50 border-white/5 hover:border-cinema/30 hover:bg-surface"}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${ep.locked ? "bg-white/5" : "bg-cinema/10"}`}>
                          {ep.locked ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Play className="w-4 h-4 text-cinema fill-cinema" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground group-hover:text-cinema transition-colors">{ep.title || `Episode ${ep.number}`}</span>
                          {ep.duration && <span className="block text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{ep.duration}</span>}
                        </div>
                        {!ep.locked && <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cinema transition-colors shrink-0" />}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground"><ListVideo className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No episodes available</p></div>
                )}
              </TabsContent>

              <TabsContent value="related">
                {recommendedList.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {recommendedList.slice(0, 10).map((item, idx) => (
                      <DramaCard key={item.id || idx} id={item.id} title={item.title} cover={item.cover} coverVertical={item.coverVertical} rating={item.rating} episodes={item.episodes} status={item.status} genre={item.genre} views={item.views} tags={item.tags} />
                    ))}
                  </div>
                ) : (
                  <DramaCardGridSkeleton count={5} />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
