import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller identity
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await callerClient.auth.getUser();
    if (claimsError || !claimsData.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.user.id;

    // Admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if caller is admin or gerente
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", callerId)
      .single();

    const body = await req.json();
    const { action } = body;

    // Actions that require admin role
    const adminActions = [
      "create-user",
      "reset-password",
      "deactivate-user",
      "activate-user",
      "delete-user",
      "set-temp-password",
    ];
    if (adminActions.includes(action) && callerProfile?.role !== "admin") {
      // Gerentes can create clients only
      if (action === "create-user" && callerProfile?.role === "gerente" && body.role === "cliente") {
        // allowed
      } else if (action === "set-temp-password" && callerProfile?.role === "gerente") {
        // Gerentes can set temp password for clients linked to their projects
        // Validation happens inside the case block
      } else {
        return new Response(
          JSON.stringify({ error: "Acesso negado. Apenas administradores podem realizar esta ação." }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    switch (action) {
      case "create-user": {
        const { email, name, role, empresa, cargo } = body;

        if (!email || !name || !role) {
          return new Response(JSON.stringify({ error: "E-mail, nome e role são obrigatórios." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!["gerente", "cliente"].includes(role)) {
          return new Response(JSON.stringify({ error: "Role inválida." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Create user via admin API with invite
        const { data: newUser, error: createError } = await adminClient.auth.admin.inviteUserByEmail(email, {
          data: { name, role },
        });

        if (createError) {
          console.error("Error creating user:", createError);
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update profile with additional data (trigger already created base profile)
        if (newUser.user) {
          await adminClient
            .from("profiles")
            .update({
              name,
              empresa: empresa || null,
              cargo: cargo || null,
              role,
            })
            .eq("id", newUser.user.id);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Usuário criado com sucesso. Um e-mail foi enviado para ${email}.`,
            user_id: newUser.user?.id,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "create-user-with-temp-password": {
        // Create a new user with a temporary password (no invite email)
        const { email, name, role, empresa, cargo, temp_password } = body;

        if (!email || !name || !role || !temp_password) {
          return new Response(
            JSON.stringify({ error: "E-mail, nome, role e senha temporária são obrigatórios." }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (!["gerente", "cliente"].includes(role)) {
          return new Response(JSON.stringify({ error: "Role inválida." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (temp_password.length < 8) {
          return new Response(
            JSON.stringify({ error: "A senha temporária deve ter no mínimo 8 caracteres." }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Create user with password directly (no invite email)
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password: temp_password,
          email_confirm: true,
          user_metadata: { name, role },
        });

        if (createError) {
          console.error("Error creating user with temp password:", createError);
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update profile with additional data and set must_change_password flag
        if (newUser.user) {
          await adminClient
            .from("profiles")
            .update({
              name,
              empresa: empresa || null,
              cargo: cargo || null,
              role,
              must_change_password: true,
            })
            .eq("id", newUser.user.id);
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Usuário criado com senha temporária. Compartilhe a senha com o usuário.`,
            user_id: newUser.user?.id,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "set-temp-password": {
        // Admin or gerente sets a temporary password for an existing user
        const { user_id, temp_password } = body;

        if (!user_id || !temp_password) {
          return new Response(
            JSON.stringify({ error: "user_id e temp_password são obrigatórios." }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        if (temp_password.length < 8) {
          return new Response(
            JSON.stringify({ error: "A senha temporária deve ter no mínimo 8 caracteres." }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // If caller is gerente, verify the target user is a client linked to their projects
        if (callerProfile?.role === "gerente") {
          const { data: targetProfile } = await adminClient
            .from("profiles")
            .select("role")
            .eq("id", user_id)
            .single();

          if (targetProfile?.role !== "cliente") {
            return new Response(
              JSON.stringify({ error: "Gerentes só podem definir senha temporária para clientes." }),
              {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }

          const { data: accessCheck } = await adminClient
            .from("project_access")
            .select("project_id")
            .eq("user_id", user_id)
            .limit(1);

          if (!accessCheck || accessCheck.length === 0) {
            return new Response(
              JSON.stringify({ error: "Cliente não vinculado a nenhum projeto seu." }),
              {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Set the new password using service role (never done from frontend)
        const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(user_id, {
          password: temp_password,
        });

        if (updateAuthError) {
          return new Response(JSON.stringify({ error: updateAuthError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Set must_change_password flag in profiles table
        const { error: updateProfileError } = await adminClient
          .from("profiles")
          .update({ must_change_password: true })
          .eq("id", user_id);

        if (updateProfileError) {
          return new Response(JSON.stringify({ error: updateProfileError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Senha temporária definida com sucesso.",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "reset-password": {
        const { user_id } = body;
        if (!user_id) {
          return new Response(JSON.stringify({ error: "user_id é obrigatório." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get user email
        const { data: targetUser } = await adminClient.auth.admin.getUserById(user_id);
        if (!targetUser.user) {
          return new Response(JSON.stringify({ error: "Usuário não encontrado." }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Generate password reset link
        const { error: resetError } = await adminClient.auth.admin.generateLink({
          type: "recovery",
          email: targetUser.user.email!,
        });

        if (resetError) {
          return new Response(JSON.stringify({ error: resetError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({ success: true, message: "Link de redefinição de senha enviado." }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "deactivate-user": {
        const { user_id } = body;
        await adminClient.from("profiles").update({ status: "inativo" }).eq("id", user_id);
        await adminClient.auth.admin.updateUserById(user_id, { ban_duration: "876000h" }); // ~100 years
        return new Response(
          JSON.stringify({ success: true, message: "Usuário desativado." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "activate-user": {
        const { user_id } = body;
        await adminClient.from("profiles").update({ status: "ativo" }).eq("id", user_id);
        await adminClient.auth.admin.updateUserById(user_id, { ban_duration: "none" });
        return new Response(
          JSON.stringify({ success: true, message: "Usuário reativado." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete-user": {
        const { user_id } = body;
        await adminClient.auth.admin.deleteUser(user_id);
        return new Response(
          JSON.stringify({ success: true, message: "Usuário excluído permanentemente." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "change-password": {
        // User changing their own password (for first login / temp password flow)
        const { new_password } = body;
        if (!new_password || new_password.length < 8) {
          return new Response(JSON.stringify({ error: "A senha deve ter no mínimo 8 caracteres." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: updateError } = await adminClient.auth.admin.updateUserById(callerId, {
          password: new_password,
        });

        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update profile to mark password changed
        await adminClient
          .from("profiles")
          .update({ must_change_password: false, first_access_done: true })
          .eq("id", callerId);

        return new Response(
          JSON.stringify({ success: true, message: "Senha alterada com sucesso." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(JSON.stringify({ error: "Ação inválida." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("manage-users error:", error);
    return new Response(JSON.stringify({ error: "Erro interno do servidor." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
