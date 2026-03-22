import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Trash2,
  Eye,
  Edit,
  FileText,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useActivityStore } from "@/stores/activityStore";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className?: string }> = {
  active: { label: "Ativo", variant: "default", className: "bg-secondary text-secondary-foreground border-none" },
  paused: { label: "Pausado", variant: "outline" },
  completed: { label: "Encerrado", variant: "secondary" },
  draft: { label: "Rascunho", variant: "outline", className: "border-dashed" },
};

const Projects = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const projects = useProjectStore((s) => s.projects);
  const { trashProject, updateProject, duplicateProject } = useProjectStore();
  const addLog = useActivityStore((s) => s.addLog);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const isAdmin = currentUser?.role === "admin";

  const visibleProjects = projects.filter((p) => {
    if (p.status === "trash") return false;
    if (!isAdmin && p.researcherId !== currentUser?.id) return false;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAction = (projectId: string, action: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project || !currentUser) return;

    switch (action) {
      case "pause":
        updateProject(projectId, { status: "paused" });
        addLog({ userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, action: "pause_project", details: `Pausou o projeto "${project.name}"` });
        toast.success("Projeto pausado");
        break;
      case "resume":
        updateProject(projectId, { status: "active" });
        addLog({ userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, action: "resume_project", details: `Retomou o projeto "${project.name}"` });
        toast.success("Projeto retomado");
        break;
      case "complete":
        updateProject(projectId, { status: "completed", completedAt: new Date().toISOString(), dataDeletionAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString() });
        addLog({ userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, action: "complete_project", details: `Encerrou o projeto "${project.name}"` });
        toast.success("Projeto encerrado");
        break;
      case "duplicate":
        const dup = duplicateProject(projectId);
        if (dup) {
          addLog({ userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, action: "duplicate_project", details: `Duplicou o projeto "${project.name}"` });
          toast.success("Projeto duplicado");
        }
        break;
      case "trash":
        setProjectToDelete(projectId);
        setDeleteDialogOpen(true);
        break;
    }
  };

  const confirmDelete = () => {
    const project = projects.find((p) => p.id === projectToDelete);
    if (!project || deleteConfirmName !== project.name) {
      toast.error("Nome do projeto não confere.");
      return;
    }
    trashProject(project.id);
    addLog({ userId: currentUser!.id, userName: currentUser!.name, userRole: currentUser!.role, action: "trash_project", details: `Moveu o projeto "${project.name}" para a lixeira` });
    toast.success("Projeto movido para a lixeira");
    setDeleteDialogOpen(false);
    setDeleteConfirmName("");
    setProjectToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Projetos</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas pesquisas</p>
        </div>
        <Button
          onClick={() => navigate("/projetos/novo")}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
        >
          <Plus size={18} />
          Novo Projeto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
            <SelectItem value="completed">Encerrado</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {visibleProjects.length > 0 ? (
        <div className="card-studio overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="label-caps px-5 py-3 text-left">Nome</th>
                  <th className="label-caps px-5 py-3 text-left">Cliente</th>
                  <th className="label-caps px-5 py-3 text-left">Status</th>
                  <th className="label-caps px-5 py-3 text-left">Amostra</th>
                  <th className="label-caps px-5 py-3 text-center">Cotas</th>
                  <th className="label-caps px-5 py-3 text-left">Criado em</th>
                  <th className="label-caps px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleProjects.map((project) => {
                  const progress = project.sampleTarget > 0 ? Math.round((project.sampleCurrent / project.sampleTarget) * 100) : 0;
                  const sc = statusConfig[project.status];
                  if (!sc) return null;
                  return (
                    <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-foreground">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.researcherName}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{project.clientName || "—"}</td>
                      <td className="px-5 py-4">
                        <Badge variant={sc.variant} className={sc.className}>
                          {sc.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{project.sampleCurrent}/{project.sampleTarget}</span>
                            <span>{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center text-sm text-muted-foreground">{project.quotas.length}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-md p-1.5 hover:bg-muted transition-colors">
                              <MoreHorizontal size={18} className="text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/projetos/${project.id}`)}>
                              <Eye size={14} className="mr-2" /> Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/projetos/${project.id}/formulario`)}>
                              <Edit size={14} className="mr-2" /> Editar Formulário
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(project.id, "duplicate")}>
                              <Copy size={14} className="mr-2" /> Duplicar
                            </DropdownMenuItem>
                            {project.status === "active" && (
                              <DropdownMenuItem onClick={() => handleAction(project.id, "pause")}>
                                <Pause size={14} className="mr-2" /> Pausar
                              </DropdownMenuItem>
                            )}
                            {project.status === "paused" && (
                              <DropdownMenuItem onClick={() => handleAction(project.id, "resume")}>
                                <Play size={14} className="mr-2" /> Retomar
                              </DropdownMenuItem>
                            )}
                            {(project.status === "active" || project.status === "paused") && (
                              <DropdownMenuItem onClick={() => handleAction(project.id, "complete")}>
                                <XCircle size={14} className="mr-2" /> Encerrar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleAction(project.id, "trash")}
                              className="text-destructive"
                            >
                              <Trash2 size={14} className="mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card-studio flex flex-col items-center justify-center py-16">
          <FileText size={48} className="text-muted-foreground/30 mb-4" />
          <h3 className="font-serif text-lg font-semibold text-foreground mb-1">Nenhum projeto encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">Crie seu primeiro projeto para começar a coletar dados.</p>
          <Button
            onClick={() => navigate("/projetos/novo")}
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
          >
            <Plus size={18} />
            Criar Projeto
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Projeto</DialogTitle>
            <DialogDescription>
              Esta ação moverá o projeto para a lixeira. Digite o nome do projeto para confirmar:
              <br />
              <strong>{projects.find((p) => p.id === projectToDelete)?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Digite o nome do projeto"
            value={deleteConfirmName}
            onChange={(e) => setDeleteConfirmName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
