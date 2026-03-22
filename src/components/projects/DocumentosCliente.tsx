import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { ProjectDocument } from '@/types/project';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  FileText, FileSpreadsheet, Presentation, Image, File, Download,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

function getFileIcon(tipo: string | null) {
  if (!tipo) return <File className="h-8 w-8 text-muted-foreground" />;
  if (tipo.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
  if (tipo.includes('sheet') || tipo.includes('excel')) return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
  if (tipo.includes('presentation') || tipo.includes('powerpoint')) return <Presentation className="h-8 w-8 text-orange-500" />;
  if (tipo.includes('word') || tipo.includes('msword')) return <FileText className="h-8 w-8 text-blue-600" />;
  if (tipo.includes('image')) return <Image className="h-8 w-8 text-purple-500" />;
  return <File className="h-8 w-8 text-muted-foreground" />;
}

function formatDate(d: string): string {
  try { return format(parseISO(d), "dd/MM/yyyy", { locale: ptBR }); }
  catch { return '—'; }
}

interface Props {
  projectId: string;
}

export function DocumentosCliente({ projectId }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { rootMargin: '200px' },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const { data: docs = [], isLoading } = useQuery<ProjectDocument[]>({
    queryKey: ['cliente-documents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('visivel_cliente', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ProjectDocument[];
    },
    enabled: visible,
    staleTime: 1000 * 60 * 5,
  });

  async function handleDownload(doc: ProjectDocument) {
    try {
      const { data, error } = await supabase.storage
        .from('project-documents')
        .createSignedUrl(doc.storage_path, 3600);
      if (error || !data?.signedUrl) throw new Error('Link não disponível.');
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = doc.nome;
      a.target = '_blank';
      a.rel = 'noreferrer';
      a.click();
    } catch {
      toast.error('Não foi possível gerar o link de download. Tente novamente.');
    }
  }

  return (
    <div ref={sectionRef} className="clarifyse-card p-5">
      <p className="clarifyse-section-label text-xs mb-0.5">DOCUMENTOS</p>
      <h3 className="text-lg font-display font-semibold mb-5">Arquivos do Projeto</h3>

      {!visible || isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <File className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm leading-relaxed max-w-sm mx-auto">
            Os documentos do seu projeto serão disponibilizados aqui conforme o andamento das entregas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {docs.map(doc => (
            <div
              key={doc.id}
              className="border border-border rounded-xl p-4 flex gap-3 items-start hover:bg-muted/20 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">{getFileIcon(doc.tipo_arquivo)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground leading-snug truncate">{doc.nome}</p>
                {doc.descricao && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{doc.descricao}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Disponível desde {formatDate(doc.created_at)}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 gap-1.5 text-xs h-7 border-clarifyse-teal text-clarifyse-teal hover:bg-clarifyse-teal/10"
                  onClick={() => handleDownload(doc)}
                >
                  <Download className="h-3 w-3" />
                  Baixar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
