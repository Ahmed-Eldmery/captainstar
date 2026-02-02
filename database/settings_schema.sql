-- Create a settings table for dynamic role names and system configurations
CREATE TABLE IF NOT EXISTS agency_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (so all users can see the correct role names)
CREATE POLICY "Allow Public Read Settings"
ON agency_settings FOR SELECT
USING (true);

-- Allow updates only by Admins/Owners (You might need to adjust this depending on your auth setup)
-- For now, we'll allow anyone to insert/update if they are authenticated, or just disable RLS for simplicity as per previous instructions
ALTER TABLE agency_settings DISABLE ROW LEVEL SECURITY;

-- Insert default values
INSERT INTO agency_settings (key, value, description)
VALUES 
  ('role_general_manager', 'المدير التنفيذي', 'المسمى الوظيفي للمدير العام/التنفيذي'),
  ('role_founder', 'مؤسس الوكالة', 'المسمى الوظيفي للمؤسس')
ON CONFLICT (key) DO NOTHING;
