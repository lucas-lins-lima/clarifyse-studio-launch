import React, { useMemo, useState } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { HealthThermometer } from '@/components/projects/HealthThermometer';
import { Progress } from '@/components/ui/progress';
import { Users, MessageSquare, Clock, CheckCircle2, Copy, ExternalLink, FileJson, BarChart3, ArrowRight, Share2, Edit3, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PILARES = ['DISCOVER', 'BRAND', 'INNOVATE', 'DECIDE', 'EXPERIENCE', 'ANALYTICS'];

interface ProjectOverviewTabProps {
  project: any;
  onSave?: (updates: any) => void;
  isLocked?: boolean;
}

export default function ProjectOverviewTab({ project, onSave, isLocked = false }: ProjectOverviewTabProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: project.name || '',
    objective: project.objective || '',
    sampleSize: project.sampleSize?.toString() || '',
    pilar: project.pilar || 'DISCOVER',
  });

  const progress = useMemo(() => {
    if (!project.sampleSize) return 0;
    return Math.min(100, Math.round((project.responses?.length || 0) / project.sampleSize * 100));
  }, [project.responses, project.sampleSize]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado!`);
    }).catch(() => {
      toast.error('Erro ao copiar. Tente manualmente.');
    });
  };

  const publicLink = project.publicLink || `${window.location.origin}/survey/${project.id}`;

  const handleShareWithInsights = () => {
    copyToClipboard(project.id, 'ID do projeto');
  };

  const handleExportJSON = () => {
    if (!project.responses || project.responses.length === 0) {
      toast.error('Nenhuma resposta coletada para exportar.');
      return;
    }
    const content = JSON.stringify(
      { project: { id: project.id, name: project.name, objective: project.objective }, responses: project.responses },
      null,
      2
    );
    const blob = new Blob([content], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `respostas_${project.id}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Respostas exportadas em JSON!');
  };

  const handleSaveEdit = () => {
    if (!editForm.name.trim()) {
      toast.error('O nome do projeto é obrigatório.');
      return;
    }
    const sampleSizeNum = parseInt(editForm.sampleSize);
    if (isNaN(sampleSizeNum) || sampleSizeNum <= 0) {
      toast.error('O tamanho da amostra deve ser um número positivo.');
      return;
    }
    if (onSave) {
      onSave({
        name: editForm.name.trim(),
        objective: editForm.objective.trim(),
        sampleSize: sampleSizeNum,
        pilar: editForm.pilar,
      });
    }
    setIsEditing(false);
    toast.success('Informações do projeto atualizadas!');
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: project.name || '',
      objective: project.objective || '',
      sampleSize: project.sampleSize?.toString() || '',
      pilar: project.pilar || 'DISCOVER',
    });
    setIsEditing(false);
  };

  const isAnalysisReady =
    project.status === 'Análise Disponível' ||
    ((project.responses?.length || 0) >= project.sampleSize && project.sampleSize > 0);

  const canEdit = !isLocked && project.status === 'Rascunho';

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Amostra Total" value={project.sampleSize} icon={Users} accentColor="purple" />
        <StatCard label="Respostas Coletadas" value={project.responses?.length || 0} icon={MessageSquare} accentColor="teal" />
        <StatCard label="Progresso" value={`${progress}%`} icon={CheckCircle2} accentColor="purple" />
        <StatCard
          label="Última Resposta"
          value={project.lastResponseAt
            ? new Date(project.lastResponseAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
            : 'Nenhuma'}
          icon={Clock}
          accentColor="teal"
        />
      </div>

      {/* Insights Banner */}
      {isAnalysisReady && (
        <div className="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-purple-900/20">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest">CLARIFYSE INSIGHTS</p>
            <h3 className="text-xl font-display font-bold text-white">Análise automática disponível!</h3>
            <p className="text-sm text-white/70">
              {project.responses?.length || 0} respostas coletadas — todos os dados prontos para análise.
            </p>
          </div>
          <Button
            onClick={() => navigate(`/admin/insights/${project.id}`)}
            className="bg-white text-[#2D1E6B] hover:bg-white/90 rounded-xl font-bold gap-2 shadow-lg flex-shrink-0"
          >
            <BarChart3 className="h-4 w-4" />
            Ver Insights Completos
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-[#2D1E6B]">Acompanhamento de Campo</h3>
            <div className="flex items-center gap-2">
              <HealthThermometer project={project} showLabel />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#64748B] font-medium">Progresso Geral</span>
              <span className="text-[#2D1E6B] font-bold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-4 bg-gray-100 rounded-full" indicatorClassName="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD]" />
            <div className="flex justify-between text-xs font-bold text-[#64748B] uppercase tracking-widest">
              <span>0 Respostas</span>
              <span>{project.sampleSize} Respondentes (Meta)</span>
            </div>
          </div>

          {/* Links Section */}
          {project.status !== 'Rascunho' && (
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <h4 className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest">LINKS E EXPORTAÇÃO</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Public Link */}
                <div className="p-4 bg-[#F1EFE8] rounded-xl flex items-center justify-between gap-2 group">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">LINK PÚBLICO</p>
                    <p className="text-sm text-[#2D1E6B] font-medium truncate">{publicLink}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(publicLink, 'Link público')}
                      className="h-8 w-8 rounded-lg text-[#2D1E6B] hover:bg-white"
                      title="Copiar link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(publicLink, '_blank')}
                      className="h-8 w-8 rounded-lg text-[#2D1E6B] hover:bg-white"
                      title="Abrir em nova aba"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Integração com Insights */}
                <div className="p-4 bg-gradient-to-br from-[#2D1E6B]/5 to-[#1D9E75]/5 rounded-xl border border-[#1D9E75]/20 flex items-center justify-between gap-2 group">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-1">INTEGRAÇÃO COM INSIGHTS</p>
                    <p className="text-sm text-[#2D1E6B] font-medium font-mono truncate">{project.id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-[#1D9E75] hover:bg-[#1D9E75]/10 font-bold text-xs flex-shrink-0 gap-1"
                    onClick={handleShareWithInsights}
                  >
                    <Share2 className="h-4 w-4" /> Copiar ID
                  </Button>
                </div>

                {/* JSON Export */}
                <div className="p-4 bg-[#F1EFE8] rounded-xl flex items-center justify-between gap-2 group">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">EXPORTAÇÃO JSON</p>
                    <p className="text-sm text-[#2D1E6B] font-medium truncate">
                      {project.responses?.length || 0} resposta{(project.responses?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg text-[#2D1E6B] hover:bg-white font-bold text-xs flex-shrink-0"
                    onClick={handleExportJSON}
                    disabled={!project.responses || project.responses.length === 0}
                  >
                    <FileJson className="h-4 w-4 mr-1" /> Exportar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-display font-bold text-[#2D1E6B]">Informações</h3>
            {canEdit && !isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 rounded-lg text-[#2D1E6B] hover:bg-[#F1EFE8]"
                title="Editar informações"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">NOME DO PROJETO</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="h-10 rounded-xl border-gray-200 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">OBJETIVO</Label>
                <Textarea
                  value={editForm.objective}
                  onChange={(e) => setEditForm({ ...editForm, objective: e.target.value })}
                  className="min-h-[80px] rounded-xl border-gray-200 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">AMOSTRA TOTAL</Label>
                <Input
                  type="number"
                  min="1"
                  value={editForm.sampleSize}
                  onChange={(e) => setEditForm({ ...editForm, sampleSize: e.target.value })}
                  className="h-10 rounded-xl border-gray-200 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">PILAR</Label>
                <Select value={editForm.pilar} onValueChange={(v) => setEditForm({ ...editForm, pilar: v })}>
                  <SelectTrigger className="h-10 rounded-xl border-gray-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PILARES.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  className="flex-1 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-xl font-bold gap-2"
                >
                  <Save className="h-4 w-4" /> Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1 rounded-xl border-gray-200 font-bold gap-2"
                >
                  <X className="h-4 w-4" /> Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[#64748B] text-sm leading-relaxed italic">
                "{project.objective || 'Nenhum objetivo definido.'}"
              </p>
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-1">PILAR CLARIFYSE</p>
                  <span className="px-3 py-1 bg-[#2D1E6B] text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
                    {project.pilar || 'Não definido'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">STATUS</p>
                  <p className="text-sm font-bold text-[#2D1E6B]">{project.status}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">CRIADO EM</p>
                  <p className="text-sm text-[#64748B]">
                    {new Date(project.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </p>
                </div>
              </div>
              {isAnalysisReady && (
                <div className="pt-4 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-xl border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75]/10 font-bold gap-2"
                    onClick={() => navigate(`/admin/insights/${project.id}`)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Abrir Insights
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
