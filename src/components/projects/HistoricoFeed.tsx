import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  GitBranch, CalendarCheck, RefreshCw, FileText, Info, ChevronDown,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PAGE_SIZE = 10;

function formatBRT(d: string): string {
  try {
    return format(parseISO(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch { return '—'; }
}

type FeedItem = {
  id: string;
  ts: string;
  icon: React.ReactNode;
  text: string;
  color: string;
};

function buildFeedItems(
  history: any[],
  syncLogs: any[],
  documents: any[],
): FeedItem[] {
  const items: FeedItem[] = [];

  for (const h of history) {
    items.push({
      id: `h-${h.id}`,
      ts: h.created_at,
      icon: <GitBranch className="h-4 w-4" />,
      text: h.descricao,
      color: 'bg-blue-100 text-blue-700',
    });
  }

  for (const s of syncLogs) {
    if (s.status === 'ok') {
      items.push({
        id: `s-${s.id}`,
        ts: s.created_at,
        icon: <RefreshCw className="h-4 w-4" />,
        text: `Dados de campo sincronizados. ${s.rows_processed != null ? `${s.rows_processed} registros processados.` : ''}`,
        color: 'bg-teal-100 text-teal-700',
      });
    }
  }

  for (const d of documents) {
    items.push({
      id: `d-${d.id}`,
      ts: d.created_at,
      icon: <FileText className="h-4 w-4" />,
      text: `Documento disponibilizado: "${d.nome}".`,
      color: 'bg-purple-100 text-purple-700',
    });
  }

  items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
  return items;
}

interface Props {
  projectId: string;
  clientView?: boolean;
}

export function HistoricoFeed({ projectId, clientView = false }: Props) {
  const [page, setPage] = useState(1);

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['project-history', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('project_history')
        .select('id, descricao, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(200);
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: syncLogs = [], isLoading: loadingSync } = useQuery({
    queryKey: ['field-sync-log-feed', projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from('field_sync_log')
        .select('id, status, rows_processed, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: clientView ? ['cliente-documents', projectId] : ['project-documents', projectId],
    queryFn: async () => {
      const q = supabase
        .from('project_documents')
        .select('id, nome, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (clientView) q.eq('visivel_cliente', true);
      const { data } = await q;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = loadingHistory || loadingSync || loadingDocs;
  const allItems = buildFeedItems(history, syncLogs, documents);
  const totalPages = Math.ceil(allItems.length / PAGE_SIZE);
  const pageItems = allItems.slice(0, page * PAGE_SIZE);
  const hasMore = page * PAGE_SIZE < allItems.length;

  return (
    <div className="clarifyse-card p-5">
      <p className="clarifyse-section-label text-xs mb-0.5">HISTÓRICO</p>
      <h3 className="text-lg font-display font-semibold mb-5">Atualizações do Projeto</h3>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : allItems.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Info className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma atualização registrada ainda.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-4 pl-12">
            {pageItems.map((item, idx) => (
              <div key={item.id} className="relative">
                <span className={`absolute -left-[2.75rem] flex h-8 w-8 items-center justify-center rounded-full ${item.color}`}>
                  {item.icon}
                </span>
                <div className="pt-0.5">
                  <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatBRT(item.ts)}</p>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 pl-12">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronDown className="h-3.5 w-3.5" />
                Carregar mais
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
