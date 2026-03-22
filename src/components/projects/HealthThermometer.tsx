import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

type HealthLevel = 'saudavel' | 'atencao' | 'critico';

function computeHealth(project: any): { level: HealthLevel; reasons: string[] } {
  if (project.status === 'Rascunho' || project.status === 'Formulário Pronto') {
    return { level: 'saudavel', reasons: ['Projeto em preparação.'] };
  }

  const totalResponses = project.responses?.length || 0;
  const sampleSize = project.sampleSize || 1;
  const progress = (totalResponses / sampleSize) * 100;

  // Simple logic for Phase 2: 
  // If quotas are defined and being met, it's healthy.
  // For now, let's use progress as a proxy or just return healthy if not critical.
  
  if (progress >= 100) {
    return { level: 'saudavel', reasons: ['Amostra total atingida.'] };
  }

  // Check quotas if they exist
  const quotas = project.quotas || [];
  const criticalQuotas = quotas.filter((q: any) => {
    const quotaProgress = (q.current / q.target) * 100;
    return quotaProgress < 20 && progress > 50; // Sample is half way but this quota is very low
  });

  if (criticalQuotas.length > 0) {
    return { level: 'critico', reasons: [`${criticalQuotas.length} cotas em nível crítico.`] };
  }

  return { level: 'saudavel', reasons: ['Coleta seguindo o esperado.'] };
}

const levelConfig = {
  saudavel: { color: 'bg-green-500', label: 'Saudável', emoji: '🟢' },
  atencao:  { color: 'bg-yellow-400', label: 'Atenção',  emoji: '🟡' },
  critico:  { color: 'bg-red-500',   label: 'Crítico',   emoji: '🔴' },
};

interface Props {
  project: any;
  showLabel?: boolean;
}

export function HealthThermometer({ project, showLabel = false }: Props) {
  const { level, reasons } = computeHealth(project);
  const config = levelConfig[level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-default select-none">
            <span
              className={`h-2.5 w-2.5 rounded-full ${config.color} ${level !== 'saudavel' ? 'animate-pulse' : ''}`}
            />
            {showLabel && (
              <span
                className={`text-xs font-medium ${
                  level === 'saudavel' ? 'text-green-700' :
                  level === 'atencao'  ? 'text-yellow-700' : 'text-red-700'
                }`}
              >
                {config.label}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-xs">{config.emoji} {reasons.join(' ')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
