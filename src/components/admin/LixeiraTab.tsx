import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';

interface TrashedProject {
  id: string;
  nome: string;
  cliente_empresa: string | null;
  status: string;
  deleted_at: string;
  gerente_name?: string | null;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd/MM/yyyy', { locale: ptBR }); }
  catch { return d; }
}

export function LixeiraTab() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: trashed, isLoading } = useQuery({
    queryKey: ['trashed-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, nome, cliente_empresa, status, deleted_at, gerente_id')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });
      if (error) throw error;
      if (!data?.length) return [] as TrashedProject[];

      const gerenteIds = [...new Set(data.map((p: any) => p.gerente_id).filter(Boolean))];
      let gerenteMap: Record<string, string> = {};
      if (gerenteIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', gerenteIds);
        (profs || []).forEach((p: any) => { gerenteMap[p.id] = p.name; });
      }
      return data.map((p: any) => ({
        ...p,
        gerente_name: p.gerente_id ? (gerenteMap[p.gerente_id] || null) : null,
      })) as TrashedProject[];
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Projeto restaurado com sucesso.' });
      qc.invalidateQueries({ queryKey: ['trashed-projects'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Projeto excluído permanentemente.' });
      qc.invalidateQueries({ queryKey: ['trashed-projects'] });
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  function handlePermanentDelete(id: string, nome: string) {
    if (!confirm(`ATENÇÃO: Esta ação é irreversível.\n\nTem certeza que deseja excluir permanentemente o projeto "${nome}"?\n\nTodos os dados associados (cronograma, campo, documentos, financeiro, histórico) serão deletados.`)) return;
    permanentDeleteMutation.mutate(id);
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="clarifyse-section-label text-xs mb-1">GERENCIAMENTO</p>
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h2 className="text-xl font-display font-bold text-foreground">Lixeira de Projetos</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Projetos movidos para a lixeira. Restaure ou exclua permanentemente.
        </p>
      </motion.div>

      {!isLoading && !trashed?.length ? (
        <div className="clarifyse-card p-12 text-center text-muted-foreground">
          <Trash2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>A lixeira está vazia.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>A exclusão permanente remove todos os dados associados ao projeto e não pode ser desfeita.</span>
          </div>
          <div className="clarifyse-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente / Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gerente</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead className="w-36"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}</TableRow>
                  ))
                ) : (
                  trashed!.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.cliente_empresa || '—'}</TableCell>
                      <TableCell><ProjectStatusBadge status={p.status as any} size="sm" /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.gerente_name || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(p.deleted_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() => restoreMutation.mutate(p.id)}
                            disabled={restoreMutation.isPending}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Restaurar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => handlePermanentDelete(p.id, p.nome)}
                            disabled={permanentDeleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
