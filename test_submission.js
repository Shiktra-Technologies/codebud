const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpsbufjrnkdkcwnbrcmd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2J1Zmpybmtka2N3bmJyY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NzEsImV4cCI6MjA4MDAxMDU3MX0.v9A7hNOYG_1AxNS6iuWlsTROIJ9VeDmE-CYt8rAr3t0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubmissionFlow() {
  try {
    console.log('🧪 Testing complete submission flow...');
    
    // Step 1: Check current submissions
    console.log('\n1️⃣ Current submissions in database:');
    const { data: existingSubmissions, error: fetchError } = await supabase
      .from('submission_csv')
      .select('*');
    
    if (fetchError) {
      console.error('❌ Error fetching existing submissions:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${existingSubmissions.length} existing submissions`);
    
    // Step 2: Create a test user if needed
    console.log('\n2️⃣ Ensuring test user exists...');
    const testUserId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID format
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .maybeSingle();
    
    if (!existingUser) {
      console.log('🔨 Creating test user...');
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: testUserId,
          email: 'test.student@example.com',
          display_name: 'Test Student',
          role: 'student'
        })
        .select()
        .single();
      
      if (userError) {
        console.error('❌ Error creating user:', userError);
        return;
      }
      console.log('✅ Test user created:', newUser);
    } else {
      console.log('✅ Test user already exists:', existingUser);
    }
    
    // Step 3: Insert a test submission
    console.log('\n3️⃣ Inserting test submission...');
    const testSubmission = {
      user_id: testUserId,
      test_type: 'Aptitude Test',
      score: 25,
      total_questions: 30,
      time_taken: 1800, // 30 minutes
      answers: JSON.stringify([
        { question: 1, answer: 'A', correct: true },
        { question: 2, answer: 'B', correct: false }
      ]),
      status: 'completed',
      violation_count: 0,
      device_info: JSON.stringify({ browser: 'Chrome', os: 'macOS' })
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
    
    console.log('✅ Test submission inserted:', insertedSubmission);
    
    // Step 4: Try to fetch with JOIN like the admin dashboard does
    console.log('\n4️⃣ Testing admin dashboard query...');
    const { data: joinedData, error: joinError } = await supabase
      .from('submission_csv')
      .select(`
        *,
        users!inner(
          email,
          display_name,
          role
        )
      `)
      .order('submitted_at', { ascending: false });
    
    if (joinError) {
      console.error('❌ Join query error:', joinError);
    } else {
      console.log(`✅ Admin query returned ${joinedData.length} submissions`);
      if (joinedData.length > 0) {
        console.log('📋 Sample joined data:', JSON.stringify(joinedData[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

testSubmissionFlow();
