import { useEffect, useRef } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useNotificationStore } from "@/stores/notificationStore";

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
  const notificationTrackerRef = useRef<NotificationTracker>({});

  useEffect(() => {
    projects.forEach((project) => {
      if (project.status !== "active") return;

      // Inicializar tracker para este projeto se necessário
      if (!notificationTrackerRef.current[project.id]) {
        notificationTrackerRef.current[project.id] = {
          quotaTargets: new Set(),
          quotaCompleted: new Set(),
        };
      }

      const tracker = notificationTrackerRef.current[project.id];
      const projectResponses = responses.filter((r) => r.projectId === project.id && r.status === "completed");

      // Verificar se a amostra total foi atingida
      if (project.sampleCurrent >= project.sampleTarget && project.sampleTarget > 0) {
        if (!tracker.sampleTarget) {
          updateProject(project.id, {
            status: "completed",
            completedAt: new Date().toISOString(),
            dataDeletionAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          });

          addNotification({
            userId: project.researcherId,
            title: "Amostra Completa",
            message: `A pesquisa "${project.name}" atingiu a meta de amostra e foi encerrada automaticamente.`,
            type: "success",
            link: `/projetos/${project.id}`,
          });

          tracker.sampleTarget = true;
        }
      }

      // Verificar se todas as cotas foram atingidas
      const allQuotasReached = project.quotas.every((quota) =>
        quota.targets.every((target) => target.current >= target.target)
      );

      if (allQuotasReached && project.quotas.length > 0) {
        const quotasCompletedKey = `all-quotas-${project.id}`;
        if (!tracker.quotaCompleted.has(quotasCompletedKey)) {
          updateProject(project.id, {
            status: "completed",
            completedAt: new Date().toISOString(),
            dataDeletionAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          });

          addNotification({
            userId: project.researcherId,
            title: "Cotas Completas",
            message: `Todas as cotas da pesquisa "${project.name}" foram atingidas. Projeto encerrado automaticamente.`,
            type: "success",
            link: `/projetos/${project.id}`,
          });

          tracker.quotaCompleted.add(quotasCompletedKey);
        }
      }

      // Notificações de alerta (80% e 100%) com bloqueio de cotas
      project.quotas.forEach((quota) => {
        quota.targets.forEach((target) => {
          if (target.target <= 0) return; // Ignorar cotas com target inválido
          const percentual = (target.current / target.target) * 100;
          const targetKey = `${quota.id}-${target.id}`;

          // Alerta de 80%
          if (percentual >= 80 && percentual < 100) {
            const eighttyPercentKey = `80-${targetKey}`;
            if (!tracker.quotaTargets.has(eighttyPercentKey)) {
              addNotification({
                userId: project.researcherId,
                title: "Quota em 80%",
                message: `A cota "${target.category}" do projeto "${project.name}" atingiu 80% (${target.current}/${target.target}).`,
                type: "warning",
                link: `/projetos/${project.id}`,
              });
              tracker.quotaTargets.add(eighttyPercentKey);
            }
          }

          // Alerta de 100% e bloqueio da cota
          if (percentual >= 100) {
            const completedKey = `completed-${targetKey}`;

            // Bloquear cota se ainda não estiver bloqueada
            if (!target.isBlocked) {
              updateQuotaTargetStatus(project.id, quota.id, target.id, true);
            }

            // Enviar notificação apenas uma vez
            if (!tracker.quotaCompleted.has(completedKey)) {
              addNotification({
                userId: project.researcherId,
                title: "Quota Completa",
                message: `A cota "${target.category}" do projeto "${project.name}" foi completada. Respondentes desta categoria estão bloqueados.`,
                type: "success",
                link: `/projetos/${project.id}`,
              });
              tracker.quotaCompleted.add(completedKey);
            }
          }
        });
      });

      // Alerta de amostra em 80%
      if (project.sampleTarget > 0) {
        const samplePercentual = project.sampleTarget > 0 ? (project.sampleCurrent / project.sampleTarget) * 100 : 0;
        if (samplePercentual >= 80 && samplePercentual < 90) {
          const sampleAlertKey = `sample-80-${project.id}`;
          if (!tracker.quotaTargets.has(sampleAlertKey)) {
            addNotification({
              userId: project.researcherId,
              title: "Amostra em 80%",
              message: `A amostra do projeto "${project.name}" atingiu 80% (${project.sampleCurrent}/${project.sampleTarget}).`,
              type: "warning",
              link: `/projetos/${project.id}`,
            });
            tracker.quotaTargets.add(sampleAlertKey);
          }
        }
      }
    });
  }, [projects, responses, updateProject, updateQuotaTargetStatus, addNotification]);
};
