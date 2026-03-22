import { useMemo, useState } from "react";
import { Activity, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useActivityStore } from "@/stores/activityStore";
import { useNavigate } from "react-router-dom";

const actionLabels: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  create_project: "Criou projeto",
  update_project: "Editou projeto",
  delete_project: "Excluiu projeto",
  trash_project: "Moveu para lixeira",
  restore_project: "Restaurou projeto",
  duplicate_project: "Duplicou projeto",
  publish_form: "Publicou formulário",
  save_form: "Salvou formulário",
  pause_project: "Pausou projeto",
  resume_project: "Retomou projeto",
  close_project: "Encerrou projeto",
  create_researcher: "Criou pesquisador",
  update_researcher: "Editou pesquisador",
  delete_researcher: "Excluiu pesquisador",
  toggle_researcher: "Alterou status de pesquisador",
};

const ActivityLog = () => {
  const navigate = useNavigate();
  const logs = useActivityStore((s) => s.logs);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.userName.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        (actionLabels[l.action] || l.action).toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-md p-1.5 hover:bg-muted transition-colors"
        >
          <ArrowLeft size={18} className="text-muted-foreground" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Log de Atividades</h1>
          <p className="text-sm text-muted-foreground">
            Histórico completo de ações dos pesquisadores
          </p>
        </div>
      </div>

      <div className="card-studio">
        <div className="border-b border-border px-5 py-4">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por pesquisador ou ação..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="divide-y divide-border">
            {filtered.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Activity size={14} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{log.userName}</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                      {log.userRole === "admin" ? "Admin" : "Pesquisador"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{log.details}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0 pt-0.5">
                  {new Date(log.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Activity size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "Nenhuma atividade encontrada para essa busca" : "Nenhuma atividade registrada ainda"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
