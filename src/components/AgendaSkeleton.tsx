import { Skeleton } from "@/components/ui/skeleton";

export const AgendaSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Date controls skeleton */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-9" />
        </div>
        <Skeleton className="h-9 w-48" />
      </div>

      {/* Agenda grid skeleton */}
      <div className="bg-card rounded-lg shadow-elegant border border-border">
        {/* Header skeleton */}
        <div className="grid" style={{ gridTemplateColumns: `160px repeat(3, minmax(200px,1fr))` }}>
          <div className="p-4 border-r border-border">
            <Skeleton className="h-3 w-8 mb-1" />
            <Skeleton className="h-5 w-20" />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 text-center border-r border-border last:border-r-0">
              <Skeleton className="w-12 h-12 rounded-full mx-auto mb-2" />
              <Skeleton className="h-4 w-20 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>

        {/* Grid body skeleton */}
        <div className="grid" style={{ gridTemplateColumns: `160px repeat(3, minmax(200px,1fr))` }}>
          {/* Time column skeleton */}
          <div className="border-r border-border">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-start justify-center pt-1 border-t border-border" style={{ height: 72 }}>
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>

          {/* Professional columns skeleton */}
          {[1, 2, 3].map((col) => (
            <div key={col} className="relative border-l border-border" style={{ height: 720 }}>
              {Array.from({ length: 10 }).map((_, row) => (
                <div key={row} className="absolute left-0 right-0 border-t border-border" style={{ top: row * 72 }} />
              ))}
              
              {/* Random appointment skeletons */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-1 right-1 rounded-md bg-muted/50"
                  style={{
                    top: (i * 2 + 1) * 72,
                    height: 72
                  }}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend skeleton */}
      <div className="flex flex-wrap items-center gap-4 pt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};
