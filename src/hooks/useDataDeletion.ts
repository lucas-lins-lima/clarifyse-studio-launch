import { useEffect } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useAuthStore } from "@/stores/authStore";

export const useDataDeletion = () => {
  const { projects, updateProject, deleteProject, deleteResponsesByProject } = useProjectStore();
  const { addNotification } = useNotificationStore();
  const users = useAuthStore((s) => s.users);
  const adminId = users.find((u) => u.role === "admin")?.id;

  useEffect(() => {
    const now = new Date();

    projects.forEach((project) => {
      // ── 1. Exclusão automática de dados após 20 dias ──
      if (project.dataDeletionAt) {
        const deletionDate = new Date(project.dataDeletionAt);
        const daysUntilDeletion = Math.ceil(
          (deletionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Aviso 3 dias antes
        if (daysUntilDeletion === 3) {
          const notify = (userId: string) =>
            addNotification({
              userId,
              title: "Dados serão excluídos em 3 dias",
              message: `Os dados do projeto "${project.name}" serão excluídos automaticamente em 3 dias. Exporte agora se necessário.`,
              type: "warning",
              link: `/projetos/${project.id}`,
            });
          notify(project.researcherId);
          if (adminId && adminId !== project.researcherId) notify(adminId);
        }

        // Exclusão quando a data chegar
        if (now >= deletionDate) {
          deleteResponsesByProject(project.id);
          updateProject(project.id, { dataDeletionAt: null });

          const notify = (userId: string) =>
            addNotification({
              userId,
              title: "Dados Excluídos",
              message: `Os dados do projeto "${project.name}" foram excluídos automaticamente conforme a política de retenção.`,
              type: "info",
              link: `/projetos/${project.id}`,
            });
          notify(project.researcherId);
          if (adminId && adminId !== project.researcherId) notify(adminId);
        }
      }

      // ── 2. Exclusão automática de projetos na lixeira após 15 dias ──
      if (project.status === "trash" && project.trashedAt) {
        const trashedDate = new Date(project.trashedAt);
        const daysInTrash = Math.floor(
          (now.getTime() - trashedDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysInTrash >= 15) {
          deleteResponsesByProject(project.id);
          deleteProject(project.id);
        }
      }
    });
  }, [projects, updateProject, deleteProject, deleteResponsesByProject, addNotification, adminId]);
};
