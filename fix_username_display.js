/**
 * Quick fix script to create a user with display_name "amanrao099"
 * Run this to ensure the user exists in the database with the correct display name
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpsbufjrnkdkcwnbrcmd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2J1Zmpybmtka2N3bmJyY21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzQ1NzEsImV4cCI6MjA4MDAxMDU3MX0.v9A7hNOYG_1AxNS6iuWlsTROIJ9VeDmE-CYt8rAr3t0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUserWithCorrectName() {
  console.log('🔧 Creating user with display_name "amanrao099"...');
  
  try {
    // Generate a consistent user ID based on the name (or use a specific one if you know it)
    const userId = 'ee6fecdb-1234-5678-9abc-def123456789'; // Replace with the actual user_id from your submission
    
    const userRecord = {
      id: userId,
      email: 'amanrao099@example.com',
      display_name: 'amanrao099',
      role: 'student'
    };
    
    console.log('👤 Creating/updating user record:', userRecord);
    
    // Try to upsert the user record
    const { data, error } = await supabase
      .from('users')
      .upsert(userRecord, {
        onConflict: 'id'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create/update user:', error);
      
      // If upsert failed, try a simple insert
      console.log('🔄 Trying simple insert...');
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert(userRecord)
        .select()
        .single();
        
      if (insertError) {
        console.error('❌ Insert also failed:', insertError);
        console.log('⚠️ You may need to check RLS policies or permissions');
      } else {
        console.log('✅ User created successfully:', insertData);
      }
    } else {
      console.log('✅ User created/updated successfully:', data);
    }
    
    // Now test fetching the user to make sure it works
    console.log('\n🔍 Testing user retrieval...');
    const { data: retrievedUser, error: retrieveError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (retrieveError) {
      console.error('❌ Could not retrieve user:', retrieveError);
    } else if (retrievedUser) {
      console.log('✅ User retrieved successfully:', {
        id: retrievedUser.id,
        display_name: retrievedUser.display_name,
        email: retrievedUser.email
      });
    } else {
      console.log('❌ User not found after creation');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Also create a function to find existing submissions and their user_ids
async function findExistingSubmissions() {
  console.log('🔍 Finding existing submissions to identify user_ids...');
  
  try {
    const { data: submissions, error } = await supabase
      .from('submission_csv')
      .select('id, user_id, test_type, score, submitted_at')
      .limit(10);
    
    if (error) {
      console.error('❌ Could not fetch submissions:', error);
      return;
    }
    
    console.log(`📊 Found ${submissions.length} submissions:`);
    submissions.forEach(sub => {
      console.log(`  - User ID: ${sub.user_id}`);
      console.log(`    Submission: ${sub.test_type}, Score: ${sub.score}`);
      console.log(`    Submitted: ${sub.submitted_at}`);
      console.log('');
    });
    
    if (submissions.length > 0) {
      console.log('💡 To fix the display name, update the createUserWithCorrectName function');
      console.log(`💡 Set userId to: "${submissions[0].user_id}"`);
    }
    
  } catch (error) {
    console.error('❌ Could not fetch submissions:', error);
  }
}

// Run both functions
async function runFix() {
  await findExistingSubmissions();
  console.log('\n' + '='.repeat(50) + '\n');
  await createUserWithCorrectName();
}

runFix();
