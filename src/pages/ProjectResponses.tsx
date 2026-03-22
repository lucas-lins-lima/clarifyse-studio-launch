import { useState, useMemo } from "react";
import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Download, Search } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const ProjectResponses = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, responses } = useProjectStore();

  const project = useMemo(() => projects.find((p) => p.id === projectId), [projects, projectId]);
  const projectResponses = useMemo(
    () => responses.filter((r) => r.projectId === projectId).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [responses, projectId]
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Projeto não encontrado.</p>
      </div>
    );
  }

  const filteredResponses = projectResponses.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchSearch = r.respondentHash.includes(search) || r.id.includes(search);
    return matchStatus && matchSearch;
  });

  const handleExportExcel = () => {
    const data = filteredResponses.map((response) => {
      const row: Record<string, any> = {
        "ID da Resposta": response.id,
        "Hash do Respondente": response.respondentHash,
        Status: response.status,
        "Iniciada em": new Date(response.startedAt).toLocaleString("pt-BR"),
        "Concluída em": response.completedAt ? new Date(response.completedAt).toLocaleString("pt-BR") : "—",
        "Tempo Total (segundos)": response.totalTimeSeconds || "—",
      };

      // Adicionar respostas de cada pergunta
      project.questions.forEach((question) => {
        const answer = response.answers[question.id];
        if (answer) {
          let answerText = "";
          if (typeof answer === "string") {
            answerText = answer;
          } else if (Array.isArray(answer)) {
            answerText = answer.join("; ");
          } else if (typeof answer === "object" && answer !== null && "value" in answer) {
            answerText = answer.value;
          }
          row[question.config.text] = answerText;
        }
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Respostas");

    XLSX.writeFile(workbook, `${project.slug}-respostas-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Arquivo exportado com sucesso!");
  };

  const handleExportJSON = () => {
    const data = {
      projeto: {
        id: project.id,
        nome: project.name,
        descricao: project.description,
        cliente: project.clientName,
        pesquisador: project.researcherName,
        status: project.status,
        dataPublicacao: project.publishedAt,
        dataEncerramento: project.completedAt,
      },
      respostas: filteredResponses,
      totalRespostas: filteredResponses.length,
      dataExportacao: new Date().toISOString(),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.slug}-respostas-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Arquivo JSON exportado com sucesso!");
  };

  const statusConfig: Record<string, string> = {
    completed: "Completa",
    in_progress: "Em Progresso",
    partial: "Parcial",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/projetos/${projectId}`)}
            className="rounded-md p-1.5 hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} className="text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Respostas</h1>
            <p className="text-sm text-muted-foreground">{project.name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportJSON} className="gap-2">
            <Download size={16} /> JSON
          </Button>
          <Button onClick={handleExportExcel} className="gap-2 bg-secondary hover:bg-secondary/90 text-white">
            <Download size={16} /> Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID ou hash..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Completa</SelectItem>
              <SelectItem value="in_progress">Em Progresso</SelectItem>
              <SelectItem value="partial">Parcial</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Responses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Total: {filteredResponses.length} resposta{filteredResponses.length !== 1 ? "s" : ""}
          </CardTitle>
          <CardDescription>
            Exibindo {filteredResponses.length} de {projectResponses.length} respostas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID da Resposta</TableHead>
                  <TableHead>Hash do Respondente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Iniciada em</TableHead>
                  <TableHead>Concluída em</TableHead>
                  <TableHead className="text-right">Tempo (s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.length > 0 ? (
                  filteredResponses.map((response) => (
                    <TableRow key={response.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs">
                        {response.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {response.respondentHash}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {statusConfig[response.status] || response.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(response.startedAt).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {response.completedAt
                          ? new Date(response.completedAt).toLocaleString("pt-BR")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {response.totalTimeSeconds || "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma resposta encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectResponses;
