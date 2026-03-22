import React from 'react';

export type ProjectStatus = "Rascunho" | "Formulário Pronto" | "Em Campo" | "Análise Disponível" | "Encerrado";

interface Props {
  status: ProjectStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<ProjectStatus, { label: string; className: string; dot?: boolean }> = {
  'Rascunho':           { label: 'Rascunho',           className: 'bg-slate-100 text-slate-600 border border-slate-200' },
  'Formulário Pronto':  { label: 'Formulário Pronto',  className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  'Em Campo':           { label: 'Em Campo',           className: 'bg-green-50 text-green-700 border border-green-200', dot: true },
  'Análise Disponível': { label: 'Análise Disponível', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
  'Encerrado':          { label: 'Encerrado',          className: 'bg-teal-50 text-teal-700 border border-teal-200' },
};

export function ProjectStatusBadge({ status, size = 'md' }: Props) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-muted text-muted-foreground border border-border' };
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClass} ${config.className}`}>
      {config.dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
