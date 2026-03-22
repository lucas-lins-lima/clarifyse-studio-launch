import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useProjectStore } from "@/stores/projectStore";
import { useActivityStore } from "@/stores/activityStore";
import { toast } from "sonner";

const defaultSettings = {
  allowMultipleResponses: false,
  requirePassword: false,
  password: "",
  estimatedTime: 10,
  welcomeMessage: "Olá! Você foi convidado a participar de uma pesquisa da Clarifyse.",
  quotaReachedMessage: "Agradecemos seu interesse, mas a quota para seu perfil já foi atingida.",
  sampleCompleteMessage: "Agradecemos, mas a pesquisa já atingiu o número necessário de respostas.",
  thankYouMessage: "Obrigado por participar! Sua resposta é muito importante para nós.",
};

interface QuotaForm {
  id: string;
  name: string;
  type: string;
  targets: { id: string; category: string; target: number }[];
}

const CreateProject = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const researchers = useAuthStore((s) => s.getResearchers());
  const addProject = useProjectStore((s) => s.addProject);
  const addLog = useActivityStore((s) => s.addLog);
  const isAdmin = currentUser?.role === "admin";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [researcherId, setResearcherId] = useState(currentUser?.id || "");
  const [sampleTarget, setSampleTarget] = useState("");
  const [settings, setSettings] = useState(defaultSettings);
  const [quotas, setQuotas] = useState<QuotaForm[]>([]);

  const addQuota = () => {
    setQuotas([
      ...quotas,
      {
        id: crypto.randomUUID(),
        name: "",
        type: "demographic",
        targets: [{ id: crypto.randomUUID(), category: "", target: 0 }],
      },
    ]);
  };

  const removeQuota = (qId: string) => {
    setQuotas(quotas.filter((q) => q.id !== qId));
  };

  const updateQuota = (qId: string, field: string, value: string) => {
    setQuotas(quotas.map((q) => (q.id === qId ? { ...q, [field]: value } : q)));
  };

  const addTarget = (qId: string) => {
    setQuotas(
      quotas.map((q) =>
        q.id === qId
          ? { ...q, targets: [...q.targets, { id: crypto.randomUUID(), category: "", target: 0 }] }
          : q
      )
    );
  };

  const removeTarget = (qId: string, tId: string) => {
    setQuotas(
      quotas.map((q) =>
        q.id === qId ? { ...q, targets: q.targets.filter((t) => t.id !== tId) } : q
      )
    );
  };

  const updateTarget = (qId: string, tId: string, field: string, value: string | number) => {
    setQuotas(
      quotas.map((q) =>
        q.id === qId
          ? { ...q, targets: q.targets.map((t) => (t.id === tId ? { ...t, [field]: value } : t)) }
          : q
      )
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nome do projeto é obrigatório.");
      return;
    }
    if (!sampleTarget || Number(sampleTarget) <= 0) {
      toast.error("Tamanho da amostra é obrigatório.");
      return;
    }

    const researcher = isAdmin
      ? [...researchers, currentUser!].find((r) => r.id === researcherId)
      : currentUser;

    const project = addProject({
      name: name.trim(),
      description,
      clientName,
      researcherId: researcher?.id || currentUser!.id,
      researcherName: researcher?.name || currentUser!.name,
      sampleTarget: Number(sampleTarget),
      status: "draft",
      settings: {
        ...settings,
        estimatedTime: settings.estimatedTime || 10,
      },
      quotas: quotas
        .filter((q) => q.name.trim())
        .map((q) => ({
          id: q.id,
          name: q.name,
          type: q.type,
          targets: q.targets
            .filter((t) => t.category.trim())
            .map((t) => ({
              ...t,
              current: 0,
              isBlocked: false,
            })),
        })),
    });

    addLog({
      userId: currentUser!.id,
      userName: currentUser!.name,
      userRole: currentUser!.role,
      action: "create_project",
      details: `Criou o projeto "${name}"`,
    });

    toast.success("Projeto criado com sucesso!");
    navigate(`/projetos/${project.id}/formulario`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/projetos")} className="rounded-md p-2 hover:bg-muted transition-colors">
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Novo Projeto</h1>
          <p className="text-sm text-muted-foreground">Configure as informações da sua pesquisa</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="card-studio p-6 space-y-5">
        <h2 className="label-caps text-foreground">Informações Básicas</h2>

        <div className="space-y-2">
          <Label htmlFor="name">Nome do Projeto *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pesquisa de Satisfação 2025" className="h-11" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição do Estudo</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o objetivo da pesquisa..." rows={3} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="client">Cliente / Empresa</Label>
          <Input id="client" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nome do cliente" className="h-11" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start-date">Data de Início Prevista</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">Data de Término Prevista</Label>
            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11" />
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-2">
            <Label>Pesquisador Responsável</Label>
            <Select value={researcherId} onValueChange={setResearcherId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecione o pesquisador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={currentUser!.id}>{currentUser!.name} (você)</SelectItem>
                {researchers.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Sample Config */}
      <div className="card-studio p-6 space-y-5">
        <h2 className="label-caps text-foreground">Configuração de Amostra</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sample">Tamanho da Amostra Total *</Label>
            <Input id="sample" type="number" min="1" value={sampleTarget} onChange={(e) => setSampleTarget(e.target.value)} placeholder="Ex: 500" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Tempo Médio Estimado (minutos)</Label>
            <Input id="time" type="number" min="1" value={settings.estimatedTime || ""} onChange={(e) => setSettings({ ...settings, estimatedTime: Number(e.target.value) })} placeholder="10" className="h-11" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border p-4">
          <div>
            <p className="text-sm font-medium text-foreground">Permitir Respostas Múltiplas do Mesmo IP</p>
            <p className="text-xs text-muted-foreground">Se desabilitado, cada IP pode responder apenas uma vez</p>
          </div>
          <Switch checked={settings.allowMultipleResponses} onCheckedChange={(v) => setSettings({ ...settings, allowMultipleResponses: v })} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">Requerer Senha para Acesso</p>
              <p className="text-xs text-muted-foreground">O entrevistado precisará digitar uma senha para acessar</p>
            </div>
            <Switch checked={settings.requirePassword} onCheckedChange={(v) => setSettings({ ...settings, requirePassword: v })} />
          </div>
          {settings.requirePassword && (
            <Input
              placeholder="Defina a senha de acesso"
              value={settings.password}
              onChange={(e) => setSettings({ ...settings, password: e.target.value })}
              className="h-11"
            />
          )}
        </div>
      </div>

      {/* Quotas */}
      <div className="card-studio p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="label-caps text-foreground">Configuração de Cotas</h2>
            <p className="text-xs text-muted-foreground mt-1">Opcional, mas recomendado para controle de amostra</p>
          </div>
          <Button variant="outline" size="sm" onClick={addQuota} className="gap-1">
            <Plus size={14} /> Adicionar Cota
          </Button>
        </div>

        {quotas.length === 0 && (
          <div className="rounded-md border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">Nenhuma cota configurada. Clique em "Adicionar Cota" para definir categorias de controle.</p>
          </div>
        )}

        {quotas.map((quota) => (
          <div key={quota.id} className="rounded-md border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical size={16} className="text-muted-foreground" />
                <Input
                  placeholder="Nome da cota (ex: Gênero, Faixa Etária)"
                  value={quota.name}
                  onChange={(e) => updateQuota(quota.id, "name", e.target.value)}
                  className="h-9 w-64"
                />
              </div>
              <button onClick={() => removeQuota(quota.id)} className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors">
                <Trash2 size={16} className="text-destructive" />
              </button>
            </div>

            <div className="space-y-2 pl-6">
              {quota.targets.map((target) => (
                <div key={target.id} className="flex items-center gap-3">
                  <Input
                    placeholder="Categoria (ex: Masculino)"
                    value={target.category}
                    onChange={(e) => updateTarget(quota.id, target.id, "category", e.target.value)}
                    className="h-9 flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Meta"
                    min="1"
                    value={target.target || ""}
                    onChange={(e) => updateTarget(quota.id, target.id, "target", Number(e.target.value))}
                    className="h-9 w-24"
                  />
                  {quota.targets.length > 1 && (
                    <button onClick={() => removeTarget(quota.id, target.id)} className="rounded-md p-1 hover:bg-destructive/10 transition-colors">
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addTarget(quota.id)}
                className="flex items-center gap-1 text-xs font-medium text-secondary hover:text-secondary/80 transition-colors"
              >
                <Plus size={12} /> Adicionar categoria
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="card-studio p-6 space-y-5">
        <h2 className="label-caps text-foreground">Mensagens Personalizáveis</h2>

        <div className="space-y-2">
          <Label>Mensagem de Boas-vindas</Label>
          <Textarea value={settings.welcomeMessage} onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>Mensagem de Quota Atingida</Label>
          <Textarea value={settings.quotaReachedMessage} onChange={(e) => setSettings({ ...settings, quotaReachedMessage: e.target.value })} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>Mensagem de Amostra Completa</Label>
          <Textarea value={settings.sampleCompleteMessage} onChange={(e) => setSettings({ ...settings, sampleCompleteMessage: e.target.value })} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>Mensagem de Agradecimento Final</Label>
          <Textarea value={settings.thankYouMessage} onChange={(e) => setSettings({ ...settings, thankYouMessage: e.target.value })} rows={2} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => navigate("/projetos")}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
        >
          <Save size={18} />
          Salvar e Criar Formulário
        </Button>
      </div>
    </div>
  );
};

export default CreateProject;
