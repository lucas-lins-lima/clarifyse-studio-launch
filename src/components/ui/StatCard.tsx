import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  loading?: boolean;
  accentColor?: 'teal' | 'purple' | 'default';
}

export const StatCard = React.memo(function StatCard({
  label,
  value,
  icon: Icon,
  loading = false,
  accentColor = 'default',
}: StatCardProps) {
  const iconColor = accentColor === 'teal'
    ? 'text-[#1D9E75]'
    : accentColor === 'purple'
    ? 'text-[#2D1E6B]'
    : 'text-[#7F77DD]';

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-[0.2em]">{label}</p>
          <p className="text-3xl font-bold font-display text-[#2D1E6B]">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-gray-50 ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
});
