import { useEffect } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useNotificationStore } from "@/stores/notificationStore";

export const useProjectAutoClose = () => {
  const { projects, responses, updateProject } = useProjectStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    projects.forEach((project) => {
      if (project.status !== "active") return;

      const projectResponses = responses.filter((r) => r.projectId === project.id && r.status === "completed");

      // Verificar se a amostra total foi atingida
      if (project.sampleCurrent >= project.sampleTarget && project.sampleTarget > 0) {
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
      }

      // Verificar se todas as cotas foram atingidas
      const allQuotasReached = project.quotas.every((quota) =>
        quota.targets.every((target) => target.current >= target.target)
      );

      if (allQuotasReached && project.quotas.length > 0) {
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
      }

      // Notificações de alerta (80% e 100%)
      project.quotas.forEach((quota) => {
        quota.targets.forEach((target) => {
          const percentual = (target.current / target.target) * 100;

          // Alerta de 80%
          if (percentual >= 80 && percentual < 90 && !target.isBlocked) {
            addNotification({
              userId: project.researcherId,
              title: "Quota em 80%",
              message: `A cota "${target.category}" do projeto "${project.name}" atingiu 80% (${target.current}/${target.target}).`,
              type: "warning",
              link: `/projetos/${project.id}`,
            });
          }

          // Alerta de 100%
          if (percentual >= 100) {
            addNotification({
              userId: project.researcherId,
              title: "Quota Completa",
              message: `A cota "${target.category}" do projeto "${project.name}" foi completada. Respondentes desta categoria estão bloqueados.`,
              type: "success",
              link: `/projetos/${project.id}`,
            });
          }
        });
      });

      // Alerta de amostra em 80%
      if (project.sampleTarget > 0) {
        const samplePercentual = (project.sampleCurrent / project.sampleTarget) * 100;
        if (samplePercentual >= 80 && samplePercentual < 90) {
          addNotification({
            userId: project.researcherId,
            title: "Amostra em 80%",
            message: `A amostra do projeto "${project.name}" atingiu 80% (${project.sampleCurrent}/${project.sampleTarget}).`,
            type: "warning",
            link: `/projetos/${project.id}`,
          });
        }
      }
    });
  }, [projects, responses, updateProject, addNotification]);
};
