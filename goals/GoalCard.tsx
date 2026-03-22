import React from 'react';
import { Goal } from '@/types/project';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  title: string;
  current: number;
  target: number;
  format?: 'currency' | 'percent' | 'number';
  previousValue?: number | null;
  compact?: boolean;
}

export function GoalCard({
  title,
  current,
  target,
  format = 'number',
  previousValue,
  compact = false,
}: GoalCardProps) {
  const percent = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const trend = previousValue !== null && previousValue !== undefined
    ? current > previousValue ? 'up' : current < previousValue ? 'down' : 'stable'
    : null;

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0,
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString('pt-BR');
    }
  };

  if (compact) {
    return (
      <div className="clarifyse-card p-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 truncate">
          {title}
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold text-foreground">
            {formatValue(current)}
          </span>
          <span className="text-xs text-muted-foreground">
            / {formatValue(target)}
          </span>
        </div>
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percent}%`,
              background: 'linear-gradient(to right, #0d9488, #7c3aed)',
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{percent.toFixed(0)}%</p>
      </div>
    );
  }

  return (
    <div className="clarifyse-card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
              trend === 'up' && 'bg-green-100 text-green-700',
              trend === 'down' && 'bg-red-100 text-red-700',
              trend === 'stable' && 'bg-gray-100 text-gray-600'
            )}
          >
            {trend === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend === 'down' && <TrendingDown className="h-3 w-3" />}
            {trend === 'stable' && <Minus className="h-3 w-3" />}
            <span>
              {trend === 'up' ? 'Alta' : trend === 'down' ? 'Queda' : 'Estável'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-bold text-foreground">
          {formatValue(current)}
        </span>
        <span className="text-sm text-muted-foreground">
          / {formatValue(target)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${percent}%`,
              background: 'linear-gradient(to right, #0d9488, #7c3aed)',
            }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{percent.toFixed(1)}% atingido</span>
          {target > 0 && current < target && (
            <span className="text-muted-foreground">
              Faltam {formatValue(target - current)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
