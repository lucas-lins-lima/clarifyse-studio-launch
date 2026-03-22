import React, { useState, memo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, MoreHorizontal, Pencil, Trash2, Star, AlertTriangle, Users } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

const PERFIS = ['Público Geral', 'Critério Simples', 'Perfil Segmentado', 'Nicho/Difícil Acesso'];
const FAIXAS = ['Até 15 perguntas', '16-30 perguntas', '31+ perguntas'];

interface Partner {
  id: string;
  nome: string;
  site: string | null;
  email_contato: string | null;
  telefone: string | null;
  notas: string | null;
  status: string;
  created_at: string;
}

interface CPRRow {
  id?: string;
  partner_id: string;
  perfil: string;
  faixa_perguntas: string;
  cpr_valor: number | null;
  data_cotacao: string | null;
}

interface Review {
  id: string;
  project_id: string | null;
  qualidade_amostral: number | null;
  cumprimento_prazo: number | null;
  custo_beneficio: number | null;
  comentario: string | null;
  created_at: string;
}

function isStale(dateStr: string | null): boolean {
  if (!dateStr) return false;
  try {
    return parseISO(dateStr) < subDays(new Date(), 90);
  } catch { return false; }
}

function StarRating({ value, onChange }: { value: number | null; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= (value || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} ${onChange ? 'cursor-pointer hover:text-yellow-400' : ''}`}
          onClick={() => onChange?.(s)}
        />
      ))}
    </div>
  );
}

const PartnerFormDialog = memo(function PartnerFormDialog({
  open, onClose, initial,
}: { open: boolean; onClose: () => void; initial?: Partner | null }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [nome, setNome] = useState(initial?.nome || '');
  const [site, setSite] = useState(initial?.site || '');
  const [email, setEmail] = useState(initial?.email_contato || '');
  const [telefone, setTelefone] = useState(initial?.telefone || '');
  const [notas, setNotas] = useState(initial?.notas || '');
  const [status, setStatus] = useState(initial?.status || 'ativo');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      setNome(initial?.nome || '');
      setSite(initial?.site || '');
      setEmail(initial?.email_contato || '');
      setTelefone(initial?.telefone || '');
      setNotas(initial?.notas || '');
      setStatus(initial?.status || 'ativo');
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setLoading(true);
    try {
      const payload = {
        nome: nome.trim(),
        site: site.trim() || null,
        email_contato: email.trim() || null,
        telefone: telefone.trim() || null,
        notas: notas.trim() || null,
        status,
      };
      if (initial?.id) {
        const { error } = await supabase.from('panel_partners').update(payload).eq('id', initial.id);
        if (error) throw error;
        toast({ title: 'Parceiro atualizado.' });
      } else {
        const { error } = await supabase.from('panel_partners').insert(payload);
        if (error) throw error;
        toast({ title: 'Parceiro cadastrado.' });
      }
      qc.invalidateQueries({ queryKey: ['panel-partners'] });
      onClose();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar Parceiro' : 'Novo Parceiro'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Site</Label><Input value={site} onChange={(e) => setSite(e.target.value)} /></div>
            <div><Label>E-mail de Contato</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={telefone} onChange={(e) => setTelefone(e.target.value)} /></div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Notas</Label><Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} /></div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-gradient-to-r from-[#7B2D8B] to-[#A855F7] text-white border-0"
            disabled={loading || !nome.trim()}
            onClick={(e) => handleSubmit(e as any)}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

function CPRTable({ partnerId }: { partnerId: string }) {
  const { toast } = useToast();
  const { data: rows, isLoading, refetch } = useQuery({
    queryKey: ['partner-cpr', partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('panel_partner_cpr')
        .select('*')
        .eq('partner_id', partnerId);
      if (error) throw error;
      return data as CPRRow[];
    },
  });

  async function upsertCPR(perfil: string, faixa: string, field: 'cpr_valor' | 'data_cotacao', value: string) {
    const existing = rows?.find((r) => r.perfil === perfil && r.faixa_perguntas === faixa);
    const numVal = field === 'cpr_valor' ? (parseFloat(value) || null) : null;
    const dateVal = field === 'data_cotacao' ? (value || null) : null;

    if (existing?.id) {
      await supabase.from('panel_partner_cpr')
        .update(field === 'cpr_valor' ? { cpr_valor: numVal } : { data_cotacao: dateVal })
        .eq('id', existing.id);
    } else {
      await supabase.from('panel_partner_cpr').upsert({
        partner_id: partnerId,
        perfil,
        faixa_perguntas: faixa,
        cpr_valor: field === 'cpr_valor' ? numVal : null,
        data_cotacao: field === 'data_cotacao' ? dateVal : null,
      }, { onConflict: 'partner_id,perfil,faixa_perguntas' });
    }
    refetch();
  }

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  const getRow = (perfil: string, faixa: string) =>
    rows?.find((r) => r.perfil === perfil && r.faixa_perguntas === faixa);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Perfil</TableHead>
            {FAIXAS.map((f) => (
              <TableHead key={f} className="text-center">{f}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {PERFIS.map((perfil) => (
            <TableRow key={perfil}>
              <TableCell className="font-medium text-sm whitespace-nowrap">{perfil}</TableCell>
              {FAIXAS.map((faixa) => {
                const row = getRow(perfil, faixa);
                const stale = isStale(row?.data_cotacao || null);
                return (
                  <TableCell key={faixa} className="p-2">
                    <div className="flex flex-col gap-1 min-w-28">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="R$ —"
                        defaultValue={row?.cpr_valor ?? ''}
                        onBlur={(e) => upsertCPR(perfil, faixa, 'cpr_valor', e.target.value)}
                        className="h-7 text-xs"
                      />
                      <Input
                        type="date"
                        defaultValue={row?.data_cotacao ?? ''}
                        onBlur={(e) => upsertCPR(perfil, faixa, 'data_cotacao', e.target.value)}
                        className="h-7 text-xs"
                      />
                      {stale && (
                        <span className="flex items-center gap-1 text-xs text-orange-600">
                          <AlertTriangle className="h-3 w-3" /> Desatualizada
                        </span>
                      )}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ReviewForm({ partnerId, onDone }: { partnerId: string; onDone: () => void }) {
  const { toast } = useToast();
  const [qual, setQual] = useState<number | null>(null);
  const [prazo, setPrazo] = useState<number | null>(null);
  const [custo, setCusto] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!qual || !prazo || !custo) {
      toast({ title: 'Preencha todas as notas.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('panel_partner_reviews').insert({
        partner_id: partnerId,
        qualidade_amostral: qual,
        cumprimento_prazo: prazo,
        custo_beneficio: custo,
        comentario: comentario.trim() || null,
      });
      if (error) throw error;
      toast({ title: 'Avaliação registrada.' });
      onDone();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
      <p className="text-sm font-semibold">Registrar Avaliação</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs">Qualidade Amostral</Label>
          <StarRating value={qual} onChange={setQual} />
        </div>
        <div>
          <Label className="text-xs">Cumprimento de Prazo</Label>
          <StarRating value={prazo} onChange={setPrazo} />
        </div>
        <div>
          <Label className="text-xs">Custo-Benefício</Label>
          <StarRating value={custo} onChange={setCusto} />
        </div>
      </div>
      <div>
        <Label className="text-xs">Comentário (opcional)</Label>
        <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} className="text-sm" />
      </div>
      <Button size="sm" onClick={submit} disabled={loading || !qual || !prazo || !custo}
        className="bg-gradient-to-r from-[#7B2D8B] to-[#A855F7] text-white border-0">
        {loading ? 'Salvando...' : 'Registrar Avaliação'}
      </Button>
    </div>
  );
}

function PartnerDetail({ partner }: { partner: Partner }) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { data: reviews, refetch } = useQuery({
    queryKey: ['partner-reviews', partner.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('panel_partner_reviews')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="cpr">
        <TabsList>
          <TabsTrigger value="cpr">Tabela de CPR</TabsTrigger>
          <TabsTrigger value="reviews">Avaliações</TabsTrigger>
        </TabsList>
        <TabsContent value="cpr" className="mt-4">
          <CPRTable partnerId={partner.id} />
        </TabsContent>
        <TabsContent value="reviews" className="mt-4 space-y-4">
          <Button size="sm" variant="outline" onClick={() => setShowReviewForm((v) => !v)}>
            {showReviewForm ? 'Cancelar' : '+ Nova Avaliação'}
          </Button>
          {showReviewForm && (
            <ReviewForm partnerId={partner.id} onDone={() => { setShowReviewForm(false); refetch(); }} />
          )}
          {reviews?.length ? (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="p-4 bg-muted/30 rounded-xl">
                  <div className="flex flex-wrap gap-4 mb-2">
                    <div><p className="text-xs text-muted-foreground">Qualidade</p><StarRating value={r.qualidade_amostral} /></div>
                    <div><p className="text-xs text-muted-foreground">Prazo</p><StarRating value={r.cumprimento_prazo} /></div>
                    <div><p className="text-xs text-muted-foreground">Custo-Benefício</p><StarRating value={r.custo_beneficio} /></div>
                  </div>
                  {r.comentario && <p className="text-sm text-muted-foreground italic">"{r.comentario}"</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(parseISO(r.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma avaliação registrada.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ParceirosTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Partner | null>(null);
  const [selected, setSelected] = useState<Partner | null>(null);

  const { data: partners, isLoading } = useQuery({
    queryKey: ['panel-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('panel_partners')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data as Partner[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('panel_partners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Parceiro removido.' });
      qc.invalidateQueries({ queryKey: ['panel-partners'] });
      if (selected) setSelected(null);
    },
    onError: (err: any) => toast({ title: 'Erro', description: err.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="clarifyse-section-label text-xs mb-1">FORNECEDORES</p>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Parceiros de Painel de Amostra
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">Gerencie fornecedores de painéis e suas tabelas de CPR.</p>
          </div>
          <Button size="sm" onClick={() => { setEditTarget(null); setFormOpen(true); }}
            className="bg-gradient-to-r from-[#7B2D8B] to-[#A855F7] text-white border-0">
            <Plus className="h-4 w-4 mr-1.5" /> Novo Parceiro
          </Button>
        </div>
      </motion.div>

      <div className="clarifyse-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                ))}</TableRow>
              ))
            ) : !partners?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Nenhum parceiro cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              partners.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setSelected(p)}
                >
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.email_contato || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.telefone || '—'}</TableCell>
                  <TableCell>
                    <Badge className={p.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {p.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditTarget(p); setFormOpen(true); }}>
                          <Pencil className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`Remover parceiro "${p.nome}"?`)) deleteMutation.mutate(p.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Partner detail panel */}
      {selected && (
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="clarifyse-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg">{selected.nome}</h3>
              {selected.site && <a href={selected.site} target="_blank" rel="noreferrer" className="text-sm text-teal-600 hover:underline">{selected.site}</a>}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Fechar</Button>
          </div>
          <PartnerDetail partner={selected} />
        </motion.div>
      )}

      <PartnerFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editTarget}
      />
    </div>
  );
}
