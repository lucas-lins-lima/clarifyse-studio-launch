import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Users, Edit, Trash2, Ban, CheckCircle } from "lucide-react";
import { useAuthStore, User } from "@/stores/authStore";
import { useActivityStore } from "@/stores/activityStore";
import { toast } from "sonner";

const Researchers = () => {
  const currentUser = useAuthStore((s) => s.currentUser);
  const researchers = useAuthStore((s) => s.getResearchers());
  const { addUser, updateUser, deleteUser } = useAuthStore();
  const addLog = useActivityStore((s) => s.addLog);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");

  const openCreate = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword("");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formEmail.trim()) {
      toast.error("Nome e e-mail são obrigatórios.");
      return;
    }

    if (editingUser) {
      const updates: Partial<User> = { name: formName.trim(), email: formEmail.trim() };
      if (formPassword) updates.password = formPassword;
      updateUser(editingUser.id, updates);
      addLog({ userId: currentUser!.id, userName: currentUser!.name, userRole: currentUser!.role, action: "edit_researcher", details: `Editou pesquisador "${formName}"` });
      toast.success("Pesquisador atualizado!");
    } else {
      if (!formPassword) {
        toast.error("Senha é obrigatória para novo pesquisador.");
        return;
      }
      addUser({ name: formName.trim(), email: formEmail.trim(), password: formPassword, role: "pesquisador" });
      addLog({ userId: currentUser!.id, userName: currentUser!.name, userRole: currentUser!.role, action: "create_researcher", details: `Criou pesquisador "${formName}"` });
      toast.success("Pesquisador criado!");
    }
    setDialogOpen(false);
  };

  const toggleStatus = (user: User) => {
    const newStatus = user.status === "ativo" ? "inativo" : "ativo";
    updateUser(user.id, { status: newStatus });
    addLog({ userId: currentUser!.id, userName: currentUser!.name, userRole: currentUser!.role, action: "toggle_researcher", details: `${newStatus === "ativo" ? "Ativou" : "Desativou"} pesquisador "${user.name}"` });
    toast.success(newStatus === "ativo" ? "Pesquisador ativado" : "Pesquisador desativado");
  };

  const handleDelete = (user: User) => {
    deleteUser(user.id);
    addLog({ userId: currentUser!.id, userName: currentUser!.name, userRole: currentUser!.role, action: "delete_researcher", details: `Excluiu pesquisador "${user.name}"` });
    toast.success("Pesquisador excluído");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Pesquisadores</h1>
          <p className="text-sm text-muted-foreground">Gerencie a equipe de pesquisa</p>
        </div>
        <Button onClick={openCreate} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2">
          <Plus size={18} />
          Novo Pesquisador
        </Button>
      </div>

      {researchers.length > 0 ? (
        <div className="card-studio overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="label-caps px-5 py-3 text-left">Nome</th>
                <th className="label-caps px-5 py-3 text-left">E-mail</th>
                <th className="label-caps px-5 py-3 text-left">Status</th>
                <th className="label-caps px-5 py-3 text-left">Criado em</th>
                <th className="label-caps px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {researchers.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 font-medium text-foreground">{r.name}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{r.email}</td>
                  <td className="px-5 py-4">
                    <Badge variant={r.status === "ativo" ? "default" : "outline"} className={r.status === "ativo" ? "bg-secondary text-secondary-foreground border-none" : ""}>
                      {r.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-md p-1.5 hover:bg-muted transition-colors">
                          <MoreHorizontal size={18} className="text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(r)}>
                          <Edit size={14} className="mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(r)}>
                          {r.status === "ativo" ? (
                            <><Ban size={14} className="mr-2" /> Desativar</>
                          ) : (
                            <><CheckCircle size={14} className="mr-2" /> Ativar</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(r)} className="text-destructive">
                          <Trash2 size={14} className="mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-studio flex flex-col items-center justify-center py-16">
          <Users size={48} className="text-muted-foreground/30 mb-4" />
          <h3 className="font-serif text-lg font-semibold text-foreground mb-1">Nenhum pesquisador cadastrado</h3>
          <p className="text-sm text-muted-foreground mb-4">Adicione pesquisadores à sua equipe.</p>
          <Button onClick={openCreate} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2">
            <Plus size={18} /> Novo Pesquisador
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Pesquisador" : "Novo Pesquisador"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Atualize as informações do pesquisador." : "Preencha os dados para criar um novo pesquisador."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome completo" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@exemplo.com" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>{editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha *"}</Label>
              <Input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Mínimo 8 caracteres" className="h-11" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
              {editingUser ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Researchers;
