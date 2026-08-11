"use client";

import { useQuery } from "@tanstack/react-query";
import { usePlatformApi, type UnifiedDrama, type UnifiedEpisode } from "@/lib/platforms/adapter";
import { useAppStore } from "@/lib/store";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipForward, SkipBack, ChevronLeft, Lock, ListVideo,
  Subtitles, X, Loader2,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useHlsPlayer } from "@/hooks/use-hls-player";

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const { lang, platform } = useAppStore();
  const platformApi = usePlatformApi();
  const id = params.id as string;
  const ep = Number(params.ep as string);

  const [showEpisodes, setShowEpisodes] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data: detailData } = useQuery({
    queryKey: ["detail", platform, id, lang],
    queryFn: () => platformApi.getDetail(id, lang),
    enabled: !!id,
  });

  const { data: episodesData } = useQuery({
    queryKey: ["allepisode", platform, id, lang],
    queryFn: () => platformApi.getAllEpisodes(id, lang),
    enabled: !!id,
  });

  const rawEpisodes = platformApi.extractList((episodesData || {}) as Record<string, unknown>);
  const episodeList = rawEpisodes.map(platformApi.normalizeEpisode);
  const detail = detailData ? platformApi.normalizeDrama(detailData) : null;
  const title = detail?.title || "";
  const totalEpisodes = episodeList.length || detail?.episodes || 0;

  // Find the current episode from the normalized list
  const currentEpisode = useMemo(
    () => episodeList.find((e) => e.number === ep),
    [episodeList, ep]
  );

  // Try to resolve video URL from normalized episode data first (works for both platforms)
  // PineDrama: /allepisode now returns videoUrl + qualityList per episode
  // DramaBox: V2 API returns mp4Url/videoUrl per episode
  const isPineDrama = platform === "pinedrama";
  const resolvedUrl = useMemo(() => {
    if (!currentEpisode || !platformApi.resolveEpisodeVideoUrl) return null;
    return platformApi.resolveEpisodeVideoUrl(currentEpisode, id, ep);
  }, [currentEpisode, id, ep, platformApi]);

  // Fallback for PineDrama: if resolveEpisodeVideoUrl returns null,
  // fetch video URL via /episode endpoint (extra API call)
  const needsFallbackFetch = isPineDrama && !resolvedUrl;
  const { data: fallbackVideoUrl, isLoading: fallbackVideoLoading } = useQuery({
    queryKey: ["episodeVideoUrl", platform, id, ep, lang],
    queryFn: () => platformApi.getEpisodeVideoUrl!(id, ep, lang),
    enabled: needsFallbackFetch && !!id && !!platformApi.getEpisodeVideoUrl,
  });

  // Compute the final video URL
  const videoUrl = useMemo(() => {
    // Use resolved URL from episode data (preferred — no extra API call)
    if (resolvedUrl) return resolvedUrl;
    // Fallback: URL fetched from /episode endpoint
    if (isPineDrama) return fallbackVideoUrl || null;
    return null;
  }, [resolvedUrl, isPineDrama, fallbackVideoUrl]);

  const hlsLoading = !episodesData || (needsFallbackFetch && fallbackVideoLoading);

  // Auto-play next episode when current episode ends
  const nextEpisode = episodeList.find((e) => e.number === ep + 1);
  const hasNextEpisode = ep < totalEpisodes && nextEpisode && !nextEpisode.locked;

  const handleEpisodeEnd = useCallback(() => {
    if (hasNextEpisode) {
      router.push(`/watch/${id}/${ep + 1}`);
    }
  }, [hasNextEpisode, router, id, ep]);

  const { isPlaying, isMuted, currentTime, duration, hlsError } = useHlsPlayer(videoRef, videoUrl, handleEpisodeEnd);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      const video = videoRef.current;
      if (video && !video.paused) setShowControls(false);
    }, 3000);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    video.currentTime = pct * duration;
  }, [duration]);

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-deep flex flex-col">
      <div className="glass sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/drama/${id}`} className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-foreground truncate max-w-[300px]">{title}</h1>
              <p className="text-xs text-muted-foreground">Episode {ep} of {totalEpisodes}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ep > 1 && (
              <Button variant="ghost" size="sm" onClick={() => router.push(`/watch/${id}/${ep - 1}`)} className="text-muted-foreground hover:text-foreground hover:bg-white/5">
                <SkipBack className="w-4 h-4 mr-1" />Prev
              </Button>
            )}
            {ep < totalEpisodes && (
              <Button variant="ghost" size="sm" onClick={() => router.push(`/watch/${id}/${ep + 1}`)} className="text-cinema hover:bg-cinema/10">
                Next<SkipForward className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full">
        <div className="flex-1 flex flex-col">
          <div ref={containerRef} className="relative bg-black aspect-video w-full cursor-pointer group" onClick={togglePlay} onMouseMove={handleMouseMove} onMouseLeave={() => { const video = videoRef.current; if (video && !video.paused) setShowControls(false); }}>
            <video ref={videoRef} className="w-full h-full object-contain" playsInline crossOrigin="anonymous" />

            {hlsLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-12 h-12 text-cinema animate-spin" />
              </div>
            )}
            {hlsError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center space-y-4">
                  <p className="text-cinema font-semibold">{hlsError}</p>
                  <Button variant="outline" className="border-white/20 text-foreground" onClick={() => window.location.reload()}>Retry</Button>
                </div>
              </div>
            )}
            {!isPlaying && !hlsLoading && !hlsError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-cinema/80 flex items-center justify-center glow-cinema">
                  <Play className="w-10 h-10 text-white fill-white ml-1" />
                </div>
              </div>
            )}
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`} onClick={(e) => e.stopPropagation()}>
              <div className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer group/progress" onClick={seek}>
                <div className="h-full bg-cinema rounded-full relative group-hover/progress:h-1.5 transition-all" style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cinema opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="text-white hover:text-cinema transition-colors">{isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}</button>
                  <button onClick={toggleMute} className="text-white hover:text-cinema transition-colors">{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
                  <span className="text-xs text-white/70">{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="text-white hover:text-cinema transition-colors"><Subtitles className="w-5 h-5" /></button>
                  <button onClick={toggleFullscreen} className="text-white hover:text-cinema transition-colors">{isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`lg:w-80 xl:w-96 border-l border-white/5 bg-deep ${showEpisodes ? "block" : "hidden lg:block"}`}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><ListVideo className="w-4 h-4 text-cinema" />Episodes ({totalEpisodes})</h2>
            <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground hover:text-foreground h-7 w-7" onClick={() => setShowEpisodes(false)}><X className="w-4 h-4" /></Button>
          </div>
          <div className="overflow-y-auto max-h-[calc(100vh-8rem)] p-2">
            {episodeList.map((item) => {
              const isActive = item.number === ep;
              return (
                <Link key={item.number} href={item.locked ? "#" : `/watch/${id}/${item.number}`} className={`flex items-center gap-3 p-3 rounded-xl mb-1 transition-all duration-200 group ${isActive ? "bg-cinema/15 border border-cinema/30" : item.locked ? "opacity-40 cursor-not-allowed" : "hover:bg-white/5 border border-transparent"}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-cinema" : "bg-white/5"}`}>
                    {isActive ? <Play className="w-4 h-4 text-white fill-white" /> : item.locked ? <Lock className="w-4 h-4 text-muted-foreground" /> : <span className="text-sm font-semibold text-muted-foreground">{item.number}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium truncate block ${isActive ? "text-cinema" : "text-foreground"}`}>{item.title || `Episode ${item.number}`}</span>
                    {item.duration && <span className="text-xs text-muted-foreground">{item.duration}</span>}
                  </div>
                  {isActive && <div className="w-2 h-2 rounded-full bg-cinema shrink-0 animate-pulse" />}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {!showEpisodes && (
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <Button onClick={() => setShowEpisodes(true)} className="bg-cinema hover:bg-cinema/90 text-white rounded-full w-12 h-12 glow-cinema"><ListVideo className="w-5 h-5" /></Button>
        </div>
      )}
    </div>
  );
}
