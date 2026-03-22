import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Download, Search, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { ActivityLog, ActivityCategory, ACTIVITY_CATEGORY_LABELS } from '@/types/project';
import { motion } from 'framer-motion';

const PAGE_SIZE = 50;

const CATEGORY_COLORS: Record<ActivityCategory | string, string> = {
  autenticacao: 'bg-blue-100 text-blue-700',
  projetos: 'bg-purple-100 text-purple-700',
  clientes: 'bg-teal-100 text-teal-700',
  gerentes: 'bg-indigo-100 text-indigo-700',
  campo: 'bg-green-100 text-green-700',
  financeiro: 'bg-yellow-100 text-yellow-700',
  documentos: 'bg-orange-100 text-orange-700',
  configuracoes: 'bg-gray-100 text-gray-700',
  acessos: 'bg-pink-100 text-pink-700',
  nps: 'bg-cyan-100 text-cyan-700',
};

function formatDatetime(d: string) {
  try {
    return format(parseISO(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return d;
  }
}

export function ActivityLogTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('30');

  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = useCallback((v: string) => {
    setSearch(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 300);
  }, []);

  const dateFrom = periodFilter !== 'all'
    ? subDays(new Date(), parseInt(periodFilter)).toISOString()
    : null;

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', page, debouncedSearch, categoryFilter, periodFilter],
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (debouncedSearch.trim()) {
        query = query.or(
          `action.ilike.%${debouncedSearch}%,user_name.ilike.%${debouncedSearch}%,context.ilike.%${debouncedSearch}%`
        );
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: (data || []) as ActivityLog[], total: count || 0 };
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  function exportExcel() {
    if (!data?.logs.length) return;
    const rows = data.logs.map((l) => ({
      'Data/Hora': formatDatetime(l.created_at),
      'Usuário': l.user_name,
      'Perfil': l.user_role,
      'Categoria': ACTIVITY_CATEGORY_LABELS[l.category as ActivityCategory] || l.category,
      'Ação': l.action,
      'Contexto': l.context || '',
      'IP': l.ip_address || '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Log de Atividades');
    XLSX.writeFile(wb, `Log_Atividades_Clarifyse_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="clarifyse-section-label text-xs mb-1">AUDITORIA</p>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Log de Atividades
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Registro cronológico de todas as ações realizadas na plataforma. Retenção: 90 dias.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportExcel} disabled={!data?.logs.length}>
            <Download className="h-4 w-4 mr-1.5" />
            Exportar Log (Excel)
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ação, usuário ou contexto..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {Object.entries(ACTIVITY_CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={(v) => { setPeriodFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="clarifyse-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Contexto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.logs.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDatetime(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{log.user_name || '—'}</div>
                    <div className="text-xs text-muted-foreground capitalize">{log.user_role}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${CATEGORY_COLORS[log.category] || 'bg-gray-100 text-gray-700'}`}>
                      {ACTIVITY_CATEGORY_LABELS[log.category as ActivityCategory] || log.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {log.context || '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data?.total} registro{data?.total !== 1 ? 's' : ''} — Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
