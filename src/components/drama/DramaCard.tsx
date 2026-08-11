"use client";

import Link from "next/link";
import { Play, Lock, Star, Eye } from "lucide-react";
import { useState } from "react";

interface DramaCardProps {
  id: string;
  title: string;
  cover?: string;
  coverVertical?: string;
  coverHorizontal?: string;
  rating?: string;
  episodes?: number;
  status?: string;
  genre?: string;
  views?: string;
  rank?: number;
  locked?: boolean;
  tags?: string[];
}

export default function DramaCard({
  id,
  title,
  cover,
  coverVertical,
  coverHorizontal,
  rating,
  episodes,
  status,
  genre,
  views,
  rank,
  locked,
  tags,
}: DramaCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const posterUrl = coverVertical || cover || coverHorizontal;

  return (
    <Link
      href={`/drama/${id}`}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-surface border border-white/5 hover:border-cinema/30 transition-all duration-300 hover:shadow-lg hover:shadow-cinema/5"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        {!imgLoaded && (
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
        )}
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-surface to-white/5 flex items-center justify-center">
            <Play className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-cinema/90 flex items-center justify-center glow-cinema transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Rating badge */}
        {rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
            <Star className="w-3 h-3 text-gold fill-gold" />
            <span className="text-xs font-semibold text-gold">{rating}</span>
          </div>
        )}

        {/* Lock badge */}
        {locked && (
          <div className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 backdrop-blur-sm">
            <Lock className="w-3 h-3 text-muted-foreground" />
          </div>
        )}

        {/* Rank badge */}
        {rank !== undefined && (
          <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-cinema/90 flex items-center justify-center">
            <span className="text-sm font-bold text-white">{rank}</span>
          </div>
        )}

        {/* Episode count */}
        {episodes && episodes > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
            <span className="text-xs text-white/80">{episodes} Ep</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1">
        <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-cinema transition-colors duration-200">
          {title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {genre && (
            <span className="text-xs text-muted-foreground truncate">{genre}</span>
          )}
          {views && (
            <span className="text-xs text-muted-foreground/60 flex items-center gap-0.5">
              <Eye className="w-3 h-3" />{views}
            </span>
          )}
          {tags && tags.length > 1 && (
            <span className="text-xs text-muted-foreground/60 truncate">{tags.slice(1, 3).join(" · ")}</span>
          )}
          {status && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              status.toLowerCase() === "ongoing"
                ? "bg-cinema/20 text-cinema"
                : "bg-gold/20 text-gold"
            }`}>
              {status}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
