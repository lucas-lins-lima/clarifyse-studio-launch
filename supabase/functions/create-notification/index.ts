import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

type NotificationType = 
  | "status_changed"
  | "nps_received"
  | "field_complete"
  | "deadline_risk"
  | "goal_alert"
  | "project_created"
  | "general";

interface NotificationPayload {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

interface BulkNotificationPayload {
  user_ids: string[];
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    const isInternalCall = authHeader?.includes(serviceRoleKey);

    if (!isInternalCall) {
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: userData, error: authErr } = await callerClient.auth.getUser();
      if (authErr || !userData.user) {
        return new Response(JSON.stringify({ error: "Não autorizado" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Only admin or gerente can send notifications
      const { data: callerProfile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (!callerProfile || !["admin", "gerente"].includes(callerProfile.role)) {
        return new Response(JSON.stringify({ error: "Acesso negado" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "send": {
        // Single notification
        const { user_id, type, title, message, link }: NotificationPayload = body;

        if (!user_id || !type || !title || !message) {
          return new Response(JSON.stringify({ error: "user_id, type, title e message são obrigatórios." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await adminClient
          .from("notifications")
          .insert({
            user_id,
            type,
            title,
            message,
            link,
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating notification:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, notification: data }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send_bulk": {
        // Multiple notifications to multiple users
        const { user_ids, type, title, message, link }: BulkNotificationPayload = body;

        if (!user_ids?.length || !type || !title || !message) {
          return new Response(JSON.stringify({ error: "user_ids, type, title e message são obrigatórios." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const notifications = user_ids.map((uid: string) => ({
          user_id: uid,
          type,
          title,
          message,
          link,
        }));

        const { data, error } = await adminClient
          .from("notifications")
          .insert(notifications)
          .select();

        if (error) {
          console.error("Error creating bulk notifications:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, count: data?.length ?? 0 }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "notify_project_status_change": {
        // Notify relevant users when project status changes
        const { project_id, old_status, new_status, changed_by } = body;

        if (!project_id || !old_status || !new_status) {
          return new Response(JSON.stringify({ error: "project_id, old_status e new_status são obrigatórios." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get project details
        const { data: project } = await adminClient
          .from("projects")
          .select("nome, gerente_id")
          .eq("id", project_id)
          .single();

        if (!project) {
          return new Response(JSON.stringify({ error: "Projeto não encontrado." }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get all users with access to this project (excluding the one who made the change)
        const { data: accessUsers } = await adminClient
          .from("project_access")
          .select("user_id")
          .eq("project_id", project_id);

        // Get all admins
        const { data: admins } = await adminClient
          .from("profiles")
          .select("id")
          .eq("role", "admin");

        // Build list of user ids to notify
        const userIdsToNotify = new Set<string>();
        
        // Add clients with access
        accessUsers?.forEach((u) => userIdsToNotify.add(u.user_id));
        
        // Add project manager
        if (project.gerente_id) {
          userIdsToNotify.add(project.gerente_id);
        }
        
        // Add admins
        admins?.forEach((a) => userIdsToNotify.add(a.id));
        
        // Remove the user who made the change
        if (changed_by) {
          userIdsToNotify.delete(changed_by);
        }

        if (userIdsToNotify.size === 0) {
          return new Response(JSON.stringify({ success: true, count: 0 }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const notifications = Array.from(userIdsToNotify).map((uid) => ({
          user_id: uid,
          type: "status_changed" as NotificationType,
          title: "Status do projeto alterado",
          message: `O projeto "${project.nome}" foi atualizado de "${old_status}" para "${new_status}".`,
          link: `/projetos/${project_id}`,
        }));

        const { data, error } = await adminClient
          .from("notifications")
          .insert(notifications)
          .select();

        if (error) {
          console.error("Error creating status change notifications:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, count: data?.length ?? 0 }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "notify_field_complete": {
        // Notify when field reaches 100%
        const { project_id } = body;

        if (!project_id) {
          return new Response(JSON.stringify({ error: "project_id é obrigatório." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get project details
        const { data: project } = await adminClient
          .from("projects")
          .select("nome, gerente_id")
          .eq("id", project_id)
          .single();

        if (!project) {
          return new Response(JSON.stringify({ error: "Projeto não encontrado." }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get all admins
        const { data: admins } = await adminClient
          .from("profiles")
          .select("id")
          .eq("role", "admin");

        // Notify admin + project manager
        const userIdsToNotify = new Set<string>();
        if (project.gerente_id) userIdsToNotify.add(project.gerente_id);
        admins?.forEach((a) => userIdsToNotify.add(a.id));

        const notifications = Array.from(userIdsToNotify).map((uid) => ({
          user_id: uid,
          type: "field_complete" as NotificationType,
          title: "Campo atingiu 100%",
          message: `O projeto "${project.nome}" atingiu 100% do campo.`,
          link: `/projetos/${project_id}`,
        }));

        const { data, error } = await adminClient
          .from("notifications")
          .insert(notifications)
          .select();

        if (error) {
          console.error("Error creating field complete notifications:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, count: data?.length ?? 0 }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "notify_nps_received": {
        // Notify admin when NPS is received
        const { project_id, nota } = body;

        if (!project_id || nota === undefined) {
          return new Response(JSON.stringify({ error: "project_id e nota são obrigatórios." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get project details
        const { data: project } = await adminClient
          .from("projects")
          .select("nome, gerente_id")
          .eq("id", project_id)
          .single();

        if (!project) {
          return new Response(JSON.stringify({ error: "Projeto não encontrado." }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get all admins
        const { data: admins } = await adminClient
          .from("profiles")
          .select("id")
          .eq("role", "admin");

        // Notify admin + project manager
        const userIdsToNotify = new Set<string>();
        if (project.gerente_id) userIdsToNotify.add(project.gerente_id);
        admins?.forEach((a) => userIdsToNotify.add(a.id));

        const npsCategory = nota >= 9 ? "Promotor" : nota >= 7 ? "Neutro" : "Detrator";
        const notifications = Array.from(userIdsToNotify).map((uid) => ({
          user_id: uid,
          type: "nps_received" as NotificationType,
          title: "Nova avaliação NPS recebida",
          message: `O projeto "${project.nome}" recebeu uma avaliação NPS: ${nota} (${npsCategory}).`,
          link: `/projetos/${project_id}`,
        }));

        const { data, error } = await adminClient
          .from("notifications")
          .insert(notifications)
          .select();

        if (error) {
          console.error("Error creating NPS notifications:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, count: data?.length ?? 0 }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "notify_deadline_risk": {
        // Notify about projects at risk (deadline approaching)
        // Get at-risk projects
        const { data: riskProjects } = await adminClient.rpc("get_risk_projects");

        if (!riskProjects?.length) {
          return new Response(JSON.stringify({ success: true, count: 0 }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get all admins
        const { data: admins } = await adminClient
          .from("profiles")
          .select("id")
          .eq("role", "admin");

        const adminIds = admins?.map((a) => a.id) ?? [];

        // Group projects by manager and create notifications
        const notificationsToCreate: any[] = [];
        const criticalProjects = riskProjects.filter((p: any) => p.risk_level === "critical");

        for (const project of criticalProjects) {
          // Notify admins and project manager
          const userIds = new Set<string>(adminIds);
          
          // Get project manager
          const { data: projectData } = await adminClient
            .from("projects")
            .select("gerente_id")
            .eq("id", project.project_id)
            .single();
          
          if (projectData?.gerente_id) {
            userIds.add(projectData.gerente_id);
          }

          const riskDescription = project.risk_type === "overdue" 
            ? `está atrasado (${project.details})` 
            : `tem prazo se aproximando (${project.details})`;

          for (const uid of userIds) {
            notificationsToCreate.push({
              user_id: uid,
              type: "deadline_risk" as NotificationType,
              title: "Alerta de projeto em risco",
              message: `O projeto "${project.project_name}" ${riskDescription}.`,
              link: `/projetos/${project.project_id}`,
            });
          }
        }

        if (notificationsToCreate.length === 0) {
          return new Response(JSON.stringify({ success: true, count: 0 }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data, error } = await adminClient
          .from("notifications")
          .insert(notificationsToCreate)
          .select();

        if (error) {
          console.error("Error creating deadline risk notifications:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, count: data?.length ?? 0 }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "notify_goal_alert": {
        // Notify admin about goals below threshold
        const { goal_id, metric, current_percent } = body;

        if (!goal_id || !metric || current_percent === undefined) {
          return new Response(JSON.stringify({ error: "goal_id, metric e current_percent são obrigatórios." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get all admins
        const { data: admins } = await adminClient
          .from("profiles")
          .select("id")
          .eq("role", "admin");

        const notifications = (admins ?? []).map((admin) => ({
          user_id: admin.id,
          type: "goal_alert" as NotificationType,
          title: "Meta abaixo do esperado",
          message: `A meta "${metric}" está em ${current_percent.toFixed(1)}% do objetivo.`,
          link: "/admin/metas",
        }));

        const { data, error } = await adminClient
          .from("notifications")
          .insert(notifications)
          .select();

        if (error) {
          console.error("Error creating goal alert notifications:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, count: data?.length ?? 0 }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Ação inválida." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err: any) {
    console.error("create-notification error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
