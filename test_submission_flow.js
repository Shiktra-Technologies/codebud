const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpsbufjrnkdkcwnbrcmd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2J1Zmpybmtka2N3bmJyY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NzEsImV4cCI6MjA4MDAxMDU3MX0.v9A7hNOYG_1AxNS6iuWlsTROIJ9VeDmE-CYt8rAr3t0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubmissionFlow() {
  try {
    console.log('🧪 Testing submission flow to understand table relationship...');
    
    // Step 1: Check both tables before insertion
    console.log('\n1️⃣ Checking submission_csv table...');
    const { data: csvBefore, error: csvError } = await supabase
      .from('submission_csv')
      .select('*');
    console.log(`submission_csv has ${csvBefore?.length || 0} records`);
    
    console.log('\n2️⃣ Checking submission_csv_with_users table...');
    const { data: withUsersBefore, error: withUsersError } = await supabase
      .from('submission_csv_with_users')
      .select('*');
    console.log(`submission_csv_with_users has ${withUsersBefore?.length || 0} records`);
    
    // Step 2: Create a test user first
    console.log('\n3️⃣ Creating test user...');
    const testUserId = 'a1b2c3d4-e5f6-7890-abcd-123456789012';
    
    try {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .upsert({
          id: testUserId,
          email: 'testuser@example.com',
          display_name: 'Test User',
          role: 'student',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();
      
      if (userError && !userError.message.includes('duplicate')) {
        console.log('User creation result:', userError);
      } else {
        console.log('✅ Test user ready');
      }
    } catch (userErr) {
      console.log('User already exists or creation issue:', userErr.message);
    }
    
    // Step 3: Insert a test submission into submission_csv
    console.log('\n4️⃣ Inserting test submission into submission_csv...');
    const testSubmission = {
      user_id: testUserId,
      test_type: 'Aptitude Test',
      score: 27,
      total_questions: 30,
      time_taken: 1200,
      answers: JSON.stringify([
        { question: 1, answer: 'A', correct: true },
        { question: 2, answer: 'C', correct: false }
      ]),
      status: 'completed',
      violation_count: 0,
      device_info: JSON.stringify({ browser: 'Test Browser', os: 'Test OS' })
    };
    
    const { data: insertedSubmission, error: insertError } = await supabase
      .from('submission_csv')
      .insert(testSubmission)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Error inserting submission:', insertError);
      return;
    }
    
    console.log('✅ Test submission inserted:', insertedSubmission.id);
    
    // Step 4: Check both tables after insertion
    console.log('\n5️⃣ Checking tables after insertion...');
    
    const { data: csvAfter } = await supabase
      .from('submission_csv')
      .select('*');
    console.log(`submission_csv now has ${csvAfter?.length || 0} records`);
    
    const { data: withUsersAfter } = await supabase
      .from('submission_csv_with_users')
      .select('*');
    console.log(`submission_csv_with_users now has ${withUsersAfter?.length || 0} records`);
    
    if (withUsersAfter && withUsersAfter.length > 0) {
      console.log('\n📋 Sample record from submission_csv_with_users:');
      console.log(JSON.stringify(withUsersAfter[0], null, 2));
    }
    
    // Step 5: Test the admin query
    console.log('\n6️⃣ Testing admin dashboard query...');
    const { data: adminData, error: adminError } = await supabase
      .from('submission_csv_with_users')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (adminError) {
      console.error('❌ Admin query error:', adminError);
    } else {
      console.log(`✅ Admin query success: ${adminData.length} submissions found`);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testSubmissionFlow();
