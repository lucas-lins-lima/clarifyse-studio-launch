/**
 * Serviço de Formulários para Clarifyse Studio
 * Gerencia criação e edição de formulários com perguntas
 */

import { Form, Question, QuestionOption, QuestionType } from '../../shared/types';
import * as storage from '../storage/jsonStorage';
import { generateId } from '../utils/crypto';

/**
 * Cria uma nova pergunta
 */
export function createQuestion(
  type: QuestionType,
  title: string,
  order: number,
  required: boolean = true,
  options?: QuestionOption[],
  description?: string
): Question {
  return {
    id: generateId(),
    type,
    title,
    description,
    required,
    order,
    options,
  };
}

/**
 * Adiciona uma pergunta ao formulário
 */
export async function addQuestionToForm(
  formId: string,
  question: Question
): Promise<Form | undefined> {
  const form = await storage.getFormById(formId);
  if (!form) return undefined;

  // Reordenar perguntas se necessário
  const maxOrder = form.questions.length > 0
    ? Math.max(...form.questions.map(q => q.order))
    : 0;

  const newQuestion = {
    ...question,
    order: question.order || maxOrder + 1,
  };

  form.questions.push(newQuestion);
  form.updatedAt = new Date().toISOString();

  return storage.updateForm(formId, form);
}

/**
 * Atualiza uma pergunta do formulário
 */
export async function updateQuestion(
  formId: string,
  questionId: string,
  updates: Partial<Question>
): Promise<Form | undefined> {
  const form = await storage.getFormById(formId);
  if (!form) return undefined;

  const questionIndex = form.questions.findIndex(q => q.id === questionId);
  if (questionIndex === -1) return undefined;

  form.questions[questionIndex] = {
    ...form.questions[questionIndex],
    ...updates,
    id: questionId, // Garantir que ID não muda
  };

  form.updatedAt = new Date().toISOString();
  return storage.updateForm(formId, form);
}

/**
 * Remove uma pergunta do formulário
 */
export async function removeQuestion(
  formId: string,
  questionId: string
): Promise<Form | undefined> {
  const form = await storage.getFormById(formId);
  if (!form) return undefined;

  form.questions = form.questions.filter(q => q.id !== questionId);
  form.updatedAt = new Date().toISOString();

  return storage.updateForm(formId, form);
}

/**
 * Reordena perguntas do formulário (drag-and-drop)
 */
export async function reorderQuestions(
  formId: string,
  questionIds: string[]
): Promise<Form | undefined> {
  const form = await storage.getFormById(formId);
  if (!form) return undefined;

  // Criar mapa de perguntas por ID
  const questionMap = new Map(form.questions.map(q => [q.id, q]));

  // Reordenar baseado na lista fornecida
  form.questions = questionIds
    .map(id => questionMap.get(id))
    .filter((q): q is Question => q !== undefined)
    .map((q, index) => ({ ...q, order: index }));

  form.updatedAt = new Date().toISOString();
  return storage.updateForm(formId, form);
}

/**
 * Adiciona opção a uma pergunta de múltipla escolha
 */
export async function addOptionToQuestion(
  formId: string,
  questionId: string,
  label: string,
  value: string
): Promise<Form | undefined> {
  const form = await storage.getFormById(formId);
  if (!form) return undefined;

  const question = form.questions.find(q => q.id === questionId);
  if (!question) return undefined;

  if (!question.options) {
    question.options = [];
  }

  const newOption: QuestionOption = {
    id: generateId(),
    label,
    value,
    order: question.options.length,
  };

  question.options.push(newOption);
  form.updatedAt = new Date().toISOString();

  return storage.updateForm(formId, form);
}

/**
 * Remove opção de uma pergunta
 */
export async function removeOptionFromQuestion(
  formId: string,
  questionId: string,
  optionId: string
): Promise<Form | undefined> {
  const form = await storage.getFormById(formId);
  if (!form) return undefined;

  const question = form.questions.find(q => q.id === questionId);
  if (!question || !question.options) return undefined;

  question.options = question.options.filter(o => o.id !== optionId);
  form.updatedAt = new Date().toISOString();

  return storage.updateForm(formId, form);
}

/**
 * Valida um formulário
 */
export function validateForm(form: Form): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!form.title || form.title.trim() === '') {
    errors.push('Formulário deve ter um título');
  }

  if (form.questions.length === 0) {
    errors.push('Formulário deve ter pelo menos uma pergunta');
  }

  form.questions.forEach((question, index) => {
    if (!question.title || question.title.trim() === '') {
      errors.push(`Pergunta ${index + 1} deve ter um título`);
    }

    if (['multipleChoice', 'likert', 'nps'].includes(question.type)) {
      if (!question.options || question.options.length === 0) {
        errors.push(`Pergunta ${index + 1} deve ter opções de resposta`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Exporta formulário como JSON
 */
export function exportFormAsJson(form: Form): string {
  return JSON.stringify(form, null, 2);
}

/**
 * Importa formulário de JSON
 */
export async function importFormFromJson(
  projectId: string,
  jsonString: string
): Promise<Form | null> {
  try {
    const data = JSON.parse(jsonString);

    const form: Form = {
      id: generateId(),
      projectId,
      title: data.title || 'Formulário Importado',
      description: data.description,
      questions: data.questions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedTime: data.estimatedTime || 5,
    };

    return storage.createForm(form);
  } catch (error) {
    console.error('Erro ao importar formulário:', error);
    return null;
  }
}
