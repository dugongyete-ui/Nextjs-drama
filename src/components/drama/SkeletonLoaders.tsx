import { Skeleton } from "@/components/ui/skeleton";

export function DramaCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden bg-surface border border-white/5">
      <Skeleton className="aspect-[2/3] w-full bg-white/5" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 bg-white/5" />
        <Skeleton className="h-3 w-1/2 bg-white/5" />
      </div>
    </div>
  );
}

export function DramaCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <DramaCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroBannerSkeleton() {
  return (
    <div className="relative h-[60vh] min-h-[400px] bg-surface">
      <Skeleton className="absolute inset-0 bg-white/5" />
      <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
        <Skeleton className="h-8 w-1/3 bg-white/10" />
        <Skeleton className="h-4 w-2/3 bg-white/10" />
        <Skeleton className="h-4 w-1/2 bg-white/10" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 bg-white/10" />
          <Skeleton className="h-10 w-32 bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export function HotRankSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
          <Skeleton className="w-8 h-8 rounded-lg bg-white/10" />
          <Skeleton className="h-12 w-12 rounded-lg bg-white/10" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 bg-white/10" />
            <Skeleton className="h-3 w-1/2 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="min-h-screen">
      <Skeleton className="h-[50vh] w-full bg-white/5" />
      <div className="max-w-6xl mx-auto px-4 -mt-32 relative z-10 space-y-6">
        <Skeleton className="h-10 w-1/2 bg-white/10" />
        <Skeleton className="h-4 w-full bg-white/10" />
        <Skeleton className="h-4 w-3/4 bg-white/10" />
        <div className="flex gap-3">
          <Skeleton className="h-12 w-40 bg-white/10" />
          <Skeleton className="h-12 w-40 bg-white/10" />
        </div>
      </div>
    </div>
  );
}
