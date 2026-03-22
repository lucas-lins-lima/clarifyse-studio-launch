import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

function convertSheetUrlToCsv(url: string): string {
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!idMatch) throw new Error("URL do Google Sheets inválida.");
  const id = idMatch[1];

  const gidMatch = url.match(/[#&?]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";

  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}

function parseFirstCsvRow(csvText: string): string[] {
  const firstLine = csvText.split("\n")[0];
  if (!firstLine) return [];

  const cols: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < firstLine.length; i++) {
    const ch = firstLine[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      cols.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cols.push(current.trim());
  return cols.filter((c) => c !== "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await callerClient.auth.getUser();
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { sheets_url } = body;

    if (!sheets_url) {
      return new Response(JSON.stringify({ error: "sheets_url é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const csvUrl = convertSheetUrlToCsv(sheets_url);

    const csvResp = await fetch(csvUrl, {
      headers: { "User-Agent": "Clarifyse-Insights/1.0" },
    });

    if (!csvResp.ok) {
      throw new Error(
        `Falha ao acessar a planilha (HTTP ${csvResp.status}). Verifique se a planilha está compartilhada publicamente.`
      );
    }

    const csvText = await csvResp.text();
    const columns = parseFirstCsvRow(csvText);

    if (columns.length === 0) {
      throw new Error("Nenhuma coluna encontrada na planilha. Verifique o formato.");
    }

    return new Response(
      JSON.stringify({ success: true, columns, csv_url: csvUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("get-sheet-headers error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro ao carregar planilha." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
