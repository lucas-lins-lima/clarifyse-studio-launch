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
  const iconBg = accentColor === 'teal'
    ? 'bg-accent/10 text-accent'
    : accentColor === 'purple'
    ? 'bg-clarifyse-purple-start/10 text-clarifyse-purple-start'
    : 'bg-primary/10 text-primary';

  if (loading) {
    return (
      <div className="clarifyse-card p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="clarifyse-card-hover p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="clarifyse-section-label text-xs">{label}</p>
          <p className="text-2xl font-bold font-display mt-1 text-foreground">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
});
