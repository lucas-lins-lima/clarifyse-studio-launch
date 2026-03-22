
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'cliente');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  empresa TEXT,
  cargo TEXT,
  role app_role NOT NULL DEFAULT 'cliente',
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  must_change_password BOOLEAN DEFAULT false,
  first_access_done BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (security best practices)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id
$$;

-- RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admin can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente_empresa TEXT,
  objetivo TEXT,
  metodologia TEXT[] DEFAULT '{}',
  pilar TEXT CHECK (pilar IN ('DISCOVER', 'BRAND', 'INNOVATE', 'DECIDE', 'EXPERIENCE', 'ANALYTICS')),
  status TEXT NOT NULL DEFAULT 'Briefing' CHECK (status IN ('Briefing', 'Elaboração do Instrumento', 'Campo', 'Análise dos Dados', 'Produção do Entregável', 'Entrega Final', 'Encerrado', 'Pausado')),
  data_inicio DATE,
  data_entrega_prevista DATE,
  gerente_id UUID REFERENCES auth.users(id),
  observacoes_internas TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on projects" ON public.projects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Gerentes view own projects" ON public.projects FOR SELECT TO authenticated USING (gerente_id = auth.uid());
CREATE POLICY "Gerentes update own projects" ON public.projects FOR UPDATE TO authenticated USING (gerente_id = auth.uid());
CREATE POLICY "Gerentes insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'gerente');

-- Project access for clients
CREATE TABLE public.project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

ALTER TABLE public.project_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage all project access" ON public.project_access FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Gerentes manage access for their projects" ON public.project_access FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND gerente_id = auth.uid()));
CREATE POLICY "Clients view projects they access" ON public.projects FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.project_access WHERE project_id = id AND user_id = auth.uid()));
CREATE POLICY "Clients view own access" ON public.project_access FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Project history
CREATE TABLE public.project_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  descricao TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on history" ON public.project_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Gerentes view history of own projects" ON public.project_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND gerente_id = auth.uid()));
CREATE POLICY "Clients view history of accessed projects" ON public.project_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.project_access WHERE project_id = project_history.project_id AND user_id = auth.uid()));

-- System settings
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage settings" ON public.system_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.system_settings (key, value) VALUES
  ('nome_empresa', 'Clarifyse Strategy & Research'),
  ('email_suporte', 'clarifysestrategyresearch@gmail.com'),
  ('whatsapp', '(11) 99310-6662'),
  ('slogan', 'Where insight becomes clarity.');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'cliente')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'cliente')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_gerente ON public.projects(gerente_id);
CREATE INDEX idx_projects_deleted ON public.projects(deleted_at);
CREATE INDEX idx_project_access_user ON public.project_access(user_id);
CREATE INDEX idx_project_access_project ON public.project_access(project_id);
CREATE INDEX idx_project_history_project ON public.project_history(project_id);
