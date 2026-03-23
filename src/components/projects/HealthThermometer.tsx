import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

type HealthLevel = 'saudavel' | 'atencao' | 'critico';

function computeHealth(project: any): { level: HealthLevel; score: number; reasons: string[] } {
  if (project.status === 'Rascunho' || project.status === 'Formulário Pronto') {
    return { level: 'saudavel', score: 100, reasons: ['Projeto em preparação — sem dados de campo ainda.'] };
  }

  const totalResponses = project.responses?.length || 0;
  const sampleSize = project.sampleSize || 1;
  const progress = Math.min(100, (totalResponses / sampleSize) * 100);
  const reasons: string[] = [];
  let score = 0;

  // 1. Progresso geral (40 pts)
  score += Math.round((progress / 100) * 40);
  if (progress >= 100) reasons.push('Amostra total atingida.');
  else if (progress >= 50) reasons.push(`${Math.round(progress)}% da amostra coletada.`);
  else reasons.push(`Apenas ${Math.round(progress)}% da amostra coletada.`);

  // 2. Equilíbrio de cotas (40 pts)
  const quotas: any[] = project.quotas || [];
  if (quotas.length > 0) {
    const quotaProgresses = quotas.map((q: any) => {
      const current = (project.responses || []).filter((r: any) => r.quotaGroup === q.name).length;
      return q.target > 0 ? Math.min(100, (current / q.target) * 100) : 100;
    });
    const avgQuotaProgress = quotaProgresses.reduce((a: number, b: number) => a + b, 0) / quotaProgresses.length;
    score += Math.round((avgQuotaProgress / 100) * 40);
    const criticalQuotas = quotas.filter((_: any, i: number) => quotaProgresses[i] < 20 && progress > 50);
    const slowQuotas = quotas.filter((_: any, i: number) => quotaProgresses[i] < 50 && progress > 70);
    if (criticalQuotas.length > 0) reasons.push(`${criticalQuotas.length} cota(s) em nível crítico.`);
    else if (slowQuotas.length > 0) reasons.push(`${slowQuotas.length} cota(s) abaixo do esperado.`);
    else reasons.push('Cotas equilibradas.');
  } else {
    score += 40;
    reasons.push('Sem cotas definidas.');
  }

  // 3. Tempo médio de resposta (20 pts)
  const responsesWithTime = (project.responses || []).filter((r: any) => r.timeSpentSeconds > 0);
  if (responsesWithTime.length > 0) {
    const avgSec = responsesWithTime.reduce((s: number, r: any) => s + r.timeSpentSeconds, 0) / responsesWithTime.length;
    const avgMin = avgSec / 60;
    if (avgMin >= 3 && avgMin <= 30) { score += 20; reasons.push(`Tempo médio adequado: ${Math.round(avgMin)} min.`); }
    else if (avgMin < 3) { score += 5; reasons.push(`Tempo médio muito baixo: ${Math.round(avgMin)} min.`); }
    else { score += 10; reasons.push(`Tempo médio elevado: ${Math.round(avgMin)} min.`); }
  } else {
    score += 10;
  }

  const finalScore = Math.min(100, score);
  const level: HealthLevel = finalScore >= 70 ? 'saudavel' : finalScore >= 40 ? 'atencao' : 'critico';
  return { level, score: finalScore, reasons };
}

const levelConfig = {
  saudavel: { color: 'bg-green-500', label: 'Saudável', emoji: '🟢', textColor: 'text-green-700' },
  atencao:  { color: 'bg-yellow-400', label: 'Atenção',  emoji: '🟡', textColor: 'text-yellow-700' },
  critico:  { color: 'bg-red-500',   label: 'Crítico',   emoji: '🔴', textColor: 'text-red-700' },
};

export type FieldProgress = Record<string, any>;

interface Props {
  project: any;
  showLabel?: boolean;
  showScore?: boolean;
  clientView?: boolean;
  scheduleItems?: any[];
  fieldProgress?: any;
}

export function HealthThermometer({ project, showLabel = false, showScore = false }: Props) {
  const { level, score, reasons } = computeHealth(project);
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
              <span className={`text-xs font-medium ${config.textColor}`}>
                {config.label}
              </span>
            )}
            {showScore && (
              <span className={`text-xs font-mono font-bold ${config.textColor}`}>
                {score}/100
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 max-w-xs">
            <p className="text-xs font-bold">{config.emoji} {config.label} — Score: {score}/100</p>
            {reasons.map((r, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {r}</p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
