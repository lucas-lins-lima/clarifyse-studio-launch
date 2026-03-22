import React, { useState, useEffect } from 'react';
import { loadDB, saveDB } from '@/lib/surveyForgeDB';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, ClipboardList, Save, UserPlus, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminConfiguracoes() {
  const { toast } = useToast();
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setDb(loadDB());
    setLoading(false);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveDB(db);
    toast({
      title: "Configurações salvas",
      description: "As alterações foram aplicadas com sucesso.",
    });
  };

  if (loading || !db) return null;

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
          <TabsTrigger value="equipe" className="rounded-lg px-6 data-[state=active]:bg-[#2D1E6B] data-[state=active]:text-white gap-2">
            <Users className="h-4 w-4" /> Usuários da Equipe
          </TabsTrigger>
          <TabsTrigger value="etapas" className="rounded-lg px-6 data-[state=active]:bg-[#2D1E6B] data-[state=active]:text-white gap-2">
            <ClipboardList className="h-4 w-4" /> Etapas Padrão
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
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">Nome da Empresa</Label>
                      <Input 
                        value={db.settings.nomeEmpresa} 
                        onChange={(e) => setDb({...db, settings: {...db.settings, nomeEmpresa: e.target.value}})}
                        className="h-12 rounded-xl border-gray-200 focus:ring-[#2D1E6B]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">Slogan</Label>
                      <Input 
                        value={db.settings.slogan} 
                        onChange={(e) => setDb({...db, settings: {...db.settings, slogan: e.target.value}})}
                        className="h-12 rounded-xl border-gray-200 focus:ring-[#2D1E6B]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-[#2D1E6B] hover:bg-[#1D9E75] text-white rounded-xl px-8 h-12 font-bold transition-all">
                      <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Usuários da Equipe */}
        <TabsContent value="equipe">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#2D1E6B]">Membros da Equipe</h3>
              <Button className="bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-xl font-bold">
                <UserPlus className="h-4 w-4 mr-2" /> Adicionar Membro
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Administrador Clarifyse', role: 'admin', email: 'admin@clarifyse.com' },
                { name: 'Pesquisador Sênior', role: 'pesquisador', email: 'pesquisador@clarifyse.com' }
              ].map((user, i) => (
                <Card key={i} className="border-gray-100 shadow-sm rounded-xl hover:border-[#1D9E75]/30 transition-all">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-[#2D1E6B]/5 flex items-center justify-center text-[#2D1E6B]">
                        <Shield className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-[#2D1E6B]">{user.name}</p>
                        <p className="text-xs text-[#64748B]">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Etapas Padrão */}
        <TabsContent value="etapas">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-gray-100 shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-[#2D1E6B] font-display">Fluxo de Trabalho</CardTitle>
                <CardDescription>Defina as etapas padrão para novos projetos de pesquisa.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {[
                  'Criação do Questionário',
                  'Programação e Testes',
                  'Coleta de Dados (Campo)',
                  'Processamento e Limpeza',
                  'Análise Estatística',
                  'Relatório Final'
                ].map((etapa, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-[#2D1E6B]">
                      {i + 1}
                    </div>
                    <span className="font-medium text-[#2D1E6B]">{etapa}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
