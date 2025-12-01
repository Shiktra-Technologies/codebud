/**
 * Test the submission system with real user data after RLS removal
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpsbufjrnkdkcwnbrcmd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2J1Zmpybmtka2N3bmJyY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NzEsImV4cCI6MjA4MDAxMDU3MX0.v9A7hNOYG_1AxNS6iuWlsTROIJ9VeDmE-CYt8rAr3t0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubmissionWithRealUser() {
  console.log('🧪 Testing submission with real user data...');
  
  try {
    // Get the amanrao099 user
    const { data: user } = await supabase
      .from('users')
      .select('id, display_name, email')
      .eq('display_name', 'amanrao099')
      .single();
    
    if (!user) {
      console.error('❌ User amanrao099 not found');
      return;
    }
    
    console.log('✅ Found user:', user.display_name, '- ID:', user.id.substring(0, 8) + '...');
    
    // Create a test submission
    const testSubmission = {
      user_id: user.id,
      test_type: 'aptitude',
      score: 25,
      total_questions: 30,
      time_taken: 1800,
      answers: [],
      status: 'completed',
      violation_count: 0
    };
    
    console.log('📝 Creating test submission...');
    const { data: submission, error } = await supabase
      .from('submission_csv')
      .insert(testSubmission)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create submission:', error);
      return;
    }
    
    console.log('✅ Submission created:', submission.id);
    
    // Now test the join query
    console.log('🔗 Testing join to get user display name...');
    const { data: joinResult } = await supabase
      .from('submission_csv')
      .select(`
        id,
        user_id,
        score,
        test_type,
        users(display_name, email)
      `)
      .eq('id', submission.id)
      .single();
    
    console.log('✅ Join result:');
    console.log('  Submission ID:', joinResult.id);
    console.log('  User ID:', joinResult.user_id.substring(0, 8) + '...');
    console.log('  Score:', joinResult.score);
    console.log('  User Display Name:', joinResult.users?.display_name);
    console.log('  User Email:', joinResult.users?.email);
    
    if (joinResult.users?.display_name === 'amanrao099') {
      console.log('🎉 SUCCESS: Display name retrieved correctly!');
    } else {
      console.log('❌ ISSUE: Expected amanrao099, got:', joinResult.users?.display_name);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSubmissionWithRealUser();
