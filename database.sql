-- =====================
-- CAPTAIN STAR DASHBOARD - DATABASE SCHEMA
-- =====================
-- Supabase PostgreSQL Database Script
-- هذا Script ما يمسح البيانات القديمة
-- Execute this directly in Supabase SQL Editor

-- =====================
-- CREATE TABLES ONLY (IF NOT EXISTS - بدون حذف)
-- =====================

-- 1. USERS TABLE
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
CREATE INDEX IF NOT EXISTS idx_users_team_role ON public.users(team_role);

-- 2. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  industry TEXT,
  country TEXT NOT NULL,
  package_type TEXT,
  phone_number TEXT,
  posts_quota INTEGER,
  videos_quota INTEGER,
  has_website BOOLEAN NOT NULL DEFAULT false,
  file_upload BOOLEAN NOT NULL DEFAULT false,
  num_campaigns INTEGER NOT NULL DEFAULT 0,
  num_platforms INTEGER NOT NULL DEFAULT 0,
  cover_image TEXT,
  has_campaign BOOLEAN NOT NULL DEFAULT false,
  campaigns JSONB,
  onboarding_notes TEXT,
  assigned_team_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_country ON public.clients(country);
CREATE INDEX IF NOT EXISTS idx_clients_industry ON public.clients(industry);

-- 3. CLIENT ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.client_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_url TEXT,
  username TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_accounts_client_id ON public.client_accounts(client_id);
CREATE INDEX idx_client_accounts_platform ON public.client_accounts(platform);
CREATE UNIQUE INDEX idx_client_accounts_unique ON public.client_accounts(client_id, platform);

-- 4. PROJECTS TABLE
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_client_id ON public.projects(client_id);
CREATE INDEX idx_projects_created_by_user_id ON public.projects(created_by_user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_start_date ON public.projects(start_date);
CREATE INDEX idx_projects_end_date ON public.projects(end_date);

-- 5. TASKS TABLE (depends on clients, projects, and users)
CREATE TABLE public.tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  type TEXT NOT NULL,
  assigned_to_user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  created_by_user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  due_date TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assigned_to_user_id ON public.tasks(assigned_to_user_id);
CREATE INDEX idx_tasks_created_by_user_id ON public.tasks(created_by_user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- 6. APPROVALS TABLE (depends on tasks, clients, and users)
CREATE TABLE public.approvals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  requested_by_user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_approvals_task_id ON public.approvals(task_id);
CREATE INDEX idx_approvals_client_id ON public.approvals(client_id);
CREATE INDEX idx_approvals_requested_by_user_id ON public.approvals(requested_by_user_id);
CREATE INDEX idx_approvals_status ON public.approvals(status);

-- 7. PERFORMANCE SNAPSHOTS TABLE (depends on clients)
CREATE TABLE public.performance_snapshots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  date TEXT NOT NULL,
  spend DECIMAL(10, 2) NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_performance_snapshots_client_id ON public.performance_snapshots(client_id);
CREATE INDEX idx_performance_snapshots_platform ON public.performance_snapshots(platform);
CREATE INDEX idx_performance_snapshots_date ON public.performance_snapshots(date);

-- 8. COMMUNITY POSTS TABLE (depends on users)
CREATE TABLE public.community_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_type ON public.community_posts(type);
CREATE INDEX idx_community_posts_department ON public.community_posts(department);

-- 9. ACTIVITY LOGS TABLE (depends on users)
CREATE TABLE public.activity_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX idx_activity_logs_entity_id ON public.activity_logs(entity_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at);

-- 10. FILE ASSETS TABLE (no foreign keys - standalone)
CREATE TABLE public.file_assets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  client TEXT NOT NULL,
  size TEXT NOT NULL,
  date TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_file_assets_client ON public.file_assets(client);
CREATE INDEX idx_file_assets_type ON public.file_assets(type);

-- =====================
-- STEP 3: ENABLE REALTIME
-- =====================

BEGIN;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.approvals;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
COMMIT;

-- =====================
-- STEP 4: CREATE VIEWS
-- =====================

CREATE VIEW public.client_statistics AS
SELECT 
  c.id,
  c.name,
  COUNT(DISTINCT p.id)::INTEGER as project_count,
  COUNT(DISTINCT t.id)::INTEGER as task_count,
  COUNT(DISTINCT ca.id)::INTEGER as account_count,
  COALESCE(SUM(ps.spend), 0)::DECIMAL as total_spend
FROM public.clients c
LEFT JOIN public.projects p ON c.id = p.client_id
LEFT JOIN public.tasks t ON c.id = t.client_id
LEFT JOIN public.client_accounts ca ON c.id = ca.client_id
LEFT JOIN public.performance_snapshots ps ON c.id = ps.client_id
GROUP BY c.id, c.name;

CREATE VIEW public.team_statistics AS
SELECT 
  u.id,
  u.name,
  u.team_role,
  COUNT(DISTINCT t.id)::INTEGER as assigned_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'قيد العمل' THEN t.id END)::INTEGER as in_progress_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'مكتمل' THEN t.id END)::INTEGER as completed_tasks
FROM public.users u
LEFT JOIN public.tasks t ON u.id = t.assigned_to_user_id
GROUP BY u.id, u.name, u.team_role;
