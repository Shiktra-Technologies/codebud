const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpsbufjrnkdkcwnbrcmd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2J1Zmpybmtka2N3bmJyY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NzEsImV4cCI6MjA4MDAxMDU3MX0.v9A7hNOYG_1AxNS6iuWlsTROIJ9VeDmE-CYt8rAr3t0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubmissionWithUser() {
  try {
    console.log('🧪 Testing submission with user creation...');
    
    const testUserId = '11111111-2222-3333-4444-555555555555';
    const testUserName = 'John Doe';
    const testUserEmail = 'john.doe@example.com';
    
    // Step 1: Try to create a user (might fail due to RLS)
    console.log('👤 Step 1: Creating test user...');
    const { data: userResult, error: userError } = await supabase
      .from('users')
      .upsert({
        id: testUserId,
        email: testUserEmail,
        display_name: testUserName,
        role: 'student'
      })
      .select();
    
    if (userError) {
      console.log('⚠️ User creation failed (likely due to RLS):', userError.message);
    } else {
      console.log('✅ User created:', userResult);
    }
    
    // Step 2: Try to create a submission (might also fail due to RLS)
    console.log('📝 Step 2: Creating test submission...');
    const { data: submissionResult, error: submissionError } = await supabase
      .from('submission_csv')
      .insert({
        user_id: testUserId,
        test_type: 'Aptitude Test',
        score: 27,
        total_questions: 30,
        time_taken: 1800,
        answers: JSON.stringify([{question: 1, answer: 'A', correct: true}]),
        status: 'completed',
        violation_count: 0,
        device_info: JSON.stringify({browser: 'Chrome', os: 'macOS'})
      })
      .select();
    
    if (submissionError) {
      console.log('⚠️ Submission creation failed (likely due to RLS):', submissionError.message);
    } else {
      console.log('✅ Submission created:', submissionResult);
    }
    
    // Step 3: Check if anything appears in submission_csv_with_users
    console.log('🔍 Step 3: Checking submission_csv_with_users...');
    const { data: withUsersData, error: withUsersError } = await supabase
      .from('submission_csv_with_users')
      .select('*')
      .limit(5);
    
    if (withUsersError) {
      console.error('❌ Error checking submission_csv_with_users:', withUsersError);
    } else {
      console.log(`📊 Found ${withUsersData.length} records in submission_csv_with_users`);
      if (withUsersData.length > 0) {
        console.log('👤 Sample record with user data:');
        console.log(JSON.stringify(withUsersData[0], null, 2));
      }
    }
    
    // Step 4: Let's also check what's in the regular submission_csv table
    console.log('🔍 Step 4: Checking regular submission_csv table...');
    const { data: regularData, error: regularError } = await supabase
      .from('submission_csv')
      .select('*')
      .limit(5);
    
    if (regularError) {
      console.error('❌ Error checking submission_csv:', regularError);
    } else {
      console.log(`📊 Found ${regularData.length} records in submission_csv`);
      if (regularData.length > 0) {
        console.log('📝 Sample submission record:');
        console.log(JSON.stringify(regularData[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testSubmissionWithUser();
