-- Create messages table
-- We drop and recreate to ensure types are correct (changing UUID to TEXT for flexibility)
DROP TABLE IF EXISTS messages;

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL, -- Changed to TEXT to support "1", "2", etc.
  receiver_id TEXT NOT NULL, -- Changed to TEXT
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow All (since we handle auth in frontend for this custom setup)
CREATE POLICY "Allow All Access"
ON messages FOR ALL
USING (true)
WITH CHECK (true);
