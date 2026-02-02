-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'TEAM_MEMBER')),
  team_role TEXT,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== CLIENTS TABLE ====================
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT,
  country TEXT,
  phone_number TEXT,
  posts_quota INTEGER,
  videos_quota INTEGER,
  has_website BOOLEAN DEFAULT false,
  file_upload BOOLEAN DEFAULT false,
  num_campaigns INTEGER DEFAULT 0,
  num_platforms INTEGER DEFAULT 0,
  cover_image TEXT,
  has_campaign BOOLEAN DEFAULT false,
  onboarding_notes TEXT,
  assigned_team_ids TEXT[], -- JSON array of user IDs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== CLIENT ACCOUNTS TABLE ====================
CREATE TABLE IF NOT EXISTS client_accounts (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_name TEXT,
  account_url TEXT,
  username TEXT,
  notes TEXT, -- stores password encrypted
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== PROJECTS TABLE ====================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED')),
  type TEXT,
  description TEXT,
  niche TEXT,
  received_date DATE,
  brief TEXT,
  total_budget DECIMAL(12, 2),
  platforms TEXT[], -- JSON array
  campaign_types TEXT[], -- JSON array
  accounts JSONB, -- Array of {platformId, platform, username, password}
  drive_link TEXT,
  product_sheet_link TEXT,
  copy_and_design TEXT,
  motion TEXT,
  campaign_details JSONB, -- {startDate, endDate, notes}
  monthly_report TEXT,
  client_status TEXT,
  objective TEXT,
  start_date DATE,
  end_date DATE,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== TASKS TABLE ====================
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('TODO', 'IN_PROGRESS', 'WAITING_APPROVAL', 'WAITING_CLIENT', 'DONE')),
  priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  type TEXT NOT NULL,
  assigned_to_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== APPROVALS TABLE ====================
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  requested_by_user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('PENDING_INTERNAL', 'PENDING_CLIENT', 'APPROVED', 'CHANGES_REQUESTED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== COMMUNITY POSTS TABLE ====================
CREATE TABLE IF NOT EXISTS community_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'discussion', 'help')),
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== PERFORMANCE SNAPSHOTS TABLE ====================
CREATE TABLE IF NOT EXISTS performance_snapshots (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  campaign_name TEXT,
  platform TEXT,
  date DATE,
  spend DECIMAL(12, 2),
  impressions INTEGER,
  clicks INTEGER,
  leads INTEGER,
  conversions INTEGER,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== ACTIVITY LOGS TABLE ====================
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== FILE ASSETS TABLE ====================
CREATE TABLE IF NOT EXISTS file_assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('image', 'video', 'document', 'other')),
  client TEXT REFERENCES clients(id) ON DELETE CASCADE,
  size TEXT,
  url TEXT,
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INDEXES ====================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_clients_country ON clients(country);
CREATE INDEX idx_client_accounts_client_id ON client_accounts(client_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to_user_id);
CREATE INDEX idx_approvals_task_id ON approvals(task_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_department ON community_posts(department);
CREATE INDEX idx_performance_client_id ON performance_snapshots(client_id);
CREATE INDEX idx_performance_platform ON performance_snapshots(platform);
CREATE INDEX idx_activity_user_id ON activity_logs(user_id);
CREATE INDEX idx_files_client_id ON file_assets(client);

-- ==================== VIEWS ====================
-- View للمهام المعلقة للاعتماد
CREATE OR REPLACE VIEW pending_approvals AS
SELECT t.*, c.name as client_name, u.name as created_by_name
FROM tasks t
JOIN clients c ON t.client_id = c.id
JOIN users u ON t.created_by_user_id = u.id
WHERE t.status IN ('WAITING_APPROVAL', 'WAITING_CLIENT')
ORDER BY t.created_at DESC;

-- View لأداء العميل
CREATE OR REPLACE VIEW client_performance_summary AS
SELECT 
  c.id,
  c.name,
  COUNT(DISTINCT t.id) as total_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'DONE' THEN t.id END) as completed_tasks,
  SUM(p.spend) as total_spend,
  SUM(p.impressions) as total_impressions,
  SUM(p.clicks) as total_clicks,
  SUM(p.conversions) as total_conversions
FROM clients c
LEFT JOIN tasks t ON c.id = t.client_id
LEFT JOIN performance_snapshots p ON c.id = p.client_id
GROUP BY c.id, c.name;

-- View لإحصائيات الفريق
CREATE OR REPLACE VIEW team_statistics AS
SELECT 
  u.id,
  u.name,
  u.team_role,
  COUNT(DISTINCT t.id) as assigned_tasks,
  COUNT(DISTINCT CASE WHEN t.status = 'DONE' THEN t.id END) as completed_tasks,
  COUNT(DISTINCT cp.id) as community_posts,
  SUM(cp.likes) as total_likes
FROM users u
LEFT JOIN tasks t ON u.id = t.assigned_to_user_id
LEFT JOIN community_posts cp ON u.id = cp.user_id
WHERE u.is_active = true
GROUP BY u.id, u.name, u.team_role;
