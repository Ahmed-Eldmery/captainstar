-- Add plan_link to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS plan_link TEXT;
