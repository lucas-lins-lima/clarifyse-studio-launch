import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QRCodeSVG as QRCode } from "qrcode.react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  ArrowLeft,
  MoreVertical,
  Pause,
  Play,
  Lock,
  Copy,
  QrCode,
  Download,
  Trash2,
} from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useAuthStore } from "@/stores/authStore";
import { useActivityStore } from "@/stores/activityStore";
import { toast } from "sonner";

const ProjectDetails = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const { projects, responses, updateProject, trashProject } = useProjectStore();
  const addLog = useActivityStore((s) => s.addLog);

  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);
  const projectResponses = useMemo(
    () => responses.filter((r) => r.projectId === projectId),
    [responses, projectId]
  );

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Projeto não encontrado.</p>
      </div>
    );
  }

  // Calcular estatísticas
  const completedResponses = projectResponses.filter((r) => r.status === "completed");
  const completionRate = projectResponses.length > 0 ? (completedResponses.length / projectResponses.length) * 100 : 0;
  const avgTimeSeconds = completedResponses.length > 0
    ? Math.round(completedResponses.reduce((sum, r) => sum + (r.totalTimeSeconds || 0), 0) / completedResponses.length)
    : 0;

  // Preparar dados do gráfico de respostas por hora (últimas 24h)
  const last24hData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() - (23 - i));
      date.setMinutes(0, 0, 0);
      return date;
    });

    return hours.map((hour) => {
      const count = projectResponses.filter((r) => {
        const startHour = new Date(r.startedAt);
        startHour.setMinutes(0, 0, 0);
        return startHour.getTime() === hour.getTime();
      }).length;

      return {
        time: hour.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        respostas: count,
      };
    });
  }, [projectResponses]);

  // Preparar dados de progresso de cotas
  const quotaData = useMemo(() => {
    return project.quotas.flatMap((quota) =>
      quota.targets.map((target) => ({
        name: target.category,
        atual: target.current,
        meta: target.target,
        percentual: (target.current / target.target) * 100,
      }))
    );
  }, [project.quotas]);

  const publicLink = `${window.location.origin}/r/${project.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleDownloadQrCode = () => {
    if (!qrCodeRef.current) return;

    const canvas = qrCodeRef.current.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `qrcode-${project.slug}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR Code baixado com sucesso!");
  };

  const handlePauseResume = () => {
    const newStatus = project.status === "active" ? "paused" : "active";
    updateProject(project.id, { status: newStatus });
    addLog({
      userId: currentUser!.id,
      userName: currentUser!.name,
      userRole: currentUser!.role,
      action: newStatus === "active" ? "resume_project" : "pause_project",
      details: `${newStatus === "active" ? "Retomou" : "Pausou"} o projeto "${project.name}"`,
    });
    toast.success(`Projeto ${newStatus === "active" ? "retomado" : "pausado"}!`);
  };

  const handleCompleteProject = () => {
    const dataDeletionAt = new Date();
    dataDeletionAt.setDate(dataDeletionAt.getDate() + 20);

    updateProject(project.id, {
      status: "completed",
      completedAt: new Date().toISOString(),
      dataDeletionAt: dataDeletionAt.toISOString(),
    });
    addLog({
      userId: currentUser!.id,
      userName: currentUser!.name,
      userRole: currentUser!.role,
      action: "complete_project",
      details: `Encerrou o projeto "${project.name}"`,
    });
    toast.success("Projeto encerrado! Dados serão excluídos em 20 dias.");
    navigate("/projetos");
  };

  const handleDeleteProject = () => {
    if (deleteConfirmation !== project.name) {
      toast.error("Nome do projeto não corresponde.");
      return;
    }
    trashProject(project.id);
    addLog({
      userId: currentUser!.id,
      userName: currentUser!.name,
      userRole: currentUser!.role,
      action: "trash_project",
      details: `Moveu o projeto "${project.name}" para a lixeira`,
    });
    toast.success("Projeto movido para a lixeira.");
    setShowDeleteDialog(false);
    navigate("/projetos");
  };

  const handleEditForm = () => {
    navigate(`/projetos/${project.id}/formulario`);
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: "Rascunho", color: "bg-slate-100 text-slate-800" },
    active: { label: "Ativo", color: "bg-green-100 text-green-800" },
    paused: { label: "Pausado", color: "bg-yellow-100 text-yellow-800" },
    completed: { label: "Encerrado", color: "bg-blue-100 text-blue-800" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/projetos")}
            className="rounded-md p-1.5 hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={statusConfig[project.status].color}>
            {statusConfig[project.status].label}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/projetos/${project.id}/respostas`)}>
                <Copy size={14} className="mr-2" /> Ver Respostas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEditForm}>
                <Copy size={14} className="mr-2" /> Editar Formulário
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePauseResume}>
                {project.status === "active" ? (
                  <>
                    <Pause size={14} className="mr-2" /> Pausar
                  </>
                ) : (
                  <>
                    <Play size={14} className="mr-2" /> Retomar
                  </>
                )}
              </DropdownMenuItem>
              {project.status !== "completed" && (
                <DropdownMenuItem onClick={handleCompleteProject}>
                  <Lock size={14} className="mr-2" /> Encerrar Projeto
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive"
              >
                <Trash2 size={14} className="mr-2" /> Mover para Lixeira
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{project.clientName || "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pesquisador</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{project.researcherName}</p>
          </CardContent>
        </Card>
      </div>

      {/* Links */}
      {project.status === "active" && (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardHeader>
            <CardTitle className="text-sm">Links de Acesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Link Público</p>
              <div className="flex gap-2">
                <code className="flex-1 bg-muted p-2 rounded text-xs break-all">
                  {publicLink}
                </code>
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  <Copy size={14} />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">QR Code</p>
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowQrModal(true)}>
                <QrCode size={14} /> Gerar QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Respostas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{projectResponses.length}</p>
            <p className="text-xs text-muted-foreground">
              {completedResponses.length} completas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Meta de Amostra</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {project.sampleCurrent}/{project.sampleTarget}
            </p>
            <Progress
              value={(project.sampleCurrent / project.sampleTarget) * 100}
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Math.round(completionRate)}%</p>
            <p className="text-xs text-muted-foreground">
              {completedResponses.length} de {projectResponses.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.floor(avgTimeSeconds / 60)}m {avgTimeSeconds % 60}s
            </p>
            <p className="text-xs text-muted-foreground">Por resposta</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Responses Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Respostas (Últimas 24h)</CardTitle>
            <CardDescription>Distribuição de respostas por hora</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={last24hData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="respostas" stroke="#1D9E75" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quota Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progresso de Cotas</CardTitle>
            <CardDescription>Status de cada categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quotaData.map((quota, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{quota.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {quota.atual}/{quota.meta}
                    </span>
                  </div>
                  <Progress value={Math.min(quota.percentual, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(quota.percentual)}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Mover para Lixeira</AlertDialogTitle>
          <AlertDialogDescription>
            Digite o nome do projeto para confirmar:
            <input
              type="text"
              placeholder={project.name}
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="mt-3 w-full px-3 py-2 border border-border rounded-md text-sm"
            />
          </AlertDialogDescription>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive hover:bg-destructive/90"
            >
              Mover para Lixeira
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code do Projeto</DialogTitle>
            <DialogDescription>
              Escaneie para acessar o formulário ou compartilhe com respondentes
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-6 bg-muted rounded-lg">
            <div ref={qrCodeRef}>
              <QRCode
                value={publicLink}
                size={256}
                level="H"
                includeMargin
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {publicLink}
          </p>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowQrModal(false)}>
              Fechar
            </Button>
            <Button onClick={handleDownloadQrCode} className="gap-2">
              <Download size={16} /> Baixar PNG
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDetails;
