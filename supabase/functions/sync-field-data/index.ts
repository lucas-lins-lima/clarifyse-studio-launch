import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

// Simple CSV parser that handles quoted fields
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  const headers = parseRow(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseRow(line: string): string[] {
  const cols: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cols.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current.trim());
  return cols;
}

// Process a single project's field sync
async function syncProject(adminClient: any, projectId: string): Promise<{ rowsCount: number }> {
  const { data: config, error: configErr } = await adminClient
    .from("field_config")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (configErr || !config) throw new Error("Configuração de campo não encontrada.");
  if (config.integration_mode !== "sheets") throw new Error("Projeto não usa integração com planilha.");
  if (!config.sheets_csv_url) throw new Error("URL da planilha não configurada.");

  const csvResp = await fetch(config.sheets_csv_url, {
    headers: { "User-Agent": "Clarifyse-Insights/1.0" },
  });

  if (!csvResp.ok) {
    throw new Error(`Falha ao acessar a planilha (HTTP ${csvResp.status}).`);
  }

  const csvText = await csvResp.text();
  const rows = parseCsv(csvText);

  // Count valid rows using reference_column
  let validRows = rows;
  if (config.reference_column) {
    validRows = rows.filter((r) => {
      const val = r[config.reference_column];
      return val !== undefined && val !== "" && val !== null;
    });
  }

  const realizadoTotal = validRows.length;

  // Calculate tempo medio real
  let tempoMedioReal: number | null = null;
  if (config.time_column) {
    const tempos = validRows
      .map((r) => parseFloat(r[config.time_column]))
      .filter((v) => !isNaN(v) && v > 0);
    if (tempos.length > 0) {
      tempoMedioReal = tempos.reduce((a, b) => a + b, 0) / tempos.length;
    }
  }

  // Load quotas
  const { data: quotas, error: quotasErr } = await adminClient
    .from("field_quotas")
    .select("*")
    .eq("project_id", projectId)
    .order("ordem");

  if (quotasErr) throw new Error("Erro ao carregar cotas.");

  // Process each quota
  for (const quota of quotas ?? []) {
    if (!quota.coluna_planilha) continue;

    const counters: Record<string, number> = {};
    const cfg = quota.config;

    if (quota.tipo === "numerico") {
      const subs: Array<{ rotulo: string; valor: string; meta: number }> = cfg.subcategorias ?? [];
      subs.forEach((s) => { counters[s.rotulo] = 0; });
      validRows.forEach((row) => {
        const val = (row[quota.coluna_planilha] ?? "").trim();
        const sub = subs.find((s) => String(s.valor).trim() === val);
        if (sub) counters[sub.rotulo] = (counters[sub.rotulo] ?? 0) + 1;
      });
    } else if (quota.tipo === "faixa_etaria") {
      const faixas: Array<{ rotulo: string; min: number; max: number; meta: number }> = cfg.faixas ?? [];
      faixas.forEach((f) => { counters[f.rotulo] = 0; });
      validRows.forEach((row) => {
        const val = parseFloat(row[quota.coluna_planilha] ?? "");
        if (isNaN(val)) return;
        const faixa = faixas.find((f) => val >= f.min && val <= f.max);
        if (faixa) counters[faixa.rotulo] = (counters[faixa.rotulo] ?? 0) + 1;
      });
    } else if (quota.tipo === "texto") {
      const cats: Array<{ valor: string; meta: number }> = cfg.categorias ?? [];
      cats.forEach((c) => { counters[c.valor] = 0; });
      validRows.forEach((row) => {
        const val = (row[quota.coluna_planilha] ?? "").trim();
        const cat = cats.find((c) => c.valor.trim() === val);
        if (cat) counters[cat.valor] = (counters[cat.valor] ?? 0) + 1;
      });
    } else if (quota.tipo === "booleano") {
      counters["Sim"] = 0;
      counters["Não"] = 0;
      const valorSim = String(cfg.valor_sim ?? "").trim();
      const valorNao = String(cfg.valor_nao ?? "").trim();
      validRows.forEach((row) => {
        const val = (row[quota.coluna_planilha] ?? "").trim();
        if (val === valorSim) counters["Sim"]++;
        else if (val === valorNao) counters["Não"]++;
      });
    }

    // Upsert results
    for (const [subcategoria, realizado] of Object.entries(counters)) {
      await adminClient
        .from("field_quota_results")
        .upsert(
          { quota_id: quota.id, subcategoria, realizado },
          { onConflict: "quota_id,subcategoria" }
        );
    }
  }

  // Update field_config
  await adminClient
    .from("field_config")
    .update({
      realizado_total: realizadoTotal,
      tempo_medio_real: tempoMedioReal,
      last_sync_at: new Date().toISOString(),
      last_sync_error: null,
    })
    .eq("project_id", projectId);

  // Log success
  await adminClient
    .from("field_sync_log")
    .insert({ project_id: projectId, status: "success", rows_count: realizadoTotal });

  return { rowsCount: realizadoTotal };
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

    const body = await req.json().catch(() => ({}));
    const { project_id, sync_all } = body;

    // Authenticate caller (unless called from pg_cron via service role)
    const authHeader = req.headers.get("Authorization");
    const isCronCall = sync_all === true;

    if (!isCronCall) {
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
    }

    if (sync_all) {
      // Sync all projects with sheets mode
      const { data: configs } = await adminClient
        .from("field_config")
        .select("project_id")
        .eq("integration_mode", "sheets");

      const results: any[] = [];
      for (const cfg of configs ?? []) {
        try {
          const r = await syncProject(adminClient, cfg.project_id);
          results.push({ project_id: cfg.project_id, ...r, success: true });
        } catch (err: any) {
          await adminClient
            .from("field_config")
            .update({ last_sync_error: err.message, last_sync_at: new Date().toISOString() })
            .eq("project_id", cfg.project_id);
          await adminClient
            .from("field_sync_log")
            .insert({ project_id: cfg.project_id, status: "error", error_message: err.message });
          results.push({ project_id: cfg.project_id, success: false, error: err.message });
        }
      }
      return new Response(JSON.stringify({ success: true, results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { rowsCount } = await syncProject(adminClient, project_id);

    return new Response(
      JSON.stringify({ success: true, rows_count: rowsCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("sync-field-data error:", err);

    // Try to log error to DB if we have project_id
    try {
      const body = await req.json().catch(() => ({}));
      if (body.project_id) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const adminClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await adminClient
          .from("field_config")
          .update({ last_sync_error: err.message, last_sync_at: new Date().toISOString() })
          .eq("project_id", body.project_id);
        await adminClient
          .from("field_sync_log")
          .insert({ project_id: body.project_id, status: "error", error_message: err.message });
      }
    } catch (_) {}

    return new Response(
      JSON.stringify({ error: err.message || "Erro interno." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
