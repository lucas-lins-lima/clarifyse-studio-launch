import {
  BarChart3,
  FileText,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const chartData = [
  { dia: "Seg", respostas: 45 },
  { dia: "Ter", respostas: 72 },
  { dia: "Qua", respostas: 58 },
  { dia: "Qui", respostas: 91 },
  { dia: "Sex", respostas: 120 },
  { dia: "Sáb", respostas: 34 },
  { dia: "Dom", respostas: 18 },
];

const summaryCards = [
  { label: "Projetos Ativos", value: "5", icon: FileText, color: "bg-secondary" },
  { label: "Entrevistas Coletadas", value: "1.247", icon: BarChart3, color: "bg-accent" },
  { label: "Taxa de Conclusão", value: "78%", icon: TrendingUp, color: "bg-secondary" },
  { label: "Coleta Encerrada", value: "3", icon: CheckCircle, color: "bg-muted-foreground" },
];

const recentProjects = [
  { name: "Satisfação do Cliente 2025", researcher: "Ana Costa", status: "active", progress: 68, target: 500, current: 342, updated: "Há 2h" },
  { name: "Pesquisa de Mercado - Fintech", researcher: "Carlos Lima", status: "active", progress: 45, target: 800, current: 360, updated: "Há 5h" },
  { name: "Avaliação Institucional", researcher: "Maria Silva", status: "paused", progress: 92, target: 300, current: 276, updated: "Há 1 dia" },
  { name: "NPS Trimestral Q1", researcher: "Ana Costa", status: "completed", progress: 100, target: 400, current: 400, updated: "Há 3 dias" },
];

const alerts = [
  { type: "warning", message: 'Projeto "Avaliação Institucional" em 92% da amostra' },
  { type: "warning", message: 'Projeto "Fintech" sem respostas nas últimas 24h' },
  { type: "info", message: 'Dados de "NPS Q4 2024" serão excluídos em 2 dias' },
];

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Ativo", variant: "default" },
  paused: { label: "Pausado", variant: "outline" },
  completed: { label: "Encerrado", variant: "secondary" },
};

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral de todos os projetos</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="card-studio p-5">
            <div className="flex items-center justify-between">
              <span className="label-caps">{card.label}</span>
              <div className={`rounded-md p-2 ${card.color} bg-opacity-10`}>
                <card.icon size={18} className="text-secondary" />
              </div>
            </div>
            <p className="mt-2 font-serif text-3xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="card-studio p-5 lg:col-span-2">
          <h3 className="label-caps mb-4">Respostas nos últimos 7 dias</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="respostas"
                  stroke="hsl(var(--secondary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--secondary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts */}
        <div className="card-studio p-5">
          <h3 className="label-caps mb-4">Alertas</h3>
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm"
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-secondary" />
                <span className="text-foreground">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card-studio">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="label-caps">Projetos Recentes</h3>
          <button className="flex items-center gap-1 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors">
            Ver todos <ArrowRight size={14} />
          </button>
        </div>
        <div className="divide-y divide-border">
          {recentProjects.map((project) => (
            <div key={project.name} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{project.name}</p>
                <p className="text-xs text-muted-foreground">{project.researcher} · {project.updated}</p>
              </div>
              <Badge
                variant={statusMap[project.status].variant}
                className={project.status === "active" ? "bg-secondary text-secondary-foreground border-none" : ""}
              >
                {statusMap[project.status].label}
              </Badge>
              <div className="hidden w-40 sm:block">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{project.current}/{project.target}</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-1.5" />
              </div>
              <button className="rounded-md px-3 py-1.5 text-sm font-medium text-secondary hover:bg-secondary/10 transition-colors">
                Ver
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
