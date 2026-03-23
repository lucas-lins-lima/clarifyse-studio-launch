import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Play, BarChart3, Share2, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ShareTabProps {
  project: any;
  onPublish: () => void;
  isLocked: boolean;
  onProjectUpdate?: (updatedProject: any) => void;
}

export default function ShareTab({ project, onPublish, isLocked, onProjectUpdate }: ShareTabProps) {
  const navigate = useNavigate();
  const [isPublishing, setIsPublishing] = React.useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copiado!`);
    }).catch(() => {
      toast.error('Erro ao copiar. Tente manualmente.');
    });
  };

  const handlePublishToBackend = async () => {
    if (!project || isPublishing) return;
    
    setIsPublishing(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      
      // Limpar respostas locais antes de publicar para o backend
      const projectToPublish = {
        ...project,
        responses: []
      };

      const response = await fetch(`${apiUrl}/api/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectToPublish)
      });

      if (!response.ok) {
        throw new Error('Erro ao publicar no backend');
      }

      const result = await response.json();
      
      // Importar dinamicamente para evitar problemas de escopo se necessário, 
      // mas como estamos em um componente React, assumimos que as funções de lib estão disponíveis
      // via props ou importação direta se o arquivo permitir.
      
      // Atualizar projeto com publicLink e status do backend
      const updatedProject = {
        ...project,
        publicLink: result.publicLink,
        status: 'Formulário Pronto'
      };
      
      // Persistir no localStorage para que o admin veja o link e o status atualizado
      // O ProjectDetailPage já tem handleProjectUpdate que chama updateProject do lib
      if (onProjectUpdate) {
        onProjectUpdate(updatedProject);
      }
      
      toast.success('Formulário publicado no backend com sucesso!');
    } catch (error) {
      console.error('Erro ao publicar:', error);
      toast.error('Erro ao publicar formulário. Verifique a conexão com o backend.');
    } finally {
      setIsPublishing(false);
    }
  };

  const publicLink = project.publicLink || `${window.location.origin}/survey/${project.id}`;
  const isPublished = project.status !== 'Rascunho';

  return (
    <div className="space-y-6">
      {/* Status de publicação */}
      {!isPublished ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4"
        >
          <div className="flex-1">
            <h3 className="font-bold text-amber-800 mb-1">Formulário não publicado</h3>
            <p className="text-sm text-amber-700">
              Publique o formulário para gerar o link público e começar a coletar respostas.
            </p>
          </div>
          <Button
            onClick={handlePublishToBackend}
            disabled={isPublishing}
            className="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white rounded-xl px-6 font-bold shadow-lg flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-4 w-4 mr-2" /> {isPublishing ? 'Publicando...' : 'Publicar Agora'}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3"
        >
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <p className="text-sm font-bold text-green-700">
            Formulário publicado e disponível para respostas.
          </p>
        </motion.div>
      )}

      {/* Link Público */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D1E6B]/10 flex items-center justify-center flex-shrink-0">
            <Link2 className="h-5 w-5 text-[#2D1E6B]" />
          </div>
          <div>
            <h3 className="font-bold text-[#2D1E6B]">Link Público para Respondentes</h3>
            <p className="text-xs text-[#64748B]">Compartilhe este link com os participantes da pesquisa.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-[#F1EFE8] rounded-xl">
          <p className="flex-1 text-sm text-[#2D1E6B] font-medium truncate font-mono">
            {publicLink}
          </p>
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
              disabled={!isPublished}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isPublished && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(publicLink, 'Link público')}
              className="rounded-xl border-[#2D1E6B] text-[#2D1E6B] hover:bg-[#2D1E6B]/5 font-bold gap-2"
            >
              <Copy className="h-4 w-4" /> Copiar Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(publicLink, '_blank')}
              className="rounded-xl border-gray-200 text-[#64748B] hover:bg-gray-50 font-bold gap-2"
            >
              <ExternalLink className="h-4 w-4" /> Abrir Formulário
            </Button>
          </div>
        )}
      </div>

      {/* Integração com Insights */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-[#1D9E75]" />
          </div>
          <div>
            <h3 className="font-bold text-[#2D1E6B]">Integração com Clarifyse Insights</h3>
            <p className="text-xs text-[#64748B]">Use o ID do projeto para vincular no Clarifyse Insights.</p>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-[#2D1E6B]/5 to-[#1D9E75]/5 rounded-xl border border-[#1D9E75]/20">
          <p className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest mb-2">ID DO PROJETO</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono font-bold text-[#2D1E6B] bg-white px-3 py-2 rounded-lg border border-gray-100">
              {project.id}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(project.id, 'ID do projeto')}
              className="h-9 w-9 rounded-lg text-[#1D9E75] hover:bg-[#1D9E75]/10"
              title="Copiar ID"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-[#64748B] mt-2">
            Use este ID para vincular o projeto no Clarifyse Insights.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(project.id, 'ID do projeto')}
            className="rounded-xl border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75]/5 font-bold gap-2"
          >
            <Copy className="h-4 w-4" /> Copiar ID
          </Button>
          <Button
            size="sm"
            onClick={() => navigate(`/admin/insights/${project.id}`)}
            className="rounded-xl bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white font-bold gap-2"
          >
            <BarChart3 className="h-4 w-4" /> Abrir no Insights
          </Button>
        </div>
      </div>

      {/* Informações do projeto */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-[#2D1E6B]">Informações do Projeto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Status</p>
            <p className="text-sm font-bold text-[#2D1E6B]">{project.status}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Amostra Total</p>
            <p className="text-sm font-bold text-[#2D1E6B]">{project.sampleSize} respondentes</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Respostas Coletadas</p>
            <p className="text-sm font-bold text-[#2D1E6B]">{project.responses?.length || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Perguntas no Formulário</p>
            <p className="text-sm font-bold text-[#2D1E6B]">{project.formQuestions?.length || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Criado em</p>
            <p className="text-sm font-bold text-[#2D1E6B]">
              {new Date(project.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
                timeZone: 'America/Sao_Paulo'
              })}
            </p>
          </div>
          {project.lastResponseAt && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Última Resposta</p>
              <p className="text-sm font-bold text-[#2D1E6B]">
                {new Date(project.lastResponseAt).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                  timeZone: 'America/Sao_Paulo'
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
