-- =====================================================
-- CREATE SUBMISSION_CSV TABLE FOR CROSS-DEVICE FUNCTIONALITY
-- =====================================================
-- Run this SQL query in your Supabase Dashboard > SQL Editor

-- Create the submission_csv table for cross-device submissions
CREATE TABLE IF NOT EXISTS submission_csv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_type TEXT DEFAULT 'aptitude',
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 30,
  time_taken INTEGER DEFAULT 0,
  answers JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'completed',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  device_info JSONB DEFAULT '{}'::jsonb,
  violation_count INTEGER DEFAULT 0,
  violation_details JSONB DEFAULT '[]'::jsonb
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_submission_csv_user_id ON submission_csv (user_id);
CREATE INDEX IF NOT EXISTS idx_submission_csv_submitted_at ON submission_csv (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_submission_csv_test_type ON submission_csv (test_type);
CREATE INDEX IF NOT EXISTS idx_submission_csv_score ON submission_csv (score DESC);

-- Enable Row Level Security for data protection
ALTER TABLE submission_csv ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own submissions
CREATE POLICY "Users can insert their own submissions" ON submission_csv
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own submissions  
CREATE POLICY "Users can view their own submissions" ON submission_csv
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can view all submissions
CREATE POLICY "Admins can view all submissions" ON submission_csv
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Policy: Allow public access for testing (REMOVE THIS IN PRODUCTION)
CREATE POLICY "Allow public read for testing" ON submission_csv
  FOR SELECT USING (true);

-- Policy: Allow public insert for testing (REMOVE THIS IN PRODUCTION)  
CREATE POLICY "Allow public insert for testing" ON submission_csv
  FOR INSERT WITH CHECK (true);

-- Policy: Admins can update all submissions (for status changes, etc.)
CREATE POLICY "Admins can update all submissions" ON submission_csv
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Optional: Create a view for easy admin dashboard queries with user details
CREATE OR REPLACE VIEW submission_csv_with_users AS
SELECT 
  s.*,
  u.email as user_email,
  u.display_name as user_name,
  u.role as user_role,
  ROUND((s.score::decimal / s.total_questions::decimal) * 100, 2) as percentage
FROM submission_csv s
LEFT JOIN users u ON s.user_id = u.id
ORDER BY s.submitted_at DESC;

-- Grant permissions on the view
GRANT SELECT ON submission_csv_with_users TO authenticated;

-- Success message
SELECT 'submission_csv table created successfully!' as message;
