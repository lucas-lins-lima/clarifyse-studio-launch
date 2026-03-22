import { ProjectStatus } from '@/types/project';

interface Props {
  status: ProjectStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<ProjectStatus, { label: string; className: string; dot?: boolean }> = {
  'Briefing':                   { label: 'Briefing',                   className: 'bg-slate-100 text-slate-600 border border-slate-200' },
  'Elaboração do Instrumento':  { label: 'Elab. Instrumento',          className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  'Campo':                      { label: 'Campo',                      className: 'bg-green-50 text-green-700 border border-green-200', dot: true },
  'Análise dos Dados':          { label: 'Análise dos Dados',          className: 'bg-purple-50 text-purple-700 border border-purple-200' },
  'Produção do Entregável':     { label: 'Prod. Entregável',           className: 'bg-orange-50 text-orange-700 border border-orange-200' },
  'Entrega Final':              { label: 'Entrega Final',              className: 'bg-teal-50 text-teal-700 border border-teal-200' },
  'Encerrado':                  { label: 'Encerrado',                  className: 'bg-green-100 text-green-800 border border-green-300' },
  'Pausado':                    { label: 'Pausado',                    className: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
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
