/**
 * Router tRPC para Respostas de Pesquisa
 * Gerencia submissão e coleta de respostas
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import * as responseService from '../services/responseService';
import * as authService from '../services/authService';
import * as storage from '../storage/jsonStorage';

export const responseRouter = router({
  /**
   * Valida se pode submeter resposta
   */
  validateSubmission: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        linkId: z.string(),
        quotaData: z.record(z.string(), z.string()),
        ipAddress: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const validation = await responseService.validateResponseSubmission(
          input.projectId,
          input.linkId,
          input.quotaData,
          input.ipAddress
        );

        return validation;
      } catch (error) {
        return {
          valid: false,
          errors: [(error as Error).message],
        };
      }
    }),

  /**
   * Submete uma resposta
   */
  submit: publicProcedure
    .input(
      z.object({
        projectId: z.string(),
        formId: z.string(),
        linkId: z.string(),
        answers: z.array(
          z.object({
            questionId: z.string(),
            value: z.union([z.string(), z.array(z.string()), z.number()]),
            timestamp: z.string(),
          })
        ),
        quotaData: z.record(z.string(), z.string()),
        ipAddress: z.string(),
        userAgent: z.string(),
        startTime: z.string(),
        endTime: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await responseService.createResponse(
          input.projectId,
          input.formId,
          input.linkId,
          input.answers,
          input.quotaData,
          input.ipAddress,
          input.userAgent,
          input.startTime,
          input.endTime
        );

        return {
          success: true,
          response,
        };
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }),

  /**
   * Obtém respostas de um projeto (admin/pesquisador)
   */
  getByProject: publicProcedure
    .input(
      z.object({
        token: z.string(),
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const user = await authService.getUserFromSession(input.token);
      if (!user) {
        throw new Error('Não autenticado');
      }

      const project = await storage.getProjectById(input.projectId);
      if (!project) {
        throw new Error('Projeto não encontrado');
      }

      if (user.role !== 'admin' && project.researcherId !== user.id) {
        throw new Error('Sem permissão');
      }

      return responseService.getResponsesByProject(input.projectId);
    }),

  /**
   * Obtém estatísticas de respostas
   */
  stats: publicProcedure
    .input(
      z.object({
        token: z.string(),
        projectId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const user = await authService.getUserFromSession(input.token);
      if (!user) {
        throw new Error('Não autenticado');
      }

      const project = await storage.getProjectById(input.projectId);
      if (!project) {
        throw new Error('Projeto não encontrado');
      }

      if (user.role !== 'admin' && project.researcherId !== user.id) {
        throw new Error('Sem permissão');
      }

      return responseService.getResponseStats(input.projectId);
    }),
});
