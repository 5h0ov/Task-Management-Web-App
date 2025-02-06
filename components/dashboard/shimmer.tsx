
// dummy shuimmer cards for loading state
export function TaskCardShimmer() {
    return (
      <div className="animate-pulse">
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="p-6 space-y-2">
            <div className="h-5 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
          <div className="p-6 space-y-4">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="flex gap-2">
              <div className="h-5 bg-muted rounded w-16"></div>
              <div className="h-5 bg-muted rounded w-20"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }