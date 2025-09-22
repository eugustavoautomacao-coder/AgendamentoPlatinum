import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ProfissionalLoadingScreen = () => {
  return (
    <div className="space-y-6 transition-colors duration-200">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 sm:h-8 sm:w-8 rounded transition-colors duration-200" />
          <div>
            <Skeleton className="h-6 w-48 mb-2 transition-colors duration-200" />
            <Skeleton className="h-4 w-64 transition-colors duration-200" />
          </div>
        </div>
        <Skeleton className="h-10 w-32 transition-colors duration-200" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-colors duration-200">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-gradient-card border border-border transition-colors duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 transition-colors duration-200">
              <Skeleton className="h-4 w-24 transition-colors duration-200" />
              <Skeleton className="h-4 w-4 rounded transition-colors duration-200" />
            </CardHeader>
            <CardContent className="transition-colors duration-200">
              <Skeleton className="h-8 w-16 mb-1 transition-colors duration-200" />
              <Skeleton className="h-3 w-32 transition-colors duration-200" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 transition-colors duration-200">
        {/* Left column - Today's appointments */}
        <Card className="bg-gradient-card border border-border transition-colors duration-200">
          <CardHeader className="transition-colors duration-200">
            <CardTitle className="flex items-center gap-2 transition-colors duration-200">
              <Skeleton className="h-5 w-5 rounded transition-colors duration-200" />
              <Skeleton className="h-6 w-40 transition-colors duration-200" />
            </CardTitle>
            <Skeleton className="h-4 w-48 transition-colors duration-200" />
          </CardHeader>
          <CardContent className="transition-colors duration-200">
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg transition-colors duration-200">
                  <Skeleton className="h-10 w-10 rounded-full transition-colors duration-200" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2 transition-colors duration-200" />
                    <Skeleton className="h-3 w-24 transition-colors duration-200" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full transition-colors duration-200" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right column - Quick actions */}
        <Card className="bg-gradient-card border border-border transition-colors duration-200">
          <CardHeader className="transition-colors duration-200">
            <CardTitle className="flex items-center gap-2 transition-colors duration-200">
              <Skeleton className="h-5 w-5 rounded transition-colors duration-200" />
              <Skeleton className="h-6 w-32 transition-colors duration-200" />
            </CardTitle>
            <Skeleton className="h-4 w-40 transition-colors duration-200" />
          </CardHeader>
          <CardContent className="transition-colors duration-200">
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4 bg-muted/30 rounded-lg transition-colors duration-200">
                  <Skeleton className="h-8 w-8 rounded transition-colors duration-200" />
                  <Skeleton className="h-4 w-16 transition-colors duration-200" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity skeleton */}
      <Card className="bg-gradient-card border border-border transition-colors duration-200">
        <CardHeader className="transition-colors duration-200">
          <CardTitle className="flex items-center gap-2 transition-colors duration-200">
            <Skeleton className="h-5 w-5 rounded transition-colors duration-200" />
            <Skeleton className="h-6 w-36 transition-colors duration-200" />
          </CardTitle>
          <Skeleton className="h-4 w-44 transition-colors duration-200" />
        </CardHeader>
        <CardContent className="transition-colors duration-200">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg transition-colors duration-200">
                <Skeleton className="h-8 w-8 rounded-full transition-colors duration-200" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-1 transition-colors duration-200" />
                  <Skeleton className="h-3 w-32 transition-colors duration-200" />
                </div>
                <Skeleton className="h-4 w-16 transition-colors duration-200" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
