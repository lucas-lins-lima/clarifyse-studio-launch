import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/db';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, DollarSign, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Metodologia = 'quantitativa' | 'qualitativa';
type TipoPerfil = 'publico_geral' | 'criterio_simples' | 'segmentado' | 'nicho';
type FaixaQuestoes = '15' | '30' | '31plus';

interface CalculatorDefaults {
  [key: string]: number | null;
}

export function CalculadoraPrecificacao() {
  const [metodologia, setMetodologia] = useState<Metodologia>('quantitativa');
  const [tipoPerfil, setTipoPerfil] = useState<TipoPerfil>('publico_geral');
  const [faixaQuestoes, setFaixaQuestoes] = useState<FaixaQuestoes>('15');
  const [amostra, setAmostra] = useState<number>(100);
  const [incluiPlataforma, setIncluiPlataforma] = useState(true);
  const [incluiElaboracao, setIncluiElaboracao] = useState(true);
  const [incluiAnalise, setIncluiAnalise] = useState(true);
  const [incluiAnalyticsAvancado, setIncluiAnalyticsAvancado] = useState(false);
  const [urgente, setUrgente] = useState(false);

  // Qualitativa specific
  const [numSessoes, setNumSessoes] = useState<number>(4);
  const [participantesPorSessao, setParticipantesPorSessao] = useState<number>(8);
  const [duracaoSessao, setDuracaoSessao] = useState<number>(2);
  const [incluiSala, setIncluiSala] = useState(true);
  const [incluiTranscricao, setIncluiTranscricao] = useState(true);
  const [incluiRoteiro, setIncluiRoteiro] = useState(true);

  const { data: defaults, isLoading } = useQuery({
    queryKey: ['calculator-defaults'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calculator_defaults')
        .select('key, value');

      if (error) throw error;

      const result: CalculatorDefaults = {};
      (data ?? []).forEach((item: any) => {
        result[item.key] = item.value ? Number(item.value) : null;
      });
      return result;
    },
  });

  const hasAllDefaults = useMemo(() => {
    if (!defaults) return false;
    const requiredKeys = [
      `cpr_${tipoPerfil}_${faixaQuestoes}`,
      'custo_plataforma_survey',
      'custo_elaboracao_instrumento',
      'custo_analise_entregavel',
    ];
    return requiredKeys.every((key) => defaults[key] !== null && defaults[key] !== undefined);
  }, [defaults, tipoPerfil, faixaQuestoes]);

  const calculation = useMemo(() => {
    if (!defaults) return null;

    let custoPainel = 0;
    let custoPlataforma = 0;
    let custoElaboracao = 0;
    let custoAnalise = 0;
    let custoAnalyticsAvancado = 0;
    let custoSala = 0;
    let custoRecrutamento = 0;
    let custoIncentivos = 0;
    let custoTranscricao = 0;
    let custoRoteiro = 0;

    if (metodologia === 'quantitativa') {
      // CPR based on profile and question range
      const cprKey = `cpr_${tipoPerfil}_${faixaQuestoes}`;
      const cpr = defaults[cprKey] ?? 0;
      custoPainel = cpr * amostra;

      if (incluiPlataforma) {
        custoPlataforma = defaults['custo_plataforma_survey'] ?? 0;
      }
      if (incluiElaboracao) {
        custoElaboracao = defaults['custo_elaboracao_instrumento'] ?? 0;
      }
      if (incluiAnalise) {
        custoAnalise = defaults['custo_analise_entregavel'] ?? 0;
      }
      if (incluiAnalyticsAvancado) {
        custoAnalyticsAvancado = defaults['custo_analytics_avancado'] ?? 0;
      }
    } else {
      // Qualitativa
      const totalParticipantes = numSessoes * participantesPorSessao;
      const totalHoras = numSessoes * duracaoSessao;

      // Recrutamento por participante
      custoRecrutamento = (defaults['custo_recrutamento_participante'] ?? 0) * totalParticipantes;
      // Incentivos por participante
      custoIncentivos = (defaults['custo_incentivo_participante'] ?? 0) * totalParticipantes;
      // Moderacao por sessao
      custoPainel = (defaults['custo_moderacao_sessao'] ?? 0) * numSessoes;

      if (incluiSala) {
        custoSala = (defaults['custo_aluguel_sala'] ?? 0) * numSessoes;
      }
      if (incluiTranscricao) {
        custoTranscricao = (defaults['custo_transcricao_hora'] ?? 0) * totalHoras;
      }
      if (incluiRoteiro) {
        custoRoteiro = defaults['custo_elaboracao_roteiro'] ?? 0;
      }
      if (incluiAnalise) {
        custoAnalise = defaults['custo_analise_qualitativa'] ?? 0;
      }
    }

    const subtotal =
      custoPainel +
      custoPlataforma +
      custoElaboracao +
      custoAnalise +
      custoAnalyticsAvancado +
      custoSala +
      custoRecrutamento +
      custoIncentivos +
      custoTranscricao +
      custoRoteiro;

    const adicionalUrgencia = urgente ? subtotal * 0.2 : 0;
    const total = subtotal + adicionalUrgencia;

    // Suggested price with margins
    const precoSugerido30 = total / 0.7; // 30% margin
    const precoSugerido40 = total / 0.6; // 40% margin
    const precoSugerido50 = total / 0.5; // 50% margin

    return {
      custoPainel,
      custoPlataforma,
      custoElaboracao,
      custoAnalise,
      custoAnalyticsAvancado,
      custoSala,
      custoRecrutamento,
      custoIncentivos,
      custoTranscricao,
      custoRoteiro,
      subtotal,
      adicionalUrgencia,
      total,
      precoSugerido30,
      precoSugerido40,
      precoSugerido50,
    };
  }, [
    defaults,
    metodologia,
    tipoPerfil,
    faixaQuestoes,
    amostra,
    incluiPlataforma,
    incluiElaboracao,
    incluiAnalise,
    incluiAnalyticsAvancado,
    urgente,
    numSessoes,
    participantesPorSessao,
    duracaoSessao,
    incluiSala,
    incluiTranscricao,
    incluiRoteiro,
  ]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning if defaults not configured */}
      {!hasAllDefaults && (
        <div className="clarifyse-card p-4 border-yellow-500/50 bg-yellow-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-700 dark:text-yellow-400">Custos nao configurados</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                Alguns valores padrao nao foram configurados. Configure na aba "Custos" para calculos precisos.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input form */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Parametros do Projeto</h3>
          </div>

          <div className="space-y-4">
            {/* Metodologia */}
            <div className="space-y-1.5">
              <Label>Metodologia</Label>
              <Select value={metodologia} onValueChange={(v) => setMetodologia(v as Metodologia)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantitativa">Pesquisa Quantitativa</SelectItem>
                  <SelectItem value="qualitativa">Pesquisa Qualitativa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {metodologia === 'quantitativa' ? (
              <>
                {/* Tipo de perfil */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1">
                    Tipo de Perfil
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[250px]">
                        <p className="text-xs">
                          Define o custo por resposta (CPR) baseado na dificuldade de recrutamento.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Select value={tipoPerfil} onValueChange={(v) => setTipoPerfil(v as TipoPerfil)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publico_geral">Publico Geral</SelectItem>
                      <SelectItem value="criterio_simples">Criterio Simples</SelectItem>
                      <SelectItem value="segmentado">Segmentado</SelectItem>
                      <SelectItem value="nicho">Nicho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Faixa de questoes */}
                <div className="space-y-1.5">
                  <Label>Numero de Questoes</Label>
                  <Select value={faixaQuestoes} onValueChange={(v) => setFaixaQuestoes(v as FaixaQuestoes)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">Ate 15 questoes</SelectItem>
                      <SelectItem value="30">16 a 30 questoes</SelectItem>
                      <SelectItem value="31plus">31+ questoes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Amostra */}
                <div className="space-y-1.5">
                  <Label>Tamanho da Amostra</Label>
                  <Input
                    type="number"
                    min={1}
                    value={amostra}
                    onChange={(e) => setAmostra(parseInt(e.target.value) || 0)}
                  />
                </div>

                {/* Switches */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Plataforma de Survey</Label>
                    <Switch checked={incluiPlataforma} onCheckedChange={setIncluiPlataforma} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Elaboracao do Instrumento</Label>
                    <Switch checked={incluiElaboracao} onCheckedChange={setIncluiElaboracao} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Analise e Entregavel</Label>
                    <Switch checked={incluiAnalise} onCheckedChange={setIncluiAnalise} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Analytics Avancado</Label>
                    <Switch checked={incluiAnalyticsAvancado} onCheckedChange={setIncluiAnalyticsAvancado} />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Qualitativa fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Numero de Sessoes</Label>
                    <Input
                      type="number"
                      min={1}
                      value={numSessoes}
                      onChange={(e) => setNumSessoes(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Participantes/Sessao</Label>
                    <Input
                      type="number"
                      min={1}
                      value={participantesPorSessao}
                      onChange={(e) => setParticipantesPorSessao(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Duracao por Sessao (horas)</Label>
                  <Input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={duracaoSessao}
                    onChange={(e) => setDuracaoSessao(parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Switches */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Aluguel de Sala</Label>
                    <Switch checked={incluiSala} onCheckedChange={setIncluiSala} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Transcricao</Label>
                    <Switch checked={incluiTranscricao} onCheckedChange={setIncluiTranscricao} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Elaboracao de Roteiro</Label>
                    <Switch checked={incluiRoteiro} onCheckedChange={setIncluiRoteiro} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Analise Qualitativa</Label>
                    <Switch checked={incluiAnalise} onCheckedChange={setIncluiAnalise} />
                  </div>
                </div>
              </>
            )}

            {/* Urgencia */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <Label className="text-sm">Projeto Urgente</Label>
                <p className="text-xs text-muted-foreground">+20% sobre o custo total</p>
              </div>
              <Switch checked={urgente} onCheckedChange={setUrgente} />
            </div>
          </div>
        </Card>

        {/* Results */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-accent" />
            <h3 className="font-semibold text-foreground">Resultado</h3>
          </div>

          {calculation && (
            <div className="space-y-4">
              {/* Cost breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Custos</p>
                
                {metodologia === 'quantitativa' ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Painel (CPR x Amostra)</span>
                      <span className="font-medium">{formatCurrency(calculation.custoPainel)}</span>
                    </div>
                    {calculation.custoPlataforma > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Plataforma</span>
                        <span className="font-medium">{formatCurrency(calculation.custoPlataforma)}</span>
                      </div>
                    )}
                    {calculation.custoElaboracao > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Elaboracao</span>
                        <span className="font-medium">{formatCurrency(calculation.custoElaboracao)}</span>
                      </div>
                    )}
                    {calculation.custoAnalise > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Analise</span>
                        <span className="font-medium">{formatCurrency(calculation.custoAnalise)}</span>
                      </div>
                    )}
                    {calculation.custoAnalyticsAvancado > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Analytics Avancado</span>
                        <span className="font-medium">{formatCurrency(calculation.custoAnalyticsAvancado)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {calculation.custoPainel > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Moderacao</span>
                        <span className="font-medium">{formatCurrency(calculation.custoPainel)}</span>
                      </div>
                    )}
                    {calculation.custoRecrutamento > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Recrutamento</span>
                        <span className="font-medium">{formatCurrency(calculation.custoRecrutamento)}</span>
                      </div>
                    )}
                    {calculation.custoIncentivos > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Incentivos</span>
                        <span className="font-medium">{formatCurrency(calculation.custoIncentivos)}</span>
                      </div>
                    )}
                    {calculation.custoSala > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Aluguel de Sala</span>
                        <span className="font-medium">{formatCurrency(calculation.custoSala)}</span>
                      </div>
                    )}
                    {calculation.custoTranscricao > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Transcricao</span>
                        <span className="font-medium">{formatCurrency(calculation.custoTranscricao)}</span>
                      </div>
                    )}
                    {calculation.custoRoteiro > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Elaboracao Roteiro</span>
                        <span className="font-medium">{formatCurrency(calculation.custoRoteiro)}</span>
                      </div>
                    )}
                    {calculation.custoAnalise > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Analise</span>
                        <span className="font-medium">{formatCurrency(calculation.custoAnalise)}</span>
                      </div>
                    )}
                  </>
                )}

                {calculation.adicionalUrgencia > 0 && (
                  <div className="flex justify-between text-sm text-yellow-600 dark:text-yellow-400">
                    <span>Adicional Urgencia (+20%)</span>
                    <span className="font-medium">{formatCurrency(calculation.adicionalUrgencia)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
                  <span>Custo Total</span>
                  <span>{formatCurrency(calculation.total)}</span>
                </div>
              </div>

              {/* Suggested prices */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Precos Sugeridos</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="clarifyse-card p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Margem 30%</p>
                    <p className="font-semibold text-foreground">{formatCurrency(calculation.precoSugerido30)}</p>
                  </div>
                  <div className="clarifyse-card p-3 text-center border-primary/50 bg-primary/5">
                    <p className="text-xs text-primary mb-1">Margem 40%</p>
                    <p className="font-bold text-primary">{formatCurrency(calculation.precoSugerido40)}</p>
                  </div>
                  <div className="clarifyse-card p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Margem 50%</p>
                    <p className="font-semibold text-foreground">{formatCurrency(calculation.precoSugerido50)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
