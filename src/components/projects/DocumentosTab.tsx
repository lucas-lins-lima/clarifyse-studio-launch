import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectDocument } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText, FileSpreadsheet, Presentation, Image, File,
  Upload, Download, Pencil, Trash2, Eye, EyeOff, Plus, RefreshCw,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
].join(',');

const MAX_SIZE_BYTES = 50 * 1024 * 1024;

function getFileIcon(tipo: string | null) {
  if (!tipo) return <File className="h-5 w-5 text-muted-foreground" />;
  if (tipo.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  if (tipo.includes('sheet') || tipo.includes('excel')) return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  if (tipo.includes('presentation') || tipo.includes('powerpoint')) return <Presentation className="h-5 w-5 text-orange-500" />;
  if (tipo.includes('word') || tipo.includes('msword')) return <FileText className="h-5 w-5 text-blue-600" />;
  if (tipo.includes('image')) return <Image className="h-5 w-5 text-purple-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: string): string {
  try { return format(parseISO(d), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }); }
  catch { return '—'; }
}

interface UploadState {
  nome: string;
  descricao: string;
  visivel_cliente: boolean;
  file: File | null;
}

const defaultUpload: UploadState = { nome: '', descricao: '', visivel_cliente: true, file: null };

interface Props {
  projectId: string;
}

export function DocumentosTab({ projectId }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>(defaultUpload);
  const [uploading, setUploading] = useState(false);
  const [editDoc, setEditDoc] = useState<ProjectDocument | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [deleteDoc, setDeleteDoc] = useState<ProjectDocument | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);

  const { data: docs = [], isLoading } = useQuery<ProjectDocument[]>({
    queryKey: ['project-documents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as ProjectDocument[];
    },
  });

  async function getSignedUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('project-documents')
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) throw new Error('Não foi possível gerar link de download.');
    return data.signedUrl;
  }

  async function handleDownload(doc: ProjectDocument) {
    try {
      const url = await getSignedUrl(doc.storage_path);
      window.open(url, '_blank');
    } catch {
      toast.error('Erro ao abrir documento.');
    }
  }

  async function handleUpload() {
    if (!uploadState.file || !uploadState.nome.trim()) {
      toast.error('Preencha o nome e selecione um arquivo.');
      return;
    }
    if (uploadState.file.size > MAX_SIZE_BYTES) {
      toast.error('Arquivo excede o limite de 50 MB.');
      return;
    }
    setUploading(true);
    try {
      // Agora enviamos o arquivo real para o adaptador do Google Drive
      const { error: dbErr } = await supabase.from('project_documents').insert({
        project_id: projectId,
        nome: uploadState.nome.trim(),
        descricao: uploadState.descricao.trim() || null,
        visivel_cliente: uploadState.visivel_cliente,
        uploaded_by: user?.id,
        file: uploadState.file, // Passamos o objeto File para o adaptador tratar o upload no Drive
      });
      if (dbErr) throw dbErr;

      await qc.invalidateQueries({ queryKey: ['project-documents', projectId] });
      await qc.invalidateQueries({ queryKey: ['project-history', projectId] });
      toast.success('Documento adicionado com sucesso.');
      setShowUpload(false);
      setUploadState(defaultUpload);
    } catch (e: any) {
      toast.error(`Erro ao enviar documento: ${e?.message ?? 'tente novamente.'}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleEditSave() {
    if (!editDoc) return;
    const { error } = await supabase
      .from('project_documents')
      .update({ nome: editNome.trim(), descricao: editDesc.trim() || null })
      .eq('id', editDoc.id);
    if (error) { toast.error('Erro ao salvar alterações.'); return; }
    await qc.invalidateQueries({ queryKey: ['project-documents', projectId] });
    toast.success('Documento atualizado.');
    setEditDoc(null);
  }

  async function handleToggleVisibility(doc: ProjectDocument) {
    const { error } = await supabase
      .from('project_documents')
      .update({ visivel_cliente: !doc.visivel_cliente })
      .eq('id', doc.id);
    if (error) { toast.error('Erro ao alterar visibilidade.'); return; }
    await qc.invalidateQueries({ queryKey: ['project-documents', projectId] });
    toast.success(doc.visivel_cliente ? 'Documento ocultado do cliente.' : 'Documento visível ao cliente.');
  }

  async function handleDelete() {
    if (!deleteDoc) return;
    const { error: storageErr } = await supabase.storage
      .from('project-documents')
      .remove([deleteDoc.storage_path]);
    if (storageErr) console.warn('Storage remove error:', storageErr.message);

    const { error: dbErr } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', deleteDoc.id);
    if (dbErr) { toast.error('Erro ao remover documento.'); return; }

    await qc.invalidateQueries({ queryKey: ['project-documents', projectId] });
    toast.success('Documento removido.');
    setDeleteDoc(null);
  }

  async function handleReplace(docId: string, file: File) {
    if (file.size > MAX_SIZE_BYTES) { toast.error('Arquivo excede 50 MB.'); return; }
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;
    setReplacingId(docId);
    try {
      if (doc.storage_path) {
        await supabase.storage.from('project-documents').remove([doc.storage_path]);
      }
      const ext = file.name.split('.').pop() ?? 'bin';
      const path = `${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: storageErr } = await supabase.storage
        .from('project-documents')
        .upload(path, file, { upsert: false });
      if (storageErr) throw storageErr;

      const { error: dbErr } = await supabase
        .from('project_documents')
        .update({ storage_path: path, tipo_arquivo: file.type, tamanho_bytes: file.size })
        .eq('id', docId);
      if (dbErr) throw dbErr;

      await qc.invalidateQueries({ queryKey: ['project-documents', projectId] });
      toast.success('Arquivo substituído com sucesso.');
    } catch (e: any) {
      toast.error(`Erro ao substituir arquivo: ${e?.message}`);
    } finally {
      setReplacingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="clarifyse-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="clarifyse-section-label text-xs mb-0.5">DOCUMENTOS</p>
            <h3 className="text-lg font-display font-semibold">Arquivos do Projeto</h3>
          </div>
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white"
            onClick={() => { setUploadState(defaultUpload); setShowUpload(true); }}
          >
            <Plus className="h-4 w-4" />
            Adicionar Documento
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <File className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum documento adicionado ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map(doc => (
              <div
                key={doc.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="mt-0.5 flex-shrink-0">{getFileIcon(doc.tipo_arquivo)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground truncate">{doc.nome}</span>
                    {doc.visivel_cliente ? (
                      <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">Visível ao cliente</span>
                    ) : (
                      <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">Oculto ao cliente</span>
                    )}
                  </div>
                  {doc.descricao && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{doc.descricao}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(doc.created_at)} · {formatBytes(doc.tamanho_bytes)}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    title="Baixar"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    title="Editar"
                    onClick={() => { setEditDoc(doc); setEditNome(doc.nome); setEditDesc(doc.descricao ?? ''); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    title={doc.visivel_cliente ? 'Ocultar do cliente' : 'Tornar visível ao cliente'}
                    onClick={() => handleToggleVisibility(doc)}
                  >
                    {doc.visivel_cliente ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    title="Substituir arquivo"
                    disabled={replacingId === doc.id}
                    onClick={() => {
                      if (replaceRef.current) {
                        replaceRef.current.dataset.docid = doc.id;
                        replaceRef.current.click();
                      }
                    }}
                  >
                    {replacingId === doc.id
                      ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      : <Upload className="h-3.5 w-3.5" />
                    }
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    title="Remover"
                    onClick={() => setDeleteDoc(doc)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden replace file input */}
      <input
        ref={replaceRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES}
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          const docId = (e.target as HTMLInputElement).dataset.docid;
          if (file && docId) handleReplace(docId, file);
          e.target.value = '';
        }}
      />

      {/* Upload modal */}
      <Dialog open={showUpload} onOpenChange={open => { if (!uploading) { setShowUpload(open); if (!open) setUploadState(defaultUpload); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="doc-nome">Nome do documento *</Label>
              <Input
                id="doc-nome"
                placeholder="Ex: Relatório Final Q1"
                value={uploadState.nome}
                onChange={e => setUploadState(s => ({ ...s, nome: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="doc-desc">Descrição (opcional)</Label>
              <Input
                id="doc-desc"
                placeholder="Breve descrição do arquivo"
                value={uploadState.descricao}
                onChange={e => setUploadState(s => ({ ...s, descricao: e.target.value }))}
              />
            </div>
            <div>
              <Label>Arquivo</Label>
              <div
                className="mt-1 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {uploadState.file ? (
                  <div className="flex items-center justify-center gap-2">
                    {getFileIcon(uploadState.file.type)}
                    <span className="text-sm font-medium truncate max-w-xs">{uploadState.file.name}</span>
                    <span className="text-xs text-muted-foreground">({formatBytes(uploadState.file.size)})</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Clique para selecionar ou arraste o arquivo</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, PPT, PPTX, XLSX, DOCX, PNG, JPG — máx. 50 MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_MIME_TYPES}
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > MAX_SIZE_BYTES) { toast.error('Arquivo excede 50 MB.'); return; }
                    setUploadState(s => ({ ...s, file, nome: s.nome || file.name.replace(/\.[^.]+$/, '') }));
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="visivel-toggle" className="cursor-pointer">Visível ao cliente</Label>
              <Switch
                id="visivel-toggle"
                checked={uploadState.visivel_cliente}
                onCheckedChange={v => setUploadState(s => ({ ...s, visivel_cliente: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)} disabled={uploading}>Cancelar</Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !uploadState.file || !uploadState.nome.trim()}
              className="bg-gradient-to-r from-clarifyse-purple-start to-clarifyse-purple-end text-white"
            >
              {uploading ? 'Enviando...' : 'Enviar Documento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editDoc} onOpenChange={open => { if (!open) setEditDoc(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={editNome} onChange={e => setEditNome(e.target.value)} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoc(null)}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={!editNome.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteDoc} onOpenChange={open => { if (!open) setDeleteDoc(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover documento?</AlertDialogTitle>
            <AlertDialogDescription>
              O arquivo <strong>"{deleteDoc?.nome}"</strong> será removido permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
