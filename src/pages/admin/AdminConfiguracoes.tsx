import React, { useState, useEffect } from 'react';
import { loadDB, updateSettings, getAllUsers, addUser, updateUser, deleteUser } from '@/lib/surveyForgeDB';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Building2, Users, Save, UserPlus, Edit3, Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AdminConfiguracoes() {
  const [db, setDb] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isResetPasswordConfirmOpen, setIsResetPasswordConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Form states
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '' });
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', status: 'active' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const loadedDb = loadDB();
      setDb(loadedDb);
      setUsers(getAllUsers());
      setSettings(loadedDb.settings);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveSettings = () => {
    if (!settings) return;
    updateSettings(settings);
    toast.success('Configurações salvas com sucesso!');
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (!newUserForm.email.includes('@')) {
      toast.error('E-mail inválido.');
      return;
    }
    if (users.some(u => u.email === newUserForm.email)) {
      toast.error('Este e-mail já está cadastrado.');
      return;
    }

    const newUser = addUser({
      name: newUserForm.name,
      email: newUserForm.email,
      password: newUserForm.password,
      empresa: 'Clarifyse',
      cargo: 'Pesquisador'
    });

    setUsers(getAllUsers());
    setIsAddUserModalOpen(false);
    setNewUserForm({ name: '', email: '', password: '' });
    toast.success(`Pesquisador "${newUser.name}" adicionado com sucesso! Senha temporária: ${newUserForm.password}`);
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const updated = updateUser(selectedUser.id, {
      name: editUserForm.name,
      email: editUserForm.email,
      status: editUserForm.status
    });

    if (updated) {
      setUsers(getAllUsers());
      setIsEditUserModalOpen(false);
      setSelectedUser(null);
      toast.success('Usuário atualizado com sucesso!');
    }
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;
    deleteUser(selectedUser.id);
    setUsers(getAllUsers());
    setIsDeleteConfirmOpen(false);
    setSelectedUser(null);
    toast.success('Usuário removido com sucesso!');
  };

  const handleResetPassword = () => {
    if (!selectedUser) return;
    const tempPassword = Math.random().toString(36).substr(2, 10);
    updateUser(selectedUser.id, {
      password: tempPassword,
      requiresPasswordChange: true
    });
    setUsers(getAllUsers());
    setIsResetPasswordConfirmOpen(false);
    setSelectedUser(null);
    toast.success(`Senha redefinida! Nova senha temporária: ${tempPassword}`);
  };

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setEditUserForm({
      name: user.name,
      email: user.email,
      status: user.status
    });
    setIsEditUserModalOpen(true);
  };

  if (loading || !db || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 text-[#2D1E6B]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-[#1D9E75] uppercase mb-1">CONFIGURAÇÕES</p>
        <h1 className="text-3xl font-display font-bold text-[#2D1E6B]">Gestão da Plataforma</h1>
      </div>

      <Tabs defaultValue="empresa" className="space-y-6">
        <TabsList className="bg-white border border-gray-100 p-1 rounded-xl h-14 shadow-sm">
          <TabsTrigger value="empresa" className="rounded-lg px-6 data-[state=active]:bg-[#2D1E6B] data-[state=active]:text-white gap-2">
            <Building2 className="h-4 w-4" /> Dados da Empresa
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="rounded-lg px-6 data-[state=active]:bg-[#2D1E6B] data-[state=active]:text-white gap-2">
            <Users className="h-4 w-4" /> Usuários da Equipe
          </TabsTrigger>
        </TabsList>

        {/* Dados da Empresa */}
        <TabsContent value="empresa">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-gray-100 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="text-[#2D1E6B] font-display">Identidade Institucional</CardTitle>
                <CardDescription>Gerencie as informações básicas da Clarifyse no SurveyForge.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">Nome da Empresa</Label>
                      <Input
                        value={settings.nomeEmpresa}
                        onChange={(e) => setSettings({ ...settings, nomeEmpresa: e.target.value })}
                        className="h-12 rounded-xl border-gray-200 focus:ring-[#2D1E6B]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">Slogan</Label>
                      <Input
                        value={settings.slogan}
                        onChange={(e) => setSettings({ ...settings, slogan: e.target.value })}
                        className="h-12 rounded-xl border-gray-200 focus:ring-[#2D1E6B]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">E-mail de Contato</Label>
                      <Input
                        type="email"
                        value={settings.emailContato || ''}
                        onChange={(e) => setSettings({ ...settings, emailContato: e.target.value })}
                        className="h-12 rounded-xl border-gray-200 focus:ring-[#2D1E6B]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleSaveSettings}
                      className="bg-[#2D1E6B] hover:bg-[#1D9E75] text-white rounded-xl px-8 h-12 font-bold transition-all"
                    >
                      <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Usuários da Equipe */}
        <TabsContent value="usuarios">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-[#2D1E6B]">Membros da Equipe</h3>
                <p className="text-sm text-[#64748B] mt-1">{users.length} usuário(s) cadastrado(s)</p>
              </div>
              <Button
                onClick={() => setIsAddUserModalOpen(true)}
                className="bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-xl font-bold"
              >
                <UserPlus className="h-4 w-4 mr-2" /> Adicionar Pesquisador
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {users.map((user) => (
                <Card key={user.id} className="border-gray-100 shadow-sm rounded-xl hover:border-[#1D9E75]/30 transition-all">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-[#2D1E6B]/5 flex items-center justify-center text-[#2D1E6B] font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#2D1E6B]">{user.name}</p>
                          <p className="text-xs text-[#64748B]">{user.email}</p>
                          <p className="text-[10px] text-[#1D9E75] font-bold uppercase tracking-wider mt-1">{user.cargo}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Pesquisador'}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md ${
                          user.status === 'active'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                      {user.role !== 'admin' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(user)}
                            className="text-[#2D1E6B] hover:bg-[#2D1E6B]/10"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsResetPasswordConfirmOpen(true);
                            }}
                            className="text-[#1D9E75] hover:bg-[#1D9E75]/10"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteConfirmOpen(true);
                            }}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[#2D1E6B]">Adicionar Pesquisador</DialogTitle>
            <DialogDescription>Crie uma nova conta para um membro da equipe.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">Nome Completo *</Label>
              <Input
                placeholder="Ex: João Silva"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                className="h-12 rounded-xl border-gray-200 focus:ring-[#2D1E6B]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">E-mail *</Label>
              <Input
                type="email"
                placeholder="Ex: joao@clarifyse.com"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                className="h-12 rounded-xl border-gray-200 focus:ring-[#2D1E6B]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">Senha Temporária *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ex: Senha@123"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="h-12 rounded-xl border-gray-200 focus:ring-[#2D1E6B] pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#2D1E6B]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-[#64748B]">O usuário precisará trocar a senha no primeiro acesso.</p>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddUserModalOpen(false)}
                className="rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-xl font-bold"
              >
                Adicionar Pesquisador
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[#2D1E6B]">Editar Pesquisador</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">Nome Completo</Label>
              <Input
                value={editUserForm.name}
                onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                className="h-12 rounded-xl border-gray-200 focus:ring-[#2D1E6B]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">E-mail</Label>
              <Input
                type="email"
                value={editUserForm.email}
                onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                className="h-12 rounded-xl border-gray-200 focus:ring-[#2D1E6B]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">Status</Label>
              <select
                value={editUserForm.status}
                onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value })}
                className="h-12 rounded-xl border border-gray-200 px-3 focus:ring-[#2D1E6B]"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditUserModalOpen(false)}
                className="rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#2D1E6B] hover:bg-[#1D9E75] text-white rounded-xl font-bold"
              >
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation */}
      <AlertDialog open={isResetPasswordConfirmOpen} onOpenChange={setIsResetPasswordConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-[#2D1E6B]">Redefinir Senha?</AlertDialogTitle>
            <AlertDialogDescription>
              Uma nova senha temporária será gerada para {selectedUser?.name}. O usuário precisará trocar a senha no próximo acesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              className="bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-xl font-bold"
            >
              Redefinir Senha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-[#2D1E6B]">Remover Pesquisador?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.name} será removido da plataforma. Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
            >
              Remover Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
