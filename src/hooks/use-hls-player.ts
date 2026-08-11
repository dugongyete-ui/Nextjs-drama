"use client";

/**
 * Video Player Hook
 * Manages video playback with support for:
 * 1. Direct MP4 URLs (preferred — from V2 API episode data)
 * 2. HLS m3u8 streams (via hls.js — for master playlists)
 * 3. Native HLS (Safari — falls through to browser)
 */

import { useState, useRef, useEffect } from "react";
import Hls from "hls.js";

export interface HlsPlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  hlsError: string | null;
}

/** Check if a URL looks like a direct video file (not an m3u8/HLS stream) */
function isDirectVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  // CDN proxy URLs serve MP4 content (PineDrama/TikTok CDN)
  if (lower.startsWith("/api/cdn") || lower.includes("/api/cdn?")) return true;
  // MP4, WebM, or any URL that doesn't end with m3u8 and doesn't contain /hls
  if (lower.endsWith(".mp4") || lower.endsWith(".webm")) return true;
  if (lower.includes(".m3u8") || lower.includes("/hls?")) return false;
  // If the URL contains mp4 in the path (like CDN URLs with .mp4 before query params)
  if (lower.includes(".mp4?") || lower.includes(".mp4/")) return true;
  // URLs containing mime_type=video_mp4 (TikTok CDN query param)
  if (lower.includes("mime_type=video_mp4")) return true;
  return false;
}

export function useHlsPlayer(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  videoUrl: string | null | undefined,
  onEpisodeEnd?: () => void
): HlsPlayerState {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hlsError, setHlsError] = useState<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Video element event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onVolumeChange = () => setIsMuted(video.muted);
    const onEnded = () => {
      if (onEpisodeEnd) onEpisodeEnd();
    };
    const onError = () => {
      const err = video.error;
      if (err) {
        setHlsError(`Video error: ${err.message || `code ${err.code}`}`);
      }
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
    };
  }, [videoRef, onEpisodeEnd]);

  // Video source setup and teardown
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const handleError = (msg: string) => setHlsError(msg);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate: clearing error state when videoUrl changes
    setHlsError(null); // Clear previous errors

    // === Strategy 1: Direct video URL (MP4, WebM, etc.) ===
    // V2 API provides mp4Url/videoUrl per episode — play directly without hls.js
    if (isDirectVideoUrl(videoUrl)) {
      video.src = videoUrl;
      video.load();

      const onLoadedData = () => {
        video.play().catch(() => {
          // Autoplay blocked — user will click play
        });
      };

      video.addEventListener("loadeddata", onLoadedData, { once: true });
      return () => {
        video.removeEventListener("loadeddata", onLoadedData);
        video.src = "";
        video.load();
      };
    }

    // === Strategy 2: HLS via hls.js ===
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hlsRef.current = hls;

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          handleError(`Playback error: ${data.type}`);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            hls.startLoad();
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    // === Strategy 3: Native HLS (Safari) ===
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(() => {});
      });
      return;
    }

    handleError("HLS is not supported in this browser");
  }, [videoRef, videoUrl]);

  return { isPlaying, isMuted, currentTime, duration, hlsError };
}
