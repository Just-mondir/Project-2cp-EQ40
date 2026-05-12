"use client";

function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ backgroundColor: "var(--panel-hover)" }}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <article
      className="mb-5 rounded-2xl p-5"
      style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border-soft)" }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-3 w-28" />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <SkeletonBlock className="h-6 w-3/4" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-5/6" />
        <SkeletonBlock className="h-56 w-full" />
      </div>
    </article>
  );
}

export function PostsSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading posts">
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ProfileGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2" role="status" aria-label="Loading profile posts">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={index} className="aspect-square w-full rounded-md" />
      ))}
    </div>
  );
}

