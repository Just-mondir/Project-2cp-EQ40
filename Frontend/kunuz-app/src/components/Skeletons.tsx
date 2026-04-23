import React from "react";

export function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      </div>

      {/* Content */}
      <div className="px-4 py-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
      </div>

      {/* Image placeholder */}
      <div className="my-3 w-full h-64 bg-gray-200 dark:bg-gray-700" />

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
  );
}

export function EventSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse flex p-4">
      {/* Date Box */}
      <div className="w-16 h-16 rounded bg-gray-200 dark:bg-gray-700 flex-shrink-0 mr-4" />
      
      {/* Content */}
      <div className="flex-1">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}
