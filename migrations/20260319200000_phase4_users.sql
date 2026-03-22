
-- Add last_sign_in_at to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

-- Allow authenticated users to update their own last_sign_in_at
-- (already covered by "Users can update own profile" policy)

-- Allow gerentes to SELECT client profiles linked to their projects
CREATE POLICY "Gerentes can view clients of their projects"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    role = 'cliente' AND
    EXISTS (
      SELECT 1 FROM public.project_access pa
      JOIN public.projects p ON pa.project_id = p.id
      WHERE pa.user_id = profiles.id
        AND p.gerente_id = auth.uid()
    )
  );

-- Allow gerentes to UPDATE client profiles linked to their projects
CREATE POLICY "Gerentes can update clients of their projects"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    role = 'cliente' AND
    EXISTS (
      SELECT 1 FROM public.project_access pa
      JOIN public.projects p ON pa.project_id = p.id
      WHERE pa.user_id = profiles.id
        AND p.gerente_id = auth.uid()
    )
  );

-- Allow gerentes to view other gerente profiles (needed for project gerente dropdown and display)
CREATE POLICY "Gerentes can view gerente profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    role IN ('gerente', 'admin')
    AND public.get_user_role(auth.uid()) IN ('gerente', 'admin')
  );

-- Index for faster last_sign_in_at queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_signin ON public.profiles(last_sign_in_at DESC);
