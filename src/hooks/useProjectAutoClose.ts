import { useEffect, useRef } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";

interface NotificationTracker {
  [projectId: string]: {
    sampleTarget?: boolean;
    quotaTargets: Set<string>;
    quotaCompleted: Set<string>;
    sampleAlert?: boolean;
  };
}

export const useProjectAutoClose = () => {
  const { projects, responses, updateProject, updateQuotaTargetStatus } = useProjectStore();
  const { addNotification } = useNotificationStore();
  const users = useAuthStore((s) => s.users);
  const notificationTrackerRef = useRef<NotificationTracker>({});

  const adminId = users.find((u) => u.role === "admin")?.id;

  useEffect(() => {
    projects.forEach((project) => {
      if (project.status !== "active") return;

      if (!notificationTrackerRef.current[project.id]) {
        notificationTrackerRef.current[project.id] = {
          quotaTargets: new Set(),
          quotaCompleted: new Set(),
        };
      }

      const tracker = notificationTrackerRef.current[project.id];

      const sendToResearcherAndAdmin = (
        title: string,
        message: string,
        type: "info" | "warning" | "success" | "error",
        link: string
      ) => {
        addNotification({ userId: project.researcherId, title, message, type, link });
        if (adminId && adminId !== project.researcherId) {
          addNotification({ userId: adminId, title, message, type, link });
        }
      };

      // Verificar se a amostra total foi atingida
      if (project.sampleCurrent >= project.sampleTarget && project.sampleTarget > 0) {
        if (!tracker.sampleTarget) {
          updateProject(project.id, {
            status: "completed",
            completedAt: new Date().toISOString(),
            dataDeletionAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          });
          sendToResearcherAndAdmin(
            "Amostra Completa",
            `A pesquisa "${project.name}" atingiu a meta de amostra e foi encerrada automaticamente.`,
            "success",
            `/projetos/${project.id}`
          );
          tracker.sampleTarget = true;
        }
      }

      // Verificar se todas as cotas foram atingidas
      const allQuotasReached =
        project.quotas.length > 0 &&
        project.quotas.every((quota) =>
          quota.targets.every((target) => target.current >= target.target && target.target > 0)
        );

      if (allQuotasReached) {
        const quotasCompletedKey = `all-quotas-${project.id}`;
        if (!tracker.quotaCompleted.has(quotasCompletedKey)) {
          updateProject(project.id, {
            status: "completed",
            completedAt: new Date().toISOString(),
            dataDeletionAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          });
          sendToResearcherAndAdmin(
            "Cotas Completas",
            `Todas as cotas da pesquisa "${project.name}" foram atingidas. Projeto encerrado automaticamente.`,
            "success",
            `/projetos/${project.id}`
          );
          tracker.quotaCompleted.add(quotasCompletedKey);
        }
      }

      // Notificações e bloqueio por cota individual
      project.quotas.forEach((quota) => {
        quota.targets.forEach((target) => {
          if (target.target <= 0) return;
          const percentual = (target.current / target.target) * 100;
          const targetKey = `${quota.id}-${target.id}`;

          // Alerta de 80%
          if (percentual >= 80 && percentual < 100) {
            const eightyKey = `80-${targetKey}`;
            if (!tracker.quotaTargets.has(eightyKey)) {
              sendToResearcherAndAdmin(
                "Quota em 80%",
                `A cota "${target.category}" do projeto "${project.name}" atingiu 80% (${target.current}/${target.target}).`,
                "warning",
                `/projetos/${project.id}`
              );
              tracker.quotaTargets.add(eightyKey);
            }
          }

          // Alerta de 100% e bloqueio da cota
          if (percentual >= 100) {
            if (!target.isBlocked) {
              updateQuotaTargetStatus(project.id, quota.id, target.id, true);
            }
            const completedKey = `completed-${targetKey}`;
            if (!tracker.quotaCompleted.has(completedKey)) {
              sendToResearcherAndAdmin(
                "Quota Completa",
                `A cota "${target.category}" do projeto "${project.name}" foi completada. Respondentes desta categoria estão bloqueados.`,
                "success",
                `/projetos/${project.id}`
              );
              tracker.quotaCompleted.add(completedKey);
            }
          }
        });
      });

      // Alerta de amostra em 80%
      if (project.sampleTarget > 0) {
        const samplePct = (project.sampleCurrent / project.sampleTarget) * 100;
        if (samplePct >= 80 && samplePct < 100) {
          const sampleAlertKey = `sample-80-${project.id}`;
          if (!tracker.quotaTargets.has(sampleAlertKey)) {
            sendToResearcherAndAdmin(
              "Amostra em 80%",
              `A amostra do projeto "${project.name}" atingiu 80% (${project.sampleCurrent}/${project.sampleTarget}).`,
              "warning",
              `/projetos/${project.id}`
            );
            tracker.quotaTargets.add(sampleAlertKey);
          }
        }
      }
    });
  }, [projects, responses, updateProject, updateQuotaTargetStatus, addNotification, adminId]);
};
