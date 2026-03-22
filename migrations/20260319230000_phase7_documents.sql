-- Phase 7: Project Documents + project_access tracking

-- 1. Enhance project_access with tracking columns
ALTER TABLE project_access
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_access BOOLEAN DEFAULT TRUE;

-- 2. project_documents table
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  storage_path TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho_bytes BIGINT,
  visivel_cliente BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Admin: full access to all documents
CREATE POLICY "admin_documents_all" ON project_documents
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Gerente: full access to documents in their own projects
CREATE POLICY "gerente_documents_own" ON project_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = project_documents.project_id
        AND p.gerente_id = auth.uid()
        AND pr.role = 'gerente'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = project_documents.project_id
        AND p.gerente_id = auth.uid()
        AND pr.role = 'gerente'
    )
  );

-- Cliente: read only visible documents for their projects
CREATE POLICY "cliente_documents_read" ON project_documents
  FOR SELECT
  USING (
    project_documents.visivel_cliente = TRUE
    AND EXISTS (
      SELECT 1 FROM project_access pa
      WHERE pa.project_id = project_documents.project_id
        AND pa.user_id = auth.uid()
    )
  );

-- 3. Create storage bucket for project documents (private, not public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  FALSE,
  52428800,
  ARRAY[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: admin full access
CREATE POLICY "admin_storage_all" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'project-documents'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    bucket_id = 'project-documents'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage RLS: gerente access to their project folders
CREATE POLICY "gerente_storage_own" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'project-documents'
    AND EXISTS (
      SELECT 1 FROM profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'gerente'
    )
  )
  WITH CHECK (
    bucket_id = 'project-documents'
    AND EXISTS (
      SELECT 1 FROM profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'gerente'
    )
  );

-- Storage RLS: cliente can read files if they are visible
CREATE POLICY "cliente_storage_read" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'project-documents'
    AND EXISTS (
      SELECT 1 FROM project_documents pd
      JOIN project_access pa ON pa.project_id = pd.project_id
      WHERE pd.storage_path = storage.objects.name
        AND pa.user_id = auth.uid()
        AND pd.visivel_cliente = TRUE
    )
  );
