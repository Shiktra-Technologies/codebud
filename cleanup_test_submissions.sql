-- =====================================================
-- CLEANUP SCRIPT FOR TEST SUBMISSIONS IN SUPABASE
-- =====================================================
-- Run this SQL query in your Supabase Dashboard > SQL Editor to clean up invalid test submissions

-- Check current submissions to see what we have
SELECT 
  id,
  user_id,
  test_type,
  score,
  total_questions,
  device_info,
  submitted_at,
  created_at
FROM submission_csv
ORDER BY created_at DESC
LIMIT 20;

-- Check if there are any demo/test users
SELECT DISTINCT user_id 
FROM submission_csv 
WHERE user_id LIKE 'demo_%' 
   OR user_id LIKE 'test_%' 
   OR user_id LIKE '%_test_%'
   OR user_id NOT IN (SELECT id FROM users);

-- Delete demo/test submissions (uncomment the lines below to actually delete)
/*
DELETE FROM submission_csv 
WHERE user_id LIKE 'demo_%' 
   OR user_id LIKE 'test_%' 
   OR user_id LIKE '%_test_%'
   OR user_id NOT IN (SELECT id FROM users);

-- Report how many submissions remain
SELECT COUNT(*) as remaining_submissions FROM submission_csv;
*/

-- Optional: Check for submissions with invalid user_ids (not in users table)
SELECT 
  s.id,
  s.user_id,
  s.test_type,
  s.score,
  s.submitted_at,
  'User not found in users table' as issue
FROM submission_csv s
LEFT JOIN users u ON s.user_id = u.id
WHERE u.id IS NULL;

SELECT 'Review the test submissions above. Uncomment the DELETE statements to remove them.' as instructions;
