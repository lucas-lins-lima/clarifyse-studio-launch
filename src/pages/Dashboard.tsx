import { useMemo } from "react";
import {
  BarChart3,
  FileText,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Activity,
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
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useActivityStore } from "@/stores/activityStore";
import { useNavigate } from "react-router-dom";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Ativo", variant: "default" },
  paused: { label: "Pausado", variant: "outline" },
  completed: { label: "Encerrado", variant: "secondary" },
  draft: { label: "Rascunho", variant: "outline" },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const projects = useProjectStore((s) => s.projects);
  const responses = useProjectStore((s) => s.responses);
  const recentLogs = useActivityStore((s) => s.getRecentLogs(10));

  const isAdmin = currentUser?.role === "admin";

  const visibleProjects = useMemo(() => {
    const filtered = projects.filter((p) => p.status !== "trash");
    if (isAdmin) return filtered;
    return filtered.filter((p) => p.researcherId === currentUser?.id);
  }, [projects, isAdmin, currentUser]);

  const activeCount = visibleProjects.filter((p) => p.status === "active").length;
  const completedCount = visibleProjects.filter((p) => p.status === "completed").length;
  const totalResponses = visibleProjects.reduce((sum, p) => sum + p.sampleCurrent, 0);
  const avgCompletion = visibleProjects.length > 0
    ? Math.round(
        visibleProjects
          .filter((p) => p.sampleTarget > 0)
          .reduce((sum, p) => sum + (p.sampleCurrent / p.sampleTarget) * 100, 0) /
        Math.max(visibleProjects.filter((p) => p.sampleTarget > 0).length, 1)
      )
    : 0;

  const summaryCards = [
    { label: "Projetos Ativos", value: String(activeCount), icon: FileText, color: "text-secondary" },
    { label: "Entrevistas Coletadas", value: String(totalResponses), icon: BarChart3, color: "text-accent" },
    { label: "Taxa de Conclusão", value: `${avgCompletion}%`, icon: TrendingUp, color: "text-secondary" },
    { label: "Coleta Encerrada", value: String(completedCount), icon: CheckCircle, color: "text-muted-foreground" },
  ];

  // Generate chart data from last 7 days
  const chartData = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      const dayResponses = responses.filter((r) => {
        const rDate = new Date(r.startedAt);
        return (
          rDate.toDateString() === date.toDateString() &&
          (isAdmin || visibleProjects.some((p) => p.id === r.projectId))
        );
      });
      return { dia: days[date.getDay()], respostas: dayResponses.length };
    });
  }, [responses, isAdmin, visibleProjects]);

  // Alerts
  const alerts = useMemo(() => {
    const result: { type: string; message: string }[] = [];
    visibleProjects.forEach((p) => {
      if (p.status === "active" && p.sampleTarget > 0) {
        const pct = (p.sampleCurrent / p.sampleTarget) * 100;
        if (pct >= 80 && pct < 100) {
          result.push({ type: "warning", message: `Projeto "${p.name}" em ${Math.round(pct)}% da amostra` });
        }
      }
      if (p.dataDeletionAt) {
        const daysLeft = Math.ceil((new Date(p.dataDeletionAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= 3) {
          result.push({ type: "warning", message: `Dados de "${p.name}" serão excluídos em ${daysLeft} dia(s)` });
        }
      }
    });
    return result;
  }, [visibleProjects]);

  const recentProjects = visibleProjects
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {isAdmin ? "Visão geral de todos os projetos" : "Visão geral dos seus projetos"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="card-studio p-5">
            <div className="flex items-center justify-between">
              <span className="label-caps">{card.label}</span>
              <card.icon size={18} className={card.color} />
            </div>
            <p className="mt-2 font-serif text-3xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="card-studio p-5 lg:col-span-2">
          <h3 className="label-caps mb-4">Respostas nos últimos 7 dias</h3>
          {chartData.some((d) => d.respostas > 0) ? (
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
          ) : (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <BarChart3 size={40} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma resposta coletada ainda</p>
              </div>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="card-studio p-5">
          <h3 className="label-caps mb-4">Alertas</h3>
          {alerts.length > 0 ? (
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
          ) : (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card-studio">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="label-caps">Projetos Recentes</h3>
          <button
            onClick={() => navigate("/projetos")}
            className="flex items-center gap-1 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors"
          >
            Ver todos <ArrowRight size={14} />
          </button>
        </div>
        {recentProjects.length > 0 ? (
          <div className="divide-y divide-border">
            {recentProjects.map((project) => {
              const progress = project.sampleTarget > 0
                ? Math.round((project.sampleCurrent / project.sampleTarget) * 100)
                : 0;
              const sm = statusMap[project.status];
              return (
                <div key={project.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {project.researcherName} · {new Date(project.updatedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {sm && (
                    <Badge
                      variant={sm.variant}
                      className={project.status === "active" ? "bg-secondary text-secondary-foreground border-none" : ""}
                    >
                      {sm.label}
                    </Badge>
                  )}
                  <div className="hidden w-40 sm:block">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{project.sampleCurrent}/{project.sampleTarget}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                  <button
                    onClick={() => navigate(`/projetos/${project.id}`)}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-secondary hover:bg-secondary/10 transition-colors"
                  >
                    Ver
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FileText size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum projeto criado ainda</p>
            <button
              onClick={() => navigate("/projetos/novo")}
              className="mt-3 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors"
            >
              Criar primeiro projeto →
            </button>
          </div>
        )}
      </div>

      {/* Activity Log - Admin only */}
      {isAdmin && (
        <div className="card-studio">
          <div className="border-b border-border px-5 py-4">
            <h3 className="label-caps">Log de Atividades</h3>
          </div>
          {recentLogs.length > 0 ? (
            <div className="divide-y divide-border">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <Activity size={14} className="mt-1 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{log.userName}</span> — {log.details}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
