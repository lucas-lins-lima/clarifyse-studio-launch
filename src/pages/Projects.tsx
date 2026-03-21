import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Trash2,
  Eye,
  Edit,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const mockProjects = [
  { id: "1", name: "Satisfação do Cliente 2025", client: "Banco Alpha", status: "active", current: 342, target: 500, quotas: 3, createdAt: "15/01/2025", researcher: "Ana Costa" },
  { id: "2", name: "Pesquisa de Mercado - Fintech", client: "TechPay", status: "active", current: 360, target: 800, quotas: 5, createdAt: "20/01/2025", researcher: "Carlos Lima" },
  { id: "3", name: "Avaliação Institucional", client: "UniClarifyse", status: "paused", current: 276, target: 300, quotas: 2, createdAt: "10/01/2025", researcher: "Maria Silva" },
  { id: "4", name: "NPS Trimestral Q1", client: "SeguraTech", status: "completed", current: 400, target: 400, quotas: 4, createdAt: "05/01/2025", researcher: "Ana Costa" },
  { id: "5", name: "Clima Organizacional", client: "Grupo Nexus", status: "draft", current: 0, target: 200, quotas: 0, createdAt: "22/01/2025", researcher: "Carlos Lima" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className?: string }> = {
  active: { label: "Ativo", variant: "default", className: "bg-secondary text-secondary-foreground border-none" },
  paused: { label: "Pausado", variant: "outline" },
  completed: { label: "Encerrado", variant: "secondary" },
  draft: { label: "Rascunho", variant: "outline", className: "border-dashed" },
};

const Projects = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockProjects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Projetos</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas pesquisas</p>
        </div>
        <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2">
          <Plus size={18} />
          Novo Projeto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
            <SelectItem value="completed">Encerrado</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="card-studio overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="label-caps px-5 py-3 text-left">Nome</th>
                <th className="label-caps px-5 py-3 text-left">Cliente</th>
                <th className="label-caps px-5 py-3 text-left">Status</th>
                <th className="label-caps px-5 py-3 text-left">Amostra</th>
                <th className="label-caps px-5 py-3 text-center">Cotas</th>
                <th className="label-caps px-5 py-3 text-left">Criado em</th>
                <th className="label-caps px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((project) => {
                const progress = project.target > 0 ? Math.round((project.current / project.target) * 100) : 0;
                const sc = statusConfig[project.status];
                return (
                  <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.researcher}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{project.client}</td>
                    <td className="px-5 py-4">
                      <Badge variant={sc.variant} className={sc.className}>
                        {sc.label}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="w-32">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{project.current}/{project.target}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-muted-foreground">{project.quotas}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">{project.createdAt}</td>
                    <td className="px-5 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="rounded-md p-1.5 hover:bg-muted transition-colors">
                            <MoreHorizontal size={18} className="text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye size={14} className="mr-2" /> Ver</DropdownMenuItem>
                          <DropdownMenuItem><Edit size={14} className="mr-2" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem><Copy size={14} className="mr-2" /> Duplicar</DropdownMenuItem>
                          {project.status === "active" && (
                            <DropdownMenuItem><Pause size={14} className="mr-2" /> Pausar</DropdownMenuItem>
                          )}
                          {project.status === "paused" && (
                            <DropdownMenuItem><Play size={14} className="mr-2" /> Retomar</DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 size={14} className="mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Projects;
