# Supabase Setup Guide for Cross-Device Submissions

## Create the submission_csv Table

To enable cross-device functionality, you need to create the `submission_csv` table in your Supabase database.

### Steps:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `codebud_frontend`
3. **Go to SQL Editor** (left sidebar)
4. **Run this SQL script**:

```sql
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submission_csv_user_id ON submission_csv (user_id);
CREATE INDEX IF NOT EXISTS idx_submission_csv_submitted_at ON submission_csv (submitted_at);
CREATE INDEX IF NOT EXISTS idx_submission_csv_test_type ON submission_csv (test_type);

-- Enable Row Level Security
ALTER TABLE submission_csv ENABLE ROW LEVEL SECURITY;

-- Create policies for security
CREATE POLICY "Users can insert their own submissions" ON submission_csv
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
  
CREATE POLICY "Users can view their own submissions" ON submission_csv
  FOR SELECT USING (auth.uid()::text = user_id::text);
  
CREATE POLICY "Admins can view all submissions" ON submission_csv
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );
```

### Table Structure Explanation:

- **id**: Primary key (auto-generated UUID)
- **user_id**: References the users table (foreign key)
- **test_type**: Type of test (aptitude, coding, etc.)
- **score**: Number of correct answers
- **total_questions**: Total questions in the test
- **time_taken**: Time taken in seconds
- **answers**: JSON array of detailed answers
- **status**: Submission status (completed, in-progress, etc.)
- **submitted_at**: When the submission was made
- **created_at**: When the record was created
- **device_info**: JSON object with device/browser info
- **violation_count**: Number of proctoring violations
- **violation_details**: JSON array of violation details

### Benefits of this approach:

1. **Normalized Data**: User info comes from users table, no duplication
2. **Cross-Device**: Real-time subscriptions work across devices
3. **Efficient**: Foreign key relationship with proper indexing
4. **Secure**: Row Level Security policies protect data
5. **Scalable**: Proper database design for future growth

### After creating the table:

1. The admin dashboard will automatically detect the new table
2. All submissions will be saved to Supabase instead of localStorage
3. Real-time updates will work across different devices
4. CSV exports will include user names/emails from the users table

### Testing:

1. Create the table using the SQL above
2. Take a test on one device
3. Check admin dashboard on another device - submission should appear immediately
