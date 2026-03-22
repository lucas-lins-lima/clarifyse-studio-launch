import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-[#E8E4DC] ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #E8E4DC 25%, #f0ece4 50%, #E8E4DC 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-3/4 mb-4" />
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-2 flex-1 rounded-full" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3"><Skeleton className="h-3 w-28" /></td>
      <td className="px-4 py-3"><Skeleton className="h-3 w-20" /></td>
      <td className="px-4 py-3"><Skeleton className="h-3 w-24" /></td>
      <td className="px-4 py-3"><Skeleton className="h-3 w-16" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td className="px-4 py-3"><Skeleton className="h-7 w-20 rounded-lg" /></td>
    </tr>
  );
}

export function AnalysisCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <Skeleton className="h-4 w-40 mb-4" />
      <Skeleton className="h-32 w-full mb-3" />
      <Skeleton className="h-3 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
