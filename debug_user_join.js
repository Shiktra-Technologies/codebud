/**
 * Test to verify users table data and join functionality
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpsbufjrnkdkcwnbrcmd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2J1Zmpybmtka2N3bmJyY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NzEsImV4cCI6MjA4MDAxMDU3MX0.v9A7hNOYG_1AxNS6iuWlsTROIJ9VeDmE-CYt8rAr3t0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserDataJoin() {
  console.log('🧪 Testing user data join for submissions...');
  
  try {
    // Step 1: Check what users exist
    console.log('\n1️⃣ Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, display_name, role')
      .limit(10);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`📊 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}`);
      console.log(`     Display Name: "${user.display_name}"`);
      console.log(`     Email: "${user.email}"`);
      console.log(`     Role: "${user.role}"`);
      console.log('');
    });
    
    // Step 2: Check submissions and their user_id relationships
    console.log('\n2️⃣ Checking submissions with user joins...');
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
      console.log(`  ${index + 1}. Submission ID: ${sub.id}`);
      console.log(`     User ID: ${sub.user_id}`);
      console.log(`     Test: ${sub.test_type}, Score: ${sub.score}`);
      console.log(`     Join Result:`, sub.users);
      
      if (sub.users) {
        console.log(`     ✅ Display Name: "${sub.users.display_name}"`);
        console.log(`     ✅ Email: "${sub.users.email}"`);
      } else {
        console.log(`     ❌ No user data joined`);
        
        // Try to find the user manually
        const matchingUser = users.find(u => u.id === sub.user_id);
        if (matchingUser) {
          console.log(`     🔍 Manual lookup found: "${matchingUser.display_name}"`);
        } else {
          console.log(`     ⚠️ User ID ${sub.user_id} not found in users table`);
        }
      }
      console.log('');
    });
    
    console.log('🎯 Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUserDataJoin();
