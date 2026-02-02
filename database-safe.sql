-- =====================
-- CAPTAIN STAR DASHBOARD DATABASE SCHEMA
-- =====================
-- Supabase PostgreSQL
-- يمكنك نسخ هذا والصقه في Supabase SQL Editor
-- هذا Script ما يمسح البيانات القديمة - IF NOT EXISTS

-- Create all tables without dropping anything

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'TEAM_MEMBER',
  team_role TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  industry TEXT,
  country TEXT NOT NULL,
  package_type TEXT,
  phone_number TEXT,
  posts_quota INTEGER,
  videos_quota INTEGER,
  has_website BOOLEAN DEFAULT false,
  file_upload BOOLEAN DEFAULT false,
  num_campaigns INTEGER DEFAULT 0,
  num_platforms INTEGER DEFAULT 0,
  cover_image TEXT,
  has_campaign BOOLEAN DEFAULT false,
  campaigns JSONB,
  onboarding_notes TEXT,
  assigned_team_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_country ON public.clients(country);

CREATE TABLE IF NOT EXISTS public.client_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_url TEXT,
  username TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_accounts_client_id ON public.client_accounts(client_id);

CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  type TEXT,
  description TEXT,
  niche TEXT,
  website JSONB,
  received_date TEXT,
  brief TEXT,
  total_budget DECIMAL(10, 2),
  platforms TEXT[] DEFAULT '{}',
  campaign_types TEXT[] DEFAULT '{}',
  accounts JSONB,
  drive_link TEXT,
  product_sheet_link TEXT,
  copy_and_design TEXT,
  motion TEXT,
  campaign_details JSONB,
  monthly_report TEXT,
  client_status TEXT,
  start_date TEXT,
  end_date TEXT,
  objective TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by_user_id ON public.projects(created_by_user_id);

CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  type TEXT NOT NULL,
  assigned_to_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_by_user_id TEXT NOT NULL REFERENCES public.users(id),
  due_date TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_user_id ON public.tasks(assigned_to_user_id);

CREATE TABLE IF NOT EXISTS public.approvals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  requested_by_user_id TEXT NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approvals_task_id ON public.approvals(task_id);

CREATE TABLE IF NOT EXISTS public.performance_snapshots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  date TEXT NOT NULL,
  spend DECIMAL(10, 2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  leads INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_performance_snapshots_client_id ON public.performance_snapshots(client_id);

CREATE TABLE IF NOT EXISTS public.community_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);

CREATE TABLE IF NOT EXISTS public.file_assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  client TEXT NOT NULL,
  size TEXT NOT NULL,
  date TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_file_assets_client ON public.file_assets(client);

-- Enable Realtime for key tables
-- Note: Uncomment these if realtime is not already enabled for these tables
-- If you get error "relation already member of publication", they're already enabled

-- ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;

-- SUCCESS
-- تم إنشاء جميع الجداول بنجاح!
