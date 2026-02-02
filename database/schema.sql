-- ============================================
-- Captain Star Agency - Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT 'password123',
    role TEXT NOT NULL DEFAULT 'TEAM_MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'ACCOUNT_MANAGER', 'TEAM_MEMBER')),
    team_role TEXT NOT NULL DEFAULT 'صانع محتوى',
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    industry TEXT,
    country TEXT DEFAULT 'السعودية',
    phone_number TEXT,
    posts_quota INTEGER DEFAULT 0,
    videos_quota INTEGER DEFAULT 0,
    num_campaigns INTEGER DEFAULT 0,
    num_platforms INTEGER DEFAULT 0,
    has_website BOOLEAN DEFAULT false,
    file_upload BOOLEAN DEFAULT false,
    has_campaign BOOLEAN DEFAULT false,
    package_type TEXT,
    cover_image TEXT,
    campaigns JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CLIENT ACCOUNTS (Platform Access)
-- ============================================
CREATE TABLE IF NOT EXISTS client_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    account_name TEXT,
    username TEXT,
    account_url TEXT,
    access_email TEXT,
    access_password TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    visible_to_roles TEXT[] DEFAULT ARRAY['OWNER', 'ADMIN', 'ACCOUNT_MANAGER'],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'قيد التنفيذ' CHECK (status IN ('قيد التنفيذ', 'مكتمل', 'متوقف', 'ملغي')),
    type TEXT,
    total_budget NUMERIC DEFAULT 0,
    platforms JSONB DEFAULT '[]',
    campaign_types JSONB DEFAULT '[]',
    website_access JSONB,
    links JSONB DEFAULT '[]',
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'جديدة' CHECK (status IN ('جديدة', 'قيد التنفيذ', 'بانتظار الاعتماد', 'مكتملة', 'مرفوضة')),
    priority TEXT DEFAULT 'متوسطة' CHECK (priority IN ('منخفضة', 'متوسطة', 'عالية', 'عاجلة')),
    type TEXT DEFAULT 'محتوى',
    assigned_to_user_id UUID REFERENCES users(id),
    created_by_user_id UUID REFERENCES users(id),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. APPROVALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    requested_by_user_id UUID REFERENCES users(id),
    reviewed_by_user_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'بانتظار المراجعة' CHECK (status IN ('بانتظار المراجعة', 'معتمد', 'مرفوض', 'معتمد بتعديلات')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- ============================================
-- 7. ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. PERFORMANCE SNAPSHOTS
-- ============================================
CREATE TABLE IF NOT EXISTS performance_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    campaign_name TEXT,
    platform TEXT,
    date DATE,
    spend NUMERIC DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    leads INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. FILE ASSETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS file_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    uploaded_by_user_id UUID REFERENCES users(id),
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. COMMUNITY POSTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DISABLE RLS (For Development - Enable in Production)
-- ============================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE performance_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE file_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts DISABLE ROW LEVEL SECURITY;

-- ============================================
-- INSERT DEFAULT OWNER USER
-- ============================================
INSERT INTO users (id, name, email, password_hash, role, team_role, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'أحمد النجم',
    'admin@captainstar.com',
    'password123',
    'OWNER',
    'مؤسس الوكالة',
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- CREATE STORAGE BUCKET (Run separately in Storage settings)
-- ============================================
-- Go to Supabase Dashboard > Storage > Create Bucket
-- Name: assets
-- Public: Yes
