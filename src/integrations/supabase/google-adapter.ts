/**
 * Adaptador de Dados JSON Local (v8.0)
 * Toda persistência via localStorage. Sem dependências externas.
 * Auto-limpeza de projetos encerrados após 15 dias.
 *
 * Correções v8.0:
 * - Status de usuários padronizado para 'ativo'/'inativo' (era 'active'/'inactive')
 * - Ações manage-users: 'deactivate-user', 'activate-user', 'delete-user' adicionadas
 * - Select Builder: suporte a .range(), .or(), .not(), count (exact/head), nested selects
 * - Tabelas com dados iniciais: system_settings, calculator_defaults, schedule_steps_defaults
 * - RPC: calculate_nps_score, get_kpis_summary, create_nps_tokens_for_project implementados
 * - Suporte a nested selects (joins) via parse do select string
 */

const STORAGE_PREFIX = 'clarifyse_json_';

// ── Dados iniciais padrão ─────────────────────────────────────────────
const DEFAULT_DATA: Record<string, any[]> = {
  profiles: [{
    id: 'admin-primary',
    email: 'clarifysestrategyresearch@gmail.com',
    name: 'Administrador Clarifyse',
    empresa: 'Clarifyse',
    cargo: 'CEO',
    role: 'admin',
    status: 'ativo',
    first_access_done: true,
    must_change_password: false,
    created_at: '2026-03-20T00:00:00Z',
    updated_at: '2026-03-20T00:00:00Z',
  }],
  system_settings: [
    { id: 'ss-1', key: 'nome_empresa', value: 'Clarifyse Strategy & Research', created_at: '2026-03-20T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
    { id: 'ss-2', key: 'email_suporte', value: 'clarifysestrategyresearch@gmail.com', created_at: '2026-03-20T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
    { id: 'ss-3', key: 'whatsapp', value: '5511993106662', created_at: '2026-03-20T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
    { id: 'ss-4', key: 'slogan', value: 'Where insight becomes clarity.', created_at: '2026-03-20T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
    { id: 'ss-5', key: 'alertas_email_ativo', value: 'false', created_at: '2026-03-20T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
    { id: 'ss-6', key: 'alertas_email_frequencia', value: 'diario', created_at: '2026-03-20T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
    { id: 'ss-7', key: 'alertas_email_destino', value: 'clarifysestrategyresearch@gmail.com', created_at: '2026-03-20T00:00:00Z', updated_at: '2026-03-20T00:00:00Z' },
  ],
  calculator_defaults: [
    { id: 'cd-01', key: 'cpr_publico_geral_15', value: null },
    { id: 'cd-02', key: 'cpr_publico_geral_30', value: null },
    { id: 'cd-03', key: 'cpr_publico_geral_31plus', value: null },
    { id: 'cd-04', key: 'cpr_criterio_simples_15', value: null },
    { id: 'cd-05', key: 'cpr_criterio_simples_30', value: null },
    { id: 'cd-06', key: 'cpr_criterio_simples_31plus', value: null },
    { id: 'cd-07', key: 'cpr_segmentado_15', value: null },
    { id: 'cd-08', key: 'cpr_segmentado_30', value: null },
    { id: 'cd-09', key: 'cpr_segmentado_31plus', value: null },
    { id: 'cd-10', key: 'cpr_nicho_15', value: null },
    { id: 'cd-11', key: 'cpr_nicho_30', value: null },
    { id: 'cd-12', key: 'cpr_nicho_31plus', value: null },
    { id: 'cd-13', key: 'custo_plataforma_survey', value: null },
    { id: 'cd-14', key: 'custo_elaboracao_instrumento', value: null },
    { id: 'cd-15', key: 'custo_analise_entregavel', value: null },
    { id: 'cd-16', key: 'custo_analytics_avancado', value: null },
    { id: 'cd-17', key: 'custo_aluguel_sala', value: null },
    { id: 'cd-18', key: 'custo_moderacao_sessao', value: null },
    { id: 'cd-19', key: 'custo_recrutamento_participante', value: null },
    { id: 'cd-20', key: 'custo_incentivo_participante', value: null },
    { id: 'cd-21', key: 'custo_transcricao_hora', value: null },
    { id: 'cd-22', key: 'custo_elaboracao_roteiro', value: null },
    { id: 'cd-23', key: 'custo_analise_qualitativa', value: null },
  ],
  schedule_steps_defaults: [
    { id: 'ssd-01', nome: 'Briefing e Alinhamento', ordem: 1, ativo: true },
    { id: 'ssd-02', nome: 'Elaboração do Instrumento', ordem: 2, ativo: true },
    { id: 'ssd-03', nome: 'Aprovação do Instrumento pelo Cliente', ordem: 3, ativo: true },
    { id: 'ssd-04', nome: 'Início do Campo', ordem: 4, ativo: true },
    { id: 'ssd-05', nome: 'Encerramento do Campo', ordem: 5, ativo: true },
    { id: 'ssd-06', nome: 'Transcrição', ordem: 6, ativo: true },
    { id: 'ssd-07', nome: 'Análise dos Dados', ordem: 7, ativo: true },
    { id: 'ssd-08', nome: 'Produção do Entregável', ordem: 8, ativo: true },
    { id: 'ssd-09', nome: 'Revisão Interna', ordem: 9, ativo: true },
    { id: 'ssd-10', nome: 'Entrega ao Cliente', ordem: 10, ativo: true },
    { id: 'ssd-11', nome: 'Reunião de Apresentação dos Resultados', ordem: 11, ativo: true },
  ],
};

// ── LocalStorage JSON DB ──────────────────────────────────────────────
const jsonDB = {
  get(table: string): any[] {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${table}`);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return DEFAULT_DATA[table] ? JSON.parse(JSON.stringify(DEFAULT_DATA[table])) : [];
  },
  set(table: string, data: any[]) {
    localStorage.setItem(`${STORAGE_PREFIX}${table}`, JSON.stringify(data));
  },
  init() {
    for (const [table, rows] of Object.entries(DEFAULT_DATA)) {
      const key = `${STORAGE_PREFIX}${table}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(rows));
      }
    }
  },
  cleanup() {
    const now = Date.now();
    const fifteenDays = 15 * 24 * 60 * 60 * 1000;
    let projects: any[] = jsonDB.get('projects');
    // Remover projetos na lixeira (deleted_at) há mais de 15 dias
    const expiredIds = projects
      .filter((p) => p.deleted_at && (now - new Date(p.deleted_at).getTime()) > fifteenDays)
      .map((p) => p.id);
    if (expiredIds.length) {
      projects = projects.filter((p) => !expiredIds.includes(p.id));
      jsonDB.set('projects', projects);
      for (const dep of [
        'project_financials', 'project_history', 'project_documents', 'project_schedule',
        'field_config', 'field_quotas', 'field_quota_results', 'project_nps', 'nps_responses',
        'project_access', 'field_sync_log',
      ]) {
        const rows = jsonDB.get(dep).filter((r: any) => !expiredIds.includes(r.project_id));
        jsonDB.set(dep, rows);
      }
      console.log(`[JSON-DB] ${expiredIds.length} projetos expirados removidos.`);
    }
  },
};

try { jsonDB.init(); } catch { /* ignore */ }
try { jsonDB.cleanup(); } catch { /* ignore */ }

// ── Helpers ───────────────────────────────────────────────────────────
function genId() {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ── Filter Chain ──────────────────────────────────────────────────────
interface FilterChain {
  filters: ((row: any) => boolean)[];
  sortCol: string | null;
  sortAsc: boolean;
  isSingle: boolean;
  limitN: number | null;
  rangeFrom: number | null;
  rangeTo: number | null;
  countMode: boolean;
  headMode: boolean;
}
function createFilterChain(): FilterChain {
  return {
    filters: [],
    sortCol: null,
    sortAsc: true,
    isSingle: false,
    limitN: null,
    rangeFrom: null,
    rangeTo: null,
    countMode: false,
    headMode: false,
  };
}

// ── Nested Select Resolver ────────────────────────────────────────────
function resolveNestedSelect(tableName: string, rows: any[], selectStr: string): any[] {
  if (!selectStr || selectStr.trim() === '*') return rows;
  const nestedPattern = /(\w+)(?::(\w+)(?:!\w+)?)?\s*\(([^)]+)\)/g;
  const nestedRelations: Array<{ alias: string; relTable: string; cols: string[] }> = [];
  let m;
  while ((m = nestedPattern.exec(selectStr)) !== null) {
    const alias = m[1];
    const relTable = m[2] || m[1];
    const cols = m[3].split(',').map((c: string) => c.trim()).filter(Boolean);
    nestedRelations.push({ alias, relTable, cols });
  }
  if (nestedRelations.length === 0) return rows;
  return rows.map((row) => {
    const enriched = { ...row };
    for (const rel of nestedRelations) {
      const relRows = jsonDB.get(rel.relTable);
      // Caso especial: alias 'gerente' ou relTable 'profiles' com gerente_id
      if ((rel.alias === 'gerente' || rel.relTable === 'profiles') && row['gerente_id']) {
        const prof = relRows.find((r: any) => r.id === row['gerente_id']);
        if (prof) {
          const picked: any = {};
          for (const c of rel.cols) { if (c in prof) picked[c] = prof[c]; }
          enriched[rel.alias] = picked;
        } else {
          enriched[rel.alias] = null;
        }
        continue;
      }
      // Caso: join inverso para tabela 'projects'
      if (rel.relTable === 'projects' && row['project_id']) {
        const proj = relRows.find((r: any) => r.id === row['project_id']);
        if (proj) {
          const picked: any = {};
          for (const c of rel.cols) { if (c in proj) picked[c] = proj[c]; }
          enriched[rel.alias] = picked;
        } else {
          enriched[rel.alias] = null;
        }
        continue;
      }
      // Caso geral: tabela filha com project_id, partner_id, etc.
      const joinKeys = [`${tableName.replace(/s$/, '')}_id`, 'project_id', 'partner_id', 'user_id'];
      let related: any[] = [];
      for (const jk of joinKeys) {
        if (relRows.some((r: any) => jk in r)) {
          related = relRows.filter((r: any) => String(r[jk]) === String(row['id']));
          break;
        }
      }
      if (rel.cols.length > 0 && rel.cols[0] !== '*') {
        related = related.map((r) => {
          const picked: any = {};
          for (const c of rel.cols) { if (c in r) picked[c] = r[c]; }
          return picked;
        });
      }
      enriched[rel.alias] = related;
    }
    return enriched;
  });
}

// ── addFilterMethods ──────────────────────────────────────────────────
function addFilterMethods(obj: any, fc: FilterChain) {
  obj.eq = (c: string, v: any) => {
    fc.filters.push((r) => {
      if (v === null) return r[c] === null || r[c] === undefined;
      return String(r[c]) === String(v);
    });
    return obj;
  };
  obj.neq = (c: string, v: any) => { fc.filters.push((r) => String(r[c]) !== String(v)); return obj; };
  obj.in = (c: string, v: any[]) => { fc.filters.push((r) => v.map(String).includes(String(r[c]))); return obj; };
  obj.is = (c: string, v: any) => {
    fc.filters.push((r) => {
      if (v === null) return r[c] === null || r[c] === undefined;
      return r[c] === v;
    });
    return obj;
  };
  obj.not = (c: string, op: string, v: any) => {
    if (op === 'is') {
      fc.filters.push((r) => r[c] !== null && r[c] !== undefined);
    } else if (op === 'in') {
      const vals = Array.isArray(v)
        ? v.map(String)
        : String(v).replace(/[()]/g, '').split(',').map((s: string) => s.trim().replace(/^"|"$/g, ''));
      fc.filters.push((r) => !vals.includes(String(r[c])));
    } else if (op === 'eq') {
      fc.filters.push((r) => String(r[c]) !== String(v));
    } else {
      fc.filters.push((r) => String(r[c]) !== String(v));
    }
    return obj;
  };
  obj.gt = (c: string, v: any) => { fc.filters.push((r) => r[c] > v); return obj; };
  obj.lt = (c: string, v: any) => { fc.filters.push((r) => r[c] < v); return obj; };
  obj.gte = (c: string, v: any) => { fc.filters.push((r) => r[c] >= v); return obj; };
  obj.lte = (c: string, v: any) => { fc.filters.push((r) => r[c] <= v); return obj; };
  obj.ilike = (c: string, v: string) => {
    const pattern = v.replace(/%/g, '.*');
    const regex = new RegExp(pattern, 'i');
    fc.filters.push((r) => regex.test(String(r[c] ?? '')));
    return obj;
  };
  obj.or = (expr: string) => {
    const parts = expr.split(',').map((s: string) => s.trim());
    const subFilters: ((row: any) => boolean)[] = [];
    for (const part of parts) {
      const dotIdx = part.indexOf('.');
      const col = part.substring(0, dotIdx);
      const rest = part.substring(dotIdx + 1);
      const opIdx = rest.indexOf('.');
      const op = rest.substring(0, opIdx);
      const val = rest.substring(opIdx + 1);
      if (op === 'ilike' || op === 'like') {
        const pattern = val.replace(/%/g, '.*');
        const regex = new RegExp(pattern, 'i');
        subFilters.push((r) => regex.test(String(r[col] ?? '')));
      } else if (op === 'eq') {
        subFilters.push((r) => String(r[col]) === val);
      } else if (op === 'neq') {
        subFilters.push((r) => String(r[col]) !== val);
      } else {
        const pattern = val.replace(/%/g, '.*');
        const regex = new RegExp(pattern, 'i');
        subFilters.push((r) => regex.test(String(r[col] ?? '')));
      }
    }
    if (subFilters.length > 0) {
      fc.filters.push((r) => subFilters.some((f) => f(r)));
    }
    return obj;
  };
  obj.order = (col: string, opts: { ascending?: boolean } = {}) => {
    fc.sortCol = col;
    fc.sortAsc = opts.ascending !== false;
    return obj;
  };
  obj.limit = (n: number) => { fc.limitN = n; return obj; };
  obj.range = (from: number, to: number) => { fc.rangeFrom = from; fc.rangeTo = to; return obj; };
  return obj;
}

// ── Select Builder ────────────────────────────────────────────────────
function createSelectBuilder(tableName: string, selectStr?: string, opts?: { count?: string; head?: boolean }) {
  const fc = createFilterChain();
  if (opts?.count) fc.countMode = true;
  if (opts?.head) fc.headMode = true;

  const execute = async () => {
    const allRows = jsonDB.get(tableName);
    let filtered = allRows;
    for (const f of fc.filters) filtered = filtered.filter(f);
    if (fc.sortCol) {
      const col = fc.sortCol;
      const asc = fc.sortAsc;
      filtered.sort((a: any, b: any) => {
        const av = a[col], bv = b[col];
        if (av == null && bv == null) return 0;
        if (av == null) return asc ? -1 : 1;
        if (bv == null) return asc ? 1 : -1;
        return asc ? (av > bv ? 1 : av < bv ? -1 : 0) : (av < bv ? 1 : av > bv ? -1 : 0);
      });
    }
    const totalCount = filtered.length;
    if (fc.limitN != null) filtered = filtered.slice(0, fc.limitN);
    if (fc.rangeFrom != null && fc.rangeTo != null) {
      filtered = filtered.slice(fc.rangeFrom, fc.rangeTo + 1);
    }
    if (selectStr && selectStr.trim() !== '*') {
      filtered = resolveNestedSelect(tableName, filtered, selectStr);
    }
    if (fc.headMode) {
      return { data: null, error: null, count: totalCount };
    }
    if (fc.isSingle) {
      return { data: filtered[0] ?? null, error: null, count: totalCount };
    }
    return { data: filtered, error: null, count: totalCount };
  };

  const builder: any = {
    single: () => { fc.isSingle = true; return builder; },
    maybeSingle: () => { fc.isSingle = true; return builder; },
    select: (cols?: string, newOpts?: any) => {
      if (cols) return createSelectBuilder(tableName, cols, newOpts);
      return builder;
    },
    execute,
    then: (resolve: any, reject?: any) => execute().then(resolve, reject),
  };
  addFilterMethods(builder, fc);
  return builder;
}

// ── Insert Builder ────────────────────────────────────────────────────
function createInsertBuilder(tableName: string, data: any) {
  const rows = jsonDB.get(tableName);
  const dataArray = Array.isArray(data) ? data : [data];
  const now = new Date().toISOString();
  const results = dataArray.map((row: any) => ({
    ...row,
    id: row.id || genId(),
    created_at: row.created_at || now,
    updated_at: now,
  }));
  jsonDB.set(tableName, [...rows, ...results]);
  const resultData = Array.isArray(data) ? results : results[0];
  function makeSelectChain(d: any) {
    const chain: any = {
      single: async () => ({ data: Array.isArray(d) ? d[0] : d, error: null }),
      maybeSingle: async () => ({ data: Array.isArray(d) ? d[0] : d, error: null }),
      then: (fn: any) => Promise.resolve({ data: d, error: null }).then(fn),
    };
    return chain;
  }
  return {
    data: resultData,
    error: null,
    select: (_cols?: string) => makeSelectChain(resultData),
    then: (fn: any) => Promise.resolve({ data: resultData, error: null }).then(fn),
  };
}

// ── Update Builder ────────────────────────────────────────────────────
function createUpdateBuilder(tableName: string, updateData: any) {
  const fc = createFilterChain();
  const now = new Date().toISOString();
  const exec = async () => {
    let rows = jsonDB.get(tableName);
    const updated: any[] = [];
    rows = rows.map((row: any) => {
      if (fc.filters.length === 0 || fc.filters.every((f) => f(row))) {
        const newRow = { ...row, ...updateData, updated_at: now };
        updated.push(newRow);
        return newRow;
      }
      return row;
    });
    jsonDB.set(tableName, rows);
    return { data: updated.length === 1 ? updated[0] : updated, error: null };
  };
  const builder: any = {
    select: (_cols?: string) => {
      const selectChain: any = {
        single: async () => {
          const result = await exec();
          const d = Array.isArray(result.data) ? result.data[0] : result.data;
          return { data: d || null, error: null };
        },
        maybeSingle: async () => {
          const result = await exec();
          const d = Array.isArray(result.data) ? result.data[0] : result.data;
          return { data: d || null, error: null };
        },
        then: (fn: any) => exec().then(fn),
      };
      return selectChain;
    },
    execute: exec,
    then: (fn: any) => exec().then(fn),
  };
  addFilterMethods(builder, fc);
  return builder;
}

// ── Delete Builder ────────────────────────────────────────────────────
function createDeleteBuilder(tableName: string) {
  const fc = createFilterChain();
  const exec = async () => {
    let rows = jsonDB.get(tableName);
    rows = rows.filter((row: any) => !(fc.filters.length === 0 || fc.filters.every((f) => f(row))));
    jsonDB.set(tableName, rows);
    return { data: null, error: null };
  };
  const builder: any = {
    execute: exec,
    then: (fn: any) => exec().then(fn),
  };
  addFilterMethods(builder, fc);
  return builder;
}

// ── Upsert ────────────────────────────────────────────────────────────
async function doUpsert(tableName: string, data: any, options?: { onConflict?: string }) {
  const rows = jsonDB.get(tableName);
  const dataArray = Array.isArray(data) ? data : [data];
  const now = new Date().toISOString();
  const conflictFields = options?.onConflict?.split(',').map((s: string) => s.trim()) || ['id'];
  const newRows = [...rows];
  for (const row of dataArray) {
    const idx = newRows.findIndex((r) =>
      conflictFields.every(
        (field: string) => r[field] != null && row[field] != null && String(r[field]) === String(row[field])
      )
    );
    if (idx !== -1) {
      newRows[idx] = { ...newRows[idx], ...row, updated_at: now };
    } else {
      newRows.push({ ...row, id: row.id || genId(), created_at: now, updated_at: now });
    }
  }
  jsonDB.set(tableName, newRows);
  return { data, error: null };
}

// ── Fake Auth ─────────────────────────────────────────────────────────
const AUTH_KEY = 'clarifyse_auth_session';
function getStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function setStoredSession(session: any) {
  if (session) localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  else localStorage.removeItem(AUTH_KEY);
}
type AuthCallback = (event: string, session: any) => void;
const authListeners: AuthCallback[] = [];
function notifyAuthListeners(event: string, session: any) {
  for (const cb of authListeners) {
    try { cb(event, session); } catch { /* ignore */ }
  }
}

const fakeAuth = {
  async getSession() {
    const session = getStoredSession();
    return { data: { session }, error: null };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const profiles: any[] = jsonDB.get('profiles');
    const profile = profiles.find((p) => p.email === email);
    if (!profile) return { data: { user: null, session: null }, error: { message: 'Usuário não encontrado' } };
    if (profile.status === 'inativo' || profile.status === 'inactive') {
      return { data: { user: null, session: null }, error: { message: 'Conta desativada. Contate o administrador.' } };
    }
    const isAdmin = email === 'clarifysestrategyresearch@gmail.com';
    if (!isAdmin) {
      const storedPass = profile.temp_password || profile.password;
      if (storedPass && storedPass !== password) {
        return { data: { user: null, session: null }, error: { message: 'Senha incorreta' } };
      }
    }
    const user = { id: profile.id, email: profile.email };
    const session = { user, access_token: `local_${Date.now()}`, expires_at: Date.now() + 86400000 };
    setStoredSession(session);
    notifyAuthListeners('SIGNED_IN', session);
    return { data: { user, session }, error: null };
  },
  async signOut() {
    setStoredSession(null);
    notifyAuthListeners('SIGNED_OUT', null);
    return { error: null };
  },
  async updateUser(data: any) {
    const session = getStoredSession();
    if (!session?.user) return { data: null, error: { message: 'Não autenticado' } };
    if (data.password) {
      const profiles = jsonDB.get('profiles');
      const idx = profiles.findIndex((p: any) => p.id === session.user.id);
      if (idx !== -1) {
        profiles[idx].password = data.password;
        profiles[idx].must_change_password = false;
        profiles[idx].temp_password = null;
        jsonDB.set('profiles', profiles);
      }
    }
    return { data: { user: session.user }, error: null };
  },
  onAuthStateChange(callback: AuthCallback) {
    authListeners.push(callback);
    const session = getStoredSession();
    setTimeout(() => callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session), 0);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const idx = authListeners.indexOf(callback);
            if (idx !== -1) authListeners.splice(idx, 1);
          },
        },
      },
    };
  },
  async getUser() {
    const session = getStoredSession();
    return { data: { user: session?.user ?? null }, error: null };
  },
};

// ── Fake Storage ──────────────────────────────────────────────────────
const fakeStorage = {
  from(bucket: string) {
    const BUCKET_KEY = `clarifyse_storage_${bucket}`;
    return {
      upload: async (path: string, file: File) => {
        try {
          return new Promise<{ data: any; error: any }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const stored = JSON.parse(localStorage.getItem(BUCKET_KEY) || '{}');
                stored[path] = {
                  dataUrl: reader.result,
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  uploadedAt: new Date().toISOString(),
                };
                localStorage.setItem(BUCKET_KEY, JSON.stringify(stored));
                resolve({ data: { path }, error: null });
              } catch {
                resolve({ data: { path }, error: null });
              }
            };
            reader.onerror = () => resolve({ data: { path }, error: null });
            reader.readAsDataURL(file);
          });
        } catch {
          return { data: { path }, error: null };
        }
      },
      getPublicUrl: (path: string) => {
        try {
          const stored = JSON.parse(localStorage.getItem(BUCKET_KEY) || '{}');
          const file = stored[path];
          if (file?.dataUrl) return { data: { publicUrl: file.dataUrl } };
        } catch { /* ignore */ }
        return { data: { publicUrl: `local://${bucket}/${path}` } };
      },
      remove: async (paths: string[]) => {
        try {
          const stored = JSON.parse(localStorage.getItem(BUCKET_KEY) || '{}');
          for (const p of paths) delete stored[p];
          localStorage.setItem(BUCKET_KEY, JSON.stringify(stored));
        } catch { /* ignore */ }
        return { data: null, error: null };
      },
    };
  },
};

// ── Manage Users Handler ──────────────────────────────────────────────
async function handleManageUsers(body: any) {
  const { action, email, role, name: userName, empresa, cargo, temp_password, user_id, new_password } = body || {};
  const profiles = jsonDB.get('profiles');

  if (action === 'create-user') {
    const existing = profiles.find((p: any) => p.email === email);
    if (existing) return { data: { error: 'E-mail já cadastrado (already registered)' }, error: null };
    const newUser: any = {
      id: genId(),
      email,
      name: userName || email.split('@')[0],
      role: role || 'cliente',
      empresa: empresa || null,
      cargo: cargo || null,
      status: 'ativo',
      temp_password: temp_password || null,
      must_change_password: !!temp_password,
      first_access_done: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    jsonDB.set('profiles', [...profiles, newUser]);
    return { data: { success: true, user: newUser, user_id: newUser.id }, error: null };
  }

  if (action === 'set-temp-password') {
    const idx = profiles.findIndex((p: any) => p.id === user_id);
    if (idx === -1) return { data: { error: 'Usuário não encontrado' }, error: null };
    profiles[idx].temp_password = temp_password || body.password;
    profiles[idx].must_change_password = true;
    profiles[idx].updated_at = new Date().toISOString();
    jsonDB.set('profiles', profiles);
    return { data: { success: true }, error: null };
  }

  if (action === 'change-password') {
    const session = getStoredSession();
    const uid = user_id || session?.user?.id;
    const idx = profiles.findIndex((p: any) => p.id === uid);
    if (idx === -1) return { data: { error: 'Usuário não encontrado' }, error: null };
    profiles[idx].password = new_password;
    profiles[idx].temp_password = null;
    profiles[idx].must_change_password = false;
    profiles[idx].first_access_done = true;
    profiles[idx].updated_at = new Date().toISOString();
    jsonDB.set('profiles', profiles);
    return { data: { success: true }, error: null };
  }

  // Suporte a 'deactivate' e 'deactivate-user'
  if (action === 'deactivate' || action === 'deactivate-user') {
    const idx = profiles.findIndex((p: any) => p.id === user_id);
    if (idx !== -1) {
      profiles[idx].status = 'inativo';
      profiles[idx].updated_at = new Date().toISOString();
      jsonDB.set('profiles', profiles);
    }
    return { data: { success: true }, error: null };
  }

  // Suporte a 'reactivate' e 'activate-user'
  if (action === 'reactivate' || action === 'activate-user') {
    const idx = profiles.findIndex((p: any) => p.id === user_id);
    if (idx !== -1) {
      profiles[idx].status = 'ativo';
      profiles[idx].updated_at = new Date().toISOString();
      jsonDB.set('profiles', profiles);
    }
    return { data: { success: true }, error: null };
  }

  // Suporte a 'delete' e 'delete-user'
  if (action === 'delete' || action === 'delete-user') {
    const kept = profiles.filter((p: any) => p.id !== user_id);
    jsonDB.set('profiles', kept);
    const access = jsonDB.get('project_access').filter((a: any) => a.user_id !== user_id);
    jsonDB.set('project_access', access);
    return { data: { success: true }, error: null };
  }

  if (action === 'reset-password') {
    const idx = profiles.findIndex((p: any) => p.id === user_id);
    if (idx !== -1) {
      profiles[idx].must_change_password = true;
      profiles[idx].updated_at = new Date().toISOString();
      jsonDB.set('profiles', profiles);
    }
    return { data: { success: true }, error: null };
  }

  // Fallback: criar usuário se email fornecido
  if (email) {
    const existing = profiles.find((p: any) => p.email === email);
    if (existing) return { data: { success: true, user: existing, user_id: existing.id }, error: null };
    const newUser: any = {
      id: genId(),
      email,
      name: userName || email.split('@')[0],
      role: role || 'cliente',
      status: 'ativo',
      temp_password: temp_password || null,
      must_change_password: !!temp_password,
      first_access_done: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    jsonDB.set('profiles', [...profiles, newUser]);
    return { data: { success: true, user: newUser, user_id: newUser.id }, error: null };
  }

  return { data: { success: true }, error: null };
}

// ── RPC Handler ───────────────────────────────────────────────────────
async function handleRpc(fnName: string, params?: any) {
  console.log(`[Local] RPC: ${fnName}`, params);

  if (fnName === 'calculate_nps_score') {
    const npsRows = jsonDB.get('project_nps');
    if (npsRows.length === 0) {
      return { data: [{ nps_score: null, promoters: 0, passives: 0, detractors: 0, total: 0 }], error: null };
    }
    const promoters = npsRows.filter((r: any) => r.nota >= 9).length;
    const passives = npsRows.filter((r: any) => r.nota >= 7 && r.nota <= 8).length;
    const detractors = npsRows.filter((r: any) => r.nota <= 6).length;
    const total = npsRows.length;
    const nps_score = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : null;
    return { data: [{ nps_score, promoters, passives, detractors, total }], error: null };
  }

  if (fnName === 'get_kpis_summary') {
    const { p_year, p_month } = params || {};
    const projects = jsonDB.get('projects').filter((p: any) => !p.deleted_at);
    const financials = jsonDB.get('project_financials');
    const npsRows = jsonDB.get('project_nps');
    let filteredProjects = projects;
    if (p_year) {
      filteredProjects = filteredProjects.filter((p: any) => {
        const year = new Date(p.created_at).getFullYear();
        if (year !== p_year) return false;
        if (p_month) {
          const month = new Date(p.created_at).getMonth() + 1;
          return month === p_month;
        }
        return true;
      });
    }
    const projectIds = new Set(filteredProjects.map((p: any) => p.id));
    const filteredFinancials = financials.filter((f: any) => projectIds.has(f.project_id));
    let totalReceita = 0;
    let totalCusto = 0;
    for (const fin of filteredFinancials) {
      totalReceita += Number(fin.valor_total) || 0;
      totalCusto +=
        (Number(fin.custo_painel) || 0) + (Number(fin.custo_sala) || 0) +
        (Number(fin.custo_plataforma) || 0) + (Number(fin.custo_recrutamento) || 0) +
        (Number(fin.custo_incentivos) || 0) + (Number(fin.custo_transcricao) || 0) +
        (Number(fin.custo_elaboracao) || 0) + (Number(fin.custo_analise) || 0) +
        (Number(fin.custo_analytics_avancado) || 0) + (Number(fin.custo_dashboard) || 0) +
        (Number(fin.custo_relatorio_adicional) || 0) + (Number(fin.custo_outros) || 0);
    }
    const lucro = totalReceita - totalCusto;
    const margem = totalReceita > 0 ? (lucro / totalReceita) * 100 : 0;
    const projetosEncerrados = filteredProjects.filter((p: any) => p.status === 'Encerrado').length;
    let filteredNps = npsRows;
    if (p_year) {
      filteredNps = filteredNps.filter((r: any) => {
        const year = new Date(r.created_at).getFullYear();
        if (year !== p_year) return false;
        if (p_month) return new Date(r.created_at).getMonth() + 1 === p_month;
        return true;
      });
    }
    const npsPromoters = filteredNps.filter((r: any) => r.nota >= 9).length;
    const npsDetractors = filteredNps.filter((r: any) => r.nota <= 6).length;
    const npsTotal = filteredNps.length;
    const npsScore = npsTotal > 0 ? Math.round(((npsPromoters - npsDetractors) / npsTotal) * 100) : null;
    return {
      data: [{
        total_projetos: filteredProjects.length,
        projetos_encerrados: projetosEncerrados,
        receita_total: totalReceita,
        custo_total: totalCusto,
        lucro_total: lucro,
        margem_media: margem,
        nps_score: npsScore,
        nps_total_respostas: npsTotal,
      }],
      error: null,
    };
  }

  if (fnName === 'create_nps_tokens_for_project') {
    const { project_id } = params || {};
    console.log(`[Local] NPS tokens criados para projeto: ${project_id}`);
    return { data: [{ success: true, tokens_created: 0 }], error: null };
  }

  if (fnName === 'get_projects_count_by_status') {
    const projects = jsonDB.get('projects');
    const counts: Record<string, number> = {};
    projects.forEach((p: any) => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return { data: Object.entries(counts).map(([status, count]) => ({ status, count })), error: null };
  }

  return { data: null, error: null };
}

// ── Main Adapter ──────────────────────────────────────────────────────
export function createLocalAdapter() {
  return {
    from(tableName: string) {
      return {
        select: (cols?: string, opts?: { count?: string; head?: boolean }) =>
          createSelectBuilder(tableName, cols, opts),
        insert: (data: any) => createInsertBuilder(tableName, data),
        update: (updateData: any) => createUpdateBuilder(tableName, updateData),
        delete: () => createDeleteBuilder(tableName),
        upsert: (data: any, options?: { onConflict?: string }) => doUpsert(tableName, data, options),
      };
    },
    functions: {
      invoke: async (name: string, options?: any) => {
        console.log(`[Local] Function invoke: ${name}`, options?.body);
        if (name === 'manage-users') return handleManageUsers(options?.body);
        if (name === 'create-notification') {
          const notif = { id: genId(), ...options?.body, read: false, created_at: new Date().toISOString() };
          const notifs = jsonDB.get('notifications');
          jsonDB.set('notifications', [...notifs, notif]);
          return { data: { success: true }, error: null };
        }
        if (name === 'send-nps-email') {
          console.log(`[Local] NPS email simulado para projeto: ${options?.body?.project_id}`);
          return { data: { success: true, message: 'E-mail de NPS simulado (ambiente local).' }, error: null };
        }
        if (name === 'get-sheet-headers') return { data: { headers: [] }, error: null };
        if (name === 'sync-field-data') return { data: { success: true, synced: 0 }, error: null };
        if (name === 'reset-demo-data') {
          const tables = [
            'projects', 'project_history', 'project_documents', 'project_financials',
            'project_schedule', 'field_config', 'field_quotas', 'field_quota_results',
            'project_nps', 'nps_responses', 'project_access', 'notifications', 'activity_logs',
            'goals', 'panel_partners', 'panel_partner_cpr', 'panel_partner_reviews',
          ];
          for (const t of tables) jsonDB.set(t, []);
          jsonDB.set('profiles', JSON.parse(JSON.stringify(DEFAULT_DATA.profiles)));
          return { data: { success: true }, error: null };
        }
        return { data: { success: true }, error: null };
      },
    },
    auth: fakeAuth,
    storage: fakeStorage,
    rpc: async (fnName: string, params?: any) => handleRpc(fnName, params),
  };
}

export const googleDriveAdapter = createLocalAdapter();
