import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NPSEmailRequest {
  project_id?: string;
  project_name?: string;
  auto_scheduled?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { project_id, project_name, auto_scheduled } = await req.json() as NPSEmailRequest;

    // Build query based on whether this is auto-scheduled or manual
    let query = supabase
      .from("nps_responses")
      .select(`
        id,
        token,
        client_id,
        email_sent_at,
        project:project_id(nome)
      `)
      .is("email_sent_at", null);

    // If auto-scheduled, get all pending with 1+ hour delay
    // Otherwise filter by specific project
    if (auto_scheduled) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      query = query.lt("created_at", oneHourAgo);
    } else if (project_id) {
      query = query.eq("project_id", project_id);
    } else {
      return new Response(
        JSON.stringify({ error: "Either project_id or auto_scheduled is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: npsResponses, error: npsError } = await query;

    if (npsError) {
      console.error("Error fetching NPS responses:", npsError);
      return new Response(
        JSON.stringify({ error: npsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!npsResponses || npsResponses.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending NPS emails to send" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client profiles
    const clientIds = npsResponses.map(r => r.client_id);
    const { data: clients, error: clientsError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", clientIds);

    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
      return new Response(
        JSON.stringify({ error: clientsError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientMap = new Map(clients?.map(c => [c.id, c]) || []);
    const baseUrl = Deno.env.get("APP_URL") || "https://clarifyse.vercel.app";

    let sentCount = 0;
    const errors: string[] = [];

    for (const nps of npsResponses) {
      const client = clientMap.get(nps.client_id);
      if (!client?.email) {
        errors.push(`No email found for client ${nps.client_id}`);
        continue;
      }

      const evaluationLink = `${baseUrl}/avaliacao/${nps.token}`;

      // Get project name from relationship or parameter
      const projectNameForEmail = project_name || (nps.project as any)?.nome || 'Seu Projeto';

      // If RESEND_API_KEY is available, send real email
      if (resendApiKey) {
        try {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Clarifyse <noreply@clarifyse.com>",
              to: [client.email],
              subject: `Avalie seu projeto: ${projectNameForEmail}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
                    .header { background: linear-gradient(135deg, #1B2B6B 0%, #2D3E8C 100%); padding: 40px 20px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 24px; }
                    .content { padding: 40px 30px; }
                    .content p { color: #333; line-height: 1.6; margin-bottom: 20px; }
                    .button { display: inline-block; background: #1B2B6B; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; }
                    .button:hover { background: #2D3E8C; }
                    .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>Clarifyse Strategy & Research</h1>
                    </div>
                    <div class="content">
                      <p>Ola, ${client.name}!</p>
                      <p>O projeto <strong>${projectNameForEmail}</strong> foi concluido e gostaríamos muito de saber sua opiniao sobre a experiencia com a Clarifyse.</p>
                      <p>Sua avaliacao é fundamental para continuarmos evoluindo nossos servicos. Leva menos de 2 minutos!</p>
                      <p style="text-align: center; margin: 30px 0;">
                        <a href="${evaluationLink}" class="button">Avaliar Projeto</a>
                      </p>
                      <p style="font-size: 13px; color: #666;">Este link expira em 15 dias.</p>
                    </div>
                    <div class="footer">
                      <p>Clarifyse Strategy & Research</p>
                      <p>Where insight becomes clarity.</p>
                    </div>
                  </div>
                </body>
                </html>
              `,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            errors.push(`Failed to send email to ${client.email}: ${errorText}`);
            continue;
          }
        } catch (emailError) {
          errors.push(`Email error for ${client.email}: ${emailError.message}`);
          continue;
        }
      } else {
        // Log that email would be sent (for development)
        console.log(`[DEV] Would send NPS email to ${client.email} with link: ${evaluationLink}`);
      }

      // Mark email as sent
      const { error: updateError } = await supabase
        .from("nps_responses")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", nps.id);

      if (updateError) {
        errors.push(`Failed to update email_sent_at for NPS ${nps.id}`);
      } else {
        sentCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        total: npsResponses.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-nps-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
