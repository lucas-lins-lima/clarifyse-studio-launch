import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Project, ScheduleItem } from '@/types/project';

type HealthLevel = 'saudavel' | 'atencao' | 'critico';

export interface FieldProgress {
  realizado: number;
  meta: number;
  prazoRestantePct: number;
}

function countBusinessDays(from: Date, to: Date): number {
  let count = 0;
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cur < end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function computeHealth(
  project: Project,
  scheduleItems?: ScheduleItem[],
  fieldProgress?: FieldProgress | null,
): { level: HealthLevel; reasons: string[] } {
  const finalStatuses = ['Entrega Final', 'Encerrado'];
  const inactiveStatuses = ['Encerrado', 'Pausado'];

  if (inactiveStatuses.includes(project.status)) {
    return { level: 'saudavel', reasons: ['Projeto encerrado ou pausado.'] };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const criticalReasons: string[] = [];
  const warningReasons: string[] = [];

  const delayed = scheduleItems?.filter(s => s.status === 'Atrasada') ?? [];

  if (delayed.length >= 2) {
    criticalReasons.push(`${delayed.length} etapas atrasadas: ${delayed.map(d => d.nome).join(', ')}.`);
  } else if (delayed.length === 1) {
    warningReasons.push(`1 etapa atrasada: ${delayed[0].nome}.`);
  }

  if (project.data_entrega_prevista && !finalStatuses.includes(project.status)) {
    const deliveryDate = new Date(project.data_entrega_prevista + 'T00:00:00');
    const diffDays = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const bizDays = countBusinessDays(today, deliveryDate);

    if (diffDays < 0) {
      criticalReasons.push(`Data de entrega ultrapassou há ${Math.abs(diffDays)} dia(s).`);
    } else if (bizDays <= 5 && bizDays >= 2) {
      warningReasons.push(`Entrega em ${bizDays} dia(s) útil(eis).`);
    }
  }

  if (fieldProgress && project.status === 'Campo') {
    const pct = fieldProgress.meta > 0 ? (fieldProgress.realizado / fieldProgress.meta) * 100 : 0;
    const prazoRestante = fieldProgress.prazoRestantePct;

    if (pct < 30 && prazoRestante < 20) {
      criticalReasons.push(`Campo em ritmo crítico — ${pct.toFixed(0)}% da meta atingida com apenas ${prazoRestante.toFixed(0)}% do prazo restante.`);
    } else if (pct < 60 && pct >= 30 && prazoRestante < 30) {
      warningReasons.push(`Campo em ${pct.toFixed(0)}% da meta com pouco prazo restante.`);
    }
  }

  if (criticalReasons.length > 0) {
    return { level: 'critico', reasons: criticalReasons };
  }
  if (warningReasons.length > 0) {
    return { level: 'atencao', reasons: warningReasons };
  }
  return { level: 'saudavel', reasons: ['Projeto no prazo e dentro do esperado.'] };
}

const levelConfig = {
  saudavel: { color: 'bg-green-500', label: 'Saudável', emoji: '🟢' },
  atencao:  { color: 'bg-yellow-400', label: 'Atenção',  emoji: '🟡' },
  critico:  { color: 'bg-red-500',   label: 'Crítico',   emoji: '🔴' },
};

const clientMessages: Record<HealthLevel, string> = {
  saudavel: 'Projeto no prazo e dentro do esperado.',
  atencao:  'Projeto requer atenção — acompanhe as próximas etapas.',
  critico:  'Projeto com pendências críticas — entre em contato com o gerente.',
};

interface Props {
  project: Project;
  showLabel?: boolean;
  clientView?: boolean;
  scheduleItems?: ScheduleItem[];
  fieldProgress?: FieldProgress | null;
}

export function HealthThermometer({
  project,
  showLabel = false,
  clientView = false,
  scheduleItems,
  fieldProgress,
}: Props) {
  const { level, reasons } = computeHealth(project, scheduleItems, fieldProgress);
  const config = levelConfig[level];

  const tooltipText = clientView
    ? clientMessages[level]
    : reasons.join(' ');

  return (
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
        <p className="text-xs max-w-xs">{config.emoji} {tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
