import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Send, RefreshCw, User, Calendar, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import type { NPSResponseWithClient } from '@/types/project';
import { getNPSClassification } from '@/types/project';

interface AvaliacaoTabProps {
  projectId: string;
  projectName: string;
  projectStatus: string;
}

export function AvaliacaoTab({ projectId, projectName, projectStatus }: AvaliacaoTabProps) {
  const [npsResponses, setNpsResponses] = useState<NPSResponseWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingTokens, setIsCreatingTokens] = useState(false);

  useEffect(() => {
    fetchNPSResponses();
  }, [projectId]);

  async function fetchNPSResponses() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('nps_responses')
        .select(`
          *,
          client:client_id (name, email)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNpsResponses(data || []);
    } catch (err) {
      console.error('Error fetching NPS responses:', err);
      toast.error('Erro ao carregar avaliacoes');
    } finally {
      setIsLoading(false);
    }
  }

  async function createNPSTokens() {
    setIsCreatingTokens(true);
    try {
      const { data, error } = await supabase.rpc('create_nps_tokens_for_project', {
        p_project_id: projectId
      });

      if (error) throw error;
      toast.success(`${data} convite(s) de avaliacao criado(s)`);
      fetchNPSResponses();
    } catch (err) {
      console.error('Error creating NPS tokens:', err);
      toast.error('Erro ao criar convites de avaliacao');
    } finally {
      setIsCreatingTokens(false);
    }
  }

  async function sendNPSEmails() {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-nps-email', {
        body: { project_id: projectId, project_name: projectName }
      });

      if (error) throw error;

      if (data.sent > 0) {
        toast.success(`${data.sent} e-mail(s) enviado(s) com sucesso`);
      } else {
        toast.info('Nenhum e-mail pendente para enviar');
      }
      
      fetchNPSResponses();
    } catch (err) {
      console.error('Error sending NPS emails:', err);
      toast.error('Erro ao enviar e-mails');
    } finally {
      setIsSending(false);
    }
  }

  async function resendEmail(npsId: string) {
    try {
      // Reset email_sent_at to null to allow resending
      const { error } = await supabase
        .from('nps_responses')
        .update({ email_sent_at: null })
        .eq('id', npsId);

      if (error) throw error;
      
      await sendNPSEmails();
    } catch (err) {
      console.error('Error resending email:', err);
      toast.error('Erro ao reenviar convite');
    }
  }

  function getStatusBadge(response: NPSResponseWithClient) {
    if (response.respondido) {
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Respondido
        </Badge>
      );
    }
    if (response.email_sent_at) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          Aguardando resposta
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Nao enviado
      </Badge>
    );
  }

  function getPrazoLabel(prazo: string | null) {
    switch (prazo) {
      case 'no_prazo': return 'Dentro do prazo';
      case 'pequeno_atraso': return 'Com pequeno atraso';
      case 'atraso_significativo': return 'Com atraso significativo';
      default: return '-';
    }
  }

  const isProjectEncerrado = projectStatus === 'Encerrado';
  const hasNoTokens = npsResponses.length === 0;
  const hasPendingEmails = npsResponses.some(r => !r.email_sent_at && !r.respondido);
  const answeredCount = npsResponses.filter(r => r.respondido).length;
  const averageNPS = answeredCount > 0 
    ? Math.round(npsResponses.filter(r => r.respondido && r.nps_score !== null).reduce((sum, r) => sum + (r.nps_score || 0), 0) / answeredCount)
    : null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Avaliacoes NPS</CardTitle>
            <div className="flex items-center gap-2">
              {isProjectEncerrado && hasNoTokens && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createNPSTokens}
                  disabled={isCreatingTokens}
                >
                  {isCreatingTokens ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Criar Convites
                </Button>
              )}
              {hasPendingEmails && (
                <Button
                  size="sm"
                  onClick={sendNPSEmails}
                  disabled={isSending}
                  className="bg-[#1B2B6B] hover:bg-[#2D3E8C]"
                >
                  {isSending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar E-mails
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isProjectEncerrado ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Os convites de avaliacao serao disponiveis quando o projeto for encerrado.</p>
            </div>
          ) : npsResponses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum convite de avaliacao criado ainda.</p>
              <p className="text-sm mt-1">Clique em "Criar Convites" para gerar links de avaliacao para os clientes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-[#1B2B6B]">{npsResponses.length}</p>
                <p className="text-sm text-muted-foreground">Convites enviados</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{answeredCount}</p>
                <p className="text-sm text-muted-foreground">Respostas recebidas</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                {averageNPS !== null ? (
                  <>
                    <p className="text-2xl font-bold" style={{ color: averageNPS >= 9 ? '#22c55e' : averageNPS >= 7 ? '#6b7280' : '#ef4444' }}>
                      {averageNPS}
                    </p>
                    <p className="text-sm text-muted-foreground">NPS Medio</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-muted-foreground">-</p>
                    <p className="text-sm text-muted-foreground">NPS Medio</p>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responses List */}
      {npsResponses.length > 0 && (
        <div className="space-y-4">
          {npsResponses.map((response, index) => {
            const npsClass = response.nps_score !== null ? getNPSClassification(response.nps_score) : null;
            
            return (
              <motion.div
                key={response.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      {/* Client Info */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[#1B2B6B]/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-[#1B2B6B]" />
                        </div>
                        <div>
                          <p className="font-medium">{response.client?.name || 'Cliente'}</p>
                          <p className="text-sm text-muted-foreground">{response.client?.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(response)}
                            {response.email_sent_at && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Enviado em {new Date(response.email_sent_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions / Results */}
                      <div className="flex items-center gap-2">
                        {response.respondido ? (
                          <div className="flex items-center gap-4">
                            {/* NPS Badge */}
                            {npsClass && (
                              <div className="text-center">
                                <Badge className={`${npsClass.color} text-white`}>
                                  {response.nps_score} - {npsClass.label}
                                </Badge>
                              </div>
                            )}
                            {/* Stars */}
                            {response.satisfaction_stars && (
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= response.satisfaction_stars!
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ) : !response.email_sent_at ? (
                          <span className="text-sm text-muted-foreground">E-mail pendente</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resendEmail(response.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reenviar
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Response Details */}
                    {response.respondido && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Prazo</p>
                            <p className="font-medium">{getPrazoLabel(response.prazo_resposta)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Qualidade</p>
                            <p className="font-medium">{response.satisfaction_stars} de 5 estrelas</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Respondido em</p>
                            <p className="font-medium">
                              {response.responded_at 
                                ? new Date(response.responded_at).toLocaleDateString('pt-BR')
                                : '-'
                              }
                            </p>
                          </div>
                        </div>
                        {response.comentario && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <p className="text-sm">{response.comentario}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
