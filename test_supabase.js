const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpsbufjrnkdkcwnbrcmd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2J1Zmpybmtka2N3bmJyY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NzEsImV4cCI6MjA4MDAxMDU3MX0.v9A7hNOYG_1AxNS6iuWlsTROIJ9VeDmE-CYt8rAr3t0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    // Test 1: Check if submission_csv table exists
    console.log('\n1️⃣ Checking submission_csv table...');
    const { data: submissions, error: submissionsError } = await supabase
      .from('submission_csv')
      .select('*')
      .limit(10);
    
    if (submissionsError) {
      console.error('❌ Error fetching submissions:', submissionsError);
    } else {
      console.log(`✅ Found ${submissions.length} submissions in submission_csv table`);
      if (submissions.length > 0) {
        console.log('📋 Sample submission:', JSON.stringify(submissions[0], null, 2));
      }
    }
    
    // Test 2: Check users table
    console.log('\n2️⃣ Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, display_name')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`✅ Found ${users.length} users`);
    }
    
    // Test 3: Try the join query that's used in the admin dashboard
    console.log('\n3️⃣ Testing join query...');
    const { data: joinData, error: joinError } = await supabase
      .from('submission_csv')
      .select(`
        *,
        users!inner(
          email,
          display_name,
          role
        )
      `)
      .limit(5);
    
    if (joinError) {
      console.error('❌ Join query error:', joinError);
    } else {
      console.log(`✅ Join query returned ${joinData.length} records`);
      if (joinData.length > 0) {
        console.log('📋 Sample joined data:', JSON.stringify(joinData[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('💥 General error:', error);
  }
}

testSupabase();
