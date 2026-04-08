import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronDown, CheckCircle2, AlertCircle, Info, Lightbulb,
  BarChart3, TrendingUp, Users, Target, Settings
} from 'lucide-react';
import {
  METHODOLOGY_REQUIREMENTS,
  MethodologyValidator,
  type MethodologyType,
  type QuestionType,
} from '@/lib/methodologyQuestionValidator';

interface MethodologyGuideProps {
  projectQuestions: Array<{ id: string; type: QuestionType; question?: string }>;
  selectedMethodologies: MethodologyType[];
  onMethodologyToggle: (methodology: MethodologyType) => void;
  totalResponses: number;
}

export function MethodologyGuide({
  projectQuestions,
  selectedMethodologies,
  onMethodologyToggle,
  totalResponses,
}: MethodologyGuideProps) {
  const [expandedMethodology, setExpandedMethodology] = useState<MethodologyType | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const validation = MethodologyValidator.validateProject(
    projectQuestions,
    Array(totalResponses).fill({}),
    selectedMethodologies
  );

  const suggestedMethodologies = MethodologyValidator.suggestMethodologies(projectQuestions);

  const getMethodologyIcon = (methodology: MethodologyType) => {
    if (methodology.includes('nps') || methodology.includes('satisfaction'))
      return <Users className="h-4 w-4" />;
    if (methodology.includes('regression') || methodology.includes('linear'))
      return <TrendingUp className="h-4 w-4" />;
    if (methodology.includes('cluster') || methodology.includes('kmeans'))
      return <Target className="h-4 w-4" />;
    return <BarChart3 className="h-4 w-4" />;
  };

  const getMinResponsesStatus = (methodology: MethodologyType) => {
    const requirements = METHODOLOGY_REQUIREMENTS[methodology];
    if (!requirements) return { status: 'unknown', message: '' };

    if (totalResponses < requirements.minResponses) {
      return {
        status: 'insufficient',
        message: `Requer ${requirements.minResponses} respostas (você tem ${totalResponses})`,
      };
    }

    return { status: 'sufficient', message: `${totalResponses}/${requirements.minResponses} respostas ✓` };
  };

  const getQuestionRequirementStatus = (
    methodology: MethodologyType,
    requiredType: QuestionType,
    minRequired: number
  ) => {
    const matchingQuestions = projectQuestions.filter(q => q.type === requiredType);
    const isSatisfied = matchingQuestions.length >= minRequired;

    return {
      isSatisfied,
      count: matchingQuestions.length,
      required: minRequired,
      questions: matchingQuestions,
    };
  };

  return (
    <div className="space-y-6">
      {/* Resumo de Validação */}
      {showValidation && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-4"
        >
          {validation.errors.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900 flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4" />
                  Erros de Validação ({validation.errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {validation.errors.map((error, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                      <span className="text-red-600 font-bold mt-0.5">•</span>
                      {error}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {validation.warnings.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-900 flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4" />
                  Avisos ({validation.warnings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {validation.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-yellow-800 flex items-start gap-2">
                      <span className="text-yellow-600 font-bold mt-0.5">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {validation.recommendations.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900 flex items-center gap-2 text-base">
                  <Lightbulb className="h-4 w-4" />
                  Recomendações ({validation.recommendations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {validation.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-0.5">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Botão de Validação */}
      <Button
        onClick={() => setShowValidation(!showValidation)}
        variant="outline"
        className="w-full gap-2"
      >
        <Info className="h-4 w-4" />
        {showValidation ? 'Ocultar' : 'Mostrar'} Validação de Metodologias
      </Button>

      {/* Metodologias Sugeridas */}
      {suggestedMethodologies.length > 0 && selectedMethodologies.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2 text-base">
                <CheckCircle2 className="h-4 w-4" />
                Metodologias Sugeridas
              </CardTitle>
              <CardDescription className="text-green-800">
                Baseado nas perguntas que você criou
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {suggestedMethodologies.map((methodology) => (
                  <Button
                    key={methodology}
                    onClick={() => onMethodologyToggle(methodology)}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-green-300 hover:bg-green-100"
                  >
                    {getMethodologyIcon(methodology)}
                    {methodology}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Lista de Metodologias */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-[#2D1E6B] flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Metodologias Disponíveis
        </h3>

        <div className="space-y-2">
          {Object.entries(METHODOLOGY_REQUIREMENTS).map(([methodology, requirements]) => {
            const isSelected = selectedMethodologies.includes(methodology as MethodologyType);
            const minResponseStatus = getMinResponsesStatus(methodology as MethodologyType);
            const isDisabled = minResponseStatus.status === 'insufficient';

            return (
              <motion.div
                key={methodology}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'border-[#2D1E6B] bg-[#F8F6F3]' : ''
                  } ${isDisabled ? 'opacity-50' : ''}`}
                  onClick={() => {
                    if (!isDisabled) {
                      onMethodologyToggle(methodology as MethodologyType);
                    }
                  }}
                >
                  <div
                    onClick={() =>
                      setExpandedMethodology(
                        expandedMethodology === methodology ? null : (methodology as MethodologyType)
                      )
                    }
                    className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (!isDisabled) {
                            onMethodologyToggle(methodology as MethodologyType);
                          }
                        }}
                        disabled={isDisabled}
                        className="h-4 w-4 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />

                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getMethodologyIcon(methodology as MethodologyType)}
                        <span className="font-medium text-sm text-[#2D1E6B] truncate">
                          {methodology}
                        </span>
                      </div>

                      {isSelected && (
                        <Badge className="bg-[#2D1E6B] text-white flex-shrink-0">
                          Selecionada
                        </Badge>
                      )}
                    </div>

                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${
                        expandedMethodology === methodology ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  <AnimatePresence>
                    {expandedMethodology === methodology && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-4 space-y-4 bg-gray-50">
                          {/* Status de Requisitos */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-600 uppercase">Requisitos</p>

                            {/* Min Responses */}
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                Respostas Mínimas: {requirements.minResponses}
                              </span>
                              <span
                                className={`font-bold ${
                                  minResponseStatus.status === 'sufficient'
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {minResponseStatus.message}
                              </span>
                            </div>

                            {/* Required Question Types */}
                            <div className="space-y-2 pt-2">
                              <p className="text-xs font-semibold text-gray-600">Tipos de Perguntas Obrigatórios:</p>

                              {requirements.requiredQuestionTypes.map((requirement, idx) => {
                                const status = getQuestionRequirementStatus(
                                  methodology as MethodologyType,
                                  requirement.questionType,
                                  requirement.minQuestions
                                );

                                return (
                                  <div
                                    key={idx}
                                    className={`p-2 rounded border text-sm ${
                                      status.isSatisfied
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-red-200 bg-red-50'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-700">
                                          {requirement.questionType}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-0.5">
                                          {requirement.description}
                                        </p>
                                        <p className="text-xs text-gray-500 italic mt-1">
                                          "{requirement.example}"
                                        </p>
                                      </div>
                                      <span
                                        className={`font-bold text-sm flex-shrink-0 ${
                                          status.isSatisfied
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                        }`}
                                      >
                                        {status.count}/{status.required}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Optional Question Types */}
                            {requirements.optionalQuestionTypes.length > 0 && (
                              <div className="space-y-2 pt-2">
                                <p className="text-xs font-semibold text-gray-600">
                                  Tipos de Perguntas Opcionais (Recomendados):
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {requirements.optionalQuestionTypes.map((type) => {
                                    const count = projectQuestions.filter(q => q.type === type).length;
                                    return (
                                      <Badge
                                        key={type}
                                        variant="outline"
                                        className={count > 0 ? 'bg-green-50 border-green-200' : ''}
                                      >
                                        {type} {count > 0 ? `(${count})` : ''}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Validation Notes */}
                          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                            <p className="font-medium mb-1">Notas de Validação:</p>
                            <p>{requirements.validationNotes}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Status Summary */}
      <Card className="bg-gradient-to-r from-[#2D1E6B]/5 to-[#1D9E75]/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-[#2D1E6B]">
                {selectedMethodologies.length}
              </p>
              <p className="text-xs text-gray-600 font-medium mt-1">Metodologias</p>
              <p className="text-xs text-gray-500">selecionadas</p>
            </div>

            <div>
              <p className="text-2xl font-bold text-[#1D9E75]">
                {projectQuestions.length}
              </p>
              <p className="text-xs text-gray-600 font-medium mt-1">Perguntas</p>
              <p className="text-xs text-gray-500">criadas</p>
            </div>

            <div>
              <p className="text-2xl font-bold text-[#7F77DD]">
                {totalResponses}
              </p>
              <p className="text-xs text-gray-600 font-medium mt-1">Respostas</p>
              <p className="text-xs text-gray-500">coletadas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
