import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/db';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, CheckCircle2, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { PrazoResposta } from '@/types/project';

type PageState = 'loading' | 'form' | 'success' | 'expired' | 'already_answered' | 'error';

export default function AvaliacaoPage() {
  const { token } = useParams<{ token: string }>();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [projectName, setProjectName] = useState<string>('');
  const [npsId, setNpsId] = useState<string>('');
  
  // Form state
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [satisfactionStars, setSatisfactionStars] = useState<number | null>(null);
  const [prazoResposta, setPrazoResposta] = useState<PrazoResposta | null>(null);
  const [comentario, setComentario] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      checkToken();
    }
  }, [token]);

  async function checkToken() {
    try {
      const { data, error } = await supabase
        .from('nps_responses')
        .select(`
          id,
          respondido,
          expires_at,
          project_id,
          projects:project_id (nome)
        `)
        .eq('token', token)
        .single();

      if (error || !data) {
        setPageState('error');
        return;
      }

      // Check if already answered
      if (data.respondido) {
        setPageState('already_answered');
        return;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        setPageState('expired');
        return;
      }

      setNpsId(data.id);
      setProjectName((data.projects as any)?.nome || 'Projeto');
      setPageState('form');
    } catch (err) {
      console.error('Error checking token:', err);
      setPageState('error');
    }
  }

  async function handleSubmit() {
    if (npsScore === null || satisfactionStars === null || !prazoResposta) {
      toast.error('Por favor, responda todas as perguntas obrigatorias.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('nps_responses')
        .update({
          nps_score: npsScore,
          satisfaction_stars: satisfactionStars,
          prazo_resposta: prazoResposta,
          comentario: comentario || null,
          respondido: true,
          responded_at: new Date().toISOString(),
        })
        .eq('id', npsId);

      if (error) throw error;

      setPageState('success');
    } catch (err) {
      console.error('Error submitting NPS:', err);
      toast.error('Erro ao enviar avaliacao. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function getNPSLabel(score: number): string {
    if (score <= 6) return 'Detrator';
    if (score <= 8) return 'Neutro';
    return 'Promotor';
  }

  function getNPSColor(score: number): string {
    if (score <= 6) return 'border-red-500 bg-red-500';
    if (score <= 8) return 'border-gray-500 bg-gray-500';
    return 'border-green-500 bg-green-500';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B2B6B] via-[#2D3E8C] to-[#1B2B6B] flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {pageState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-white flex items-center gap-3"
          >
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando...</span>
          </motion.div>
        )}

        {pageState === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl"
          >
            <Card className="shadow-2xl">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-[#1B2B6B] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xl">C</span>
                  </div>
                </div>
                <CardTitle className="text-2xl text-[#1B2B6B]">Avalie sua experiencia</CardTitle>
                <CardDescription className="text-base">
                  Projeto: <span className="font-semibold text-foreground">{projectName}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-4">
                {/* NPS Score */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium">
                    Em uma escala de 0 a 10, o quanto voce recomendaria a Clarifyse para um colega ou parceiro de negocio?
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex items-center justify-between gap-1">
                    {Array.from({ length: 11 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNpsScore(i)}
                        className={`w-9 h-9 rounded-full border-2 text-sm font-medium transition-all
                          ${npsScore === i 
                            ? getNPSColor(i) + ' text-white' 
                            : 'border-gray-300 hover:border-[#1B2B6B] hover:bg-[#1B2B6B]/5'
                          }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Nada provavel</span>
                    <span>Extremamente provavel</span>
                  </div>
                  {npsScore !== null && (
                    <p className="text-sm text-center">
                      Classificacao: <span className={`font-semibold ${
                        npsScore <= 6 ? 'text-red-600' : npsScore <= 8 ? 'text-gray-600' : 'text-green-600'
                      }`}>{getNPSLabel(npsScore)}</span>
                    </p>
                  )}
                </div>

                {/* Satisfaction Stars */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium">
                    Como voce avalia a qualidade do entregavel final?
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSatisfactionStars(star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-10 w-10 transition-colors ${
                            satisfactionStars && star <= satisfactionStars
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {satisfactionStars && (
                    <p className="text-sm text-center text-muted-foreground">
                      {satisfactionStars === 1 && 'Muito insatisfeito'}
                      {satisfactionStars === 2 && 'Insatisfeito'}
                      {satisfactionStars === 3 && 'Neutro'}
                      {satisfactionStars === 4 && 'Satisfeito'}
                      {satisfactionStars === 5 && 'Muito satisfeito'}
                    </p>
                  )}
                </div>

                {/* Prazo */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium">
                    O projeto foi entregue dentro do prazo acordado?
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { value: 'no_prazo', label: 'Sim, dentro do prazo', icon: CheckCircle2, color: 'border-green-500 bg-green-50 text-green-700' },
                      { value: 'pequeno_atraso', label: 'Com pequeno atraso', icon: Clock, color: 'border-yellow-500 bg-yellow-50 text-yellow-700' },
                      { value: 'atraso_significativo', label: 'Com atraso significativo', icon: AlertTriangle, color: 'border-red-500 bg-red-50 text-red-700' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setPrazoResposta(option.value as PrazoResposta)}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 text-sm
                          ${prazoResposta === option.value 
                            ? option.color 
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <option.icon className="h-5 w-5" />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comentario */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium">
                    Deixe um comentario (opcional)
                  </label>
                  <Textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Conte-nos mais sobre sua experiencia..."
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || npsScore === null || satisfactionStars === null || !prazoResposta}
                  className="w-full bg-[#1B2B6B] hover:bg-[#2D3E8C] text-white py-6 text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Avaliacao'
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {pageState === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl text-center">
              <CardContent className="pt-10 pb-10 space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-[#1B2B6B]">Obrigado pelo seu feedback!</h2>
                <p className="text-muted-foreground">
                  Ele e fundamental para continuarmos evoluindo.
                </p>
                <p className="text-sm text-muted-foreground italic">
                  — Equipe Clarifyse
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {pageState === 'expired' && (
          <motion.div
            key="expired"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl text-center">
              <CardContent className="pt-10 pb-10 space-y-4">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-10 w-10 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-[#1B2B6B]">Link expirado</h2>
                <p className="text-muted-foreground">
                  Este link de avaliacao expirou.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {pageState === 'already_answered' && (
          <motion.div
            key="answered"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl text-center">
              <CardContent className="pt-10 pb-10 space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-[#1B2B6B]">Avaliacao ja enviada</h2>
                <p className="text-muted-foreground">
                  Voce ja enviou sua avaliacao para este projeto. Obrigado!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {pageState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md"
          >
            <Card className="shadow-2xl text-center">
              <CardContent className="pt-10 pb-10 space-y-4">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-[#1B2B6B]">Link invalido</h2>
                <p className="text-muted-foreground">
                  Este link de avaliacao nao existe ou e invalido.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
