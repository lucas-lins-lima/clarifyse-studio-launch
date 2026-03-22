import { useEffect } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useNotificationStore } from "@/stores/notificationStore";

export const useDataDeletion = () => {
  const { projects, responses, updateProject, deleteResponsesByProject } = useProjectStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    const now = new Date();

    projects.forEach((project) => {
      if (!project.dataDeletionAt) return;

      const deletionDate = new Date(project.dataDeletionAt);
      const daysUntilDeletion = Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Notificação 3 dias antes da exclusão
      if (daysUntilDeletion === 3) {
        addNotification({
          userId: project.researcherId,
          title: "Dados serão excluídos em 3 dias",
          message: `Os dados do projeto "${project.name}" serão excluídos automaticamente em 3 dias. Exporte os dados agora se necessário.`,
          type: "warning",
          link: `/projetos/${project.id}`,
        });
      }

      // Excluir dados quando a data chegar
      if (now >= deletionDate) {
        // Deletar todas as respostas do projeto
        deleteResponsesByProject(project.id);

        // Atualizar projeto para marcar como deletado
        updateProject(project.id, {
          dataDeletionAt: null,
        });

        addNotification({
          userId: project.researcherId,
          title: "Dados Excluídos",
          message: `Os dados do projeto "${project.name}" foram excluídos automaticamente conforme a política de retenção.`,
          type: "info",
          link: `/projetos/${project.id}`,
        });
      }
    });
  }, [projects, responses, updateProject, deleteResponsesByProject, addNotification]);
};
