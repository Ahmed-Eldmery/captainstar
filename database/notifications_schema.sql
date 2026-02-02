-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Who receives the notification
  type TEXT NOT NULL, -- 'task_assigned', 'project_invite', 'mention', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- Where clicking takes them
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own notifications
CREATE POLICY "Users can see own notifications"
ON notifications FOR SELECT
USING (auth.uid()::text = user_id OR user_id = 'all');

-- Policy: Anyone can insert (system/triggers)
CREATE POLICY "Anyone can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- Policy: Users can update their own (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid()::text = user_id);
