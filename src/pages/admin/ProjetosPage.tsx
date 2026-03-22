import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loadDB, addProject, deleteProject, getProjectsByUser } from '@/lib/surveyForgeDB';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { HealthThermometer } from '@/components/projects/HealthThermometer';
import { FolderOpen, Plus, Search, MoreVertical, Trash2, Edit3, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const PILARES = ['DISCOVER', 'BRAND', 'INNOVATE', 'DECIDE', 'EXPERIENCE', 'ANALYTICS'];

export default function ProjetosPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    sampleSize: '',
    pilar: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDb(loadDB());
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filteredProjects = useMemo(() => {
    if (!db || !profile) return [];
    const userProjects = getProjectsByUser(user?.id, profile.role);
    return userProjects
      .filter(
        (p: any) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.objective || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a: any, b: any) => {
        try {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } catch {
          return 0;
        }
      });
  }, [db, searchTerm, profile, user?.id]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sampleSize || !formData.pilar || !user?.id) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }
    const newProject = addProject({
      name: formData.name,
      objective: formData.objective,
      sampleSize: parseInt(formData.sampleSize),
      pilar: formData.pilar,
      status: 'Rascunho',
    }, user.id);
    setDb(loadDB());
    setIsModalOpen(false);
    setFormData({ name: '', objective: '', sampleSize: '', pilar: '' });
    toast.success('Projeto criado com sucesso!');
    navigate(`/admin/projetos/${newProject.id}`);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      deleteProject(deleteConfirmId);
      setDb(loadDB());
      setDeleteConfirmId(null);
      toast.success('Projeto excluído com sucesso.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-[#1D9E75] uppercase mb-1">GESTÃO DE PESQUISAS</p>
          <h1 className="text-3xl font-display font-bold text-[#2D1E6B]">Projetos</h1>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] hover:opacity-90 text-white rounded-xl px-6 h-12 font-bold transition-all shadow-lg shadow-purple-900/10"
        >
          <Plus className="h-5 w-5 mr-2" /> Novo Projeto
        </Button>
      </div>

      {/* Filters */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome ou objetivo..."
          className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:ring-[#2D1E6B]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Project List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          Array(3)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-white border border-gray-100" />)
        ) : filteredProjects.length > 0 ? (
          <AnimatePresence>
            {filteredProjects.map((project: any) => {
              const progress =
                project.sampleSize > 0
                  ? Math.min(100, Math.round(((project.responses?.length || 0) / project.sampleSize) * 100))
                  : 0;
              const isAnalysisReady =
                project.status === 'Análise Disponível' ||
                ((project.responses?.length || 0) >= project.sampleSize && project.sampleSize > 0);

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-lg text-[#2D1E6B] truncate group-hover:text-[#1D9E75] transition-colors">
                          {project.name}
                        </h3>
                        <ProjectStatusBadge status={project.status} size="sm" />
                      </div>
                      <p className="text-sm text-[#64748B] line-clamp-1">{project.objective}</p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-[#1D9E75] uppercase tracking-widest">
                        {project.pilar && <span>{project.pilar}</span>}
                        {project.pilar && <span className="text-gray-300">•</span>}
                        <span>Criado em {new Date(project.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="w-full md:w-64 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#64748B] font-medium">Progresso</span>
                        <span className="text-[#2D1E6B] font-bold">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-gray-100" indicatorClassName="bg-[#1D9E75]" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HealthThermometer project={project} />
                          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Saúde</span>
                        </div>
                        <span className="text-xs font-bold text-[#2D1E6B]">
                          {project.responses?.length || 0} / {project.sampleSize}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAnalysisReady ? (
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white rounded-lg font-bold gap-1.5 shadow-md"
                          onClick={() => navigate(`/admin/insights/${project.id}`)}
                        >
                          <BarChart3 className="h-4 w-4" />
                          Insights
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg border-gray-200 text-[#2D1E6B] hover:bg-gray-50"
                          onClick={() => navigate(`/admin/projetos/${project.id}`)}
                        >
                          Gerenciar
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-gray-400 hover:text-[#2D1E6B]">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 rounded-xl">
                          <DropdownMenuItem onClick={() => navigate(`/admin/projetos/${project.id}`)}>
                            <Edit3 className="h-4 w-4 mr-2" /> Gerenciar Projeto
                          </DropdownMenuItem>
                          {isAnalysisReady && (
                            <DropdownMenuItem onClick={() => navigate(`/admin/insights/${project.id}`)}>
                              <BarChart3 className="h-4 w-4 mr-2" /> Ver Insights
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => setDeleteConfirmId(project.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir Projeto
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center space-y-4">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <FolderOpen className="h-8 w-8 text-gray-300" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-[#2D1E6B]">
                {searchTerm ? 'Nenhum projeto encontrado' : 'Nenhum projeto criado'}
              </h3>
              <p className="text-sm text-[#64748B]">
                {searchTerm
                  ? 'Tente buscar com outros termos.'
                  : 'Comece criando um novo projeto de pesquisa.'}
              </p>
            </div>
            {!searchTerm && (
              <Button onClick={() => setIsModalOpen(true)} className="bg-[#2D1E6B] text-white rounded-xl">
                Criar Primeiro Projeto
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden border-none">
          <div className="bg-[#2D1E6B] p-6 text-white">
            <DialogTitle className="text-2xl font-display font-bold">Novo Projeto</DialogTitle>
            <DialogDescription className="text-white/70">
              Inicie uma nova jornada de descoberta e clareza.
            </DialogDescription>
          </div>
          <form onSubmit={handleCreateProject} className="p-6 space-y-6 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest">
                  NOME DO PROJETO *
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Pesquisa de Marca 2026"
                  className="h-12 rounded-xl border-gray-200 focus:ring-[#2D1E6B]"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective" className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest">
                  OBJETIVO DO ESTUDO
                </Label>
                <Textarea
                  id="objective"
                  placeholder="Descreva o que se pretende descobrir..."
                  className="min-h-[100px] rounded-xl border-gray-200 focus:ring-[#2D1E6B]"
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sampleSize" className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest">
                    AMOSTRA TOTAL *
                  </Label>
                  <Input
                    id="sampleSize"
                    type="number"
                    min="1"
                    placeholder="Ex: 500"
                    className="h-12 rounded-xl border-gray-200 focus:ring-[#2D1E6B]"
                    value={formData.sampleSize}
                    onChange={(e) => setFormData({ ...formData, sampleSize: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pilar" className="text-xs font-bold text-[#1D9E75] uppercase tracking-widest">
                    PILAR CLARIFYSE *
                  </Label>
                  <Select onValueChange={(v) => setFormData({ ...formData, pilar: v })} required>
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-[#2D1E6B]">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {PILARES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-[#2D1E6B] to-[#7F77DD] text-white rounded-xl px-8 font-bold shadow-lg shadow-purple-900/20"
              >
                Criar Projeto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-[#2D1E6B]">Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todas as respostas, cotas e configurações do formulário serão
              permanentemente removidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
