import React, { useMemo } from 'react';
import { StatCard } from '@/components/ui/StatCard';
import { HealthThermometer } from '@/components/projects/HealthThermometer';
import { Progress } from '@/components/ui/progress';
import { Users, MessageSquare, Clock, CheckCircle2, Copy, ExternalLink, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ProjectOverviewTab({ project }: { project: any }) {
  const progress = useMemo(() => {
    if (!project.sampleSize) return 0;
    return Math.min(100, Math.round((project.responses?.length || 0) / project.sampleSize * 100));
  }, [project.responses, project.sampleSize]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  const publicLink = `https://seusite.com/survey/${project.id}`;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Amostra Total" value={project.sampleSize} icon={Users} accentColor="purple" />
        <StatCard label="Respostas Coletadas" value={project.responses?.length || 0} icon={MessageSquare} accentColor="teal" />
        <StatCard label="Progresso" value={`${progress}%`} icon={CheckCircle2} accentColor="purple" />
        <StatCard label="Última Resposta" value={project.lastResponseAt ? new Date(project.lastResponseAt).toLocaleDateString('pt-BR') : 'Nenhuma'} icon={Clock} accentColor="teal" />
      </div>

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
                <div className="p-4 bg-[#F1EFE8] rounded-xl flex items-center justify-between group">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">LINK PÚBLICO</p>
                    <p className="text-sm text-[#2D1E6B] font-medium truncate">{publicLink}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(publicLink, "Link público")} className="h-8 w-8 rounded-lg text-[#2D1E6B] hover:bg-white">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-[#2D1E6B] hover:bg-white">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 bg-[#F1EFE8] rounded-xl flex items-center justify-between group">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">EXPORTAÇÃO JSON</p>
                    <p className="text-sm text-[#2D1E6B] font-medium truncate">responses_{project.id}.json</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg text-[#2D1E6B] hover:bg-white font-bold text-xs">
                    <FileJson className="h-4 w-4 mr-2" /> Exportar para Insights
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Objective Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm space-y-4">
          <h3 className="text-xl font-display font-bold text-[#2D1E6B]">Objetivo do Estudo</h3>
          <p className="text-[#64748B] text-sm leading-relaxed italic">
            "{project.objective || 'Nenhum objetivo definido.'}"
          </p>
          <div className="pt-4 border-t border-gray-100">
            <p className="text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest mb-2">PILAR CLARIFYSE</p>
            <span className="px-3 py-1 bg-[#2D1E6B] text-white text-[10px] font-bold rounded-full uppercase tracking-widest">
              {project.pilar}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
