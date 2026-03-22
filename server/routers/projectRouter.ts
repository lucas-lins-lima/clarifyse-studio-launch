/**
 * Router tRPC para Projetos
 * Gerencia CRUD de projetos de pesquisa
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import * as projectService from '../services/projectService';
import * as authService from '../services/authService';

export const projectRouter = router({
  /**
   * Lista todos os projetos
   */
  list: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const user = await authService.getUserFromSession(input.token);
      if (!user) {
        throw new Error('Não autenticado');
      }

      if (user.role === 'admin') {
        return projectService.getAllProjects();
      }

      return projectService.getProjectsByResearcherId(user.id);
    }),

  /**
   * Obtém um projeto específico
   */
  get: publicProcedure
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

      const project = await projectService.getProjectById(input.projectId);
      if (!project) {
        throw new Error('Projeto não encontrado');
      }

      // Verificar permissão
      if (user.role !== 'admin' && project.researcherId !== user.id) {
        throw new Error('Sem permissão');
      }

      return project;
    }),

  /**
   * Cria um novo projeto
   */
  create: publicProcedure
    .input(
      z.object({
        token: z.string(),
        name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
        description: z.string().optional().default(''),
        client: z.string().min(2, 'Cliente deve ter no mínimo 2 caracteres'),
        sampleSize: z.number().int().positive('Tamanho da amostra deve ser positivo'),
        startDate: z.string().datetime(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await authService.getUserFromSession(input.token);
      if (!user) {
        throw new Error('Não autenticado');
      }

      try {
        const project = await projectService.createProject(
          input.name,
          input.description,
          input.client,
          user.id,
          input.sampleSize,
          input.startDate
        );

        return {
          success: true,
          project,
        };
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }),

  /**
   * Atualiza um projeto
   */
  update: publicProcedure
    .input(
      z.object({
        token: z.string(),
        projectId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        client: z.string().optional(),
        sampleSize: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await authService.getUserFromSession(input.token);
      if (!user) {
        throw new Error('Não autenticado');
      }

      const project = await projectService.getProjectById(input.projectId);
      if (!project) {
        throw new Error('Projeto não encontrado');
      }

      if (user.role !== 'admin' && project.researcherId !== user.id) {
        throw new Error('Sem permissão');
      }

      try {
        const updated = await projectService.updateProject(input.projectId, {
          name: input.name,
          description: input.description,
          client: input.client,
          sampleSize: input.sampleSize,
        });

        return {
          success: true,
          project: updated,
        };
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }),

  /**
   * Muda status do projeto
   */
  changeStatus: publicProcedure
    .input(
      z.object({
        token: z.string(),
        projectId: z.string(),
        status: z.enum(['rascunho', 'ativo', 'pausado', 'encerrado']),
      })
    )
    .mutation(async ({ input }) => {
      const user = await authService.getUserFromSession(input.token);
      if (!user) {
        throw new Error('Não autenticado');
      }

      const project = await projectService.getProjectById(input.projectId);
      if (!project) {
        throw new Error('Projeto não encontrado');
      }

      if (user.role !== 'admin' && project.researcherId !== user.id) {
        throw new Error('Sem permissão');
      }

      try {
        const updated = await projectService.changeProjectStatus(
          input.projectId,
          input.status
        );

        return {
          success: true,
          project: updated,
        };
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }),

  /**
   * Duplica um projeto
   */
  duplicate: publicProcedure
    .input(
      z.object({
        token: z.string(),
        projectId: z.string(),
        newName: z.string().min(3),
      })
    )
    .mutation(async ({ input }) => {
      const user = await authService.getUserFromSession(input.token);
      if (!user) {
        throw new Error('Não autenticado');
      }

      const project = await projectService.getProjectById(input.projectId);
      if (!project) {
        throw new Error('Projeto não encontrado');
      }

      if (user.role !== 'admin' && project.researcherId !== user.id) {
        throw new Error('Sem permissão');
      }

      try {
        const duplicated = await projectService.duplicateProject(
          input.projectId,
          input.newName
        );

        return {
          success: true,
          project: duplicated,
        };
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }),

  /**
   * Deleta um projeto
   */
  delete: publicProcedure
    .input(
      z.object({
        token: z.string(),
        projectId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await authService.getUserFromSession(input.token);
      if (!user) {
        throw new Error('Não autenticado');
      }

      const project = await projectService.getProjectById(input.projectId);
      if (!project) {
        throw new Error('Projeto não encontrado');
      }

      if (user.role !== 'admin' && project.researcherId !== user.id) {
        throw new Error('Sem permissão');
      }

      try {
        const deleted = await projectService.deleteProject(input.projectId);

        return {
          success: deleted,
        };
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }),

  /**
   * Publica um projeto
   */
  publish: publicProcedure
    .input(
      z.object({
        token: z.string(),
        projectId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await authService.getUserFromSession(input.token);
      if (!user) {
        throw new Error('Não autenticado');
      }

      const project = await projectService.getProjectById(input.projectId);
      if (!project) {
        throw new Error('Projeto não encontrado');
      }

      if (user.role !== 'admin' && project.researcherId !== user.id) {
        throw new Error('Sem permissão');
      }

      try {
        const link = await projectService.publishProject(input.projectId);

        return {
          success: true,
          link,
        };
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }),

  /**
   * Obtém estatísticas do projeto
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

      const project = await projectService.getProjectById(input.projectId);
      if (!project) {
        throw new Error('Projeto não encontrado');
      }

      if (user.role !== 'admin' && project.researcherId !== user.id) {
        throw new Error('Sem permissão');
      }

      return projectService.getProjectStats(input.projectId);
    }),
});
