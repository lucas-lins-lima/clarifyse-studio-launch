/**
 * Router tRPC para Autenticação
 * Gerencia login, logout e sessões
 */

import { z } from 'zod';
import { publicProcedure, router } from '../_core/trpc';
import * as authService from '../services/authService';

export const authRouter = router({
  /**
   * Faz login de um usuário
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email('Email inválido'),
        password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { user, token } = await authService.loginUser(input.email, input.password);
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        };
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }),

  /**
   * Registra um novo usuário (apenas admin pode criar)
   */
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email('Email inválido'),
        password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
        name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
        role: z.enum(['admin', 'pesquisador']).default('pesquisador'),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const user = await authService.registerUser(
          input.email,
          input.password,
          input.name,
          input.role
        );
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }),

  /**
   * Obtém usuário atual da sessão
   */
  me: publicProcedure
    .input(z.object({ token: z.string().optional() }))
    .query(async ({ input }) => {
      if (!input.token) {
        return null;
      }

      const user = await authService.getUserFromSession(input.token);
      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }),

  /**
   * Faz logout
   */
  logout: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(({ input }) => {
      authService.logoutUser(input.token);
      return { success: true };
    }),

  /**
   * Atualiza perfil do usuário
   */
  updateProfile: publicProcedure
    .input(
      z.object({
        token: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await authService.getUserFromSession(input.token);
      if (!user) {
        throw new Error('Sessão inválida');
      }

      try {
        const updated = await authService.updateUserProfile(user.id, {
          name: input.name,
          email: input.email,
        });

        if (!updated) {
          throw new Error('Erro ao atualizar perfil');
        }

        return {
          success: true,
          user: {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            role: updated.role,
          },
        };
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }),

  /**
   * Altera senha do usuário
   */
  changePassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        currentPassword: z.string(),
        newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
      })
    )
    .mutation(async ({ input }) => {
      const user = await authService.getUserFromSession(input.token);
      if (!user) {
        throw new Error('Sessão inválida');
      }

      try {
        await authService.changePassword(
          user.id,
          input.currentPassword,
          input.newPassword
        );
        return { success: true };
      } catch (error) {
        throw new Error((error as Error).message);
      }
    }),
});
