/**
 * Test script to verify username display fix in submissions
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpsbufjrnkdkcwnbrcmd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2J1Zmpybmtka2N3bmJyY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NzEsImV4cCI6MjA4MDAxMDU3MX0.v9A7hNOYG_1AxNS6iuWlsTROIJ9VeDmE-CYt8rAr3t0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUsernameDisplay() {
  console.log('🧪 Testing username display in submissions...');
  
  try {
    // First, let's see what submissions exist
    console.log('\n1️⃣ Checking current submissions...');
    const { data: submissions, error: submissionsError } = await supabase
      .from('submission_csv')
      .select(`
        id,
        user_id,
        test_type,
        score,
        submitted_at,
        users(
          email,
          display_name,
          role
        )
      `)
      .order('submitted_at', { ascending: false })
      .limit(5);
    
    if (submissionsError) {
      console.error('❌ Error fetching submissions:', submissionsError);
      return;
    }
    
    console.log(`📊 Found ${submissions.length} recent submissions:`);
    submissions.forEach((sub, index) => {
      const userName = sub.users?.display_name || sub.users?.email?.split('@')[0] || 'Unknown';
      const userEmail = sub.users?.email || 'No email';
      
      console.log(`  ${index + 1}. ID: ${sub.id}`);
      console.log(`     User ID: ${sub.user_id?.substring(0, 8)}...`);
      console.log(`     User Name: ${userName}`);
      console.log(`     User Email: ${userEmail}`);
      console.log(`     Test: ${sub.test_type}, Score: ${sub.score}`);
      console.log(`     Has User Data: ${sub.users ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    // Check users table
    console.log('\n2️⃣ Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, display_name, role')
      .limit(10);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
    } else {
      console.log(`📊 Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id?.substring(0, 8)}... Name: ${user.display_name} Email: ${user.email}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUsernameDisplay();
